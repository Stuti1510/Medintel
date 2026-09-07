"""
MEDINTEL AI - Phase 8: Stratified Train / Validation / Test Partitioning
Performs leakage-free 70/15/15 stratified split on the 10,000-row synthetic dataset.
"""

import os
import sys
import json
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database.session import SessionLocal
from backend.app.models.entities import RawPatientData, Dataset

RANDOM_SEED = 42

def perform_stratified_split(output_dir="data/processed", models_dir="models/classical"):
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(models_dir, exist_ok=True)

    print("=" * 60)
    print("PHASE 8: TRAIN / VAL / TEST SPLIT (70% / 15% / 15%)")
    print("=" * 60)

    # Load from Database or raw CSV fallback
    db = SessionLocal()
    try:
        ds = db.query(Dataset).filter(Dataset.name == "synthetic_clinical_dataset").first()
        if ds:
            rows = db.query(RawPatientData).filter(RawPatientData.dataset_id == ds.id).all()
            print(f"Loaded {len(rows):,} rows from raw_patient_data table (dataset_id: {ds.id}).")
            data = [{
                "patient_id": r.patient_id,
                "age": r.age,
                "sex": r.sex,
                "bmi": r.bmi,
                "systolic_bp": r.systolic_bp,
                "diastolic_bp": r.diastolic_bp,
                "glucose": r.glucose,
                "cholesterol": r.cholesterol,
                "creatinine": r.creatinine,
                "diabetes": r.diabetes,
                "hypertension": r.hypertension,
                "diagnosis": r.diagnosis,
                "readmission_30d": r.readmission_30d,
                "mortality": r.mortality
            } for r in rows]
            df = pd.DataFrame(data)
        else:
            csv_path = "data/raw/synthetic_clinical_dataset.csv"
            print(f"Loading from CSV at {csv_path}...")
            df = pd.read_csv(csv_path)
    finally:
        db.close()

    total_count = len(df)
    assert total_count == 10000, f"Expected 10,000 rows, got {total_count}"
    
    # Exclude patient_id identifier from feature matrix during split / training
    target_col = "diagnosis"
    
    # 1. 70% Train, 30% Temp (Val + Test)
    train_df, temp_df = train_test_split(
        df,
        test_size=0.30,
        random_state=RANDOM_SEED,
        stratify=df[target_col]
    )

    # 2. Split Temp evenly into 15% Validation and 15% Test
    val_df, test_df = train_test_split(
        temp_df,
        test_size=0.50,
        random_state=RANDOM_SEED,
        stratify=temp_df[target_col]
    )

    # Verify partition sizes
    assert len(train_df) == 7000, f"Train set size: {len(train_df)}"
    assert len(val_df) == 1500, f"Val set size: {len(val_df)}"
    assert len(test_df) == 1500, f"Test set size: {len(test_df)}"

    # Fit LabelEncoder strictly on train set
    le = LabelEncoder()
    train_df = train_df.copy()
    val_df = val_df.copy()
    test_df = test_df.copy()

    train_df["label_idx"] = le.fit_transform(train_df[target_col])
    val_df["label_idx"] = le.transform(val_df[target_col])
    test_df["label_idx"] = le.transform(test_df[target_col])

    label_mapping = {int(idx): str(label) for idx, label in enumerate(le.classes_)}
    joblib.dump(le, os.path.join(models_dir, "synthetic_label_encoder.joblib"))
    
    with open(os.path.join(output_dir, "synthetic_label_mapping.json"), "w", encoding="utf-8") as f:
        json.dump(label_mapping, f, indent=2)

    # Save partition CSVs
    train_df.to_csv(os.path.join(output_dir, "train_synthetic.csv"), index=False)
    val_df.to_csv(os.path.join(output_dir, "val_synthetic.csv"), index=False)
    test_df.to_csv(os.path.join(output_dir, "test_synthetic.csv"), index=False)

    # Verify no overlap of patient_ids
    train_ids = set(train_df["patient_id"])
    val_ids = set(val_df["patient_id"])
    test_ids = set(test_df["patient_id"])
    assert len(train_ids.intersection(val_ids)) == 0, "Leakage detected between Train and Val!"
    assert len(train_ids.intersection(test_ids)) == 0, "Leakage detected between Train and Test!"
    assert len(val_ids.intersection(test_ids)) == 0, "Leakage detected between Val and Test!"

    # Calculate class proportions across sets
    print("\nPartition Class Counts & Percentages:")
    for label in le.classes_:
        n_train = (train_df[target_col] == label).sum()
        n_val = (val_df[target_col] == label).sum()
        n_test = (test_df[target_col] == label).sum()
        p_train = n_train / len(train_df) * 100
        p_val = n_val / len(val_df) * 100
        p_test = n_test / len(test_df) * 100
        print(f"  {label:<15} | Train: {n_train:>4} ({p_train:5.2f}%) | Val: {n_val:>4} ({p_val:5.2f}%) | Test: {n_test:>4} ({p_test:5.2f}%)")

    print("\n" + "=" * 60)
    print(f"SPLIT COMPLETE: Train={len(train_df)}, Val={len(val_df)}, Test={len(test_df)} (Total: {total_count})")
    print(f"Artifacts saved to {output_dir}/")
    print("=" * 60)

    return train_df, val_df, test_df

if __name__ == "__main__":
    perform_stratified_split()
