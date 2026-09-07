"""
MEDINTEL AI - Leakage-Safe Multi-Class Clinical Feature Engineering Pipeline
1. Tabular Transformer: StandardScaler on continuous biometrics (age, heart_rate, systolic_bp, diastolic_bp, temperature, spo2)
   + OneHotEncoder on categorical features (sex, severity).
2. Text Transformer: TF-IDF on clinical narratives, symptoms, and medical history.
3. Strict Leakage Prevention: All transformers fit EXCLUSIVELY on the training partition (train.csv N=1,750).
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.feature_extraction.text import TfidfVectorizer

RANDOM_SEED = 42

NUMERIC_FEATURES = ["age", "heart_rate", "systolic_bp", "diastolic_bp", "temperature", "spo2"]
CATEGORICAL_FEATURES = ["sex", "severity"]
TEXT_FEATURE = "full_clinical_text"

class ClinicalFeatureEngine:
    def __init__(self, tfidf_max_features=300):
        self.tfidf_max_features = tfidf_max_features
        self.tabular_transformer = ColumnTransformer(
            transformers=[
                ("num", StandardScaler(), NUMERIC_FEATURES),
                ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_FEATURES)
            ]
        )
        self.text_vectorizer = TfidfVectorizer(
            max_features=self.tfidf_max_features,
            ngram_range=(1, 2),
            sublinear_tf=True,
            stop_words="english"
        )
        self.is_fitted = False
        self.feature_names = []

    def fit(self, train_df: pd.DataFrame):
        """Fits all feature transformers EXCLUSIVELY on training partition to strictly prevent leakage."""
        print(f"[FEATURE ENGINE] Fitting transformers on {len(train_df):,} multi-class training samples...")
        
        # Prepare tabular data
        tab_df = train_df[NUMERIC_FEATURES + CATEGORICAL_FEATURES].copy()
        for col in NUMERIC_FEATURES:
            tab_df[col] = pd.to_numeric(tab_df[col], errors='coerce').fillna(tab_df[col].median())
        for col in CATEGORICAL_FEATURES:
            tab_df[col] = tab_df[col].astype(str).fillna("Unknown")
            
        self.tabular_transformer.fit(tab_df)
        self.text_vectorizer.fit(train_df[TEXT_FEATURE].fillna(""))
        
        # Build feature names
        cat_encoder = self.tabular_transformer.named_transformers_["cat"]
        cat_names = []
        for i, col in enumerate(CATEGORICAL_FEATURES):
            for val in cat_encoder.categories_[i]:
                cat_names.append(f"{col}_{val}")
        tab_names = NUMERIC_FEATURES + cat_names
        text_names = [f"tfidf_{w}" for w in self.text_vectorizer.get_feature_names_out()]
        self.feature_names = tab_names + text_names
        self.is_fitted = True
        print(f"[FEATURE ENGINE] Fitted {len(tab_names)} tabular + {len(text_names)} text features = {len(self.feature_names)} total dimensions.")
        return self

    def transform(self, df: pd.DataFrame) -> np.ndarray:
        """Transforms validation or test features using previously fitted parameters."""
        if not self.is_fitted:
            raise ValueError("Feature engine must be fitted before transform.")
        
        tab_df = df.copy()
        # Guarantee presence of required columns with safe defaults if missing
        default_vals = {
            "age": 50, "heart_rate": 78, "systolic_bp": 120, "diastolic_bp": 80,
            "temperature": 37.0, "spo2": 98, "sex": "Male", "severity": "Moderate"
        }
        for col, default_v in default_vals.items():
            if col not in tab_df.columns:
                tab_df[col] = default_v
            else:
                tab_df[col] = tab_df[col].fillna(default_v)

        for col in NUMERIC_FEATURES:
            tab_df[col] = pd.to_numeric(tab_df[col], errors='coerce').fillna(default_vals[col])
        for col in CATEGORICAL_FEATURES:
            tab_df[col] = tab_df[col].astype(str)

        text_col = tab_df[TEXT_FEATURE] if TEXT_FEATURE in tab_df.columns else pd.Series([""] * len(tab_df))
        
        X_tab = self.tabular_transformer.transform(tab_df[NUMERIC_FEATURES + CATEGORICAL_FEATURES])
        X_text = self.text_vectorizer.transform(text_col.fillna("")).toarray()
        return np.hstack([X_tab, X_text])

    def transform_tabular_only(self, df: pd.DataFrame) -> np.ndarray:
        return self.tabular_transformer.transform(df[NUMERIC_FEATURES + CATEGORICAL_FEATURES])

    def transform_text_only(self, df: pd.DataFrame) -> np.ndarray:
        return self.text_vectorizer.transform(df[TEXT_FEATURE]).toarray()

    def save(self, models_dir="models/classical"):
        os.makedirs(models_dir, exist_ok=True)
        joblib.dump(self, os.path.join(models_dir, "feature_pipeline.joblib"))
        joblib.dump(self.text_vectorizer, os.path.join(models_dir, "tfidf_vectorizer.joblib"))
        joblib.dump(self.tabular_transformer, os.path.join(models_dir, "tabular_transformer.joblib"))
        print(f"[FEATURE ENGINE] Saved pipeline artifacts to {models_dir}")

def build_and_fit_feature_pipeline(
    data_dir="data/processed",
    models_dir="models/classical"
):
    train_df = pd.read_csv(os.path.join(data_dir, "train.csv"))
    val_df = pd.read_csv(os.path.join(data_dir, "val.csv"))
    test_df = pd.read_csv(os.path.join(data_dir, "test.csv"))

    engine = ClinicalFeatureEngine(tfidf_max_features=300)
    engine.fit(train_df)

    # Transform splits
    X_train = engine.transform(train_df)
    y_train = train_df["label_idx"].values
    
    X_val = engine.transform(val_df)
    y_val = val_df["label_idx"].values
    
    X_test = engine.transform(test_df)
    y_test = test_df["label_idx"].values

    engine.save(models_dir)

    classes, counts = np.unique(y_train, return_counts=True)
    train_dist = {int(c): int(cnt) for c, cnt in zip(classes, counts)}

    return engine, X_train, y_train, X_val, y_val, X_test, y_test, train_dist

if __name__ == "__main__":
    build_and_fit_feature_pipeline()

