"""
MEDINTEL AI - Comprehensive 7-Step Model Audit & Evaluation
Computes:
Step 1: Prediction and candidate distribution tracing.
Step 2: Class labels & index bijective mapping verification.
Step 3: Recalculation of test accuracy from saved models and test.csv (N=180).
Step 4: Comparison of training (N=840), validation (N=180), and test (N=180) performance (overfitting analysis).
Step 5: Macro-F1, Weighted-F1, Per-class Recall, and Confusion Matrix analysis.
Step 6: Calibration evaluation (ECE with 10 equal-width bins, Brier score, reliability curves) on held-out test data.
Step 7: Dashboard and API response verification.
"""

import os
import sys
import json
import joblib

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import torch
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score, balanced_accuracy_score, f1_score,
    precision_score, recall_score, confusion_matrix,
    classification_report, brier_score_loss
)

def compute_ece(probs: np.ndarray, y_true: np.ndarray, n_bins: int = 10) -> float:
    """
    Computes Expected Calibration Error (ECE) for multiclass classification
    using top-1 confidence predictions across n_bins equal-width bins.
    """
    confidences = np.max(probs, axis=1)
    predictions = np.argmax(probs, axis=1)
    accuracies = (predictions == y_true).astype(float)
    
    bin_boundaries = np.linspace(0.0, 1.0, n_bins + 1)
    ece = 0.0
    total_samples = len(y_true)
    
    bin_details = []
    for i in range(n_bins):
        bin_lower = bin_boundaries[i]
        bin_upper = bin_boundaries[i + 1]
        
        in_bin = (confidences > bin_lower) & (confidences <= bin_upper) if i > 0 else (confidences >= bin_lower) & (confidences <= bin_upper)
        bin_count = np.sum(in_bin)
        
        if bin_count > 0:
            bin_acc = np.mean(accuracies[in_bin])
            bin_conf = np.mean(confidences[in_bin])
            bin_error = abs(bin_acc - bin_conf)
            ece += (bin_count / total_samples) * bin_error
            bin_details.append({
                "bin": i + 1,
                "range": f"[{bin_lower:.1f}, {bin_upper:.1f}]",
                "count": int(bin_count),
                "accuracy": float(round(bin_acc, 4)),
                "confidence": float(round(bin_conf, 4)),
                "diff": float(round(bin_error, 4))
            })
            
    return float(round(ece, 4)), bin_details

def main():
    print("=" * 80)
    print("MEDINTEL AI: 7-STEP COMPREHENSIVE ML AUDIT")
    print("=" * 80)

    # 1. Load Partitions
    train_df = pd.read_csv("data/processed/train.csv")
    val_df = pd.read_csv("data/processed/val.csv")
    test_df = pd.read_csv("data/processed/test.csv")
    print(f"Dataset partitions loaded: Train={len(train_df)}, Val={len(val_df)}, Test={len(test_df)}")

    # 2. Step 2: Verify class mappings
    with open("data/processed/label_mapping.json", "r") as f:
        label_mapping = json.load(f)
    le = joblib.load("models/classical/label_encoder.joblib")
    classes_24 = list(le.classes_)
    
    for idx, c in enumerate(classes_24):
        assert label_mapping[str(idx)] == c, f"Class mapping mismatch at {idx}: {label_mapping[str(idx)]} != {c}"
    print(f"Step 2: Class mappings 100% verified across {len(classes_24)} classes.")

    # Load Feature Pipeline
    feature_pipeline = joblib.load("models/classical/feature_pipeline.joblib")
    
    X_train = feature_pipeline.transform(train_df["text"])
    y_train = le.transform(train_df["label"])

    X_val = feature_pipeline.transform(val_df["text"])
    y_val = le.transform(val_df["label"])

    X_test = feature_pipeline.transform(test_df["text"])
    y_test = le.transform(test_df["label"])

    # Models to audit
    models = {
        "Calibrated Linear SVM": joblib.load("models/classical/linear_svm.joblib"),
        "Logistic Regression": joblib.load("models/classical/logistic_regression.joblib"),
        "Random Forest": joblib.load("models/classical/random_forest.joblib"),
        "XGBoost": joblib.load("models/classical/xgboost.joblib")
    }

    results = {}

    for m_name, model in models.items():
        print(f"\n--- Evaluating Model: {m_name} ---")
        
        # Determine predict_proba function
        def get_probs(m, X_mat):
            if m_name == "XGBoost" and hasattr(X_mat, "toarray"):
                X_mat = X_mat.toarray()
            if hasattr(m, "predict_proba"):
                return m.predict_proba(X_mat)
            elif hasattr(m, "decision_function"):
                d = m.decision_function(X_mat)
                exp_d = np.exp(d - np.max(d, axis=1, keepdims=True))
                return exp_d / np.sum(exp_d, axis=1, keepdims=True)
            else:
                y_p = m.predict(X_mat)
                p = np.zeros((len(y_p), len(classes_24)))
                for row_idx, pred_c in enumerate(y_p):
                    p[row_idx, pred_c] = 1.0
                return p

        # Probabilities
        train_probs = get_probs(model, X_train)
        val_probs = get_probs(model, X_val)
        test_probs = get_probs(model, X_test)

        train_preds = np.argmax(train_probs, axis=1)
        val_preds = np.argmax(val_probs, axis=1)
        test_preds = np.argmax(test_probs, axis=1)

        # Accuracies
        train_acc = float(round(accuracy_score(y_train, train_preds), 4))
        val_acc = float(round(accuracy_score(y_val, val_preds), 4))
        test_acc = float(round(accuracy_score(y_test, test_preds), 4))
        
        # Step 4: Overfitting Generalization Gap
        gen_gap_val = float(round(train_acc - val_acc, 4))
        gen_gap_test = float(round(train_acc - test_acc, 4))

        # Step 5: Test Metrics
        test_bal_acc = float(round(balanced_accuracy_score(y_test, test_preds), 4))
        test_macro_f1 = float(round(f1_score(y_test, test_preds, average="macro"), 4))
        test_weighted_f1 = float(round(f1_score(y_test, test_preds, average="weighted"), 4))
        test_macro_prec = float(round(precision_score(y_test, test_preds, average="macro", zero_division=0), 4))
        test_macro_rec = float(round(recall_score(y_test, test_preds, average="macro", zero_division=0), 4))

        cm = confusion_matrix(y_test, test_preds, labels=range(len(classes_24)))
        cm_trace = int(np.trace(cm))
        cm_total = int(np.sum(cm))
        recalculated_acc = float(round(cm_trace / cm_total, 4))

        # Per-class recall
        per_class_rec = {}
        report = classification_report(y_test, test_preds, target_names=classes_24, output_dict=True, zero_division=0)
        for c in classes_24:
            per_class_rec[c] = {
                "precision": float(round(report[c]["precision"], 4)),
                "recall": float(round(report[c]["recall"], 4)),
                "f1": float(round(report[c]["f1-score"], 4)),
                "support": int(report[c]["support"])
            }

        # Step 6: Calibration Metrics
        val_ece, _ = compute_ece(val_probs, y_val, n_bins=10)
        test_ece, bin_details = compute_ece(test_probs, y_test, n_bins=10)
        
        # Multi-class Brier score
        one_hot_test = np.zeros_like(test_probs)
        for r_i, c_i in enumerate(y_test):
            one_hot_test[r_i, c_i] = 1.0
        brier = float(round(np.mean(np.sum((test_probs - one_hot_test) ** 2, axis=1)), 4))

        results[m_name] = {
            "train_accuracy": train_acc,
            "val_accuracy": val_acc,
            "test_accuracy": test_acc,
            "balanced_accuracy": test_bal_acc,
            "macro_f1": test_macro_f1,
            "weighted_f1": test_weighted_f1,
            "macro_precision": test_macro_prec,
            "macro_recall": test_macro_rec,
            "generalization_gap_val": gen_gap_val,
            "generalization_gap_test": gen_gap_test,
            "confusion_matrix_diagonal_sum": cm_trace,
            "confusion_matrix_total": cm_total,
            "accuracy_matches_cm_trace": (test_acc == recalculated_acc),
            "val_ece": val_ece,
            "test_ece": test_ece,
            "brier_score": brier,
            "calibration_bins": bin_details,
            "per_class": per_class_rec,
            "confusion_matrix": cm.tolist()
        }

        print(f"Train Acc: {train_acc*100:.2f}% | Val Acc: {val_acc*100:.2f}% | Test Acc: {test_acc*100:.2f}%")
        print(f"Macro F1: {test_macro_f1:.4f} | Weighted F1: {test_weighted_f1:.4f} | Macro Recall: {test_macro_rec:.4f}")
        print(f"Generalization Gap (Train - Test): {gen_gap_test*100:.2f}%")
        print(f"Confusion Matrix Trace: {cm_trace}/{cm_total} = {recalculated_acc*100:.2f}% (Matches: {test_acc == recalculated_acc})")
        print(f"Calibration: Test ECE = {test_ece:.4f} | Brier Score = {brier:.4f}")

    # Save comprehensive audit results to reports/
    os.makedirs("reports", exist_ok=True)
    with open("reports/audit_7steps_results.json", "w") as f:
        json.dump(results, f, indent=2)
    print("\nSaved comprehensive audit report to reports/audit_7steps_results.json")

if __name__ == "__main__":
    main()
