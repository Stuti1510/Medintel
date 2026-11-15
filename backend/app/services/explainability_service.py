"""
Explainability Service for Multimodal Skin Lesion Analysis.
Produces Grad-CAM visual heatmaps, exact linear text attributions,
and dynamic modality weighting from the quality gate.
"""

import base64
import cv2
import numpy as np
import torch
from typing import Dict, Any, List, Optional

from xai.gradcam import compute_gradcam, overlay_cam
from xai.text_explain import explain_text
from vision.preprocessing.quality import assess_image_quality

def encode_image_base64(img_rgb: np.ndarray) -> str:
    """Encodes an RGB numpy image to base64 PNG string."""
    bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)
    _, buffer = cv2.imencode(".png", bgr)
    return base64.b64encode(buffer).decode("utf-8")

class ExplainabilityService:
    def __init__(self):
        pass
        
    def explain_multimodal(self, image_rgb: Optional[np.ndarray],
                           enhanced_rgb: Optional[np.ndarray],
                           narrative: str,
                           pred_class_idx: int,
                           image_model=None,
                           gate_image_weight: float = 0.5,
                           enhancement_applied: bool = False,
                           enhancement_method: str = "none") -> Dict[str, Any]:
        """
        Generates full explainability package for a multimodal inference request.
        """
        # 1. Quality Assessment
        if image_rgb is not None:
            quality = assess_image_quality(image_rgb)
        else:
            quality = {"blur": 0.0, "brightness": 0.0, "noise": 0.0, "q": 0.0}
            
        # 2. Grad-CAM visual saliency
        gradcam_base64 = None
        if image_model is not None and (enhanced_rgb is not None or image_rgb is not None):
            active_img = enhanced_rgb if enhanced_rgb is not None else image_rgb
            # Prepare tensor for Grad-CAM
            img_resized = cv2.resize(active_img, (224, 224))
            tensor = torch.from_numpy(img_resized).permute(2, 0, 1).unsqueeze(0).float() / 255.0
            # ImageNet normalize
            mean = torch.tensor([0.485, 0.456, 0.406]).view(1, 3, 1, 1)
            std = torch.tensor([0.229, 0.224, 0.225]).view(1, 3, 1, 1)
            norm_tensor = (tensor - mean) / std
            
            try:
                cam_mask = compute_gradcam(image_model, norm_tensor, target_class_idx=pred_class_idx, method="gradcam_pp")
                blended = overlay_cam(active_img, cam_mask)
                gradcam_base64 = encode_image_base64(blended)
            except Exception as e:
                print(f"Grad-CAM generation error: {e}")
                
        # 3. Enhanced image base64
        enhanced_base64 = None
        if enhanced_rgb is not None:
            enhanced_base64 = encode_image_base64(enhanced_rgb)
        elif image_rgb is not None:
            enhanced_base64 = encode_image_base64(image_rgb)
            
        # 4. Exact Linear Text Attributions
        text_attributions = []
        if narrative:
            try:
                text_attributions = explain_text(narrative, fold=0, pred_class_idx=pred_class_idx, top_k=5)
            except Exception as e:
                print(f"Text attribution error: {e}")
                
        # 5. Modality weights
        if image_rgb is None:
            modality_weights = {"image": 0.0, "text": 1.0}
        else:
            modality_weights = {
                "image": round(float(gate_image_weight), 4),
                "text": round(float(1.0 - gate_image_weight), 4)
            }
            
        return {
            "quality": quality,
            "enhancement_applied": enhancement_applied,
            "enhancement_method": enhancement_method,
            "modality_weights": modality_weights,
            "text_attributions": text_attributions,
            "gradcam_base64": gradcam_base64,
            "enhanced_image_base64": enhanced_base64
        }

explainability_service = ExplainabilityService()
