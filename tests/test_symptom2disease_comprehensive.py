"""
MEDINTEL AI - Comprehensive Symptom2Disease Test Suite
Thoroughly tests:
1. Dataset schema validation & integrity
2. Missing, malformed, and whitespace text handling
3. Label mapping and 24-class count verification
4. Duplicate and conflicting-label audit validation
5. Train/Val/Test zero duplicate text leakage prevention
6. Model artifact integrity and pipeline loading
7. Valid symptom presentation prediction across models
8. Empty and invalid input error handling
9. Output constraint: predictions restricted strictly to the 24 classes
10. Fallback and model-not-found resilience
11. Dataset metadata & disease list endpoint schemas
12. API response structure compatibility
13. Medical safety disclaimer & low-confidence abstention
"""

import os
import json
import pytest
import pandas as pd
import numpy as np

from ml.inference.classical_inference import ClassicalMLInferenceService
from transformer.inference.biobert_inference import BioBERTInferenceService
from data.dataset_registry import DATASET_REGISTRY, DISEASE_CLASSES_24
from data.preprocess import clean_clinical_text

@pytest.fixture
def clean_df():
    path = "data/cleaned/symptom_to_disease_clean.csv"
    assert os.path.exists(path), f"Clean dataset not found at {path}"
    return pd.read_csv(path)

@pytest.fixture
def partitions():
    train_df = pd.read_csv("data/processed/train.csv")
    val_df = pd.read_csv("data/processed/val.csv")
    test_df = pd.read_csv("data/processed/test.csv")
    return train_df, val_df, test_df

@pytest.fixture
def classical_service():
    service = ClassicalMLInferenceService()
    assert service.is_loaded
    return service

# 1. Dataset schema validation
def test_dataset_schema_and_types(clean_df):
    assert "label" in clean_df.columns
    assert "text" in clean_df.columns
    assert len(clean_df) == 1200
    assert clean_df["label"].dtype == object
    assert clean_df["text"].dtype == object

# 2. Missing and malformed text handling
def test_missing_and_malformed_text(classical_service):
    with pytest.raises(ValueError):
        classical_service.predict(None)

    with pytest.raises(ValueError):
        classical_service.predict("")

    with pytest.raises(ValueError):
        classical_service.predict("   ")

    with pytest.raises(ValueError):
        classical_service.predict("ab")  # Too short

    # Numeric input converted safely or handled
    res = classical_service.predict("12345 symptom description with pain")
    assert "predicted_condition" in res

# 3. Label mapping and 24-class count
def test_label_mapping_and_classes():
    map_path = "data/processed/label_mapping.json"
    assert os.path.exists(map_path)
    with open(map_path, "r", encoding="utf-8") as f:
        mapping = json.load(f)
    assert len(mapping) == 24
    unique_classes = set(mapping.values())
    assert len(unique_classes) == 24
    assert set(DISEASE_CLASSES_24) == unique_classes

# 4. Duplicate and conflicting-label detection
def test_duplicate_audit_no_label_conflicts(clean_df):
    dup_mask = clean_df.duplicated(subset=["text"], keep=False)
    dup_df = clean_df[dup_mask]
    assert len(dup_df) == 90  # 90 rows total
    assert dup_df["text"].nunique() == 43  # 43 unique texts (47 duplicates)
    
    # 0 conflicting labels
    for text_val, group in dup_df.groupby("text"):
        assert group["label"].nunique() == 1, f"Conflicting label detected for: {text_val}"

# 5. Prevention of train/test leakage
def test_train_val_test_zero_leakage(partitions):
    train_df, val_df, test_df = partitions
    assert len(train_df) == 840
    assert len(val_df) == 180
    assert len(test_df) == 180
    
    tr_texts = set(train_df["text"])
    va_texts = set(val_df["text"])
    te_texts = set(test_df["text"])
    
    assert len(tr_texts & va_texts) == 0, "Train-Val duplicate text leakage!"
    assert len(tr_texts & te_texts) == 0, "Train-Test duplicate text leakage!"
    assert len(va_texts & te_texts) == 0, "Val-Test duplicate text leakage!"

# 6. Successful model training and artifact loading
def test_artifact_loading():
    models_dir = "models/classical"
    for artifact in [
        "feature_pipeline.joblib",
        "label_encoder.joblib",
        "logistic_regression.joblib",
        "linear_svm.joblib",
        "random_forest.joblib",
        "xgboost.joblib"
    ]:
        p = os.path.join(models_dir, artifact)
        assert os.path.exists(p), f"Artifact missing: {p}"

# 7. Valid symptom description prediction
def test_valid_symptom_prediction(classical_service):
    query = "I have a sudden rash on my legs that is causing a lot of discomforts. It seems there is a cramp and I can see prominent veins on the calf."
    res = classical_service.predict(query, model_name="Logistic Regression")
    assert res["predicted_condition"] == "Varicose Veins"
    assert res["confidence"] > 0.40
    assert len(res["top_differentials"]) == 5
    assert sum(res["all_probabilities"].values()) == pytest.approx(1.0, rel=1e-3)

# 8. Prediction strictly restricted to 24 supported labels
def test_predictions_strictly_in_24_classes(classical_service):
    test_cases = [
        "High fever, chills, intense sweating, severe headache, nausea and muscle pain",
        "Red itchy patches on elbows and scalp with silver flaking scales",
        "Stomach pain, heartburn, acid regurgitation, bloating after eating",
        "Frequent urination, excessive thirst, increased appetite, and unexplained weight loss"
    ]
    for text in test_cases:
        res = classical_service.predict(text)
        assert res["predicted_condition"] in DISEASE_CLASSES_24

# 9. Model-not-found resilience
def test_fallback_on_unknown_model_name(classical_service):
    res = classical_service.predict(
        "Severe pain in joints and swelling",
        model_name="NonExistentModel123"
    )
    assert "predicted_condition" in res
    assert res["predicted_condition"] in DISEASE_CLASSES_24

# 10. Medical safety & low-confidence abstention
def test_medical_safety_and_abstention(classical_service):
    # Nonsense / out of distribution text
    vague_text = "lorem ipsum dolor sit amet consectetur"
    res = classical_service.predict(vague_text)
    assert "clinical_caveat" in res
    assert "abstention_recommended" in res
    # Vague text should trigger low confidence or non-specific caveat
    assert res["confidence"] < 0.35

# 11. Dataset metadata structure
def test_dataset_registry_metadata():
    assert "symptom_to_disease" in DATASET_REGISTRY
    meta = DATASET_REGISTRY["symptom_to_disease"]
    assert meta["num_classes"] == 24
    assert meta["raw_samples"] == 1200
    assert meta["text_features"] == ["text"]
    assert len(meta["numerical_features"]) == 0

# 12. Regression Test: XGBoost dense representation pipeline
def test_xgboost_dense_vector_inference(classical_service):
    """Ensures XGBoost receives dense representations so predictions span the full 24-class space."""
    res = classical_service.predict(
        "I have high fever, chills, and shivering with severe headache",
        model_name="XGBoost"
    )
    assert res["model_name"] == "XGBoost"
    assert res["predicted_condition"] in DISEASE_CLASSES_24
    assert res["confidence"] > 0.05
    assert len(res["all_probabilities"]) == 24
    assert sum(res["all_probabilities"].values()) == pytest.approx(1.0, rel=1e-3)

# 13. Regression Test: Abstention behavior and distribution bounds
def test_abstention_behavior_and_distribution_bounds(classical_service):
    """Verifies that canonical symptoms have high confidence while uninformative text yields lower confidence."""
    # Canonical presentation
    canonical = "I have developed high fever with severe chills, shivering, and body pain"
    res_canon = classical_service.predict(canonical, model_name="Linear SVM")
    assert res_canon["confidence"] >= 0.20
    assert not res_canon["abstention_recommended"]

    # Gibberish / non-medical input
    gibberish = "xyz abc 12345 !@#$%^&*()_+"
    res_gib = classical_service.predict(gibberish, model_name="Linear SVM")
    # Should flag abstention when confidence drops below threshold
    assert res_gib["confidence"] < 0.20


