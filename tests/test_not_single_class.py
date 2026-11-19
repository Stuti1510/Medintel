"""
Step 5.1 — Regression Guard: Verify the model is not a single-class predictor.
Evaluates a fixed 80-image stratified subset (20 per class) from Fold 0 test split.
Asserts:
1. At least 3 different classes are predicted across the evaluation set.
2. No single class accounts for more than 70% of total predictions.
3. Macro-F1 is strictly above the majority-class trivial baseline (1/4 = 0.25).
"""

import sys
from pathlib import Path
if "." not in sys.path:
    sys.path.insert(0, ".")

import pytest
import pandas as pd
from collections import Counter
from sklearn.metrics import f1_score, accuracy_score
from backend.app.services.multimodal_service import get_multimodal_service
from data.multimodal.preprocess_inference import CLASSES

PROJECT_ROOT = Path(__file__).resolve().parents[1]

def test_predictions_not_single_class():
    manifest_p = PROJECT_ROOT / "data/multimodal/manifest.csv"
    assert manifest_p.exists(), "Manifest file data/multimodal/manifest.csv not found"
    
    df = pd.read_csv(manifest_p)
    f0 = df[df["fold"] == 0]
    
    # Stratified 20 samples per class = 80 samples total
    samples = []
    for c in CLASSES:
        cls_df = f0[f0["diagnostic"] == c].head(20)
        samples.append(cls_df)
    eval_df = pd.concat(samples, ignore_index=True)
    assert len(eval_df) == 80
    
    service = get_multimodal_service()
    
    y_true = []
    y_pred = []
    
    for _, row in eval_df.iterrows():
        img_id = row["img_id"]
        true_c = row["diagnostic"]
        narrative = str(row["narrative"])
        img_p = PROJECT_ROOT / "data/multimodal/images" / img_id
        
        with open(img_p, "rb") as f:
            img_bytes = f.read()
            
        res = service.analyze(image_bytes=img_bytes, narrative=narrative)
        pred_c = res["prediction"]
        
        y_true.append(true_c)
        y_pred.append(pred_c)
        
    counts = Counter(y_pred)
    total = len(y_pred)
    unique_classes = set(y_pred)
    
    print(f"\nPrediction counts across 80 samples: {dict(counts)}")
    
    # 1. At least 3 different classes predicted
    assert len(unique_classes) >= 3, (
        f"Model predicted only {len(unique_classes)} distinct classes: {unique_classes}"
    )
    
    # 2. No single class exceeds 70%
    for c, cnt in counts.items():
        ratio = cnt / total
        assert ratio <= 0.70, (
            f"Class {c} accounted for {ratio*100:.1f}% (> 70%) of all predictions!"
        )
        
    # 3. Macro-F1 strictly above majority-class trivial baseline
    macro_f1 = f1_score(y_true, y_pred, average="macro", zero_division=0)
    print(f"Subset Macro-F1: {macro_f1:.4f}, Accuracy: {accuracy_score(y_true, y_pred):.4f}")
    assert macro_f1 > 0.40, (
        f"Macro-F1 {macro_f1:.4f} is not sufficiently above baseline"
    )
