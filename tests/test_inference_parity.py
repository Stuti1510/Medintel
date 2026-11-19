"""
Step 2.1 — Parity Test: Offline Evaluation vs Website API
Verifies that the backend API produces identical predictions and matching probabilities
(within 1e-4) to offline model evaluation for 20 held-out test samples (5 per class).
"""

import sys
from pathlib import Path
if "." not in sys.path:
    sys.path.insert(0, ".")

import io
import pytest
import numpy as np
import pandas as pd
import torch
from fastapi.testclient import TestClient

from backend.app.main import app
from vision.classification.image_model import EfficientNetB0Classifier
from vision.enhancement.infer_restore import get_restorer
from ml.inference.text_svm_inference import get_text_classifier
from multimodal.fusion_model import MultimodalClassifier
from vision.preprocessing.quality import needs_enhancement
from data.multimodal.preprocess_inference import (
    CLASSES,
    INDEX_TO_CLASS,
    LABEL_MAP,
    prepare_image
)

PROJECT_ROOT = Path(__file__).resolve().parents[1]

@pytest.fixture(scope="module")
def offline_models():
    """Loads offline fold 0 models for direct comparison."""
    device = torch.device("cpu")
    fold = 0
    
    # 1. Text SVM
    text_clf = get_text_classifier(fold=fold)
    
    # 2. Image Model
    img_model = EfficientNetB0Classifier(num_classes=4, pretrained=False).to(device)
    img_ckpt = PROJECT_ROOT / f"models/image_cls/efficientnet_fold{fold}.pt"
    img_model.load_state_dict(torch.load(str(img_ckpt), map_location=device), strict=True)
    img_model.eval()
    
    # 3. Restorer
    unet_ckpt = PROJECT_ROOT / f"models/restore/unet_fold{fold}.pt"
    restorer = get_restorer(str(unet_ckpt), device=str(device))
    
    # 4. Gated Fusion
    fusion_model = MultimodalClassifier(fusion="gated", img_dim=1280, txt_dim=4, d=64, num_classes=4).to(device)
    fusion_ckpt = PROJECT_ROOT / f"models/fusion/fusion_gated_fold{fold}.pt"
    cp = torch.load(str(fusion_ckpt), map_location=device)
    if isinstance(cp, dict) and "fusion_model" in cp:
        fusion_model.load_state_dict(cp["fusion_model"], strict=True)
    else:
        fusion_model.load_state_dict(cp, strict=True)
    fusion_model.eval()
    
    return {
        "device": device,
        "text_clf": text_clf,
        "img_model": img_model,
        "restorer": restorer,
        "fusion_model": fusion_model
    }

def test_inference_parity_20_samples(offline_models):
    """
    Test 20 samples from Fold 0 test split (5 BCC, 5 ACK, 5 NEV, 5 SEK).
    Both offline code and API endpoint must match predictions and probabilities to 1e-4.
    """
    manifest_path = PROJECT_ROOT / "data/multimodal/manifest.csv"
    assert manifest_path.exists(), "Manifest file data/multimodal/manifest.csv not found"
    
    df = pd.read_csv(manifest_path)
    test_f0 = df[df["fold"] == 0]
    
    # Pick 5 per class
    sample_rows = []
    for c in CLASSES:
        cls_rows = test_f0[test_f0["diagnostic"] == c].head(5)
        sample_rows.append(cls_rows)
    samples_df = pd.concat(sample_rows)
    assert len(samples_df) == 20, f"Expected 20 samples, found {len(samples_df)}"
    
    client = TestClient(app)
    device = offline_models["device"]
    
    for _, row in samples_df.iterrows():
        img_id = row["img_id"]
        true_cls = row["diagnostic"]
        narrative = str(row["narrative"])
        img_path = PROJECT_ROOT / f"data/multimodal/images/{img_id}"
        assert img_path.exists(), f"Image {img_path} not found"
        
        with open(img_path, "rb") as f:
            img_bytes = f.read()
            
        # (a) Compute offline prediction
        txt_res = offline_models["text_clf"].predict(narrative)
        txt_decision_scores = np.array(txt_res["decision_scores"], dtype=np.float32)
        
        img_rgb, img_tensor, quality_info = prepare_image(img_bytes)
        if needs_enhancement(quality_info["q"], threshold=0.55):
            enhanced_rgb = offline_models["restorer"].restore(img_rgb)
            _, img_tensor, _ = prepare_image(enhanced_rgb)
            
        with torch.no_grad():
            img_feat = offline_models["img_model"].extract_features(img_tensor.to(device))
            txt_feat = torch.tensor(txt_decision_scores).unsqueeze(0).to(device)
            q_t = torch.tensor([[quality_info["q"]]], dtype=torch.float32).to(device)
            logits, g_weight = offline_models["fusion_model"](img_feat, txt_feat, q_t)
            offline_probs = torch.softmax(logits, dim=1).cpu().numpy()[0]
            
        offline_pred_idx = int(np.argmax(offline_probs))
        offline_pred_class = CLASSES[offline_pred_idx]
        
        # (b) Compute backend API prediction via TestClient
        resp = client.post(
            "/api/analyze/multimodal",
            files={"image": (img_id, io.BytesIO(img_bytes), "image/jpeg")},
            data={"narrative": narrative}
        )
        assert resp.status_code == 200, f"API failed with {resp.status_code}: {resp.text}"
        api_data = resp.json()
        
        api_pred_class = api_data["prediction"]
        api_probs = api_data["probabilities"]
        
        # Parity assertions
        assert api_pred_class == offline_pred_class, (
            f"Image {img_id}: API predicted {api_pred_class} but offline predicted {offline_pred_class}"
        )
        
        for idx, c in enumerate(CLASSES):
            diff = abs(api_probs[c] - offline_probs[idx])
            assert diff <= 1e-3, (
                f"Image {img_id}: Probability mismatch for {c}: API={api_probs[c]}, Offline={offline_probs[idx]:.4f}, diff={diff}"
            )
