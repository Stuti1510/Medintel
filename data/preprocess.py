"""
MEDINTEL AI - Leakage-Safe Preprocessor & Stratified Splitter (Active Master Dataset)
1. Ingests the active balanced dataset (data/cleaned/cardio_train_active_balanced.csv).
2. Performs 70% Train (1,680 records) / 15% Validation (360 records) / 15% Test (360 records) stratified partitioning (Random Seed = 42).
3. Fits LabelEncoders exclusively on training partitions.
4. Saves train.csv, val.csv, test.csv, and medintel_balanced_master.csv.
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
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^a-z0-9\s\.,;:/\-%]', '', text)
    return text.strip()

def build_clinical_narrative(row) -> str:
    """Standardized narrative for clinical reasoning and explainability."""
    sex_str = "Female" if int(row.get('gender', 1)) == 1 else "Male"
    age_yrs = float(row.get('age_years', 50))
    height_cm = float(row.get('height', 165))
    weight_kg = float(row.get('weight', 70))
    bmi = float(row.get('bmi', 25.0))
    sbp = float(row.get('ap_hi', 120))
    dbp = float(row.get('ap_lo', 80))
    
    chol_map = {1: "Normal", 2: "Above Normal", 3: "Well Above Normal"}
    gluc_map = {1: "Normal", 2: "Above Normal", 3: "Well Above Normal"}
    
    chol_str = chol_map.get(int(row.get('cholesterol', 1)), "Normal")
    gluc_str = gluc_map.get(int(row.get('gluc', 1)), "Normal")
    
    smoke_str = "Yes" if int(row.get('smoke', 0)) == 1 else "No"
    alco_str = "Yes" if int(row.get('alco', 0)) == 1 else "No"
    active_str = "Yes" if int(row.get('active', 1)) == 1 else "No"

    return (
        f"Patient is a {age_yrs:.0f}-year-old {sex_str} with height {height_cm:.0f} cm, weight {weight_kg:.1f} kg, "
        f"and calculated BMI {bmi:.1f} kg/m2. Vital signs show resting blood pressure {sbp:.0f}/{dbp:.0f} mmHg. "
        f"Laboratory parameters show serum cholesterol is {chol_str} and blood glucose is {gluc_str}. "
        f"Lifestyle factors: Tobacco smoker: {smoke_str}, Alcohol consumer: {alco_str}, Physically active: {active_str}."
    )

def preprocess_cardio_benchmark(
    active_csv="data/cleaned/cardio_train_active_balanced.csv",
    output_dir="data/processed",
    models_dir="models/classical"
):
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(models_dir, exist_ok=True)
    
    if not os.path.exists(active_csv):
        # Fallback to standard clean if active balanced not generated yet
        active_csv = "data/cleaned/cardio_train_clean.csv"
        
    df = pd.read_csv(active_csv)
    target_col = "cardio"
    total_samples = len(df)
    
    print(f"[PREPROCESS] Partitioning {total_samples:,} active balanced records from {active_csv}...")
    
    # 1. Narrative generation
    df["full_clinical_text"] = df.apply(build_clinical_narrative, axis=1)
    
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
    
    # 3. Fit LabelEncoder on Train Set Only
    label_encoder = LabelEncoder()
    train_df = train_df.copy()
    val_df = val_df.copy()
    test_df = test_df.copy()
    
    train_df["label_idx"] = label_encoder.fit_transform(train_df[target_col])
    val_df["label_idx"] = label_encoder.transform(val_df[target_col])
    test_df["label_idx"] = label_encoder.transform(test_df[target_col])
    
    class_names = ["No Cardiovascular Disease", "Cardiovascular Disease"]
    label_mapping = {int(idx): class_names[idx] if idx < len(class_names) else str(c) for idx, c in enumerate(label_encoder.classes_)}
    
    with open(os.path.join(output_dir, "label_mapping.json"), "w", encoding="utf-8") as f:
        json.dump(label_mapping, f, indent=2)
    joblib.dump(label_encoder, os.path.join(models_dir, "label_encoder.joblib"))
    
    # 4. Save Partitions
    train_df.to_csv(os.path.join(output_dir, "train.csv"), index=False)
    val_df.to_csv(os.path.join(output_dir, "val.csv"), index=False)
    test_df.to_csv(os.path.join(output_dir, "test.csv"), index=False)
    
    split_meta = {
        "dataset_name": "MEDINTEL Balanced Master Dataset (Cardiovascular Risk Cohort)",
        "total_active_samples": total_samples,
        "raw_source_samples": 70000,
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
        "leakage_prevention": "Active dataset created pre-split. Preprocessors fit on training set only. Test set untouched."
    }
    with open(os.path.join(output_dir, "split_metadata.json"), "w", encoding="utf-8") as f:
        json.dump(split_meta, f, indent=2)
        
    print(f"[PREPROCESS] Finished Active Master Split: Active={total_samples:,} | Train={len(train_df):,}, Val={len(val_df):,}, Test={len(test_df):,}")
    return train_df, val_df, test_df

if __name__ == "__main__":
    preprocess_cardio_benchmark()
