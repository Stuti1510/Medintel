"""
Training script for the only text classifier: TF-IDF (1-2 grams) + Calibrated LinearSVC.
Tunes C in {0.1, 0.3, 1, 3, 10} on validation fold by macro-F1.
Saves vectorizer.joblib and model.joblib in models/text_svm/fold{k}/.
"""

import os
import sys
if "." not in sys.path:
    sys.path.insert(0, ".")

import argparse
import json
import joblib
import yaml
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, f1_score, balanced_accuracy_score, roc_auc_score, confusion_matrix

from data.preprocess import get_fold_splits

def compute_ece(probs, labels, n_bins=10):
    bin_boundaries = np.linspace(0, 1, n_bins + 1)
    confidences = np.max(probs, axis=1)
    predictions = np.argmax(probs, axis=1)
    accuracies = (predictions == labels)
    
    ece = 0.0
    for i in range(n_bins):
        in_bin = (confidences > bin_boundaries[i]) & (confidences <= bin_boundaries[i + 1])
        prop_in_bin = np.mean(in_bin)
        if prop_in_bin > 0:
            accuracy_in_bin = np.mean(accuracies[in_bin])
            avg_confidence_in_bin = np.mean(confidences[in_bin])
            ece += np.abs(avg_confidence_in_bin - accuracy_in_bin) * prop_in_bin
    return float(ece)

def train_text_svm(fold: int = 0, manifest_path: str = "data/multimodal/manifest.csv", seed: int = 42):
    print(f"=== Training TF-IDF + Linear SVM on Fold {fold} ===")
    train_df, val_df, test_df = get_fold_splits(manifest_path, fold=fold)
    
    X_train_text = train_df["narrative"].astype(str).tolist()
    y_train = train_df["label"].values
    
    X_val_text = val_df["narrative"].astype(str).tolist()
    y_val = val_df["label"].values
    
    X_test_text = test_df["narrative"].astype(str).tolist()
    y_test = test_df["label"].values
    
    # 1. Fit TF-IDF Vectorizer on training narratives only
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, min_df=1)
    X_train = vectorizer.fit_transform(X_train_text)
    X_val = vectorizer.transform(X_val_text)
    X_test = vectorizer.transform(X_test_text)
    
    # 2. Tune C on validation fold
    c_candidates = [0.1, 0.3, 1.0, 3.0, 10.0]
    best_c = 1.0
    best_val_f1 = -1.0
    
    for c_val in c_candidates:
        base_svc = LinearSVC(C=c_val, class_weight="balanced", random_state=seed, max_iter=2000)
        calibrated_clf = CalibratedClassifierCV(estimator=base_svc, method="sigmoid", cv=3)
        calibrated_clf.fit(X_train, y_train)
        
        val_preds = calibrated_clf.predict(X_val)
        val_f1 = f1_score(y_val, val_preds, average="macro", zero_division=0)
        print(f"  C={c_val:4.1f} | Val Macro-F1: {val_f1:.4f}")
        
        if val_f1 > best_val_f1:
            best_val_f1 = val_f1
            best_c = c_val
            
    print(f"Chosen C for fold {fold}: {best_c} (Val Macro-F1: {best_val_f1:.4f})")
    
    # 3. Train final model with chosen C
    final_svc = LinearSVC(C=best_c, class_weight="balanced", random_state=seed, max_iter=2000)
    final_model = CalibratedClassifierCV(estimator=final_svc, method="sigmoid", cv=3)
    final_model.fit(X_train, y_train)
    
    # 4. Save artifacts
    save_dir = f"models/text_svm/fold{fold}"
    os.makedirs(save_dir, exist_ok=True)
    joblib.dump(vectorizer, os.path.join(save_dir, "vectorizer.joblib"))
    joblib.dump(final_model, os.path.join(save_dir, "model.joblib"))
    
    # Update config tuned_c
    config_path = "configs/text_svm.yaml"
    if os.path.exists(config_path):
        with open(config_path, "r") as fp:
            cfg = yaml.safe_load(fp) or {}
        if "tuned_c" not in cfg:
            cfg["tuned_c"] = {}
        cfg["tuned_c"][f"fold{fold}"] = float(best_c)
        with open(config_path, "w") as fp:
            yaml.dump(cfg, fp, default_flow_style=False)
            
    # 5. Evaluate on test set
    test_probs = final_model.predict_proba(X_test)
    test_preds = np.argmax(test_probs, axis=1)
    
    acc = accuracy_score(y_test, test_preds)
    macro_f1 = f1_score(y_test, test_preds, average="macro", zero_division=0)
    bal_acc = balanced_accuracy_score(y_test, test_preds)
    per_class_f1 = f1_score(y_test, test_preds, average=None, zero_division=0).tolist()
    
    try:
        macro_auc = roc_auc_score(y_test, test_probs, multi_class="ovr", average="macro")
    except Exception:
        macro_auc = 0.5
        
    ece = compute_ece(test_probs, y_test)
    cm = confusion_matrix(y_test, test_preds).tolist()
    
    metrics = {
        "fold": fold,
        "chosen_C": best_c,
        "accuracy": round(float(acc), 4),
        "macro_f1": round(float(macro_f1), 4),
        "balanced_accuracy": round(float(bal_acc), 4),
        "per_class_f1": [round(float(x), 4) for x in per_class_f1],
        "macro_auc": round(float(macro_auc), 4),
        "ece": round(float(ece), 4),
        "confusion_matrix": cm
    }
    
    out_dir = f"reports/multimodal/text_svm_fold{fold}"
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)
        
    print(f"Test Set Evaluation -> Accuracy: {acc:.4f}, Macro-F1: {macro_f1:.4f}, Macro-AUC: {macro_auc:.4f}, ECE: {ece:.4f}")
    return metrics

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--fold", type=int, default=0)
    args = parser.parse_args()
    train_text_svm(fold=args.fold)
