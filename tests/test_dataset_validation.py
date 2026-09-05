"""
MEDINTEL AI - 4-Dataset Validation & Quality Test Suite
Automates scientific data integrity checks across all 4 datasets.
"""

import os
import pytest
import pandas as pd
import numpy as np
from data.dataset_registry import DATASET_REGISTRY
from data.dataset_validator import profile_all_4_datasets

@pytest.fixture
def cardio_clean_df():
    path = "data/cleaned/cardio_train_clean.csv"
    assert os.path.exists(path), f"Clean dataset missing at {path}"
    return pd.read_csv(path)

def test_1_all_4_datasets_exist():
    for d_id, meta in DATASET_REGISTRY.items():
        assert os.path.exists(meta["source_path"]), f"Dataset source missing: {meta['source_path']}"

def test_2_cardio_clean_schema(cardio_clean_df):
    expected_cols = [
        "id", "age", "gender", "height", "weight", "ap_hi", "ap_lo",
        "cholesterol", "gluc", "smoke", "alco", "active", "cardio", "age_years", "bmi"
    ]
    assert list(cardio_clean_df.columns) == expected_cols

def test_3_cardio_clean_rows_and_nulls(cardio_clean_df):
    assert len(cardio_clean_df) > 60000
    assert cardio_clean_df.isnull().sum().sum() == 0

def test_4_target_valid_values(cardio_clean_df):
    unique_targets = set(cardio_clean_df["cardio"].unique())
    assert unique_targets == {0, 1}

def test_5_feature_types_identified(cardio_clean_df):
    numeric_cols = ["age_years", "height", "weight", "ap_hi", "ap_lo", "bmi"]
    for col in numeric_cols:
        assert pd.api.types.is_numeric_dtype(cardio_clean_df[col])
    assert set(cardio_clean_df["gender"].unique()).issubset({1, 2})
    assert set(cardio_clean_df["smoke"].unique()).issubset({0, 1})
    assert set(cardio_clean_df["alco"].unique()).issubset({0, 1})
    assert set(cardio_clean_df["active"].unique()).issubset({0, 1})

def test_6_no_impossible_vital_signs(cardio_clean_df):
    assert (cardio_clean_df["ap_hi"] >= 60).all() and (cardio_clean_df["ap_hi"] <= 240).all()
    assert (cardio_clean_df["ap_lo"] >= 40).all() and (cardio_clean_df["ap_lo"] <= 180).all()
    assert (cardio_clean_df["ap_hi"] > cardio_clean_df["ap_lo"]).all()

def test_7_no_impossible_physicals(cardio_clean_df):
    assert (cardio_clean_df["height"] >= 100).all() and (cardio_clean_df["height"] <= 220).all()
    assert (cardio_clean_df["weight"] >= 30).all() and (cardio_clean_df["weight"] <= 200).all()

def test_8_non_constant_features(cardio_clean_df):
    for col in cardio_clean_df.columns:
        assert cardio_clean_df[col].nunique() > 1, f"Column {col} is constant"

def test_9_heart_disease_deduplication():
    df_clean = pd.read_csv("data/cleaned/heart_clean.csv")
    assert df_clean.duplicated().sum() == 0
    assert len(df_clean) == 302

def test_10_profiler_execution():
    profiles = profile_all_4_datasets()
    assert len(profiles) == 4
    assert "cardio_train" in profiles
    assert "heart_disease" in profiles
    assert "disease_profile" in profiles
    assert "symptoms_augmented" in profiles
