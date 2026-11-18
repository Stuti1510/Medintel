"""
Model Evaluation and Research Results API Endpoints.
Serves experiment benchmarks E1 to E8 and dataset summary statistics.
Uses memory caching keyed by file modification time so repeat calls return in < 5ms.
Never returns 500 on missing files; returns {"rows": [], "status": "not_run"}.
"""

from fastapi import APIRouter
from pathlib import Path
import os
import pandas as pd
import numpy as np
from typing import Dict, Tuple, List, Any

router = APIRouter()

PROJECT_ROOT = Path(__file__).resolve().parents[4]
REPORTS_DIR = PROJECT_ROOT / "reports" / "multimodal"
MANIFEST_PATH = PROJECT_ROOT / "data" / "multimodal" / "manifest.csv"

EXP_FILE_MAP = {
    "e1": "e1_enhancement.csv",
    "e3": "e3_main.csv",
    "e4": "e4_robustness.csv",
    "e5": "e5_text.csv",
    "e6": "e6_xai.csv",
    "e7": "e7_ablation.csv",
    "e8": "e8_real_lowq.csv"
}

# In-memory CSV cache: filepath -> (mtime, rows)
_CSV_CACHE: Dict[str, Tuple[float, List[Dict[str, Any]]]] = {}
_SUMMARY_CACHE: Tuple[float, Dict[str, Any]] = (0.0, {})

def get_cached_csv_rows(csv_path: Path) -> List[Dict[str, Any]]:
    mtime = csv_path.stat().st_mtime
    key = str(csv_path.resolve())
    if key in _CSV_CACHE:
        cached_mtime, cached_rows = _CSV_CACHE[key]
        if cached_mtime == mtime:
            return cached_rows
            
    df = pd.read_csv(csv_path)
    df = df.replace({np.nan: None})
    rows = df.to_dict(orient="records")
    _CSV_CACHE[key] = (mtime, rows)
    return rows

@router.get("/results/{exp_id}")
def get_experiment_results(exp_id: str):
    """
    Returns CSV benchmark rows for experiment exp_id in JSON format.
    Cached in-memory for sub-millisecond repeated lookups.
    If the experiment has not been run, returns status: 'not_run' with empty rows.
    """
    exp_id = exp_id.lower().strip()
    if exp_id not in EXP_FILE_MAP:
        return {"rows": [], "status": "invalid_experiment_id", "message": f"Unknown experiment ID '{exp_id}'."}
        
    file_name = EXP_FILE_MAP[exp_id]
    csv_path = REPORTS_DIR / file_name
    
    if not csv_path.exists():
        return {"rows": [], "status": "not_run", "message": f"Experiment {exp_id.upper()} has not been run yet."}
        
    try:
        rows = get_cached_csv_rows(csv_path)
        return {"rows": rows, "status": "success", "count": len(rows)}
    except Exception as e:
        return {"rows": [], "status": "error", "message": str(e)}

@router.get("/dataset/summary")
def get_dataset_summary():
    """
    Returns PAD-UFES-20 dataset summary:
    - class counts
    - fold distribution
    - sharpness (Laplacian variance) histogram
    - brightness histogram
    Cached in-memory against manifest mtime.
    """
    global _SUMMARY_CACHE
    if not MANIFEST_PATH.exists():
        return {"status": "not_run", "message": "Manifest has not been generated yet."}
        
    try:
        mtime = MANIFEST_PATH.stat().st_mtime
        if _SUMMARY_CACHE[0] == mtime and _SUMMARY_CACHE[1]:
            return _SUMMARY_CACHE[1]
            
        df = pd.read_csv(MANIFEST_PATH)
        
        # 1. Class counts
        class_counts = df["diagnostic"].value_counts().to_dict()
        
        # 2. Fold distribution by class
        fold_dist = []
        for f in sorted(df["fold"].unique()):
            sub = df[df["fold"] == f]
            counts = sub["diagnostic"].value_counts().to_dict()
            fold_dist.append({
                "fold": f"Fold {f}",
                "BCC": counts.get("BCC", 0),
                "ACK": counts.get("ACK", 0),
                "NEV": counts.get("NEV", 0),
                "SEK": counts.get("SEK", 0),
                "total": len(sub)
            })
            
        # 3. Histograms
        # Sharpness histogram (10 bins)
        blur_vals = df["blur_laplacian_var"].dropna().values
        blur_hist, blur_bins = np.histogram(blur_vals, bins=10)
        sharpness_histogram = [
            {"bin": f"{int(blur_bins[i])}-{int(blur_bins[i+1])}", "count": int(blur_hist[i])}
            for i in range(len(blur_hist))
        ]
        
        # Brightness histogram (10 bins)
        bright_vals = df["brightness_mean"].dropna().values
        bright_hist, bright_bins = np.histogram(bright_vals, bins=10)
        brightness_histogram = [
            {"bin": f"{int(bright_bins[i])}-{int(bright_bins[i+1])}", "count": int(bright_hist[i])}
            for i in range(len(bright_hist))
        ]
        
        result = {
            "status": "success",
            "total_samples": len(df),
            "num_patients": int(df["patient_id"].nunique()),
            "classes": class_counts,
            "folds": fold_dist,
            "sharpness_histogram": sharpness_histogram,
            "brightness_histogram": brightness_histogram
        }
        _SUMMARY_CACHE = (mtime, result)
        return result
    except Exception as e:
        return {"status": "error", "message": str(e)}
