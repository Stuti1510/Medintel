"""
Dataset Validation & Statistics Script for PAD-UFES-20.
Inspects all 2,054 images, labels, and 5 patient-grouped folds.
Outputs verifiable counts for DATASET_REPORT.md.
"""

from pathlib import Path
import json
import numpy as np
import pandas as pd
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = PROJECT_ROOT / "data" / "multimodal" / "manifest.csv"
IMAGES_DIR = PROJECT_ROOT / "data" / "multimodal" / "images"

def main():
    df = pd.read_csv(MANIFEST_PATH)
    print(f"Total rows in manifest: {len(df)}")
    print(f"Unique patient IDs: {df['patient_id'].nunique()}")
    
    # Class distribution
    class_counts = df["diagnostic"].value_counts().to_dict()
    print("Class distribution:", class_counts)
    
    # Verify image files
    missing = []
    corrupted = []
    shapes = []
    
    for idx, row in df.iterrows():
        img_name = row["img_id"]
        img_path = IMAGES_DIR / img_name
        if not img_path.exists():
            missing.append(img_name)
            continue
        try:
            with Image.open(img_path) as im:
                shapes.append(im.size) # (width, height)
        except Exception as e:
            corrupted.append((img_name, str(e)))
            
    print(f"Verified images: {len(shapes)} / {len(df)}")
    print(f"Missing images: {len(missing)}")
    print(f"Corrupted images: {len(corrupted)}")
    
    # Leakage check across folds
    patient_folds = df.groupby("patient_id")["fold"].nunique()
    multi_fold_patients = (patient_folds > 1).sum()
    print(f"Patients appearing across multiple folds: {multi_fold_patients} (0 means zero patient leakage)")
    
    # Fold breakdown table
    fold_table = []
    for f in range(5):
        sub = df[df["fold"] == f]
        c = sub["diagnostic"].value_counts().to_dict()
        fold_table.append({
            "fold": f,
            "total": len(sub),
            "patients": int(sub["patient_id"].nunique()),
            "BCC": c.get("BCC", 0),
            "ACK": c.get("ACK", 0),
            "NEV": c.get("NEV", 0),
            "SEK": c.get("SEK", 0),
        })
        
    print("\nFold Breakdown:")
    print(pd.DataFrame(fold_table))

if __name__ == "__main__":
    main()
