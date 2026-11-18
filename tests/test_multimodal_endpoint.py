"""
Tests for POST /api/analyze/multimodal endpoint.
Uses FastAPI TestClient to test:
1. Valid upload with small PNG and symptoms returns 200 with all required fields.
2. Text-only request (no image) returns 200 with image_weight=0.0.
3. Unsupported file extension returns 400.
4. Missing model file returns 503 with descriptive message.
"""

import sys
from pathlib import Path
if "." not in sys.path:
    sys.path.insert(0, ".")

import io
import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.multimodal_service import get_multimodal_service, ModelUnavailableError

client = TestClient(app)

def create_dummy_png():
    img = np.full((128, 128, 3), 150, dtype=np.uint8)
    cv2.circle(img, (64, 64), 30, (80, 50, 40), -1)
    _, buffer = cv2.imencode(".png", img)
    return io.BytesIO(buffer.tobytes())

def test_multimodal_endpoint_success():
    png_io = create_dummy_png()
    files = {"image": ("test_lesion.png", png_io, "image/png")}
    data = {
        "narrative": "Patient is a 62-year-old female with an elevated bleeding lesion on the cheek.",
        "bleed": "true",
        "elevation": "true",
        "age": "62",
        "region": "FACE"
    }
    
    resp = client.post("/api/analyze/multimodal", files=files, data=data)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    
    body = resp.json()
    assert body["prediction"] in ["BCC", "ACK", "NEV", "SEK"]
    assert 0.0 <= body["confidence"] <= 1.0
    assert 0.0 <= body["quality"]["q"] <= 1.0
    assert "image" in body["modality_weights"]
    assert "text" in body["modality_weights"]
    assert len(body["text_attributions"]) > 0
    assert body["gradcam_base64"] is not None
    assert "timings_ms" in body
    assert body["timings_ms"]["quality"] >= 0.0
    assert body["timings_ms"]["fusion"] >= 0.0

def test_text_only_request():
    data = {
        "narrative": "Patient presents with a flat stable lesion on the back without itch or bleeding.",
        "itch": "false",
        "bleed": "false"
    }
    resp = client.post("/api/analyze/multimodal", data=data)
    assert resp.status_code == 200
    
    body = resp.json()
    assert body["prediction"] in ["BCC", "ACK", "NEV", "SEK"]
    assert body["modality_weights"]["image"] == 0.0
    assert body["modality_weights"]["text"] == 1.0
    assert body["gradcam_base64"] is None

def test_unsupported_image_format_returns_400():
    fake_txt = io.BytesIO(b"not an image file")
    files = {"image": ("sample.txt", fake_txt, "text/plain")}
    resp = client.post("/api/analyze/multimodal", files=files)
    assert resp.status_code == 400
    assert "Only JPEG and PNG" in resp.json()["detail"]

def test_missing_model_file_returns_503(monkeypatch):
    svc = get_multimodal_service()
    # Simulate missing model file by setting is_ready = False
    original_ready = svc.is_ready
    original_missing = svc.missing_path
    
    try:
        svc.is_ready = False
        svc.missing_path = "models/fusion/fusion_gated_fold0.pt"
        
        png_io = create_dummy_png()
        files = {"image": ("test.png", png_io, "image/png")}
        resp = client.post("/api/analyze/multimodal", files=files)
        assert resp.status_code == 503
        assert "Model file not found" in resp.json()["detail"]
    finally:
        svc.is_ready = original_ready
        svc.missing_path = original_missing
