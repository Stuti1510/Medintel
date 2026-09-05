"""
MEDINTEL AI - Classical ML & Transformer Inference Tests (4-Dataset Benchmark)
"""

import os
import pytest
from ml.inference.classical_inference import ClassicalMLInferenceService
from transformer.inference.biobert_inference import BioBERTInferenceService

def test_classical_ml_inference():
    service = ClassicalMLInferenceService()
    sample_text = "58yo male presenting with blood pressure 168/105 mmHg, cholesterol above normal, chronic smoker, exertional dyspnea."
    sample_struct = {
        "age": 58, "sex": "Male", "height": 172, "weight": 88, "bmi": 29.7,
        "ap_hi": 168, "ap_lo": 105, "cholesterol": 2, "gluc": 2, "smoke": 1, "alco": 0, "active": 0
    }
    
    valid_classes = {"No Cardiovascular Disease", "Cardiovascular Disease"}
    for model_name in ["Logistic Regression", "Random Forest", "XGBoost"]:
        res = service.predict(sample_text, structured_data=sample_struct, model_name=model_name, top_k=2)
        assert "predicted_condition" in res
        assert res["predicted_condition"] in valid_classes
        assert 0.0 <= res["confidence_score"] <= 1.0
        assert len(res["top_differentials"]) > 0

def test_transformer_inference():
    service = BioBERTInferenceService()
    sample_text = "Patient presenting with acute chest pain, dyspnea, and elevated blood pressure."
    res = service.predict(sample_text, top_k=2)

    assert "predicted_condition" in res
    assert res["model_name"] == "BioBERT Clinical Transformer"
    assert len(res["top_differentials"]) > 0
