"""
Tests for POST /api/analyze/multimodal endpoint.
Verifies:
1. Valid upload with image and symptoms returns prediction, quality, Grad-CAM, and modality weights.
2. Text-only request (no image) works with image_weight=0.0.
3. Prediction adheres strictly to the 4 target classes: BCC, ACK, NEV, SEK.
"""

import sys
if "." not in sys.path:
    sys.path.insert(0, ".")

import io
import cv2
import numpy as np
import pytest
from fastapi import UploadFile

from backend.app.api.endpoints.clinical import analyze_multimodal
from backend.app.schemas.clinical_schema import MultimodalAnalysisResponse

def create_dummy_png():
    img = np.full((128, 128, 3), 150, dtype=np.uint8)
    cv2.circle(img, (64, 64), 30, (80, 50, 40), -1)
    _, buffer = cv2.imencode(".png", img)
    return io.BytesIO(buffer.tobytes())

def test_multimodal_analysis_with_image():
    png_io = create_dummy_png()
    upload = UploadFile(file=png_io, filename="test_lesion.png")
    
    raw = analyze_multimodal(
        image=upload,
        narrative="Patient is a 62-year-old female with an elevated bleeding lesion on the cheek.",
        bleed="true",
        elevation="true"
    )
    
    body = MultimodalAnalysisResponse(**raw) if isinstance(raw, dict) else raw
    assert body.prediction in ["BCC", "ACK", "NEV", "SEK"]
    assert 0.0 <= body.confidence <= 1.0
    assert 0.0 <= body.quality.q <= 1.0
    assert body.modality_weights.image >= 0.0
    assert body.modality_weights.text >= 0.0
    assert len(body.text_attributions) > 0
    assert body.gradcam_base64 is not None

def test_text_only_request():
    raw = analyze_multimodal(
        image=None,
        narrative="Patient presents with a flat stable lesion on the back without itch or bleeding."
    )
    
    body = MultimodalAnalysisResponse(**raw) if isinstance(raw, dict) else raw
    assert body.prediction in ["BCC", "ACK", "NEV", "SEK"]
    assert body.modality_weights.image == 0.0
    assert body.modality_weights.text == 1.0
    assert body.gradcam_base64 is None
