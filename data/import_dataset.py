"""
MEDINTEL AI - Master Dataset Import Pipeline
Orchestrates:
1. Dataset Detection / Generation
2. Integrity Validation & Profiling
3. Cleaning, Text Normalization & Stratified Train/Val/Test Splitting
4. Documentation Generation
"""

import sys
import os

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from data.generate_dataset import generate_dataset
from data.dataset_validator import validate_and_profile_dataset
from data.preprocess import preprocess_and_split

def run_import_pipeline():
    print("=" * 60)
    print("MEDINTEL AI - DATASET IMPORT & VALIDATION PIPELINE")
    print("=" * 60)
    
    raw_path = "data/raw/clinical_cases_raw.csv"
    if not os.path.exists(raw_path):
        print("\n[STEP 1/3] Generating synthetic benchmark clinical dataset...")
        generate_dataset(samples_per_class=125, output_csv=raw_path)
    else:
        print(f"\n[STEP 1/3] Existing dataset detected at {raw_path}")
        
    print("\n[STEP 2/3] Validating and profiling dataset...")
    profile = validate_and_profile_dataset(raw_csv_path=raw_path)
    
    print("\n[STEP 3/3] Preprocessing and creating stratified 70/15/15 splits...")
    train_df, val_df, test_df, encoder = preprocess_and_split(raw_csv_path=raw_path)
    
    print("\n" + "=" * 60)
    print(f"PIPELINE COMPLETE: {profile['total_samples']} samples processed across {profile['num_classes']} classes.")
    print("Splits: Train = {}, Val = {}, Test = {}".format(len(train_df), len(val_df), len(test_df)))
    print("=" * 60)

if __name__ == "__main__":
    run_import_pipeline()
