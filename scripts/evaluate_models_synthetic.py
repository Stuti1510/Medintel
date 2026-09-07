"""
MEDINTEL AI - Phase 11: Empirical Model Evaluation on Held-Out Test Set (N=1,500)
Calculates real metrics strictly from the untouched test set.
"""

import os
import sys
import time
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score, balanced_accuracy_score, precision_score, recall_score,
    f1_score, confusion_matrix, classification_report, roc_auc_score
)
from sklearn.preprocessing import label_binarize

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

def evaluate_models_on_test_set(
    data_dir="data/processed",
    models_dir="models/classical",
    eval_dir="evaluation"
):
    os.makedirs(eval_dir, exist_ok=True)

    print("=" * 60)
    print("PHASE 11: MODEL EVALUATION ON HELD-OUT TEST SET (N=1,500)")
    print("=" * 60)

    # 1. Load Test Set
    X_test = np.load(os.path.join(data_dir, "X_test_synthetic.npy"))
    y_test = np.load(os.path.join(data_dir, "y_test_synthetic.npy"))

    with open(os.path.join(data_dir, "synthetic_label_mapping.json"), "r") as f:
        label_mapping = json.load(f)

    classes = [label_mapping[str(i)] for i in range(len(label_mapping))]
    num_classes = len(classes)
    y_test_bin = label_binarize(y_test, classes=list(range(num_classes)))

    print(f"Test Set Samples: {len(y_test):,} | Features: {X_test.shape[1]}")
    print(f"Target Classes: {classes}")

    models_manifest = {
        "Logistic Regression": "synthetic_logistic_regression.joblib",
        "Random Forest": "synthetic_random_forest.joblib",
        "XGBoost": "synthetic_xgboost.joblib"
    }

    results = {}

    for model_name, filename in models_manifest.items():
        model_path = os.path.join(models_dir, filename)
        if not os.path.exists(model_path):
            print(f"Warning: Model artifact missing at {model_path}")
            continue

        model = joblib.load(model_path)
        
        # Benchmark Inference Latency
        start_inf = time.perf_counter()
        y_pred = model.predict(X_test)
        inf_duration = time.perf_counter() - start_inf
        latency_ms_per_sample = round((inf_duration / len(X_test)) * 1000, 4)

        # Probabilities
        y_prob = None
        if hasattr(model, "predict_proba"):
            y_prob = model.predict_proba(X_test)

        # Compute Real Metrics
        acc = float(accuracy_score(y_test, y_pred))
        bal_acc = float(balanced_accuracy_score(y_test, y_pred))
        p_macro = float(precision_score(y_test, y_pred, average="macro", zero_division=0))
        r_macro = float(recall_score(y_test, y_pred, average="macro", zero_division=0))
        f1_macro = float(f1_score(y_test, y_pred, average="macro", zero_division=0))
        
        p_weighted = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
        r_weighted = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
        f1_weighted = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))

        cm = confusion_matrix(y_test, y_pred).tolist()

        # Per-Class Metrics
        clf_rep = classification_report(y_test, y_pred, target_names=classes, output_dict=True, zero_division=0)
        per_class = {}
        for cls_name in classes:
            if cls_name in clf_rep:
                per_class[cls_name] = {
                    "precision": round(clf_rep[cls_name]["precision"], 4),
                    "recall": round(clf_rep[cls_name]["recall"], 4),
                    "f1": round(clf_rep[cls_name]["f1-score"], 4),
                    "support": int(clf_rep[cls_name]["support"])
                }

        roc_auc = None
        if y_prob is not None:
            try:
                roc_auc = float(round(roc_auc_score(y_test_bin, y_prob, multi_class="ovr", average="macro"), 4))
            except Exception:
                roc_auc = None

        file_size_kb = round(os.path.getsize(model_path) / 1024, 2)

        results[model_name] = {
            "model_name": model_name,
            "filename": filename,
            "accuracy": round(acc, 4),
            "balanced_accuracy": round(bal_acc, 4),
            "precision_macro": round(p_macro, 4),
            "recall_macro": round(r_macro, 4),
            "f1_macro": round(f1_macro, 4),
            "precision_weighted": round(p_weighted, 4),
            "recall_weighted": round(r_weighted, 4),
            "f1_weighted": round(f1_weighted, 4),
            "roc_auc": roc_auc,
            "confusion_matrix": cm,
            "per_class_metrics": per_class,
            "inference_latency_ms": latency_ms_per_sample,
            "model_size_kb": file_size_kb,
            "test_samples": len(y_test)
        }

        print(f"\n==================================================")
        print(f"MODEL: {model_name}")
        print(f"==================================================")
        print(f"  Accuracy:            {acc * 100:.2f}%")
        print(f"  Balanced Accuracy:   {bal_acc * 100:.2f}%")
        print(f"  Macro Precision:     {p_macro:.4f}")
        print(f"  Macro Recall:        {r_macro:.4f}")
        print(f"  PRIMARY: Macro F1:   {f1_macro:.4f}")
        print(f"  Weighted F1:         {f1_weighted:.4f}")
        if roc_auc:
            print(f"  Multi-class ROC-AUC: {roc_auc:.4f}")
        print(f"  Inference Latency:   {latency_ms_per_sample:.3f} ms / sample")
        print(f"\n  Per-Class Metrics:")
        for c_name, c_metrics in per_class.items():
            print(f"    - {c_name:<15}: Precision={c_metrics['precision']:.4f}, Recall={c_metrics['recall']:.4f}, F1={c_metrics['f1']:.4f}, Support={c_metrics['support']}")
        print(f"\n  Confusion Matrix:\n{np.array(cm)}")

    # Save to evaluation directory
    output_results_path = os.path.join(eval_dir, "synthetic_classical_ml_results.json")
    with open(output_results_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print(f"\nSaved empirical test set evaluation results to {output_results_path}")
    print("=" * 60)
    print("PHASE 11 COMPLETE: Real evaluation metrics calculated and logged.")
    print("=" * 60)

    return results

if __name__ == "__main__":
    evaluate_models_on_test_set()
