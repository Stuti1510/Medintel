"""
MEDINTEL AI - Classical ML & Transformer Inference Tests
"""

import os
import pytest
from ml.inference.classical_inference import ClassicalMLInferenceService
from transformer.inference.biobert_inference import BioBERTInferenceService

def test_classical_ml_inference():
    service = ClassicalMLInferenceService()
    sample_text = "58yo male with crushing substernal chest pain radiating to left arm and jaw, diaphoresis, dyspnea for 3 hours."
    res = service.predict(sample_text, model_name="Logistic Regression", top_k=3)

    assert res["status"] == "SUCCESS"
    assert "predicted_condition" in res
    assert res["confidence"] > 0.5
    assert len(res["top_differentials"]) == 3
    assert res["predicted_condition"] == "Myocardial Infarction"

def test_transformer_inference():
    service = BioBERTInferenceService()
    sample_text = "58yo male with crushing substernal chest pain radiating to left arm and jaw, diaphoresis, dyspnea for 3 hours."
    res = service.predict(sample_text, top_k=3)

    assert res["status"] == "SUCCESS"
    assert res["model_name"] == "BioBERT Clinical Transformer"
    assert res["predicted_condition"] == "Myocardial Infarction"
    assert len(res["tokens"]) > 0
    assert len(res["attention_matrix"]) > 0
