"""
MEDINTEL AI - Leakage-Safe Multi-Class Clinical Dataset Preprocessor & Stratified Splitter
1. Ingests the 20-class clinical cases dataset (data/raw/clinical_cases_raw.csv) containing 2,500 real clinical cases.
2. Performs 70% Train (1,750 records) / 15% Validation (375 records) / 15% Test (375 records) stratified partitioning (Random Seed = 42).
3. Fits LabelEncoders exclusively on training partitions to strictly prevent leakage.
4. Generates standardized clinical narratives and feature matrices.
5. Saves train.csv, val.csv, test.csv, label_mapping.json, and split_metadata.json.
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
    """Normalizes clinical text while preserving medical terminology, abbreviations, and measurements."""
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^a-z0-9\s\.,;:/\-%°]', '', text)
    return text.strip()

def build_clinical_narrative_from_case(row) -> str:
    """Standardized narrative for clinical reasoning, Transformer tokenization, and explainability."""
    age = row.get('age', 50)
    sex = row.get('sex', 'Male')
    syms = str(row.get('symptoms', 'None reported'))
    dur = str(row.get('duration', 'Unspecified'))
    sev = str(row.get('severity', 'Moderate'))
    hr = row.get('heart_rate', 78)
    sbp = row.get('systolic_bp', 120)
    dbp = row.get('diastolic_bp', 80)
    temp = row.get('temperature', 37.0)
    spo2 = row.get('spo2', 98)
    hist = str(row.get('medical_history', 'None reported'))
    meds = str(row.get('current_medications', 'None'))
    raw_nar = str(row.get('clinical_narrative', ''))

    narrative = (
        f"Patient is a {age}-year-old {sex} presenting with {sev.lower()} symptoms: {syms}. "
        f"Symptom duration: {dur}. Past medical history: {hist}. Current medications: {meds}. "
        f"Vital signs: Blood Pressure {sbp}/{dbp} mmHg, Heart Rate {hr} bpm, Temperature {temp}°C, SpO2 {spo2}%. "
        f"Clinical notes: {raw_nar}"
    )
    return clean_clinical_text(narrative)

def preprocess_clinical_dataset(
    raw_csv="data/raw/clinical_cases_raw.csv",
    output_dir="data/processed",
    models_dir="models/classical"
):
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(models_dir, exist_ok=True)
    
    if not os.path.exists(raw_csv):
        raise FileNotFoundError(f"Raw clinical dataset not found at {raw_csv}")
        
    df = pd.read_csv(raw_csv)
    target_col = "condition"
    total_samples = len(df)
    
    print(f"[PREPROCESS] Partitioning {total_samples:,} clinical records from {raw_csv} across {df[target_col].nunique()} conditions...")
    
    # 1. Generate full clinical narrative text
    df["full_clinical_text"] = df.apply(build_clinical_narrative_from_case, axis=1)
    
    # Fill any null values safely
    df["medical_history"] = df["medical_history"].fillna("None reported")
    df["current_medications"] = df["current_medications"].fillna("None")
    
    # Save active master dataset
    df.to_csv(os.path.join(output_dir, "medintel_balanced_master.csv"), index=False)
    
    # 2. Stratified 70/15/15 Split (Seed = 42)
    train_df, temp_df = train_test_split(
        df,
        test_size=0.30,
        random_state=RANDOM_SEED,
        stratify=df[target_col]
    )
    
    val_df, test_df = train_test_split(
        temp_df,
        test_size=0.50,
        random_state=RANDOM_SEED,
        stratify=temp_df[target_col]
    )
    
    # 3. Fit LabelEncoder on Train Set Only (Leakage Prevention)
    label_encoder = LabelEncoder()
    train_df = train_df.copy()
    val_df = val_df.copy()
    test_df = test_df.copy()
    
    train_df["label_idx"] = label_encoder.fit_transform(train_df[target_col])
    val_df["label_idx"] = label_encoder.transform(val_df[target_col])
    test_df["label_idx"] = label_encoder.transform(test_df[target_col])
    
    classes = [str(c) for c in label_encoder.classes_]
    label_mapping = {str(idx): str(c) for idx, c in enumerate(classes)}
    
    with open(os.path.join(output_dir, "label_mapping.json"), "w", encoding="utf-8") as f:
        json.dump(label_mapping, f, indent=2)
    joblib.dump(label_encoder, os.path.join(models_dir, "label_encoder.joblib"))
    
    # 4. Save Partitions
    train_df.to_csv(os.path.join(output_dir, "train.csv"), index=False)
    val_df.to_csv(os.path.join(output_dir, "val.csv"), index=False)
    test_df.to_csv(os.path.join(output_dir, "test.csv"), index=False)
    
    split_meta = {
        "dataset_name": "MEDINTEL Clinical Intelligence Multi-Disease Master Dataset",
        "total_active_samples": total_samples,
        "train_samples": len(train_df),
        "val_samples": len(val_df),
        "test_samples": len(test_df),
        "target_column": target_col,
        "num_classes": len(label_mapping),
        "label_mapping": label_mapping,
        "active_class_distribution": {str(k): int(v) for k, v in df[target_col].value_counts().items()},
        "train_class_distribution": {str(k): int(v) for k, v in train_df[target_col].value_counts().items()},
        "val_class_distribution": {str(k): int(v) for k, v in val_df[target_col].value_counts().items()},
        "test_class_distribution": {str(k): int(v) for k, v in test_df[target_col].value_counts().items()},
        "leakage_prevention": "Active dataset created pre-split. Preprocessors and LabelEncoders fit on training set only. Test set untouched."
    }
    with open(os.path.join(output_dir, "split_metadata.json"), "w", encoding="utf-8") as f:
        json.dump(split_meta, f, indent=2)
        
    print(f"[PREPROCESS] Finished Multi-Class Split: Total={total_samples:,} | Train={len(train_df):,}, Val={len(val_df):,}, Test={len(test_df):,} across {len(label_mapping)} classes.")
    return train_df, val_df, test_df

if __name__ == "__main__":
    preprocess_clinical_dataset()

