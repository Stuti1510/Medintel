"""
MEDINTEL AI - Clinical Inference, Document Ingestion & Pipeline API Endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query, Body
from typing import Dict, Any, List, Optional

from backend.app.schemas.clinical_schema import (
    ClinicalAnalysisRequest, ClinicalAnalysisResponse,
    MLPredictRequest, TransformerPredictRequest,
    RAGSearchRequest, LLMExplainRequest
)
from backend.app.services.clinical_orchestrator import ClinicalAnalysisOrchestrator
from backend.app.services.document_parser import medical_document_parser
from backend.app.services.explainability_service import explainability_service
from backend.app.services.differential_engine import differential_engine

router = APIRouter(prefix="/api", tags=["Clinical Analysis & Document Ingestion"])

# Global singleton orchestrator
orchestrator = ClinicalAnalysisOrchestrator()

@router.post("/analyze", response_model=ClinicalAnalysisResponse)
async def run_full_clinical_analysis(payload: ClinicalAnalysisRequest):
    """
    Executes the complete 10-stage Clinical Intelligence Pipeline:
    Validation -> Preprocessing -> Classical ML -> BioBERT -> Concordance
    -> Multi-Symptom Differential -> RAG Evidence -> LLM Grounding -> Safety Audit -> PostgreSQL Storage -> Response.
    """
    try:
        req_data = payload.model_dump()
        result = orchestrator.analyze(req_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Clinical analysis error: {str(e)}")

@router.post("/documents/upload")
async def upload_medical_document(
    file: UploadFile = File(...),
    run_analysis: bool = Query(default=True)
):
    """
    Multimodal Document Ingestion Pipeline:
    Validates PDF / PNG / JPG / JPEG files -> Text extraction / OCR -> Error normalization ->
    Medical entity extraction (symptoms, lab values, vitals, history, meds) -> Structured patient schema.
    If run_analysis=True, automatically executes full clinical analysis on the extracted patient.
    """
    try:
        content = await file.read()
        filename = file.filename or "uploaded_document"
        
        # Parse document
        parsed_doc = medical_document_parser.parse_document(content, filename)
        
        if parsed_doc.get("status") == "ERROR":
            return parsed_doc

        analysis_result = None
        if run_analysis:
            patient = parsed_doc.get("extracted_patient", {})
            vitals = patient.get("vitals", {})
            labs = patient.get("lab_results", {})
            
            # Formulate analysis payload
            chol_val = 2 if "cholesterol" in labs and labs["cholesterol"].get("status") in ["High", "Elevated"] else 1
            gluc_val = 2 if "glucose" in labs and labs["glucose"].get("status") in ["Elevated (Hyperglycemia)"] else 1
            
            analysis_payload = {
                "age": patient.get("age", 52),
                "sex": patient.get("sex", "Male"),
                "symptoms": ", ".join(patient.get("symptoms", [])),
                "duration": patient.get("duration", "3 days"),
                "severity": "Moderate",
                "medical_history": ", ".join(patient.get("medical_history", [])),
                "current_medications": ", ".join(patient.get("medications", [])),
                "vitals": vitals,
                "clinical_narrative": parsed_doc.get("normalized_text", "")[:400],
                "cholesterol": chol_val,
                "gluc": gluc_val
            }
            analysis_result = orchestrator.analyze(analysis_payload)

        return {
            "document": parsed_doc,
            "analysis": analysis_result,
            "status": "SUCCESS"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document upload processing error: {str(e)}")

@router.post("/ml/predict")
async def predict_classical_ml(payload: MLPredictRequest):
    """Standalone Classical Machine Learning inference with dynamic feature attribution."""
    try:
        res = orchestrator.ml_service.predict(
            payload.clinical_text,
            model_name=payload.model_name or "Logistic Regression",
            top_k=payload.top_k or 5
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classical ML prediction error: {str(e)}")

@router.post("/ml/explain")
async def explain_prediction(
    clinical_text: str = Body(..., embed=True),
    model_name: Optional[str] = Body(default="Logistic Regression", embed=True),
    selected_disease: Optional[str] = Body(default=None, embed=True)
):
    """Generates dynamic feature attribution, lexical token salience, and positive/negative evidence."""
    try:
        res = explainability_service.explain(
            clinical_text=clinical_text,
            model_name=model_name,
            selected_disease=selected_disease
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explainability computation error: {str(e)}")

@router.post("/differential/compute")
async def compute_differential_diagnosis(
    symptoms: List[str] = Body(..., embed=True),
    vitals: Optional[Dict[str, Any]] = Body(default=None, embed=True),
    labs: Optional[Dict[str, Any]] = Body(default=None, embed=True),
    top_k: Optional[int] = Body(default=5, embed=True)
):
    """Computes disease-specific scores and softmax probabilities across multi-symptom presentations."""
    try:
        res = differential_engine.compute_differential_scores(
            symptoms=symptoms,
            vitals=vitals,
            labs=labs,
            top_k=top_k or 5
        )
        return {"differentials": res, "status": "SUCCESS"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Differential diagnosis computation error: {str(e)}")

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
    """Semantic vector search across medical knowledge base with disease metadata filtering."""
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
