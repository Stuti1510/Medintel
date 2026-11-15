"""
Dataset validator for pad_ufes_20_4class.
Verifies:
1. Exactly 4 classes (BCC, ACK, NEV, SEK)
2. Every fold contains all 4 classes
3. No patient_id crosses folds (zero leakage)
4. No narrative contains any diagnosis words
"""

import os
import sys
import re
import pandas as pd

if "." not in sys.path:
    sys.path.insert(0, ".")

from data.dataset_registry import get_dataset_info

FORBIDDEN_WORDS = [
    r"\bbcc\b", r"\back\b", r"\bnev\b", r"\bsek\b",
    r"\bbasal\b", r"\bactinic\b", r"\bkeratosis\b", r"\bnevus\b", r"\bnevi\b",
    r"\bcarcinoma\b", r"\bseborrheic\b", r"\bmelanoma\b", r"\bscc\b"
]

def validate_manifest(manifest_path: str = "data/multimodal/manifest.csv") -> dict:
    if not os.path.exists(manifest_path):
        return {"status": "error", "message": f"Manifest file not found: {manifest_path}"}
        
    df = pd.read_csv(manifest_path)
    info = get_dataset_info("pad_ufes_20_4class")
    expected_classes = set(info["classes"])
    
    # Check classes
    present_classes = set(df["diagnostic"].unique())
    if present_classes != expected_classes:
        return {
            "status": "error",
            "message": f"Expected classes {expected_classes}, found {present_classes}"
        }
        
    # Check folds & leakage
    folds = sorted(df["fold"].unique())
    if len(folds) != 5:
        return {"status": "error", "message": f"Expected 5 folds, found {len(folds)}"}
        
    for f in folds:
        fold_df = df[df["fold"] == f]
        # All classes in fold
        if set(fold_df["diagnostic"].unique()) != expected_classes:
            return {"status": "error", "message": f"Fold {f} missing classes: {set(fold_df['diagnostic'].unique())}"}
        # Check leakage
        other_patients = set(df[df["fold"] != f]["patient_id"])
        fold_patients = set(fold_df["patient_id"])
        leak = fold_patients.intersection(other_patients)
        if len(leak) > 0:
            return {"status": "error", "message": f"Patient leakage in fold {f}: {leak}"}
            
    # Check narratives
    for pat in FORBIDDEN_WORDS:
        leaks = df[df["narrative"].str.contains(pat, case=False, regex=True)]
        if len(leaks) > 0:
            return {"status": "error", "message": f"Diagnosis leak '{pat}' found in {len(leaks)} narratives!"}
            
    return {
        "status": "valid",
        "total_samples": len(df),
        "classes": list(expected_classes),
        "num_folds": len(folds),
        "patients_count": int(df["patient_id"].nunique())
    }

if __name__ == "__main__":
    res = validate_manifest()
    print("Validation result:", res)
