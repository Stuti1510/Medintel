"""
Computes out-of-fold SVM decision scores for training samples to prevent target leakage
in multimodal fusion training. Validation and test samples use the full training SVM.
Caches scores to reports/multimodal/cache/svm_scores_fold{k}.parquet.
"""

import os
import sys
if "." not in sys.path:
    sys.path.insert(0, ".")

import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV

from data.preprocess import get_fold_splits
from ml.inference.text_svm_inference import get_text_classifier

def get_svm_decision_scores_from_model(calibrated_model, X_tfidf):
    scores = []
    for cc in calibrated_model.calibrated_classifiers_:
        svc = getattr(cc, "estimator", None) or getattr(cc, "base_estimator", None)
        if svc is not None and hasattr(svc, "decision_function"):
            scores.append(svc.decision_function(X_tfidf))
    if scores:
        return np.mean(scores, axis=0)
    probs = calibrated_model.predict_proba(X_tfidf)
    return np.log(np.clip(probs, 1e-6, 1.0))

def compute_oof_svm_scores(fold: int = 0, manifest_path: str = "data/multimodal/manifest.csv",
                           cache_dir: str = "reports/multimodal/cache", seed: int = 42) -> pd.DataFrame:
    os.makedirs(cache_dir, exist_ok=True)
    cache_path = os.path.join(cache_dir, f"svm_scores_fold{fold}.parquet")
    if os.path.exists(cache_path):
        print(f"Loading cached SVM scores from {cache_path}")
        return pd.read_parquet(cache_path)
        
    print(f"Computing Out-Of-Fold SVM decision scores for fold {fold}...")
    train_df, val_df, test_df = get_fold_splits(manifest_path, fold=fold)
    
    # Text and labels
    train_texts = train_df["narrative"].astype(str).values
    train_labels = train_df["label"].values
    train_patients = train_df["patient_id"].values
    
    oof_scores = np.zeros((len(train_df), 4), dtype=np.float32)
    
    # Inner 5-fold StratifiedGroupKFold inside training fold
    inner_sgkf = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=seed)
    for inner_tr_idx, inner_val_idx in inner_sgkf.split(train_df, train_labels, train_patients):
        vec = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, min_df=1)
        X_tr = vec.fit_transform(train_texts[inner_tr_idx])
        X_v = vec.transform(train_texts[inner_val_idx])
        
        svc = LinearSVC(C=1.0, class_weight="balanced", random_state=seed, max_iter=2000)
        clf = CalibratedClassifierCV(estimator=svc, method="sigmoid", cv=3)
        clf.fit(X_tr, train_labels[inner_tr_idx])
        
        oof_scores[inner_val_idx] = get_svm_decision_scores_from_model(clf, X_v)
        
    # Fit full model on all training data for Val and Test sets
    full_vec = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, min_df=1)
    X_train_full = full_vec.fit_transform(train_texts)
    full_svc = LinearSVC(C=1.0, class_weight="balanced", random_state=seed, max_iter=2000)
    full_clf = CalibratedClassifierCV(estimator=full_svc, method="sigmoid", cv=3)
    full_clf.fit(X_train_full, train_labels)
    
    X_val = full_vec.transform(val_df["narrative"].astype(str).values)
    X_test = full_vec.transform(test_df["narrative"].astype(str).values)
    
    val_scores = get_svm_decision_scores_from_model(full_clf, X_val)
    test_scores = get_svm_decision_scores_from_model(full_clf, X_test)
    
    # Save to DataFrame
    all_rows = []
    for i, idx in enumerate(train_df["img_id"]):
        all_rows.append({"img_id": idx, "split": "train", "s0": oof_scores[i, 0], "s1": oof_scores[i, 1], "s2": oof_scores[i, 2], "s3": oof_scores[i, 3]})
    for i, idx in enumerate(val_df["img_id"]):
        all_rows.append({"img_id": idx, "split": "val", "s0": val_scores[i, 0], "s1": val_scores[i, 1], "s2": val_scores[i, 2], "s3": val_scores[i, 3]})
    for i, idx in enumerate(test_df["img_id"]):
        all_rows.append({"img_id": idx, "split": "test", "s0": test_scores[i, 0], "s1": test_scores[i, 1], "s2": test_scores[i, 2], "s3": test_scores[i, 3]})
        
    df_scores = pd.DataFrame(all_rows)
    df_scores.to_parquet(cache_path, index=False)
    print(f"Cached {len(df_scores)} SVM scores to {cache_path}")
    return df_scores

def get_empty_narrative_svm_score(fold: int = 0) -> np.ndarray:
    """Returns the 4-class SVM decision score for an empty string."""
    clf = get_text_classifier(fold=fold)
    if not clf.is_loaded:
        clf.load()
    X = clf.vectorizer.transform([""])
    return clf.get_decision_scores(X)[0]
