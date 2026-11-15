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

def overlay_cam(img_rgb: np.ndarray, cam_mask: np.ndarray, alpha: float = 0.5,
                colormap: int = cv2.COLORMAP_JET) -> np.ndarray:
    """
    Overlays a grayscale CAM mask onto an RGB image.
    img_rgb: uint8 array (H, W, 3)
    cam_mask: float array in [0, 1] (H_cam, W_cam)
    Returns: uint8 RGB array (H, W, 3)
    """
    h, w = img_rgb.shape[:2]
    # Resize cam_mask to image dimensions
    cam_resized = cv2.resize(cam_mask, (w, h), interpolation=cv2.INTER_LINEAR)
    cam_resized = np.clip(cam_resized, 0.0, 1.0)
    
    heatmap = (cam_resized * 255.0).astype(np.uint8)
    heatmap_color = cv2.applyColorMap(heatmap, colormap)
    heatmap_color = cv2.cvtColor(heatmap_color, cv2.COLOR_BGR2RGB)
    
    blended = (1.0 - alpha) * img_rgb.astype(np.float32) + alpha * heatmap_color.astype(np.float32)
    return np.clip(blended, 0, 255).astype(np.uint8)
