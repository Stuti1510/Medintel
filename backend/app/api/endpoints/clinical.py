"""
MEDINTEL AI - Clinical Inference & Pipeline API Endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List

from backend.app.schemas.clinical_schema import (
    ClinicalAnalysisRequest, ClinicalAnalysisResponse,
    MLPredictRequest, TransformerPredictRequest,
    RAGSearchRequest, LLMExplainRequest
)
from backend.app.services.clinical_orchestrator import ClinicalAnalysisOrchestrator
from ml.inference.classical_inference import ClassicalMLInferenceService
from transformer.inference.biobert_inference import BioBERTInferenceService
from rag.retrieval.retriever import RAGRetrieverService
from llm.services.llm_engine import LLMServiceEngine
from llm.safety.safety_checker import ClinicalSafetyChecker

router = APIRouter(prefix="/api", tags=["Clinical Analysis"])

# Global singleton orchestrator
orchestrator = ClinicalAnalysisOrchestrator()

@router.post("/analyze", response_model=ClinicalAnalysisResponse)
async def run_full_clinical_analysis(payload: ClinicalAnalysisRequest):
    """
    Executes the complete 10-stage Clinical Intelligence Pipeline:
    Validation -> Preprocessing -> Classical ML -> BioBERT -> Concordance
    -> RAG Evidence -> LLM Grounding -> Safety Audit -> PostgreSQL Storage -> Response.
    """
    try:
        req_data = payload.model_dump()
        result = orchestrator.analyze(req_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Clinical analysis error: {str(e)}")

@router.post("/ml/predict")
async def predict_classical_ml(payload: MLPredictRequest):
    """Standalone Classical Machine Learning inference with feature attribution."""
    try:
        res = orchestrator.ml_service.predict(
            payload.clinical_text,
            model_name=payload.model_name or "Logistic Regression",
            top_k=payload.top_k or 5
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classical ML prediction error: {str(e)}")

@router.post("/transformer/predict")
async def predict_transformer(payload: TransformerPredictRequest):
    """Standalone BioBERT Transformer inference with live tokenization and attention visualization."""
    try:
        res = orchestrator.transformer_service.predict(
            payload.clinical_text,
            top_k=payload.top_k or 5
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"BioBERT inference error: {str(e)}")

@router.post("/rag/search")
async def search_medical_evidence(payload: RAGSearchRequest):
    """Semantic vector search across medical knowledge base."""
    try:
        res = orchestrator.rag_service.search_evidence(
            payload.query,
            top_k=payload.top_k or 4
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG search error: {str(e)}")

@router.post("/llm/explain")
async def explain_clinical_case(payload: LLMExplainRequest):
    """Grounded clinical synthesis using LLM adapter and safety audits."""
    try:
        res = orchestrator.llm_service.explain_case(
            patient_case=payload.case_context,
            ml_result=payload.ml_prediction,
            transformer_result=payload.transformer_prediction,
            retrieved_evidence=payload.retrieved_evidence,
            safety_flags=payload.safety_flags or []
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM explanation error: {str(e)}")
