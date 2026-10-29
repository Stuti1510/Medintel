"""
MEDINTEL AI - Global Disease Registry & Class Distribution Builder
Inspects the Symptom2Disease benchmark dataset, extracts the 24 canonical disease classes,
calculates exact counts, percentages, stratified train/val/test splits, and saves disease_registry.json.
"""

import os
import json
import pandas as pd
from typing import Dict, Any, List

def build_global_disease_registry():
    output_dir = "data/processed"
    os.makedirs(output_dir, exist_ok=True)
    
    registry = {
        "datasets": {},
        "unified_disease_classes": [],
        "cross_dataset_matrix": [],
        "total_unique_disease_entities": 24,
        "summary_by_dataset": {},
        "total_active_clinical_records": 1200,
        "total_raw_clinical_records": 1200
    }
    
    csv_path = "datasets/Symptom2Disease.csv"
    if not os.path.exists(csv_path):
        csv_path = "data/raw/symptom_to_disease_raw.csv"
        
    df = pd.read_csv(csv_path)
    label_col = "label" if "label" in df.columns else "condition"
    total_records = len(df)
    counts = df[label_col].value_counts()
    
    unified_list = []
    cross_matrix = []
    
    for disease_name, count in counts.items():
        disease_str = str(disease_name).strip()
        train_c = int(round(count * 0.70))
        val_c = int(round(count * 0.15))
        test_c = count - train_c - val_c
        
        disease_info = {
            "disease_name": disease_str,
            "standardized_label": disease_str,
            "clinical_meaning": f"Clinical symptom presentation for {disease_str}",
            "raw_records": int(count),
            "active_records": int(count),
            "records_removed": 0,
            "reduction_pct": 0.0,
            "percentage": round(count / total_records * 100, 2),
            "active_percentage": round(count / total_records * 100, 2),
            "train_count": train_c,
            "val_count": val_c,
            "test_count": test_c,
            "source_datasets": ["Symptom2Disease"],
            "dataset_breakdown": {"symptom_to_disease": int(count)}
        }
        unified_list.append(disease_info)
        
        cross_matrix.append({
            "name": disease_str,
            "raw": int(count),
            "active": int(count),
            "train": train_c,
            "val": val_c,
            "test": test_c,
            "symptom_to_disease": int(count),
            "removed": 0,
            "reduction_pct": 0.0,
            "sources": ["Symptom2Disease"]
        })
        
    registry["unified_disease_classes"] = unified_list
    registry["cross_dataset_matrix"] = cross_matrix
    registry["total_unique_disease_entities"] = len(unified_list)
    
    registry["datasets"]["symptom_to_disease"] = {
        "name": "Symptom-to-Disease Clinical Benchmark (Symptom2Disease)",
        "source_path": csv_path,
        "task_type": "24-Class Multi-Disease Diagnosis",
        "target_column": label_col,
        "num_classes": len(unified_list),
        "total_records": total_records,
        "raw_records": total_records,
        "active_records": total_records,
        "classes": unified_list
    }
    
    registry["summary_by_dataset"] = {
        "all": {
            "name": "All Datasets (Symptom2Disease Master Scope)",
            "classes": len(unified_list),
            "raw_records": total_records,
            "active_records": total_records,
            "train_records": sum(d["train_count"] for d in unified_list),
            "val_records": sum(d["val_count"] for d in unified_list),
            "test_records": sum(d["test_count"] for d in unified_list),
            "target": "Unified Clinical Diagnosis (label)"
        },
        "symptom_to_disease": {
            "name": "Symptom-to-Disease Clinical Benchmark",
            "classes": len(unified_list),
            "raw_records": total_records,
            "active_records": total_records,
            "train_records": sum(d["train_count"] for d in unified_list),
            "val_records": sum(d["val_count"] for d in unified_list),
            "test_records": sum(d["test_count"] for d in unified_list),
            "target": label_col
        }
    }
    
    reg_path = os.path.join(output_dir, "disease_registry.json")
    with open(reg_path, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2)
        
    print(f"[DISEASE REGISTRY] Built registry for {len(unified_list)} conditions across {total_records} cases.")
    return registry

if __name__ == "__main__":
    build_global_disease_registry()
