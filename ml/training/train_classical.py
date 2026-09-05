"""
MEDINTEL AI - Classical ML Training, Optimization & Evaluation Engine (Active Master Dataset)
Trains Logistic Regression, Random Forest, and XGBoost on the active balanced master dataset partition (train.csv N=1,680).
Evaluates on untouched validation & test splits (val.csv N=360, test.csv N=360) with zero data manipulation.
"""

import os
import sys
import time
import json
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score, balanced_accuracy_score, precision_score, recall_score,
    f1_score, confusion_matrix, classification_report, roc_auc_score,
    precision_recall_curve, auc
)
import joblib

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from data.feature_pipeline import build_and_fit_feature_pipeline

RANDOM_SEED = 42

def train_and_evaluate_all_models(
    data_dir="data/processed",
    models_dir="models/classical",
    eval_dir="evaluation"
):
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(eval_dir, exist_ok=True)
    
    # 1. Build and Fit Feature Engine on Active Master Dataset Split
    engine, X_train, y_train, X_val, y_val, X_test, y_test, train_dist = build_and_fit_feature_pipeline(
        data_dir, models_dir
    )
    
    with open(os.path.join(data_dir, "label_mapping.json"), "r", encoding="utf-8") as f:
        label_mapping = json.load(f)
    classes = [label_mapping[str(i)] for i in range(len(label_mapping))]
    
    print(f"\n[CLASSICAL ML] Active Master Split: Training={len(y_train):,}, Validation={len(y_val):,}, Test={len(y_test):,}")
    print(f"[CLASSICAL ML] Feature Dimensionality: {X_train.shape[1]} features")
    print(f"[CLASSICAL ML] Target Classes ({len(classes)}): {classes}")
    
    models = {
        "Logistic Regression": {
            "model": LogisticRegression(
                max_iter=1000,
                C=1.0,
                class_weight="balanced",
                random_state=RANDOM_SEED,
                solver="lbfgs"
            ),
            "filename": "logistic_regression.joblib",
            "hyperparameters": {"C": 1.0, "max_iter": 1000, "class_weight": "balanced", "solver": "lbfgs"}
        },
        "Random Forest": {
            "model": RandomForestClassifier(
                n_estimators=150,
                max_depth=16,
                min_samples_split=5,
                min_samples_leaf=2,
                class_weight="balanced",
                random_state=RANDOM_SEED,
                n_jobs=-1
            ),
            "filename": "random_forest.joblib",
            "hyperparameters": {"n_estimators": 150, "max_depth": 16, "min_samples_split": 5, "min_samples_leaf": 2, "class_weight": "balanced"}
        },
        "XGBoost": {
            "model": XGBClassifier(
                n_estimators=150,
                max_depth=6,
                learning_rate=0.08,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=RANDOM_SEED,
                eval_metric="logloss",
                n_jobs=-1
            ),
            "filename": "xgboost.joblib",
            "hyperparameters": {"n_estimators": 150, "max_depth": 6, "learning_rate": 0.08, "subsample": 0.8}
        }
    }
    
    results = {}
    experiments = []
    
    for model_name, config in models.items():
        print(f"\n--- Training {model_name} on {len(X_train):,} active master samples ---")
        clf = config["model"]
        
        start_train = time.time()
        clf.fit(X_train, y_train)
        train_time = round(time.time() - start_train, 4)
        
        model_save_path = os.path.join(models_dir, config["filename"])
        joblib.dump(clf, model_save_path)
        model_size_kb = round(os.path.getsize(model_save_path) / 1024, 2)
        
        # Validation Evaluation
        y_val_pred = clf.predict(X_val)
        val_acc = float(accuracy_score(y_val, y_val_pred))
        val_bal_acc = float(balanced_accuracy_score(y_val, y_val_pred))
        
        # Test Evaluation (Real Test Set N=360)
        start_inf = time.time()
        y_test_pred = clf.predict(X_test)
        inference_latency_ms = round(((time.time() - start_inf) / len(X_test)) * 1000, 3)
        y_test_probs = clf.predict_proba(X_test)[:, 1] if hasattr(clf, "predict_proba") else None
        
        test_acc = float(accuracy_score(y_test, y_test_pred))
        test_bal_acc = float(balanced_accuracy_score(y_test, y_test_pred))
        macro_prec = float(precision_score(y_test, y_test_pred, average="macro", zero_division=0))
        macro_rec = float(recall_score(y_test, y_test_pred, average="macro", zero_division=0))
        macro_f1 = float(f1_score(y_test, y_test_pred, average="macro", zero_division=0))
        weighted_f1 = float(f1_score(y_test, y_test_pred, average="weighted", zero_division=0))
        roc_auc = float(roc_auc_score(y_test, y_test_probs)) if y_test_probs is not None else None
        
        # PR-AUC
        if y_test_probs is not None:
            precision_pts, recall_pts, _ = precision_recall_curve(y_test, y_test_probs)
            pr_auc = float(auc(recall_pts, precision_pts))
        else:
            pr_auc = None
        
        cm = confusion_matrix(y_test, y_test_pred).tolist()
        report = classification_report(y_test, y_test_pred, target_names=classes, output_dict=True, zero_division=0)
        
        print(f"[{model_name}] Test Accuracy: {test_acc*100:.2f}% | Balanced Acc: {test_bal_acc*100:.2f}% | Macro F1: {macro_f1:.4f} | ROC-AUC: {roc_auc:.4f} | PR-AUC: {pr_auc:.4f}")
        
        metrics_dict = {
            "model_name": model_name,
            "model_type": "Classical ML",
            "dataset_name": "MEDINTEL Balanced Master Dataset (Cardiovascular Risk Cohort)",
            "dataset_version": "v3.0-MASTER",
            "active_samples": 2400,
            "raw_samples": 70000,
            "train_samples": len(y_train),
            "val_samples": len(y_val),
            "test_samples": len(y_test),
            "balancing_method": "Pre-Split Controlled Dataset-Level Majority Undersampling",
            "target_dominant_count": 1200,
            "random_seed": RANDOM_SEED,
            "train_class_distribution": train_dist,
            "training_time_s": train_time,
            "inference_latency_ms": inference_latency_ms,
            "model_size_kb": model_size_kb,
            "val_accuracy": round(val_acc, 4),
            "val_balanced_accuracy": round(val_bal_acc, 4),
            "accuracy": round(test_acc, 4),
            "balanced_accuracy": round(test_bal_acc, 4),
            "precision_macro": round(macro_prec, 4),
            "recall_macro": round(macro_rec, 4),
            "f1_macro": round(macro_f1, 4),
            "f1_weighted": round(weighted_f1, 4),
            "roc_auc": round(roc_auc, 4) if roc_auc else None,
            "pr_auc": round(pr_auc, 4) if pr_auc else None,
            "classes": classes,
            "confusion_matrix": cm,
            "per_class": {
                c: {
                    "precision": round(report[c]["precision"], 4),
                    "recall": round(report[c]["recall"], 4),
                    "f1-score": round(report[c]["f1-score"], 4),
                    "support": int(report[c]["support"])
                }
                for c in classes if c in report
            }
        }
        results[model_name] = metrics_dict
        
        experiments.append({
            "experiment_id": f"EXP-{model_name.upper().replace(' ', '_')}-V3.0-MASTER",
            "experiment_name": "MEDINTEL — Balanced Master Dataset V1",
            "model": model_name,
            "model_version": "v3.0.0",
            "model_type": "Classical ML",
            "dataset": "MEDINTEL Balanced Master Dataset (Cardiovascular Risk Cohort)",
            "dataset_version": "v3.0-MASTER",
            "raw_samples": 70000,
            "active_samples": 2400,
            "train_samples": len(y_train),
            "val_samples": len(y_val),
            "test_samples": len(y_test),
            "random_seed": RANDOM_SEED,
            "balancing_method": "Pre-Split Controlled Dataset-Level Majority Undersampling",
            "hyperparameters": config["hyperparameters"],
            "training_time_s": train_time,
            "inference_latency_ms": inference_latency_ms,
            "accuracy": round(test_acc, 4),
            "balanced_accuracy": round(test_bal_acc, 4),
            "macro_f1": round(macro_f1, 4),
            "weighted_f1": round(weighted_f1, 4),
            "roc_auc": round(roc_auc, 4) if roc_auc else None,
            "pr_auc": round(pr_auc, 4) if pr_auc else None,
            "model_path": model_save_path,
            "status": "COMPLETED",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
        })

    with open(os.path.join(eval_dir, "classical_ml_results.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
        
    with open(os.path.join(eval_dir, "experiment_registry.json"), "w", encoding="utf-8") as f:
        json.dump(experiments, f, indent=2)

    print(f"\n[CLASSICAL ML] Successfully retrained all models on MEDINTEL Balanced Master Dataset V1.")
    print(f"[CLASSICAL ML] Saved results to {os.path.join(eval_dir, 'classical_ml_results.json')}")
    return results

if __name__ == "__main__":
    train_and_evaluate_all_models()
