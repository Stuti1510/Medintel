"""
MEDINTEL AI - Phase 10: Classical ML Model Training
Trains Logistic Regression, Random Forest, and XGBoost on preprocessed training partition (N=7,000).
Tunes/calibrates on validation set (N=1,500).
Saves model artifacts to models/classical/.
"""

import os
import sys
import time
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, balanced_accuracy_score, f1_score

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

RANDOM_SEED = 42

def train_all_models(
    data_dir="data/processed",
    models_dir="models/classical",
    eval_dir="evaluation"
):
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(eval_dir, exist_ok=True)

    print("=" * 60)
    print("PHASE 10: CLASSICAL ML MODEL TRAINING (7,000 SAMPLES)")
    print("=" * 60)

    # 1. Load Transformed Partitions
    X_train = np.load(os.path.join(data_dir, "X_train_synthetic.npy"))
    y_train = np.load(os.path.join(data_dir, "y_train_synthetic.npy"))
    X_val = np.load(os.path.join(data_dir, "X_val_synthetic.npy"))
    y_val = np.load(os.path.join(data_dir, "y_val_synthetic.npy"))

    with open(os.path.join(data_dir, "synthetic_label_mapping.json"), "r") as f:
        label_mapping = json.load(f)

    classes = [label_mapping[str(i)] for i in range(len(label_mapping))]
    num_classes = len(classes)

    print(f"Training Instances: {X_train.shape[0]:,} | Features: {X_train.shape[1]}")
    print(f"Validation Instances: {X_val.shape[0]:,}")
    print(f"Target Classes ({num_classes}): {classes}")

    model_definitions = {
        "Logistic Regression": {
            "model": LogisticRegression(
                C=1.0,
                max_iter=1000,
                class_weight="balanced",
                random_state=RANDOM_SEED,
                solver="lbfgs"
            ),
            "filename": "synthetic_logistic_regression.joblib",
            "hyperparameters": {
                "C": 1.0,
                "max_iter": 1000,
                "class_weight": "balanced",
                "solver": "lbfgs"
            }
        },
        "Random Forest": {
            "model": RandomForestClassifier(
                n_estimators=100,
                max_depth=12,
                min_samples_split=4,
                min_samples_leaf=2,
                class_weight="balanced",
                random_state=RANDOM_SEED,
                n_jobs=-1
            ),
            "filename": "synthetic_random_forest.joblib",
            "hyperparameters": {
                "n_estimators": 100,
                "max_depth": 12,
                "min_samples_split": 4,
                "class_weight": "balanced"
            }
        },
        "XGBoost": {
            "model": XGBClassifier(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.08,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=RANDOM_SEED,
                eval_metric="mlogloss",
                n_jobs=-1
            ),
            "filename": "synthetic_xgboost.joblib",
            "hyperparameters": {
                "n_estimators": 100,
                "max_depth": 5,
                "learning_rate": 0.08,
                "subsample": 0.8
            }
        }
    }

    trained_artifacts = {}

    for name, config in model_definitions.items():
        print(f"\n--- Training {name} ---")
        clf = config["model"]
        start_t = time.time()
        clf.fit(X_train, y_train)
        fit_duration = round(time.time() - start_t, 4)

        # Calibrate probabilities on validation set (Platt scaling / sigmoid)
        try:
            calibrated = CalibratedClassifierCV(estimator=clf, method="sigmoid", cv="prefit")
            calibrated.fit(X_val, y_val)
            final_model = calibrated
        except Exception as e:
            print(f"[{name}] Calibrator fallback: {e}")
            final_model = clf

        save_path = os.path.join(models_dir, config["filename"])
        joblib.dump(final_model, save_path)
        file_size_kb = round(os.path.getsize(save_path) / 1024, 2)

        # Validation Performance Check
        y_val_pred = final_model.predict(X_val)
        val_acc = float(accuracy_score(y_val, y_val_pred))
        val_macro_f1 = float(f1_score(y_val, y_val_pred, average="macro"))

        print(f"  Training Time: {fit_duration:.3f}s | Artifact Size: {file_size_kb} KB")
        print(f"  Validation Accuracy: {val_acc:.4f} | Validation Macro F1: {val_macro_f1:.4f}")
        print(f"  Saved to: {save_path}")

        trained_artifacts[name] = {
            "name": name,
            "filename": config["filename"],
            "model_path": save_path,
            "hyperparameters": config["hyperparameters"],
            "training_time_sec": fit_duration,
            "file_size_kb": file_size_kb,
            "val_accuracy": val_acc,
            "val_macro_f1": val_macro_f1
        }

    # Save summary manifest
    with open(os.path.join(models_dir, "synthetic_models_manifest.json"), "w") as f:
        json.dump(trained_artifacts, f, indent=2)

    print("\n" + "=" * 60)
    print("PHASE 10 COMPLETE: All three classical ML models trained and saved.")
    print("=" * 60)

    return trained_artifacts

if __name__ == "__main__":
    train_all_models()
