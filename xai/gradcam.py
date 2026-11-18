"""
Grad-CAM and Grad-CAM++ implementations for EfficientNet-B0.
Generates saliency maps and visual heatmaps overlaid on the lesion image.
"""

import numpy as np
import torch
import cv2
from pytorch_grad_cam import GradCAM, GradCAMPlusPlus
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
from typing import Optional, Tuple

def get_target_layer(model):
    """Finds the last convolutional layer in EfficientNet-B0 backbone."""
    backbone = getattr(model, "backbone", model)
    if hasattr(backbone, "conv_head"):
        return [backbone.conv_head]
    if hasattr(backbone, "blocks"):
        return [backbone.blocks[-1]]
    # Fallback to last conv
    for name, module in reversed(list(backbone.named_modules())):
        if isinstance(module, torch.nn.Conv2d):
            return [module]
    return [backbone]

def compute_gradcam(model, input_tensor: torch.Tensor, target_class_idx: int,
                    method: str = "gradcam_pp") -> np.ndarray:
    """
    Computes 2D Grad-CAM or Grad-CAM++ mask in [0, 1].
    input_tensor: (1, 3, 224, 224)
    """
    model.eval()
    target_layers = get_target_layer(model)
    cam_cls = GradCAMPlusPlus if method == "gradcam_pp" else GradCAM
    
    with cam_cls(model=model, target_layers=target_layers) as cam:
        targets = [ClassifierOutputTarget(target_class_idx)]
        grayscale_cam = cam(input_tensor=input_tensor, targets=targets)
        # grayscale_cam shape: (1, H, W)
        return grayscale_cam[0]

def overlay_cam(img_rgb: np.ndarray, cam_mask: np.ndarray, alpha: float = 0.6) -> np.ndarray:
    """
    Overlays a grayscale CAM mask onto an RGB image using a single-hue
    palette (transparent -> violet #c9b4fa -> indigo #1b1938).
    Avoids rainbow / jet colormaps for clinical interpretability.
    img_rgb: uint8 array (H, W, 3)
    cam_mask: float array in [0, 1] (H_cam, W_cam)
    Returns: uint8 RGB array (H, W, 3)
    """
    h, w = img_rgb.shape[:2]
    # Resize cam_mask to image dimensions
    cam_resized = cv2.resize(cam_mask, (w, h), interpolation=cv2.INTER_LINEAR)
    cam_resized = np.clip(cam_resized, 0.0, 1.0)
    
    # Weight per pixel: cam_weight in [0, 1]
    weight = cam_resized[..., None].astype(np.float32)
    
    # Single-hue endpoints in RGB: violet (#c9b4fa) to indigo (#1b1938)
    violet_rgb = np.array([201.0, 180.0, 250.0], dtype=np.float32)
    indigo_rgb = np.array([27.0, 25.0, 56.0], dtype=np.float32)
    
    # Linear interpolation between violet and indigo based on activation
    heat_color = (1.0 - weight) * violet_rgb + weight * indigo_rgb
    
    # Soft blend: where activation is zero, show 100% original image
    effective_alpha = alpha * weight
    blended = (1.0 - effective_alpha) * img_rgb.astype(np.float32) + effective_alpha * heat_color
    return np.clip(blended, 0, 255).astype(np.uint8)
