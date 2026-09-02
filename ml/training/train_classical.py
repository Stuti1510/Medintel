"""
MEDINTEL AI - Classical ML Training & Evaluation Engine
Trains Logistic Regression, Random Forest, and XGBoost models on training set only.
Evaluates strictly on the untouched test set and saves models and metrics.
"""

import os
import time
import json
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)
import joblib

RANDOM_SEED = 42

def train_and_evaluate_classical(
    data_dir="data/processed",
    models_dir="models/classical",
    eval_dir="evaluation"
):
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(eval_dir, exist_ok=True)
    os.makedirs(os.path.join(eval_dir, "metrics"), exist_ok=True)
    
    # 1. Load Pre-split Datasets
    train_df = pd.read_csv(os.path.join(data_dir, "train.csv"))
    val_df = pd.read_csv(os.path.join(data_dir, "val.csv"))
    test_df = pd.read_csv(os.path.join(data_dir, "test.csv"))
    
    with open(os.path.join(data_dir, "label_mapping.json"), "r") as f:
        label_mapping = json.load(f)
    classes = [label_mapping[str(i)] for i in range(len(label_mapping))]
    
    print(f"[CLASSICAL ML] Training Samples: {len(train_df)}, Val: {len(val_df)}, Test: {len(test_df)}")
    
    # 2. Text Feature Extraction (TF-IDF fitted ONLY on Train)
    tfidf = TfidfVectorizer(
        max_features=2500,
        ngram_range=(1, 2),
        sublinear_tf=True,
        stop_words="english"
    )
    
    X_train_text = tfidf.fit_transform(train_df["full_clinical_text"]).toarray()
    X_val_text = tfidf.transform(val_df["full_clinical_text"]).toarray()
    X_test_text = tfidf.transform(test_df["full_clinical_text"]).toarray()
    
    # Save TF-IDF Vectorizer
    joblib.dump(tfidf, os.path.join(models_dir, "tfidf_vectorizer.joblib"))
    
    y_train = train_df["label_idx"].values
    y_val = val_df["label_idx"].values
    y_test = test_df["label_idx"].values
    
    # 3. Model Definitions
    models = {
        "Logistic Regression": {
            "model": LogisticRegression(
                max_iter=1000,
                C=2.0,
                random_state=RANDOM_SEED,
                solver="lbfgs"
            ),
            "filename": "logistic_regression.joblib",
            "hyperparameters": {"C": 2.0, "max_iter": 1000, "solver": "lbfgs"}
        },
        "Random Forest": {
            "model": RandomForestClassifier(
                n_estimators=150,
                max_depth=25,
                random_state=RANDOM_SEED,
                n_jobs=-1
            ),
            "filename": "random_forest.joblib",
            "hyperparameters": {"n_estimators": 150, "max_depth": 25}
        },
        "XGBoost": {
            "model": XGBClassifier(
                n_estimators=120,
                max_depth=6,
                learning_rate=0.1,
                random_state=RANDOM_SEED,
                eval_metric="mlogloss",
                n_jobs=-1
            ),
            "filename": "xgboost.joblib",
            "hyperparameters": {"n_estimators": 120, "max_depth": 6, "learning_rate": 0.1}
        }
    }
    
    results = {}
    experiments = []
    
    for model_name, config in models.items():
        print(f"\n--- Training {model_name} ---")
        clf = config["model"]
        
        # Measure Training Time
        start_train = time.time()
        clf.fit(X_train_text, y_train)
        train_time = round(time.time() - start_train, 4)
        
        # Save Model Artifact
        model_path = os.path.join(models_dir, config["filename"])
        joblib.dump(clf, model_path)
        
        # Measure Inference Latency on Test Set
        start_inf = time.time()
        y_pred = clf.predict(X_test_text)
        y_proba = clf.predict_proba(X_test_text) if hasattr(clf, "predict_proba") else None
        total_inf_time = time.time() - start_inf
        avg_latency_ms = round((total_inf_time / len(test_df)) * 1000, 3)
        
        # Compute Metrics on Untouched Test Set
        acc = round(accuracy_score(y_test, y_pred), 4)
        prec_macro = round(precision_score(y_test, y_pred, average="macro", zero_division=0), 4)
        rec_macro = round(recall_score(y_test, y_pred, average="macro", zero_division=0), 4)
        f1_macro = round(f1_score(y_test, y_pred, average="macro", zero_division=0), 4)
        f1_weighted = round(f1_score(y_test, y_pred, average="weighted", zero_division=0), 4)
        
        cm = confusion_matrix(y_test, y_pred).tolist()
        report = classification_report(y_test, y_pred, target_names=classes, output_dict=True, zero_division=0)
        
        # Approximate Model Size
        model_size_kb = round(os.path.getsize(model_path) / 1024, 2)
        
        print(f"[{model_name}] Test Accuracy: {acc * 100:.2f}% | Macro F1: {f1_macro:.4f} | Latency: {avg_latency_ms}ms | Size: {model_size_kb}KB")
        
        results[model_name] = {
            "model_name": model_name,
            "model_type": "Classical ML",
            "model_file": config["filename"],
            "accuracy": acc,
            "precision_macro": prec_macro,
            "recall_macro": rec_macro,
            "f1_macro": f1_macro,
            "f1_weighted": f1_weighted,
            "inference_latency_ms": avg_latency_ms,
            "training_time_s": train_time,
            "model_size_kb": model_size_kb,
            "hyperparameters": config["hyperparameters"],
            "confusion_matrix": cm,
            "classes": classes,
            "classification_report": report
        }
        
        experiments.append({
            "experiment_id": f"EXP-{model_name.replace(' ', '_').upper()}-001",
            "model": model_name,
            "model_version": "v1.0.0",
            "model_type": "Classical ML",
            "dataset": "MEDINTEL Clinical Benchmark",
            "dataset_version": "v1.0",
            "train_samples": len(train_df),
            "val_samples": len(val_df),
            "test_samples": len(test_df),
            "random_seed": RANDOM_SEED,
            "hyperparameters": config["hyperparameters"],
            "training_time_s": train_time,
            "inference_latency_ms": avg_latency_ms,
            "accuracy": acc,
            "macro_f1": f1_macro,
            "weighted_f1": f1_weighted,
            "model_path": model_path,
            "status": "COMPLETED",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
        })
        
    # Save Classical ML Results
    results_path = os.path.join(eval_dir, "classical_ml_results.json")
    with open(results_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\n[CLASSICAL ML] Saved results to {results_path}")
    
    # Update or Save Experiment Registry
    registry_path = os.path.join(eval_dir, "experiment_registry.json")
    existing_exp = []
    if os.path.exists(registry_path):
        try:
            with open(registry_path, "r") as f:
                existing_exp = json.load(f)
        except Exception:
            existing_exp = []
            
    # Filter out previous runs for these models
    model_names = list(models.keys())
    existing_exp = [e for e in existing_exp if e["model"] not in model_names]
    existing_exp.extend(experiments)
    
    with open(registry_path, "w") as f:
        json.dump(existing_exp, f, indent=2)
    print(f"[CLASSICAL ML] Registered {len(experiments)} experiments to {registry_path}")
    
    # Save Feature Metadata
    feature_meta = {
        "vectorizer": "TF-IDF (1-2 ngrams, 2500 max features)",
        "vocabulary_size": len(tfidf.vocabulary_),
        "num_classes": len(classes),
        "classes": classes,
        "trained_date": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
    }
    with open(os.path.join(models_dir, "feature_metadata.json"), "w") as f:
        json.dump(feature_meta, f, indent=2)
        
    return results

if __name__ == "__main__":
    train_and_evaluate_classical()
