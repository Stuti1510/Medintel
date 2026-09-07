"""
MEDINTEL AI - Phase 9: Fit Preprocessing on Train Only & Transform Splits
Fits StandardScaler, OneHotEncoder, and LabelEncoders EXCLUSIVELY on train_synthetic.csv,
then transforms validation and test splits without refitting.
"""

import os
import sys
import joblib
import numpy as np
import pandas as pd

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from data.feature_pipeline import SyntheticClinicalFeatureEngine

def fit_preprocessing_and_transform(
    data_dir="data/processed",
    models_dir="models/classical"
):
    print("=" * 60)
    print("PHASE 9: FIT PREPROCESSING ON TRAIN ONLY")
    print("=" * 60)

    train_path = os.path.join(data_dir, "train_synthetic.csv")
    val_path = os.path.join(data_dir, "val_synthetic.csv")
    test_path = os.path.join(data_dir, "test_synthetic.csv")

    train_df = pd.read_csv(train_path)
    val_df = pd.read_csv(val_path)
    test_df = pd.read_csv(test_path)

    print(f"Loaded Partitions: Train={len(train_df)}, Val={len(val_df)}, Test={len(test_df)}")

    # 1. Initialize & Fit Feature Engine on Train ONLY
    engine = SyntheticClinicalFeatureEngine()
    engine.fit(train_df)

    # 2. Transform Train, Validation, and Test
    print("\nTransforming partitions with fitted engine...")
    X_train = engine.transform(train_df)
    y_train = train_df["label_idx"].values

    X_val = engine.transform(val_df)
    y_val = val_df["label_idx"].values

    X_test = engine.transform(test_df)
    y_test = test_df["label_idx"].values

    # 3. Verification checks
    print("\nVerification Checks:")
    print(f"  - X_train shape: {X_train.shape} (NaNs: {np.isnan(X_train).sum()}, Infs: {np.isinf(X_train).sum()})")
    print(f"  - X_val shape:   {X_val.shape} (NaNs: {np.isnan(X_val).sum()}, Infs: {np.isinf(X_val).sum()})")
    print(f"  - X_test shape:  {X_test.shape} (NaNs: {np.isnan(X_test).sum()}, Infs: {np.isinf(X_test).sum()})")
    print(f"  - Feature names ({len(engine.feature_names)}): {engine.feature_names}")

    assert np.isnan(X_train).sum() == 0, "NaNs found in X_train"
    assert np.isnan(X_val).sum() == 0, "NaNs found in X_val"
    assert np.isnan(X_test).sum() == 0, "NaNs found in X_test"
    assert X_train.shape[1] == X_val.shape[1] == X_test.shape[1] == len(engine.feature_names)

    # 4. Save fitted pipeline and processed numpy matrices
    engine.save(models_dir)
    
    np.save(os.path.join(data_dir, "X_train_synthetic.npy"), X_train)
    np.save(os.path.join(data_dir, "y_train_synthetic.npy"), y_train)
    np.save(os.path.join(data_dir, "X_val_synthetic.npy"), X_val)
    np.save(os.path.join(data_dir, "y_val_synthetic.npy"), y_val)
    np.save(os.path.join(data_dir, "X_test_synthetic.npy"), X_test)
    np.save(os.path.join(data_dir, "y_test_synthetic.npy"), y_test)

    print("\n" + "=" * 60)
    print("PHASE 9 COMPLETE: Transformers fitted on train only and saved.")
    print("=" * 60)

    return engine, X_train, y_train, X_val, y_val, X_test, y_test

if __name__ == "__main__":
    fit_preprocessing_and_transform()
