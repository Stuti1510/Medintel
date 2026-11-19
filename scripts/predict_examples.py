"""
MEDINTEL AI — Empirical Test Case Evaluator
Runs 5 held-out test-split images per class from fold 0 (20 total)
and displays true class, predicted class, probability distribution, and match status.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pandas as pd
import numpy as np
from sklearn.metrics import accuracy_score, classification_report, f1_score
from backend.app.services.multimodal_service import MultimodalService
from data.multimodal.preprocess_inference import CLASSES

def run_examples():
    project_root = Path(__file__).resolve().parents[1]
    manifest_p = project_root / "data/multimodal/manifest.csv"
    if not manifest_p.exists():
        print(f"[ERROR] Manifest file not found: {manifest_p}")
        sys.exit(1)
        
    df = pd.read_csv(manifest_p)
    f0 = df[df["fold"] == 0]
    
    print("=" * 95)
    print("MEDINTEL AI: HELD-OUT TEST SAMPLE EVALUATION (FOLD 0)")
    print("=" * 95)
    
    service = MultimodalService(fold=0)
    
    y_true = []
    y_pred = []
    results = []
    
    header = f"{'Image ID':<16} | {'True':<5} | {'Pred':<5} | {'Match':<5} | {'Conf':<7} | {'BCC':<6} | {'ACK':<6} | {'NEV':<6} | {'SEK':<6}"
    print(header)
    print("-" * 95)
    
    for c in CLASSES:
        samples = f0[f0["diagnostic"] == c].head(5)
        for _, s in samples.iterrows():
            img_id = s["img_id"]
            img_p = project_root / "data/multimodal/images" / img_id
            
            with open(img_p, "rb") as f:
                img_bytes = f.read()
                
            res = service.analyze(image_bytes=img_bytes, narrative=s["narrative"])
            pred = res["prediction"]
            conf = res["confidence"]
            p = res["probabilities"]
            
            matched = "✓" if pred == c else "✗"
            y_true.append(c)
            y_pred.append(pred)
            
            row_str = (
                f"{img_id:<16} | {c:<5} | {pred:<5} | {matched:<5} | "
                f"{conf:<7.4f} | {p['BCC']:<6.3f} | {p['ACK']:<6.3f} | {p['NEV']:<6.3f} | {p['SEK']:<6.3f}"
            )
            print(row_str)
            results.append({
                "img_id": img_id,
                "true": c,
                "pred": pred,
                "conf": conf,
                "probs": p
            })
            
    print("=" * 95)
    acc = accuracy_score(y_true, y_pred)
    macro_f1 = f1_score(y_true, y_pred, average="macro", zero_division=0)
    unique_preds = set(y_pred)
    
    print(f"Sample Accuracy: {acc * 100:.2f}% ({sum(1 for t, p in zip(y_true, y_pred) if t == p)} / {len(y_true)})")
    print(f"Macro F1 Score:  {macro_f1:.4f}")
    print(f"Classes Predicted: {sorted(list(unique_preds))} ({len(unique_preds)}/4 classes)")
    print("=" * 95)
    
    if len(unique_preds) < 3:
        print("[FAIL] Model did not predict diverse classes.")
        sys.exit(1)
        
    print("[PASS] Multi-class prediction verified on held-out test split.")

if __name__ == "__main__":
    run_examples()
