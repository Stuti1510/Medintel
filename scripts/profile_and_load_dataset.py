"""
MEDINTEL AI - Phase 4-6 Dataset Loader & Verification Script
Profiles synthetic_clinical_dataset.csv, inserts dataset metadata,
and loads all 10,000 rows into raw_patient_data table in batches.
"""

import os
import sys
import json
import hashlib
import pandas as pd
from datetime import datetime

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database.session import SessionLocal
from backend.app.models.entities import Dataset, RawPatientData

def profile_and_load():
    csv_path = "data/raw/synthetic_clinical_dataset.csv"
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset not found at {csv_path}")

    # ---------------------------------------------------------
    # PHASE 4: Profile Dataset & Compute SHA-256
    # ---------------------------------------------------------
    print("=" * 60)
    print("PHASE 4: LOCATE & PROFILE DATASET")
    print("=" * 60)
    
    with open(csv_path, "rb") as f:
        file_bytes = f.read()
        sha256_hash = hashlib.sha256(file_bytes).hexdigest()
    
    df = pd.read_csv(csv_path)
    total_samples, total_features = df.shape
    missing_count = int(df.isnull().sum().sum())
    dup_count = int(df.duplicated().sum())
    class_dist = df["diagnosis"].value_counts().to_dict()
    
    print(f"File: {csv_path}")
    print(f"SHA-256: {sha256_hash}")
    print(f"Rows: {total_samples}")
    print(f"Columns ({total_features}): {list(df.columns)}")
    print(f"Missing Values: {missing_count}")
    print(f"Duplicates: {dup_count}")
    print(f"Target Column: diagnosis (4 classes)")
    print(f"Class Distribution: {class_dist}")
    
    # ---------------------------------------------------------
    # PHASE 5: Insert Dataset Metadata into DB
    # ---------------------------------------------------------
    print("\n" + "=" * 60)
    print("PHASE 5: INSERT DATASET METADATA INTO DATABASE")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # Check if dataset record exists
        dataset = db.query(Dataset).filter(Dataset.name == "synthetic_clinical_dataset").first()
        if not dataset:
            dataset = Dataset(
                name="synthetic_clinical_dataset",
                version="v1.0",
                file_type="csv",
                file_path=csv_path,
                total_samples=total_samples,
                total_features=total_features,
                target_column="diagnosis",
                num_classes=len(class_dist),
                missing_values=missing_count,
                duplicate_records=dup_count,
                class_distribution=class_dist,
                status="validated",
                last_processed_at=datetime.utcnow()
            )
            db.add(dataset)
            db.commit()
            db.refresh(dataset)
            print(f"Created Dataset metadata record ID: {dataset.id}")
        else:
            dataset.total_samples = total_samples
            dataset.total_features = total_features
            dataset.class_distribution = class_dist
            dataset.status = "validated"
            dataset.last_processed_at = datetime.utcnow()
            db.commit()
            db.refresh(dataset)
            print(f"Updated existing Dataset metadata record ID: {dataset.id}")

        dataset_id = dataset.id

        # ---------------------------------------------------------
        # PHASE 6: Load All 10,000 Rows into raw_patient_data
        # ---------------------------------------------------------
        print("\n" + "=" * 60)
        print("PHASE 6: LOAD ALL 10,000 ROWS INTO raw_patient_data TABLE")
        print("=" * 60)
        
        current_rows_count = db.query(RawPatientData).filter(RawPatientData.dataset_id == dataset_id).count()
        if current_rows_count == total_samples:
            print(f"All {total_samples} rows are already loaded for dataset ID {dataset_id}.")
        else:
            if current_rows_count > 0:
                print(f"Purging {current_rows_count} partial rows before fresh import...")
                db.query(RawPatientData).filter(RawPatientData.dataset_id == dataset_id).delete()
                db.commit()
            
            print(f"Inserting {total_samples} rows in batches of 500...")
            batch_size = 500
            records_to_insert = []
            
            for idx, row in df.iterrows():
                rec = RawPatientData(
                    dataset_id=dataset_id,
                    patient_id=str(row["patient_id"]),
                    age=int(row["age"]) if pd.notnull(row["age"]) else None,
                    sex=str(row["sex"]) if pd.notnull(row["sex"]) else None,
                    bmi=float(row["bmi"]) if pd.notnull(row["bmi"]) else None,
                    systolic_bp=float(row["systolic_bp"]) if pd.notnull(row["systolic_bp"]) else None,
                    diastolic_bp=float(row["diastolic_bp"]) if pd.notnull(row["diastolic_bp"]) else None,
                    glucose=float(row["glucose"]) if pd.notnull(row["glucose"]) else None,
                    cholesterol=float(row["cholesterol"]) if pd.notnull(row["cholesterol"]) else None,
                    creatinine=float(row["creatinine"]) if pd.notnull(row["creatinine"]) else None,
                    diabetes=int(row["diabetes"]) if pd.notnull(row["diabetes"]) else None,
                    hypertension=int(row["hypertension"]) if pd.notnull(row["hypertension"]) else None,
                    diagnosis=str(row["diagnosis"]) if pd.notnull(row["diagnosis"]) else None,
                    readmission_30d=int(row["readmission_30d"]) if pd.notnull(row["readmission_30d"]) else None,
                    mortality=int(row["mortality"]) if pd.notnull(row["mortality"]) else None
                )
                records_to_insert.append(rec)
                
                if len(records_to_insert) >= batch_size:
                    db.bulk_save_objects(records_to_insert)
                    db.commit()
                    records_to_insert = []
            
            if records_to_insert:
                db.bulk_save_objects(records_to_insert)
                db.commit()
            print("All batches successfully committed.")

        # Verification Queries
        count = db.query(RawPatientData).filter(RawPatientData.dataset_id == dataset_id).count()
        print(f"\nVerification 1 - Row Count for dataset_id {dataset_id}: {count} (Expected: 10000)")
        
        from sqlalchemy import func
        diag_counts = (
            db.query(RawPatientData.diagnosis, func.count(RawPatientData.id))
            .filter(RawPatientData.dataset_id == dataset_id)
            .group_by(RawPatientData.diagnosis)
            .order_by(func.count(RawPatientData.id).desc())
            .all()
        )
        print("Verification 2 - Diagnosis Distribution from DB query:")
        for diag, c in diag_counts:
            print(f"  - {diag}: {c}")

        return {
            "dataset_id": dataset_id,
            "sha256": sha256_hash,
            "total_rows": count,
            "distribution": {d: c for d, c in diag_counts}
        }
    finally:
        db.close()

if __name__ == "__main__":
    profile_and_load()
