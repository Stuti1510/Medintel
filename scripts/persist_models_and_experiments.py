"""
MEDINTEL AI - Phase 15: Empirical Database Persistence
Persists trained models, real test-set metrics, experiment runs, and end-to-end predictions into DB.
"""

import os
import sys
import json
import uuid
from datetime import datetime

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database.session import SessionLocal
from backend.app.models.entities import (
    AIModel, ModelMetric, Experiment, PatientCase, Prediction,
    PredictionProbability, RetrievalResult, LLMInteraction, SafetyEvent, Dataset
)
from backend.app.services.clinical_orchestrator import ClinicalAnalysisOrchestrator

def persist_empirical_results():
    print("=" * 60)
    print("PHASE 15: DATABASE PERSISTENCE FOR TRAINED MODELS & METRICS")
    print("=" * 60)

    db = SessionLocal()
    try:
        # Load empirical evaluation results
        eval_path = "evaluation/synthetic_classical_ml_results.json"
        if not os.path.exists(eval_path):
            raise FileNotFoundError(f"Empirical evaluation results missing at {eval_path}")

        with open(eval_path, "r") as f:
            eval_results = json.load(f)

        dataset = db.query(Dataset).filter(Dataset.name == "synthetic_clinical_dataset").first()
        dataset_id = dataset.id if dataset else None

        persisted_models = []

        for model_name, metrics in eval_results.items():
            # 1. Models table
            model_record = db.query(AIModel).filter(AIModel.name == model_name).first()
            if not model_record:
                model_record = AIModel(
                    name=model_name,
                    type="Classical ML",
                    version="v1.0.0",
                    dataset="synthetic_clinical_dataset",
                    dataset_version="v1.0",
                    dataset_id=dataset_id,
                    status="READY",
                    model_path=os.path.join("models/classical", metrics["filename"])
                )
                db.add(model_record)
                db.commit()
                db.refresh(model_record)
                print(f"Inserted model record: {model_name} (ID: {model_record.id})")
            else:
                model_record.status = "READY"
                model_record.dataset_id = dataset_id
                model_record.model_path = os.path.join("models/classical", metrics["filename"])
                db.commit()
                db.refresh(model_record)
                print(f"Updated existing model record: {model_name} (ID: {model_record.id})")

            # 2. Model Metrics table
            metric_record = db.query(ModelMetric).filter(ModelMetric.model_id == model_record.id).first()
            if not metric_record:
                metric_record = ModelMetric(
                    model_id=model_record.id,
                    accuracy=metrics["accuracy"],
                    precision=metrics["precision_macro"],
                    recall=metrics["recall_macro"],
                    f1=metrics["f1_macro"],
                    macro_f1=metrics["f1_macro"],
                    weighted_f1=metrics["f1_weighted"],
                    roc_auc=metrics.get("roc_auc"),
                    evaluation_date=datetime.utcnow()
                )
                db.add(metric_record)
                db.commit()
                print(f"  -> Persisted model metrics for {model_name} (Accuracy: {metrics['accuracy']}, Macro F1: {metrics['f1_macro']})")
            else:
                metric_record.accuracy = metrics["accuracy"]
                metric_record.precision = metrics["precision_macro"]
                metric_record.recall = metrics["recall_macro"]
                metric_record.f1 = metrics["f1_macro"]
                metric_record.macro_f1 = metrics["f1_macro"]
                metric_record.weighted_f1 = metrics["f1_weighted"]
                metric_record.roc_auc = metrics.get("roc_auc")
                metric_record.evaluation_date = datetime.utcnow()
                db.commit()
                print(f"  -> Updated model metrics for {model_name}")

            # 3. Experiments table
            exp_name = f"EXP-SYNTHETIC-{model_name.upper().replace(' ', '_')}"
            exp_record = db.query(Experiment).filter(Experiment.experiment_name == exp_name).first()
            if not exp_record:
                exp_record = Experiment(
                    experiment_name=exp_name,
                    model_id=model_record.id,
                    dataset_name="synthetic_clinical_dataset",
                    dataset_version="v1.0",
                    dataset_id=dataset_id,
                    train_samples=7000,
                    validation_samples=1500,
                    test_samples=1500,
                    inference_time=metrics.get("inference_latency_ms", 0.0),
                    created_at=datetime.utcnow()
                )
                db.add(exp_record)
                db.commit()
                print(f"  -> Persisted experiment run: {exp_name}")

            persisted_models.append(model_record.name)

        # 4. End-to-End Case Inference & Database Persistence Verification
        print("\n--- Running End-to-End Clinical Case Analysis Persistence Test ---")
        orchestrator = ClinicalAnalysisOrchestrator()
        test_case_ref = f"MEDINTEL-P15-{uuid.uuid4().hex[:6].upper()}"
        
        payload = {
            "case_reference": test_case_ref,
            "age": 67,
            "sex": "Female",
            "symptoms": "High fever (39.2C), severe productive cough with purulent sputum, pleuritic chest pain, dyspnea",
            "clinical_narrative": "67-year-old female presents with acute respiratory decompensation and fever.",
            "duration": "3 days",
            "severity": "Severe",
            "medical_history": "Type 2 Diabetes, Hypertension",
            "current_medications": "Metformin 500mg, Lisinopril 10mg",
            "selected_ml_model": "Random Forest",
            "vitals": {
                "heart_rate": 108,
                "systolic_bp": 105,
                "diastolic_bp": 68,
                "temperature": 39.2,
                "spo2": 91
            }
        }

        result = orchestrator.analyze(payload)
        assert result.get("database_persisted") is True, "Orchestrator failed to persist case to DB."

        # Verify querying back from DB
        saved_case = db.query(PatientCase).filter(PatientCase.case_reference == test_case_ref).first()
        assert saved_case is not None, f"Case {test_case_ref} not found in patient_cases table"
        print(f"Verified patient_cases table record: ID={saved_case.id}, Reference={saved_case.case_reference}")

        saved_preds = db.query(Prediction).filter(Prediction.case_id == saved_case.id).all()
        assert len(saved_preds) > 0, "No predictions recorded for patient case"
        print(f"Verified predictions table records: {len(saved_preds)} prediction entries logged.")

        saved_rag = db.query(RetrievalResult).filter(RetrievalResult.case_id == saved_case.id).all()
        print(f"Verified retrieval_results table records: {len(saved_rag)} evidence entries logged.")

        saved_llm = db.query(LLMInteraction).filter(LLMInteraction.case_id == saved_case.id).first()
        assert saved_llm is not None, "No LLM interaction recorded"
        print(f"Verified llm_interactions table record: {len(saved_llm.llm_response)} characters saved.")

        print("\n" + "=" * 60)
        print("PHASE 15 COMPLETE: Database writes verified end-to-end.")
        print("=" * 60)

    finally:
        db.close()

if __name__ == "__main__":
    persist_empirical_results()
