"""
MEDINTEL AI - Phase 15 Database Persistence & Relational Schema Test Suite
"""

import os
import uuid
import pytest
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from backend.app.database.session import SessionLocal
from backend.app.models.entities import (
    Base, AIModel, ModelMetric, PatientCase, Prediction,
    PredictionProbability, RetrievalResult, LLMInteraction, SafetyEvent, User
)
from backend.app.services.clinical_orchestrator import ClinicalAnalysisOrchestrator

@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_1_tables_present(db_session: Session):
    tables = list(Base.metadata.tables.keys())
    expected_tables = [
        "users", "models", "model_metrics", "patient_cases",
        "predictions", "prediction_probabilities", "retrieval_results",
        "llm_interactions", "safety_events", "experiments"
    ]
    for tbl in expected_tables:
        assert tbl in tables, f"Missing table: {tbl}"

def test_2_model_registry_and_metrics_persisted(db_session: Session):
    models = db_session.query(AIModel).all()
    assert len(models) >= 3, "AIModel table should contain registered models"
    
    for m in models:
        assert m.name is not None
        assert m.type is not None

def test_3_end_to_end_case_persistence_and_retrieval(db_session: Session):
    orchestrator = ClinicalAnalysisOrchestrator()
    case_ref = f"CASE-{uuid.uuid4().hex[:8].upper()}"
    
    payload = {
        "case_reference": case_ref,
        "age": 63,
        "sex": "Male",
        "symptoms": "High fever, elevated blood glucose, confusion, low blood pressure",
        "clinical_narrative": "63-year-old male with acute presentation and physiological decompensation.",
        "duration": "1 day",
        "severity": "Severe",
        "medical_history": "Hypertension",
        "current_medications": "Amlodipine 5mg",
        "selected_ml_model": "Random Forest",
        "vitals": {
            "heart_rate": 115,
            "systolic_bp": 95,
            "diastolic_bp": 60,
            "temperature": 39.4,
            "spo2": 94
        }
    }
    
    # Execute full pipeline
    result = orchestrator.analyze(payload)
    assert result["database_persisted"] is True
    assert "concordance" in result
    assert "llm_explanation" in result
    
    # Verify in Database
    saved_case = db_session.query(PatientCase).filter(PatientCase.case_reference == result["case_id"]).first()
    assert saved_case is not None
    assert saved_case.age == 63
    assert saved_case.sex == "Male"
    
    # Check predictions recorded
    preds = db_session.query(Prediction).filter(Prediction.case_id == saved_case.id).all()
    assert len(preds) >= 1
    
    # Check probabilities recorded
    probs = db_session.query(PredictionProbability).filter(PredictionProbability.prediction_id.in_([p.id for p in preds])).all()
    assert len(probs) >= 1
    
    # Check LLM explanation recorded
    llm_rec = db_session.query(LLMInteraction).filter(LLMInteraction.case_id == saved_case.id).first()
    assert llm_rec is not None
    assert len(llm_rec.llm_response) > 100
    
    # Check RAG retrievals recorded
    retrieval_recs = db_session.query(RetrievalResult).filter(RetrievalResult.case_id == saved_case.id).all()
    assert len(retrieval_recs) >= 1

if __name__ == "__main__":
    db = SessionLocal()
    test_1_tables_present(db)
    test_2_model_registry_and_metrics_persisted(db)
    test_3_end_to_end_case_persistence_and_retrieval(db)
    print("Database persistence tests completed successfully.")
