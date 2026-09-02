"""
MEDINTEL AI - Models, Datasets, Evaluation, History & System Status Endpoints
"""

import os
import json
import pandas as pd
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.entities import (
    AIModel, ModelMetric, PatientCase, Prediction,
    PredictionProbability, Experiment, RetrievalResult, LLMInteraction, SafetyEvent
)

router = APIRouter(prefix="/api", tags=["Research, Governance & History"])

@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "MEDINTEL AI Clinical Engine", "timestamp": pd.Timestamp.utcnow().isoformat()}

@router.get("/system/status")
async def system_status(db: Session = Depends(get_db)):
    """Returns actual real-time status of all intelligence components."""
    eval_c = os.path.exists("evaluation/classical_ml_results.json")
    eval_t = os.path.exists("evaluation/transformer_results.json")
    rag_idx = os.path.exists("rag/vectorstore/medical_index.json")
    data_profile = os.path.exists("data/processed/dataset_profile.json")

    total_cases = db.query(PatientCase).count()
    total_models = db.query(AIModel).count()

    llm_provider = os.getenv("LLM_PROVIDER", "demo").upper()
    has_api_key = bool(os.getenv("LLM_API_KEY"))

    return {
        "status": "ONLINE",
        "components": {
            "classical_ml": {
                "status": "ONLINE" if eval_c else "NOT_TRAINED",
                "models_available": ["Logistic Regression", "Random Forest", "XGBoost"] if eval_c else []
            },
            "biobert_transformer": {
                "status": "READY" if eval_t else "TRAINING / PENDING",
                "base_architecture": "dmis-lab/biobert-v1.1",
                "mode": "DEVELOPMENT MODE (CPU Optimized)"
            },
            "rag_vector_engine": {
                "status": "GROUNDED" if rag_idx else "READY",
                "vector_store": "Normalized Cosine Medical Index"
            },
            "llm_engine": {
                "status": "CONNECTED" if (has_api_key or llm_provider == "DEMO") else "DEMO_MODE",
                "provider": llm_provider,
                "mode": "DEMO MODE (Educational Synthesis)" if not has_api_key else "LIVE_API"
            },
            "database": {
                "status": "CONNECTED",
                "type": "PostgreSQL / SQLAlchemy ORM",
                "stored_cases": total_cases,
                "registered_models": total_models
            }
        },
        "dataset_ready": data_profile
    }

@router.get("/models")
async def list_models(db: Session = Depends(get_db)):
    """Returns list of registered AI models with parameters and performance."""
    models = db.query(AIModel).all()
    res = []
    for m in models:
        metrics = db.query(ModelMetric).filter(ModelMetric.model_id == m.id).first()
        res.append({
            "id": m.id,
            "name": m.name,
            "type": m.type,
            "version": m.version,
            "dataset": m.dataset,
            "dataset_version": m.dataset_version,
            "status": m.status,
            "model_path": m.model_path,
            "created_at": m.created_at.isoformat() if m.created_at else None,
            "metrics": {
                "accuracy": metrics.accuracy if metrics else None,
                "precision": metrics.precision if metrics else None,
                "recall": metrics.recall if metrics else None,
                "f1": metrics.f1 if metrics else None,
                "macro_f1": metrics.macro_f1 if metrics else None,
                "weighted_f1": metrics.weighted_f1 if metrics else None
            } if metrics else None
        })
    return res

@router.get("/models/{model_id}")
async def get_model_details(model_id: int, db: Session = Depends(get_db)):
    m = db.query(AIModel).filter(AIModel.id == model_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Model not found")
    metrics = db.query(ModelMetric).filter(ModelMetric.model_id == m.id).first()
    return {
        "id": m.id,
        "name": m.name,
        "type": m.type,
        "version": m.version,
        "dataset": m.dataset,
        "dataset_version": m.dataset_version,
        "status": m.status,
        "model_path": m.model_path,
        "metrics": metrics.__dict__ if metrics else None
    }

@router.get("/evaluation")
async def get_evaluation_benchmarks():
    """Returns actual test-set evaluation results for classical ML and BioBERT."""
    eval_data = {"classical_ml": {}, "transformer": {}, "comparison": []}

    c_path = "evaluation/classical_ml_results.json"
    if os.path.exists(c_path):
        with open(c_path, "r") as f:
            eval_data["classical_ml"] = json.load(f)

    t_path = "evaluation/transformer_results.json"
    if os.path.exists(t_path):
        with open(t_path, "r") as f:
            eval_data["transformer"] = json.load(f)

    # Build comparison summary
    for m_name, m_val in eval_data["classical_ml"].items():
        eval_data["comparison"].append({
            "model_name": m_name,
            "type": "Classical ML",
            "accuracy": m_val.get("accuracy"),
            "precision": m_val.get("precision_macro"),
            "recall": m_val.get("recall_macro"),
            "f1": m_val.get("f1_macro"),
            "latency_ms": m_val.get("inference_latency_ms"),
            "size_kb": m_val.get("model_size_kb")
        })

    if eval_data["transformer"]:
        t_val = eval_data["transformer"]
        eval_data["comparison"].append({
            "model_name": t_val.get("model_name"),
            "type": "Medical Transformer",
            "accuracy": t_val.get("accuracy"),
            "precision": t_val.get("precision_macro"),
            "recall": t_val.get("recall_macro"),
            "f1": t_val.get("f1_macro"),
            "latency_ms": t_val.get("inference_latency_ms"),
            "size_kb": (t_val.get("model_size_mb", 0) * 1024)
        })

    return eval_data

@router.get("/datasets")
async def get_dataset_profile():
    """Returns dataset profile and statistical distributions from actual data."""
    profile_path = "data/processed/dataset_profile.json"
    if not os.path.exists(profile_path):
        raise HTTPException(status_code=404, detail="Dataset profile not yet generated.")
    with open(profile_path, "r") as f:
        data = json.load(f)
    return data

@router.get("/datasets/preview")
async def get_dataset_preview(limit: int = 50, offset: int = 0):
    """Returns actual dataset rows with pagination."""
    csv_path = "data/raw/clinical_cases_raw.csv"
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail="Dataset file not found.")
    df = pd.read_csv(csv_path)
    total = len(df)
    sliced = df.iloc[offset:offset + limit].fillna("")
    return {
        "total_rows": total,
        "offset": offset,
        "limit": limit,
        "columns": list(df.columns),
        "rows": sliced.to_dict(orient="records")
    }

@router.get("/experiments")
async def get_experiment_registry():
    """Returns experiment registry tracking all model training runs."""
    reg_path = "evaluation/experiment_registry.json"
    if not os.path.exists(reg_path):
        return []
    with open(reg_path, "r") as f:
        return json.load(f)

@router.get("/history")
async def get_prediction_history(limit: int = 25, offset: int = 0, db: Session = Depends(get_db)):
    """Retrieves case history from PostgreSQL/database."""
    cases = db.query(PatientCase).order_by(PatientCase.created_at.desc()).offset(offset).limit(limit).all()
    res = []
    for c in cases:
        pred = db.query(Prediction).filter(Prediction.case_id == c.id).order_by(Prediction.created_at.desc()).first()
        res.append({
            "case_id": c.case_reference,
            "db_id": c.id,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "age": c.age,
            "sex": c.sex,
            "symptoms": c.symptom_text,
            "severity": c.severity,
            "duration": c.duration,
            "prediction": pred.predicted_condition if pred else "Unprocessed",
            "confidence": pred.confidence if pred else 0.0,
            "confidence_percentage": f"{(pred.confidence * 100):.1f}%" if pred else "0%"
        })
    return res

@router.get("/history/{case_reference}")
async def get_historical_case_detail(case_reference: str, db: Session = Depends(get_db)):
    """Loads a full stored analysis case from database by reference."""
    case = db.query(PatientCase).filter(PatientCase.case_reference == case_reference).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found in database.")

    preds = db.query(Prediction).filter(Prediction.case_id == case.id).all()
    retrievals = db.query(RetrievalResult).filter(RetrievalResult.case_id == case.id).all()
    llm = db.query(LLMInteraction).filter(LLMInteraction.case_id == case.id).first()
    safety = db.query(SafetyEvent).filter(SafetyEvent.case_id == case.id).all()

    # Differentials
    differentials = []
    if preds:
        probs = db.query(PredictionProbability).filter(PredictionProbability.prediction_id == preds[-1].id).all()
        for p in sorted(probs, key=lambda x: x.rank):
            differentials.append({
                "rank": p.rank,
                "condition": p.condition,
                "probability": p.probability,
                "percentage": f"{p.probability * 100:.1f}%"
            })

    return {
        "case_id": case.case_reference,
        "created_at": case.created_at.isoformat() if case.created_at else None,
        "patient_profile": {
            "age": case.age,
            "sex": case.sex,
            "symptoms": case.symptom_text,
            "duration": case.duration,
            "severity": case.severity,
            "medical_history": case.medical_history,
            "current_medications": case.current_medications,
            "clinical_narrative": case.clinical_narrative,
            "vitals": case.vitals
        },
        "predictions": [
            {
                "model_id": p.model_id,
                "condition": p.predicted_condition,
                "confidence": p.confidence,
                "inference_time_ms": p.inference_time
            } for p in preds
        ],
        "top_differentials": differentials,
        "retrieved_evidence": [
            {
                "title": r.source,
                "snippet": r.document,
                "similarity_score": r.similarity_score,
                "source_url": r.source_url
            } for r in retrievals
        ],
        "llm_explanation": {
            "explanation_markdown": llm.llm_response if llm else "Historical explanation not recorded.",
            "provider": llm.provider if llm else "Unknown",
            "model_name": llm.model_name if llm else "Unknown"
        },
        "safety_flags": [
            {
                "flag_type": s.flag_type,
                "severity": s.severity,
                "message": s.message
            } for s in safety
        ]
    }
