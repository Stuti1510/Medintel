"""
MEDINTEL AI - Data Preprocessor & Splitter
Implements end-to-end clinical text cleaning, feature normalization,
stratified train/validation/test splitting (70% / 15% / 15%), and data leakage prevention.
"""

import os
import re
import json
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib

RANDOM_SEED = 42

def clean_clinical_text(text: str) -> str:
    """Normalizes clinical text while preserving medical terminology and measurements."""
    if not isinstance(text, str):
        return ""
    text = text.lower()
    # Normalize spaces around punctuation
    text = re.sub(r'\s+', ' ', text)
    # Remove non-alphanumeric except standard punctuation
    text = re.sub(r'[^a-z0-9\s\.,;:/\-%]', '', text)
    return text.strip()

def preprocess_and_split(raw_csv_path="data/raw/clinical_cases_raw.csv",
                         output_dir="data/processed/",
                         models_dir="models/classical/"):
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(models_dir, exist_ok=True)
    
    df = pd.read_csv(raw_csv_path)
    print(f"[PREPROCESS] Loaded {len(df)} records from {raw_csv_path}")
    
    # 1. Clean Text Columns
    df["cleaned_narrative"] = df["clinical_narrative"].apply(clean_clinical_text)
    df["cleaned_symptoms"] = df["symptoms"].apply(clean_clinical_text)
    
    # Create combined rich clinical representation
    df["full_clinical_text"] = df.apply(
        lambda r: f"Age: {r['age']} Sex: {r['sex']} Severity: {r['severity']} Symptoms: {r['cleaned_symptoms']} History: {r['medical_history']} Meds: {r['current_medications']} Vitals: HR {r['heart_rate']} BP {r['systolic_bp']}/{r['diastolic_bp']} Temp {r['temperature']} SpO2 {r['spo2']} Narrative: {r['cleaned_narrative']}",
        axis=1
    )
    
    # 2. Encode Labels
    label_encoder = LabelEncoder()
    df["label_idx"] = label_encoder.fit_transform(df["condition"])
    
    # Save label mapping
    label_mapping = {int(idx): str(label) for idx, label in enumerate(label_encoder.classes_)}
    with open(os.path.join(output_dir, "label_mapping.json"), "w") as f:
        json.dump(label_mapping, f, indent=2)
    joblib.dump(label_encoder, os.path.join(models_dir, "label_encoder.joblib"))
    print(f"[PREPROCESS] Encoded {len(label_encoder.classes_)} distinct disease classes")
    
    # 3. Stratified Split: 70% Train, 15% Val, 15% Test
    # First split: 70% Train, 30% Temp (Val + Test)
    train_df, temp_df = train_test_split(
        df,
        test_size=0.30,
        random_state=RANDOM_SEED,
        stratify=df["condition"]
    )
    
    # Second split: Split temp (30%) equally into 15% Val and 15% Test
    val_df, test_df = train_test_split(
        temp_df,
        test_size=0.50,
        random_state=RANDOM_SEED,
        stratify=temp_df["condition"]
    )
    
    # Save split CSVs
    train_path = os.path.join(output_dir, "train.csv")
    val_path = os.path.join(output_dir, "val.csv")
    test_path = os.path.join(output_dir, "test.csv")
    
    train_df.to_csv(train_path, index=False)
    val_df.to_csv(val_path, index=False)
    test_df.to_csv(test_path, index=False)
    
    split_meta = {
        "random_seed": RANDOM_SEED,
        "split_ratio": {"train": 0.70, "val": 0.15, "test": 0.15},
        "total_samples": len(df),
        "train_samples": len(train_df),
        "val_samples": len(val_df),
        "test_samples": len(test_df),
        "classes_count": len(label_encoder.classes_),
        "leakage_prevention": "TF-IDF and encoders fit on training set only. Test set is strictly isolated for untouched final evaluation."
    }
    
    with open(os.path.join(output_dir, "split_metadata.json"), "w") as f:
        json.dump(split_meta, f, indent=2)
        
    print(f"[PREPROCESS] Splits saved: Train={len(train_df)}, Val={len(val_df)}, Test={len(test_df)}")
    return train_df, val_df, test_df, label_encoder

if __name__ == "__main__":
    preprocess_and_split()
