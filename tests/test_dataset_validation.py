"""
MEDINTEL AI - Dataset Validation & Profiling Tests
"""

import os
import json
import pandas as pd
import pytest

def test_dataset_files_exist():
    assert os.path.exists("data/raw/clinical_cases_raw.csv"), "Raw dataset CSV must exist."
    assert os.path.exists("data/processed/train.csv"), "Train split CSV must exist."
    assert os.path.exists("data/processed/val.csv"), "Val split CSV must exist."
    assert os.path.exists("data/processed/test.csv"), "Test split CSV must exist."
    assert os.path.exists("data/processed/dataset_profile.json"), "Dataset profile JSON must exist."

def test_dataset_integrity():
    df = pd.read_csv("data/raw/clinical_cases_raw.csv")
    assert len(df) == 2500, f"Expected 2,500 samples, got {len(df)}"
    assert df["condition"].nunique() == 20, f"Expected 20 disease classes, got {df['condition'].nunique()}"
    core_cols = ["case_id", "age", "sex", "symptoms", "duration", "severity", "heart_rate", "systolic_bp", "diastolic_bp", "temperature", "spo2", "clinical_narrative", "condition"]
    assert df[core_cols].isnull().sum().sum() == 0, "Core clinical fields must contain 0 missing values."

def test_split_proportions():
    train_df = pd.read_csv("data/processed/train.csv")
    val_df = pd.read_csv("data/processed/val.csv")
    test_df = pd.read_csv("data/processed/test.csv")

    assert len(train_df) == 1750, f"Expected 1,750 train cases (70%), got {len(train_df)}"
    assert len(val_df) == 375, f"Expected 375 val cases (15%), got {len(val_df)}"
    assert len(test_df) == 375, f"Expected 375 test cases (15%), got {len(test_df)}"
