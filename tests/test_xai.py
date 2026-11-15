"""
Unit tests for Explainable AI (XAI) modules.
"""

import sys
if "." not in sys.path:
    sys.path.insert(0, ".")

import torch
import numpy as np
import pytest
from xai.gradcam import compute_gradcam, overlay_cam
from xai.text_explain import explain_text
from xai.xai_metrics import compute_saliency_stability
from vision.classification.image_model import EfficientNetB0Classifier

def test_gradcam_output_shape_and_bounds():
    model = EfficientNetB0Classifier(num_classes=4, pretrained=False)
    model.eval()
    dummy_input = torch.rand(1, 3, 224, 224)
    cam = compute_gradcam(model, dummy_input, target_class_idx=0, method="gradcam_pp")
    assert cam.shape == (224, 224), f"CAM shape mismatch: {cam.shape}"
    assert cam.min() >= 0.0 and cam.max() <= 1.0, f"CAM values not in [0, 1]: min={cam.min()}, max={cam.max()}"

def test_overlay_cam_shape_and_dtype():
    rgb = np.full((224, 224, 3), 120, dtype=np.uint8)
    cam = np.random.rand(224, 224).astype(np.float32)
    blended = overlay_cam(rgb, cam)
    assert blended.shape == rgb.shape
    assert blended.dtype == np.uint8

def test_saliency_stability_identical_maps():
    cam1 = np.ones((100, 100), dtype=np.float32)
    ssim_val, spearman_val = compute_saliency_stability(cam1, cam1)
    assert np.isclose(ssim_val, 1.0, atol=1e-3)
