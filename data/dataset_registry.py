"""
MEDINTEL AI - Centralized 4-Dataset Registry & Clinical Benchmark Architecture
Defines the canonical metadata, clinical tasks, feature definitions, and source paths for the 4 real clinical datasets.
"""

from typing import Dict, Any, List
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

DATASET_REGISTRY: Dict[str, Dict[str, Any]] = {
    "cardio_train": {
        "dataset_id": "cardio_train",
        "name": "Cardiovascular Disease Clinical Risk Benchmark",
        "version": "v2.2-4DATA",
        "category": "Cardiovascular Risk",
        "task_type": "Binary Classification",
        "source_path": str(BASE_DIR / "datasets" / "cardio_train.csv"),
        "delimiter": ";",
        "target_column": "cardio",
        "target_classes": ["No Disease (0)", "Cardiovascular Disease (1)"],
        "id_column": "id",
        "numerical_features": ["age_years", "height", "weight", "ap_hi", "ap_lo", "bmi"],
        "categorical_features": ["cholesterol", "gluc"],
        "binary_features": ["gender", "smoke", "alco", "active"],
        "description": "70,000 patient physical examinations profiling blood pressure, serum cholesterol, glucose, and lifestyle factors.",
        "raw_samples": 70000,
        "is_primary": True
    },
    "heart_disease": {
        "dataset_id": "heart_disease",
        "name": "Coronary Heart Disease Diagnostic Assessment",
        "version": "v2.2-4DATA",
        "category": "Cardiology Biometrics",
        "task_type": "Binary Classification",
        "source_path": str(BASE_DIR / "datasets" / "heart.csv"),
        "delimiter": ",",
        "target_column": "target",
        "target_classes": ["No Disease (0)", "Heart Disease Present (1)"],
        "id_column": None,
        "numerical_features": ["age", "trestbps", "chol", "thalach", "oldpeak"],
        "categorical_features": ["cp", "restecg", "slope", "ca", "thal"],
        "binary_features": ["sex", "fbs", "exang"],
        "description": "1,025 clinical biometrics detailing ST depression, resting blood pressure, fluoroscopy vessels, and chest pain type.",
        "raw_samples": 1025,
        "is_primary": False
    },
    "disease_profile": {
        "dataset_id": "disease_profile",
        "name": "Disease Symptom & Patient Profile Benchmark",
        "version": "v2.2-4DATA",
        "category": "Multi-Condition Diagnosis",
        "task_type": "Multi-Class Diagnosis",
        "source_path": str(BASE_DIR / "datasets" / "Disease_symptom_and_patient_profile_dataset.csv"),
        "delimiter": ",",
        "target_column": "Disease",
        "num_classes": 116,
        "id_column": None,
        "numerical_features": ["Age"],
        "categorical_features": ["Blood Pressure", "Cholesterol Level"],
        "binary_features": ["Fever", "Cough", "Fatigue", "Difficulty Breathing", "Gender", "Outcome Variable"],
        "description": "349 multimodal patient profiles across 116 genuine disease entities correlating demographic biometrics, symptoms, and diagnostic outcomes.",
        "raw_samples": 349,
        "is_primary": False
    },
    "symptoms_augmented": {
        "dataset_id": "symptoms_augmented",
        "name": "Comprehensive Multi-Symptom Disease Differential",
        "version": "v2.2-4DATA",
        "category": "High-Dimensional Symptom Differential",
        "task_type": "Multi-Class Disease Classification",
        "source_path": str(BASE_DIR / "datasets" / "Final_Augmented_dataset_Diseases_and_Symptoms.csv"),
        "delimiter": ",",
        "target_column": "diseases",
        "num_classes": 773,
        "id_column": None,
        "description": "246,945 clinical records across 377 symptom indicator features for wide-spectrum disease differential diagnostics across 773 genuine disease classes.",
        "raw_samples": 246945,
        "is_primary": False
    }
}

def get_dataset_config(dataset_id: str = "cardio_train") -> Dict[str, Any]:
    return DATASET_REGISTRY.get(dataset_id, DATASET_REGISTRY["cardio_train"])

def list_all_datasets() -> List[Dict[str, Any]]:
    return list(DATASET_REGISTRY.values())
