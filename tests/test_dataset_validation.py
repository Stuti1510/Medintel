"""
MEDINTEL AI - Symptom2Disease Validation & Quality Test Suite
Automates scientific data integrity checks on the Symptom2Disease benchmark dataset.
"""

import os
import pytest
import pandas as pd
import numpy as np
from data.dataset_registry import DATASET_REGISTRY
from data.dataset_validator import profile_all_4_datasets

@pytest.fixture
def symptom_df():
    path = "datasets/Symptom2Disease.csv"
    assert os.path.exists(path), f"Dataset missing at {path}"
    return pd.read_csv(path)

def test_1_dataset_exists():
    for d_id, meta in DATASET_REGISTRY.items():
        assert os.path.exists(meta["source_path"]), f"Dataset source missing: {meta['source_path']}"

def test_2_dataset_schema(symptom_df):
    assert "label" in symptom_df.columns
    assert "text" in symptom_df.columns
    assert len(symptom_df.columns) >= 2

def test_3_rows_and_nulls(symptom_df):
    assert len(symptom_df) == 1200
    assert symptom_df["label"].isnull().sum() == 0
    assert symptom_df["text"].isnull().sum() == 0

def test_4_classes_count(symptom_df):
    unique_classes = symptom_df["label"].nunique()
    assert unique_classes == 24, f"Expected 24 classes, got {unique_classes}"

def test_5_balanced_distribution(symptom_df):
    counts = symptom_df["label"].value_counts()
    assert (counts == 50).all(), "All 24 disease classes must have exactly 50 samples"

def test_6_clean_dataset_exists():
    path = "data/cleaned/symptom_to_disease_clean.csv"
    assert os.path.exists(path), f"Clean dataset missing at {path}"
    df_clean = pd.read_csv(path)
    assert len(df_clean) > 1100

def test_7_stratified_partitions():
    train_path = "data/processed/train.csv"
    val_path = "data/processed/val.csv"
    test_path = "data/processed/test.csv"
    
    assert os.path.exists(train_path)
    assert os.path.exists(val_path)
    assert os.path.exists(test_path)
    
    train_df = pd.read_csv(train_path)
    val_df = pd.read_csv(val_path)
    test_df = pd.read_csv(test_path)
    
    assert len(train_df) == 840
    assert len(val_df) == 180
    assert len(test_df) == 180
    assert train_df["label_idx"].nunique() == 24

def test_8_profiler_execution():
    profiles = profile_all_4_datasets()
    assert "symptom_to_disease" in profiles
    assert profiles["symptom_to_disease"]["total_samples"] == 1200
    assert profiles["symptom_to_disease"]["num_classes"] == 24
