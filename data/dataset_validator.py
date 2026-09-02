"""
MEDINTEL AI - Dataset Validator & Profiler
Validates dataset integrity, checks schemas, identifies missing/duplicate records,
computes real statistical distributions, and generates dataset_profile.json and docs/dataset.md.
"""

import os
import json
import pandas as pd
import numpy as np
from datetime import datetime

REQUIRED_COLUMNS = [
    "case_id", "age", "sex", "symptoms", "duration", "severity",
    "heart_rate", "systolic_bp", "diastolic_bp", "temperature", "spo2",
    "medical_history", "current_medications", "clinical_narrative", "condition"
]

def validate_and_profile_dataset(raw_csv_path="data/raw/clinical_cases_raw.csv",
                                 profile_output="data/processed/dataset_profile.json",
                                 doc_output="docs/dataset.md"):
    os.makedirs(os.path.dirname(profile_output), exist_ok=True)
    os.makedirs(os.path.dirname(doc_output), exist_ok=True)
    
    if not os.path.exists(raw_csv_path):
        raise FileNotFoundError(f"Raw dataset not found at {raw_csv_path}")
        
    df = pd.read_csv(raw_csv_path)
    
    # 1. Structural Validation
    total_samples = len(df)
    total_features = len(df.columns)
    missing_columns = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    
    # 2. Missing & Duplicates
    missing_values = int(df.isnull().sum().sum())
    missing_per_col = {col: int(count) for col, count in df.isnull().sum().items()}
    duplicates = int(df.duplicated(subset=["clinical_narrative"]).sum())
    
    # 3. Class Distribution
    class_counts = df["condition"].value_counts().to_dict()
    num_classes = len(class_counts)
    
    # 4. Demographic & Vital Distributions
    age_stats = {
        "mean": float(round(df["age"].mean(), 2)),
        "std": float(round(df["age"].std(), 2)),
        "min": int(df["age"].min()),
        "max": int(df["age"].max()),
        "median": float(df["age"].median())
    }
    
    sex_dist = df["sex"].value_counts().to_dict()
    severity_dist = df["severity"].value_counts().to_dict()
    
    vitals_stats = {
        "heart_rate": {
            "mean": float(round(df["heart_rate"].mean(), 1)),
            "min": int(df["heart_rate"].min()),
            "max": int(df["heart_rate"].max())
        },
        "systolic_bp": {
            "mean": float(round(df["systolic_bp"].mean(), 1)),
            "min": int(df["systolic_bp"].min()),
            "max": int(df["systolic_bp"].max())
        },
        "diastolic_bp": {
            "mean": float(round(df["diastolic_bp"].mean(), 1)),
            "min": int(df["diastolic_bp"].min()),
            "max": int(df["diastolic_bp"].max())
        },
        "temperature": {
            "mean": float(round(df["temperature"].mean(), 2)),
            "min": float(df["temperature"].min()),
            "max": float(df["temperature"].max())
        },
        "spo2": {
            "mean": float(round(df["spo2"].mean(), 1)),
            "min": int(df["spo2"].min()),
            "max": int(df["spo2"].max())
        }
    }
    
    # Word count distribution in narratives
    df["word_count"] = df["clinical_narrative"].apply(lambda x: len(str(x).split()))
    text_stats = {
        "mean_words": float(round(df["word_count"].mean(), 1)),
        "min_words": int(df["word_count"].min()),
        "max_words": int(df["word_count"].max())
    }
    
    validation_status = {
        "is_valid": len(missing_columns) == 0,
        "missing_required_columns": missing_columns,
        "has_missing_values": missing_values > 0,
        "has_duplicates": duplicates > 0,
        "checks": [
            {"check": "File Existence & Readability", "passed": True, "details": f"Successfully loaded {raw_csv_path}"},
            {"check": "Required Columns Schema", "passed": len(missing_columns) == 0, "details": f"{total_features} features present"},
            {"check": "Missing Value Integrity", "passed": missing_values == 0, "details": f"{missing_values} missing cells detected"},
            {"check": "Duplicate Narrative Check", "passed": duplicates == 0, "details": f"{duplicates} duplicate cases found"},
            {"check": "Target Label Integrity", "passed": num_classes > 0, "details": f"{num_classes} distinct disease classes verified"}
        ]
    }
    
    profile_data = {
        "dataset_name": "MEDINTEL Clinical Disease Benchmark Dataset",
        "raw_file": raw_csv_path,
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "total_samples": total_samples,
        "total_features": total_features,
        "num_classes": num_classes,
        "target_column": "condition",
        "missing_values": missing_values,
        "missing_per_col": missing_per_col,
        "duplicates": duplicates,
        "classes": list(class_counts.keys()),
        "class_distribution": class_counts,
        "demographics": {
            "age": age_stats,
            "sex": sex_dist,
            "severity": severity_dist
        },
        "vitals_summary": vitals_stats,
        "text_summary": text_stats,
        "validation_status": validation_status
    }
    
    # Save JSON profile
    with open(profile_output, "w") as f:
        json.dump(profile_data, f, indent=2)
    print(f"[DATASET VALIDATOR] Saved dataset profile to {profile_output}")
    
    # Generate Markdown documentation
    markdown_doc = f"""# MEDINTEL Clinical Dataset Documentation

Generated on: `{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}`

## 1. Dataset Overview

- **Dataset Name**: MEDINTEL Clinical Disease Benchmark Dataset
- **Source File**: `{raw_csv_path}`
- **Total Samples**: **{total_samples:,}**
- **Total Features**: **{total_features}**
- **Target Variable**: `condition` ({num_classes} classes)
- **Missing Values**: {missing_values}
- **Duplicates**: {duplicates}

## 2. Validation Status

| Validation Check | Status | Details |
| :--- | :--- | :--- |
"""
    for check in validation_status["checks"]:
        status_icon = "✓ PASSED" if check["passed"] else "✗ FAILED"
        markdown_doc += f"| {check['check']} | `{status_icon}` | {check['details']} |\n"

    markdown_doc += f"""
## 3. Disease Class Distribution

| Disease Condition | Sample Count | Percentage |
| :--- | :--- | :--- |
"""
    for cls_name, count in sorted(class_counts.items(), key=lambda x: x[1], reverse=True):
        pct = (count / total_samples) * 100
        markdown_doc += f"| {cls_name} | {count} | {pct:.1f}% |\n"

    markdown_doc += f"""
## 4. Patient Demographics & Vitals Summary

- **Age**: Mean {age_stats['mean']} ± {age_stats['std']} yrs (Range: {age_stats['min']} - {age_stats['max']} yrs, Median: {age_stats['median']})
- **Biological Sex**: {", ".join([f"{k}: {v}" for k, v in sex_dist.items()])}
- **Severity Levels**: {", ".join([f"{k}: {v}" for k, v in severity_dist.items()])}
- **Clinical Narratives**: Mean length {text_stats['mean_words']} words (Range: {text_stats['min_words']} - {text_stats['max_words']})

### Vital Signs Range:
- **Heart Rate**: Mean {vitals_stats['heart_rate']['mean']} bpm (Min: {vitals_stats['heart_rate']['min']}, Max: {vitals_stats['heart_rate']['max']})
- **Blood Pressure**: Mean {vitals_stats['systolic_bp']['mean']}/{vitals_stats['diastolic_bp']['mean']} mmHg
- **Temperature**: Mean {vitals_stats['temperature']['mean']} °C (Min: {vitals_stats['temperature']['min']}, Max: {vitals_stats['temperature']['max']})
- **SpO2**: Mean {vitals_stats['spo2']['mean']}% (Min: {vitals_stats['spo2']['min']}, Max: {vitals_stats['spo2']['max']}%)
"""

    with open(doc_output, "w", encoding="utf-8") as f:
        f.write(markdown_doc)
    print(f"[DATASET VALIDATOR] Generated dataset documentation at {doc_output}")
    
    return profile_data

if __name__ == "__main__":
    validate_and_profile_dataset()
