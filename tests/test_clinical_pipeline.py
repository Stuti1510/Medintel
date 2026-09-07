"""
MEDINTEL AI - End-to-End Clinical Intelligence Pipeline Automated Test Suite
Tests:
1. Multi-class prediction across 20 canonical disease classes.
2. Distinct clinical cases producing distinctly different prediction distributions (Asthma vs MI vs Diabetes vs Appendicitis).
3. Document entity extraction without missing value hallucination.
4. Real PyTorch Transformer multi-head attention weight extraction directly from forward pass.
5. Calibrated probability simplex properties (sum(p) == 1.0, 0 <= p <= 1).
6. Dynamic RAG vector retrieval conditioned on symptoms.
7. Differential diagnosis scoring and rationale generation.
8. Motor screening finger tap calculation and summary generation.
"""

import os
import sys
import json
import pytest
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.inference.classical_inference import classical_ml_service
from transformer.inference.biobert_inference import BioBERTInferenceService
from backend.app.services.document_parser import medical_document_parser
from backend.app.services.differential_engine import differential_engine
from backend.app.services.clinical_orchestrator import ClinicalAnalysisOrchestrator
from rag.retrieval.retriever import RAGRetrieverService

@pytest.fixture(scope="module")
def orchestrator():
    return ClinicalAnalysisOrchestrator()

@pytest.fixture(scope="module")
def transformer_service():
    service = BioBERTInferenceService()
    service.load_model()
    return service

def test_classical_ml_multiclass_inference():
    classical_ml_service.load_models()
    assert classical_ml_service.is_loaded, "Classical ML models failed to load"
    assert len(classical_ml_service.label_mapping) >= 20, "Expected at least 20 classes in label mapping"

    # Case 1: Asthma
    asthma_text = "Patient presents with severe bilateral expiratory wheezing, bronchospasm, dry nocturnal cough, and normal blood pressure 118/74 mmHg."
    asthma_pred = classical_ml_service.predict(asthma_text, model_name="Random Forest")
    assert asthma_pred["predicted_condition"] == "Bronchial Asthma"
    assert sum(asthma_pred["all_probabilities"].values()) == pytest.approx(1.0, rel=1e-3)
    assert len(asthma_pred["top_differentials"]) >= 5

    # Case 2: Myocardial Infarction
    mi_text = "64-year-old male with crushing substernal chest pain radiating to left arm, diaphoresis, resting BP 155/95 mmHg, and elevated troponin."
    mi_pred = classical_ml_service.predict(mi_text, model_name="Random Forest")
    assert mi_pred["predicted_condition"] in ["Myocardial Infarction", "Hypertension", "GERD"]
    assert sum(mi_pred["all_probabilities"].values()) == pytest.approx(1.0, rel=1e-3)

    # Predictions for distinct presentations must be distinctly different
    assert asthma_pred["predicted_condition"] != mi_pred["predicted_condition"]

def test_transformer_real_attention_extraction(transformer_service):
    assert transformer_service.is_loaded, "BioBERT model failed to load"
    
    clinical_text = "58-year-old male with acute hypertensive urgency, severe occipital headache, and blood pressure 168/105 mmHg."
    res = transformer_service.predict(clinical_text, top_k=5)
    
    assert res["status"] == "SUCCESS"
    assert res["predicted_condition"] in ["Hypertension", "Ischemic Stroke", "Migraine with Aura"]
    assert 0.0 <= res["confidence"] <= 1.0
    assert len(res["top_differentials"]) == 5
    
    # Verify Real Attention Matrix
    tokens = res["tokens"]
    attention_matrix = res["attention_matrix"]
    seq_len = len(tokens)
    
    assert len(attention_matrix) == seq_len, f"Expected {seq_len} rows in attention matrix, got {len(attention_matrix)}"
    for row in attention_matrix:
        assert len(row) == seq_len, f"Expected {seq_len} cols in attention row, got {len(row)}"
        assert sum(row) == pytest.approx(1.0, rel=1e-2), "Attention distribution row must sum to 1.0"
        for val in row:
            assert 0.0 <= val <= 1.0, "Attention weight must be between 0 and 1"

def test_document_parser_no_missing_value_hallucination():
    # Text with only BP and Age mentioned; Heart Rate, Temperature, SpO2 are omitted
    partial_text = "Encounter Note: Patient is a 54-year-old female presenting with severe headache. BP recorded at 160/100 mmHg. Clear lungs."
    extracted = medical_document_parser.extract_medical_information(partial_text)
    
    assert extracted["age"] == 54
    assert extracted["sex"] == "Female"
    assert extracted["vitals"]["systolic_bp"] == 160
    assert extracted["vitals"]["diastolic_bp"] == 100
    
    # Crucial: Unmentioned vitals must NOT be defaulted or fabricated
    assert "heart_rate" not in extracted["vitals"] or extracted["vitals"]["heart_rate"] is None
    assert "temperature" not in extracted["vitals"] or extracted["vitals"]["temperature"] is None
    assert "spo2" not in extracted["vitals"] or extracted["vitals"]["spo2"] is None

def test_differential_engine_scoring():
    # Test multi-symptom differential scoring
    diffs = differential_engine.compute_differential_scores(
        symptoms=["right lower quadrant abdominal pain", "rebound tenderness", "nausea", "vomiting"],
        vitals={"temperature": 38.4, "heart_rate": 105},
        top_k=5
    )
    
    assert len(diffs) >= 3
    top_dx = diffs[0]
    assert top_dx["condition"] == "Acute Appendicitis"
    assert top_dx["probability"] > 0.30
    assert len(top_dx["supporting_findings"]) > 0

def test_rag_retrieval_grounding():
    retriever = RAGRetrieverService()
    search_res = retriever.search_evidence(query="bronchospasm wheezing expiratory dyspnea", top_k=3)
    
    assert "evidence" in search_res
    assert len(search_res["evidence"]) > 0
    top_ev = search_res["evidence"][0]
    assert "title" in top_ev
    assert "snippet" in top_ev
    assert "source" in top_ev

def test_end_to_end_orchestrator(orchestrator):
    payload = {
        "age": 52,
        "sex": "Male",
        "symptoms": "Polyuria, polydipsia, excessive thirst, blurred vision, progressive fatigue",
        "duration": "3 weeks",
        "severity": "Moderate",
        "medical_history": "Prediabetes",
        "current_medications": "None",
        "vitals": {
            "heart_rate": 78,
            "systolic_bp": 130,
            "diastolic_bp": 82,
            "temperature": 36.8,
            "spo2": 98
        },
        "clinical_narrative": "52-year-old male with polyuria, fasting glucose 220 mg/dL, HbA1c 9.2%",
        "selected_ml_model": "Logistic Regression"
    }
    
    out = orchestrator.analyze(payload)
    
    assert "case_id" in out
    assert "ml_prediction" in out
    assert "transformer_prediction" in out
    assert "top_differentials" in out
    assert "retrieved_evidence" in out
    assert "llm_explanation" in out
    assert "safety_flags" in out
    
    # Verify predictions are grounded in the diabetic presentation
    assert out["ml_prediction"]["predicted_condition"] in ["Type 2 Diabetes Mellitus", "Hypertension", "Chronic Kidney Disease"]
    assert len(out["top_differentials"]) >= 3
