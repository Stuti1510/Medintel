"""
MEDINTEL AI - Leakage-Safe Multi-Class Clinical Dataset Preprocessor & Group-Stratified Splitter
1. Ingests the 24-class Symptom2Disease benchmark dataset (1,200 verified clinical cases).
2. Performs Group-Aware Stratified Partitioning:
   - Groups identical symptom descriptions so duplicate texts NEVER cross split boundaries (Zero Data Leakage).
   - Strictly 70% Train (840 records) / 15% Validation (180 records) / 15% Test (180 records).
3. Preserves authentic natural-language text schema without fabricating synthetic measurements or vitals.
4. Fits LabelEncoder exclusively on the training partition.
5. Saves train.csv, val.csv, test.csv, label_mapping.json, split_metadata.json, and medintel_balanced_master.csv.
"""

import os
import sys
import re
import json
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.preprocessing import LabelEncoder
import joblib

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

RANDOM_SEED = 42

def clean_clinical_text(text: str) -> str:
    """Normalizes clinical text while preserving medical terminology, abbreviations, and measurements."""
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^a-z0-9\s\.,;:/\-%°]', '', text)
    return text.strip()

def preprocess_clinical_dataset(
    raw_csv="data/cleaned/symptom_to_disease_clean.csv",
    output_dir="data/processed",
    models_dir="models/classical",
    raw_output_dir="data/raw"
):
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(raw_output_dir, exist_ok=True)
    
    if not os.path.exists(raw_csv):
        raw_csv = "datasets/Symptom2Disease.csv"
    if not os.path.exists(raw_csv):
        raw_csv = "data/raw/Symptom2Disease.csv"
    if not os.path.exists(raw_csv):
        raw_csv = "data/raw/symptom_to_disease_raw.csv"
        
    if not os.path.exists(raw_csv):
        raise FileNotFoundError(f"Source clinical dataset not found at {raw_csv}")
        
    raw_df = pd.read_csv(raw_csv)
    
    label_col = "label" if "label" in raw_df.columns else "condition"
    text_col = "text" if "text" in raw_df.columns else "clinical_narrative"
    if text_col not in raw_df.columns and "full_clinical_text" in raw_df.columns:
        text_col = "full_clinical_text"
        
    # Build clean DataFrame preserving authentic text schema
    df = pd.DataFrame()
    df["case_id"] = [f"CASE-{i+1:04d}" for i in range(len(raw_df))]
    df["label"] = raw_df[label_col].astype(str).str.strip()
    df["condition"] = df["label"]  # Canonical alias
    df["text"] = raw_df[text_col].astype(str).str.strip()
    df["clinical_narrative"] = df["text"]  # Canonical alias
    df["full_clinical_text"] = df["text"].apply(clean_clinical_text)
    
    total_samples = len(df)
    target_col = "label"
    classes = sorted(df[target_col].unique())
    num_classes = len(classes)
    
    print(f"[PREPROCESS] Processing {total_samples:,} records across {num_classes} conditions from {raw_csv}...")
    
    # Save master dataset
    df.to_csv(os.path.join(output_dir, "medintel_balanced_master.csv"), index=False)
    
    # 2. Group-Aware Stratified Split
    # Map identical text descriptions to unique group_ids
    unique_texts = df["text"].unique()
    text_to_group = {t: idx for idx, t in enumerate(unique_texts)}
    df["group_id"] = df["text"].map(text_to_group)
    
    train_indices = []
    val_indices = []
    test_indices = []
    
    # 24 classes: 12 classes give 8 val / 7 test, 12 classes give 7 val / 8 test
    # Each class gives exactly 35 train samples.
    # Total: 24 * 35 = 840 train, 180 val, 180 test. Zero duplicate leakage.
    for i, lbl in enumerate(classes):
        target_val = 8 if i % 2 == 0 else 7
        target_test = 7 if i % 2 == 0 else 8
        
        c_sub = df[df[target_col] == lbl]
        group_map = {}
        for idx, row in c_sub.iterrows():
            group_map.setdefault(row["group_id"], []).append(idx)
            
        found = False
        for seed in range(500):
            rng = np.random.RandomState(seed + RANDOM_SEED)
            items = list(group_map.values())
            rng.shuffle(items)
            
            c_tr, c_va, c_te = [], [], []
            for grp in items:
                if len(c_tr) + len(grp) <= 35:
                    c_tr.extend(grp)
                elif len(c_va) + len(grp) <= target_val:
                    c_va.extend(grp)
                elif len(c_te) + len(grp) <= target_test:
                    c_te.extend(grp)
                    
            if len(c_tr) == 35 and len(c_va) == target_val and len(c_te) == target_test:
                train_indices.extend(c_tr)
                val_indices.extend(c_va)
                test_indices.extend(c_te)
                found = True
                break
                
        if not found:
            # Fallback to standard deterministic fill
            items = list(group_map.values())
            c_tr, c_va, c_te = [], [], []
            for grp in items:
                if len(c_tr) < 35:
                    c_tr.extend(grp)
                elif len(c_va) < target_val:
                    c_va.extend(grp)
                else:
                    c_te.extend(grp)
            train_indices.extend(c_tr)
            val_indices.extend(c_va)
            test_indices.extend(c_te)
            
    train_df = df.loc[train_indices].copy().reset_index(drop=True)
    val_df = df.loc[val_indices].copy().reset_index(drop=True)
    test_df = df.loc[test_indices].copy().reset_index(drop=True)
    
    # Verify zero leakage across partition texts
    tr_set = set(train_df["text"])
    va_set = set(val_df["text"])
    te_set = set(test_df["text"])
    leakage_count = len(tr_set & va_set) + len(tr_set & te_set) + len(va_set & te_set)
    assert leakage_count == 0, f"Critical: Data leakage detected across splits ({leakage_count} overlapping texts)"
    
    # 3. Fit LabelEncoder strictly on Training Split Only (Leakage Prevention)
    label_encoder = LabelEncoder()
    train_df["label_idx"] = label_encoder.fit_transform(train_df[target_col])
    val_df["label_idx"] = label_encoder.transform(val_df[target_col])
    test_df["label_idx"] = label_encoder.transform(test_df[target_col])
    
    classes_list = [str(c) for c in label_encoder.classes_]
    label_mapping = {str(idx): str(c) for idx, c in enumerate(classes_list)}
    
    with open(os.path.join(output_dir, "label_mapping.json"), "w", encoding="utf-8") as f:
        json.dump(label_mapping, f, indent=2)
    joblib.dump(label_encoder, os.path.join(models_dir, "label_encoder.joblib"))
    
    # Drop internal group_id before saving
    train_df = train_df.drop(columns=["group_id"], errors="ignore")
    val_df = val_df.drop(columns=["group_id"], errors="ignore")
    test_df = test_df.drop(columns=["group_id"], errors="ignore")
    
    # 4. Save Partitions
    train_df.to_csv(os.path.join(output_dir, "train.csv"), index=False)
    val_df.to_csv(os.path.join(output_dir, "val.csv"), index=False)
    test_df.to_csv(os.path.join(output_dir, "test.csv"), index=False)
    
    split_meta = {
        "dataset_name": "Symptom-to-Disease Clinical Benchmark (Symptom2Disease)",
        "total_active_samples": total_samples,
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
        "leakage_prevention": "Group-aware stratified splitting on unique text descriptions. Zero text overlap between train, val, and test partitions. LabelEncoder fit strictly on training partition."
    }
    with open(os.path.join(output_dir, "split_metadata.json"), "w", encoding="utf-8") as f:
        json.dump(split_meta, f, indent=2)
        
    print(f"[PREPROCESS] Finished Group-Stratified Split: Total={total_samples:,} | Train={len(train_df):,}, Val={len(val_df):,}, Test={len(test_df):,} across {len(label_mapping)} classes.")
    print(f"[PREPROCESS] Verified zero duplicate text leakage across partitions.")
    return train_df, val_df, test_df, label_encoder

if __name__ == "__main__":
    preprocess_clinical_dataset()
