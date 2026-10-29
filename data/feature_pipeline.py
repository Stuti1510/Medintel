"""
MEDINTEL AI - Leakage-Safe Multi-Class Clinical NLP Feature Pipeline
1. Text Transformer: Sublinear TF-IDF with word unigrams and bigrams on clinical symptom narratives.
2. Strict Leakage Prevention: Fitted EXCLUSIVELY on the training partition (train.csv N=840).
3. Pure Natural Language Architecture: Operates directly on symptom descriptions without fabricated biometrics.
"""

import os
import sys
import json
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from data.preprocess import clean_clinical_text

RANDOM_SEED = 42

class ClinicalFeatureEngine:
    def __init__(self, max_features=3000, ngram_range=(1, 2)):
        self.max_features = max_features
        self.ngram_range = ngram_range
        self.text_vectorizer = TfidfVectorizer(
            max_features=self.max_features,
            ngram_range=self.ngram_range,
            sublinear_tf=True,
            min_df=1,
            strip_accents="unicode"
        )
        self.is_fitted = False
        self.feature_names = []

    def _extract_text_list(self, data) -> list:
        """Standardizes input into a clean list of text strings."""
        if isinstance(data, str):
            return [clean_clinical_text(data)]
        elif isinstance(data, list):
            return [clean_clinical_text(str(x)) for x in data]
        elif isinstance(data, pd.DataFrame):
            for col in ["text", "clinical_narrative", "full_clinical_text", "symptoms"]:
                if col in data.columns:
                    return [clean_clinical_text(str(x)) for x in data[col].fillna("")]
            # Fallback: join any string columns
            return [" ".join([str(val) for val in row if isinstance(val, str)]) for _, row in data.iterrows()]
        elif isinstance(data, pd.Series):
            return [clean_clinical_text(str(x)) for x in data.fillna("")]
        else:
            return [clean_clinical_text(str(data))]

    def fit(self, train_df: pd.DataFrame):
        """Fits text vectorizer EXCLUSIVELY on training partition to strictly prevent leakage."""
        texts = self._extract_text_list(train_df)
        print(f"[FEATURE ENGINE] Fitting TF-IDF text features on {len(texts):,} training samples...")
        self.text_vectorizer.fit(texts)
        self.feature_names = [f"tfidf_{w}" for w in self.text_vectorizer.get_feature_names_out()]
        self.is_fitted = True
        print(f"[FEATURE ENGINE] Fitted {len(self.feature_names)} text n-gram features (vocab size: {len(self.text_vectorizer.vocabulary_):,}).")
        return self

    def transform(self, data) -> np.ndarray:
        """Transforms input text using previously fitted vocabulary."""
        if not self.is_fitted:
            raise ValueError("Feature engine must be fitted before transform.")
        texts = self._extract_text_list(data)
        sparse_matrix = self.text_vectorizer.transform(texts)
        return sparse_matrix.toarray()

    def get_feature_names(self):
        return self.feature_names

def build_and_fit_feature_pipeline(
    data_dir="data/processed",
    models_dir="models/classical"
):
    os.makedirs(models_dir, exist_ok=True)
    
    train_path = os.path.join(data_dir, "train.csv")
    val_path = os.path.join(data_dir, "val.csv")
    test_path = os.path.join(data_dir, "test.csv")
    
    train_df = pd.read_csv(train_path)
    val_df = pd.read_csv(val_path)
    test_df = pd.read_csv(test_path)
    
    engine = ClinicalFeatureEngine(max_features=3000, ngram_range=(1, 2))
    engine.fit(train_df)
    
    # Save fitted pipeline artifact
    joblib.dump(engine, os.path.join(models_dir, "feature_pipeline.joblib"))
    joblib.dump(engine.text_vectorizer, os.path.join(models_dir, "tfidf_vectorizer.joblib"))
    
    # Feature metadata
    metadata = {
        "pipeline_version": "v3.0.0-NLP",
        "feature_count": len(engine.feature_names),
        "vectorizer": "TfidfVectorizer(ngram_range=(1,2), sublinear_tf=True, max_features=3000)",
        "train_samples": len(train_df),
        "val_samples": len(val_df),
        "test_samples": len(test_df),
        "leakage_prevention": "Strictly fit on train.csv (N=840). Zero leakage into val/test partitions."
    }
    with open(os.path.join(models_dir, "feature_metadata.json"), "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
        
    X_train = engine.transform(train_df)
    y_train = train_df["label_idx"].values
    
    X_val = engine.transform(val_df)
    y_val = val_df["label_idx"].values
    
    X_test = engine.transform(test_df)
    y_test = test_df["label_idx"].values
    
    train_dist = {str(k): int(v) for k, v in train_df["label"].value_counts().items()}
    
    print(f"[FEATURE ENGINE] Pipeline generated successfully. Dimensionality: {X_train.shape[1]} features.")
    return engine, X_train, y_train, X_val, y_val, X_test, y_test, train_dist

if __name__ == "__main__":
    build_and_fit_feature_pipeline()
