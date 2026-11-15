"""
Modality contribution and ablation analysis for the gated fusion classifier.
Measures the gate allocation weight g and leave-one-modality-out confidence drop.
"""

import torch
import numpy as np
from typing import Dict, Any

def compute_modality_contributions(fusion_model, img_feat: torch.Tensor, txt_feat: torch.Tensor,
                                   q: torch.Tensor, empty_txt_feat: torch.Tensor,
                                   heavily_degraded_img_feat: torch.Tensor) -> Dict[str, float]:
    """
    Computes:
    - gate_image_weight: mean g in [0, 1]
    - gate_text_weight: 1 - g in [0, 1]
    - conf_drop_without_image: confidence drop when image is removed/degraded
    - conf_drop_without_text: confidence drop when narrative is removed
    """
    fusion_model.eval()
    with torch.no_grad():
        # Full prediction
        logits_full, g_weight = fusion_model(img_feat, txt_feat, q)
        probs_full = torch.softmax(logits_full, dim=1)
        pred_class = torch.argmax(probs_full, dim=1).item()
        conf_full = probs_full[0, pred_class].item()
        
        # Text-only prediction (image replaced with heavily degraded/zero)
        logits_txt_only, _ = fusion_model(heavily_degraded_img_feat, txt_feat, q)
        probs_txt_only = torch.softmax(logits_txt_only, dim=1)
        conf_txt_only = probs_txt_only[0, pred_class].item()
        
        # Image-only prediction (text replaced with empty string features)
        logits_img_only, _ = fusion_model(img_feat, empty_txt_feat, q)
        probs_img_only = torch.softmax(logits_img_only, dim=1)
        conf_img_only = probs_img_only[0, pred_class].item()
        
    g = float(g_weight.mean().item())
    drop_no_img = max(0.0, float(conf_full - conf_txt_only))
    drop_no_txt = max(0.0, float(conf_full - conf_img_only))
    
    return {
        "image_weight": round(g, 4),
        "text_weight": round(1.0 - g, 4),
        "confidence_full": round(conf_full, 4),
        "confidence_drop_without_image": round(drop_no_img, 4),
        "confidence_drop_without_text": round(drop_no_txt, 4)
    }
