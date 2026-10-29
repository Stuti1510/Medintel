"""
MEDINTEL AI - Centralized Dataset Registry & Clinical Benchmark Architecture
Defines the canonical metadata, clinical tasks, feature definitions, and source paths for the Symptom2Disease benchmark.
"""

from typing import Dict, Any, List
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

DISEASE_CLASSES_24 = [
    "Psoriasis",
    "Varicose Veins",
    "Typhoid",
    "Chicken pox",
    "Impetigo",
    "Dengue",
    "Fungal infection",
    "Common Cold",
    "Pneumonia",
    "Dimorphic Hemorrhoids",
    "Arthritis",
    "Acne",
    "Bronchial Asthma",
    "Hypertension",
    "Migraine",
    "Cervical spondylosis",
    "Jaundice",
    "Malaria",
    "urinary tract infection",
    "allergy",
    "gastroesophageal reflux disease",
    "drug reaction",
    "peptic ulcer disease",
    "diabetes"
]

DATASET_REGISTRY: Dict[str, Dict[str, Any]] = {
    "symptom_to_disease": {
        "dataset_id": "symptom_to_disease",
        "name": "Symptom-to-Disease Clinical Benchmark (Symptom2Disease)",
        "version": "v1.0.0",
        "category": "Natural Language Symptom Differential",
        "task_type": "24-Class Multi-Disease Diagnosis",
        "source_path": str(BASE_DIR / "datasets" / "Symptom2Disease.csv"),
        "raw_path": str(BASE_DIR / "data" / "raw" / "Symptom2Disease.csv"),
        "clean_path": str(BASE_DIR / "data" / "cleaned" / "symptom_to_disease_clean.csv"),
        "delimiter": ",",
        "target_column": "label",
        "text_column": "text",
        "target_classes": DISEASE_CLASSES_24,
        "num_classes": 24,
        "id_column": "id",
        "numerical_features": [],
        "categorical_features": [],
        "binary_features": [],
        "text_features": ["text"],
        "description": "1,200 verified clinical cases profiling realistic patient symptom narratives across 24 distinct disease entities (50 cases per condition).",
        "raw_samples": 1200,
        "active_samples": 1200,
        "is_primary": True
    }
}

# Alias for backward-compatibility
DATASET_REGISTRY["Symptom2Disease"] = DATASET_REGISTRY["symptom_to_disease"]
DATASET_REGISTRY["all"] = DATASET_REGISTRY["symptom_to_disease"]

def get_dataset_config(dataset_id: str = "symptom_to_disease") -> Dict[str, Any]:
    return DATASET_REGISTRY.get(dataset_id, DATASET_REGISTRY["symptom_to_disease"])

def list_all_datasets() -> List[Dict[str, Any]]:
    # Return unique datasets (omit aliases)
    return [DATASET_REGISTRY["symptom_to_disease"]]
