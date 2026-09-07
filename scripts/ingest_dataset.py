"""
MEDINTEL AI - Dataset Ingestion & Validation Script
Loads synthetic_clinical_dataset.csv, validates records, computes summary statistics,
and stores metadata in datasets table and rows in raw_patient_data table.
"""

import os
import sys
import json
import pandas as pd
from datetime import datetime

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database.session import SessionLocal
from backend.app.models.entities import Dataset, RawPatientData

DATASET_CSV_PATH = "data/raw/synthetic_clinical_dataset.csv"

def ingest_dataset():
    if not os.path.exists(DATASET_CSV_PATH):
        print(f"[ERROR] Dataset file not found at {DATASET_CSV_PATH}")
        return

    print(f"[DATASET INGEST] Reading {DATASET_CSV_PATH}...")
    df = pd.read_csv(DATASET_CSV_PATH)
    total_samples = len(df)
    total_features = len(df.columns) - 1 # excluding target
    missing_count = int(df.isnull().sum().sum())
    duplicate_count = int(df.duplicated().sum())
    class_counts = df['diagnosis'].value_counts().to_dict()
    num_classes = len(class_counts)

    train_samples = int(total_samples * 0.70)
    val_samples = int(total_samples * 0.15)
    test_samples = total_samples - train_samples - val_samples

    print(f"[DATASET INGEST] Total samples: {total_samples}")
    print(f"[DATASET INGEST] Total features: {total_features}")
    print(f"[DATASET INGEST] Target classes: {class_counts}")
    print(f"[DATASET INGEST] Missing: {missing_count}, Duplicates: {duplicate_count}")

    db = SessionLocal()
    try:
        # Check if dataset record exists
        ds = db.query(Dataset).filter(Dataset.name == "Synthetic Clinical Dataset").first()
        if not ds:
            ds = Dataset(
                name="Synthetic Clinical Dataset",
                version="v1.0.0",
                file_type="csv",
                file_path=DATASET_CSV_PATH,
                total_samples=total_samples,
                total_features=total_features,
                target_column="diagnosis",
                num_classes=num_classes,
                train_samples=train_samples,
                validation_samples=val_samples,
                test_samples=test_samples,
                missing_values=missing_count,
                duplicate_records=duplicate_count,
                class_distribution=class_counts,
                status="validated",
                last_processed_at=datetime.utcnow()
            )
            db.add(ds)
            db.commit()
            db.refresh(ds)
            print(f"[DATASET INGEST] Created Dataset record id={ds.id}")
        else:
            ds.total_samples = total_samples
            ds.total_features = total_features
            ds.class_distribution = class_counts
            ds.train_samples = train_samples
            ds.validation_samples = val_samples
            ds.test_samples = test_samples
            ds.missing_values = missing_count
            ds.duplicate_records = duplicate_count
            ds.last_processed_at = datetime.utcnow()
            db.commit()
            print(f"[DATASET INGEST] Updated Dataset record id={ds.id}")

        # Batch insert raw_patient_data if not already populated
        existing_rows = db.query(RawPatientData).filter(RawPatientData.dataset_id == ds.id).count()
        if existing_rows < total_samples:
            if existing_rows > 0:
                print(f"[DATASET INGEST] Clearing {existing_rows} partial rows...")
                db.query(RawPatientData).filter(RawPatientData.dataset_id == ds.id).delete()
                db.commit()

            print(f"[DATASET INGEST] Inserting {total_samples} raw patient records...")
            records = []
            for _, row in df.iterrows():
                records.append(RawPatientData(
                    dataset_id=ds.id,
                    patient_id=str(row['patient_id']),
                    age=int(row['age']) if pd.notnull(row['age']) else None,
                    sex=str(row['sex']) if pd.notnull(row['sex']) else None,
                    bmi=float(row['bmi']) if pd.notnull(row['bmi']) else None,
                    systolic_bp=float(row['systolic_bp']) if pd.notnull(row['systolic_bp']) else None,
                    diastolic_bp=float(row['diastolic_bp']) if pd.notnull(row['diastolic_bp']) else None,
                    glucose=float(row['glucose']) if pd.notnull(row['glucose']) else None,
                    cholesterol=float(row['cholesterol']) if pd.notnull(row['cholesterol']) else None,
                    creatinine=float(row['creatinine']) if pd.notnull(row['creatinine']) else None,
                    diabetes=int(row['diabetes']) if pd.notnull(row['diabetes']) else None,
                    hypertension=int(row['hypertension']) if pd.notnull(row['hypertension']) else None,
                    diagnosis=str(row['diagnosis']) if pd.notnull(row['diagnosis']) else None,
                    readmission_30d=int(row['readmission_30d']) if pd.notnull(row['readmission_30d']) else None,
                    mortality=int(row['mortality']) if pd.notnull(row['mortality']) else None
                ))
            
            # Bulk save in batches of 1000
            batch_size = 1000
            for i in range(0, len(records), batch_size):
                db.bulk_save_objects(records[i:i + batch_size])
                db.commit()
            print(f"[DATASET INGEST] Successfully ingested {len(records)} patient rows into raw_patient_data table.")
        else:
            print(f"[DATASET INGEST] raw_patient_data already populated with {existing_rows} rows.")

    except Exception as e:
        print(f"[DATASET INGEST ERROR] {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    ingest_dataset()
