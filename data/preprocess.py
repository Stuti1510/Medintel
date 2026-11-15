"""
Dataset preprocessing and fold splitting for pad_ufes_20_4class.
"""

import os
import pandas as pd
from typing import Tuple, Dict

def load_manifest(manifest_path: str = "data/multimodal/manifest.csv") -> pd.DataFrame:
    if not os.path.exists(manifest_path):
        raise FileNotFoundError(f"Manifest not found at {manifest_path}. Run build_pad_ufes_dataset.py first.")
    return pd.read_csv(manifest_path)

def get_fold_splits(manifest_path: str = "data/multimodal/manifest.csv", fold: int = 0) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Returns (train_df, val_df, test_df) for fold k according to the project rule:
    Fold k = test, (k + 1) % 5 = validation, the rest = training.
    """
    df = load_manifest(manifest_path)
    k = fold
    val_fold = (k + 1) % 5
    
    test_df = df[df["fold"] == k].reset_index(drop=True)
    val_df = df[df["fold"] == val_fold].reset_index(drop=True)
    train_df = df[(df["fold"] != k) & (df["fold"] != val_fold)].reset_index(drop=True)
    
    return train_df, val_df, test_df

def get_class_counts(manifest_path: str = "data/multimodal/manifest.csv") -> Dict[str, int]:
    df = load_manifest(manifest_path)
    return df["diagnostic"].value_counts().to_dict()
