"""
Unit tests for multimodal fusion models (late, concat, gated).
"""

import sys
if "." not in sys.path:
    sys.path.insert(0, ".")

import torch
import pytest
from multimodal.fusion_model import MultimodalClassifier

@pytest.mark.parametrize("fusion_type", ["late", "concat", "gated"])
def test_fusion_forward_shapes(fusion_type):
    model = MultimodalClassifier(fusion=fusion_type, img_dim=1280, txt_dim=4, d=64, num_classes=4)
    model.eval()
    
    batch_size = 4
    img_feat = torch.randn(batch_size, 1280)
    txt_feat = torch.randn(batch_size, 4)
    q = torch.rand(batch_size, 1)
    
    with torch.no_grad():
        logits, img_weight = model(img_feat, txt_feat, q)
        
    assert logits.shape == (batch_size, 4), f"Logits shape mismatch: {logits.shape}"
    assert img_weight.shape == (batch_size,), f"Image weight shape mismatch: {img_weight.shape}"
    
    probs = torch.softmax(logits, dim=1)
    assert torch.allclose(probs.sum(dim=1), torch.ones(batch_size), atol=1e-4)

def test_gated_fusion_weights_range():
    model = MultimodalClassifier(fusion="gated", img_dim=1280, txt_dim=4, d=64, num_classes=4)
    model.eval()
    
    img_feat = torch.randn(10, 1280)
    txt_feat = torch.randn(10, 4)
    q = torch.rand(10, 1)
    
    with torch.no_grad():
        _, img_weights = model(img_feat, txt_feat, q)
        
    assert (img_weights >= 0.0).all() and (img_weights <= 1.0).all(), f"Weights outside [0, 1]: {img_weights}"
