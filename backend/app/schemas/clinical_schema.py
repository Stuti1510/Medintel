"""
MEDINTEL AI - Pydantic Request & Response Schemas
"""

import re
import math
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, field_validator, model_validator

class VitalsInput(BaseModel):
    heart_rate: Optional[int] = Field(None, ge=20, le=280, description="Heart rate in bpm")
    systolic_bp: Optional[int] = Field(None, ge=50, le=300, description="Systolic blood pressure in mmHg")
    diastolic_bp: Optional[int] = Field(None, ge=30, le=200, description="Diastolic blood pressure in mmHg")
    temperature: Optional[float] = Field(None, ge=28.0, le=45.0, description="Body temperature in Celsius")
    spo2: Optional[int] = Field(None, ge=40, le=100, description="Oxygen saturation in %")

    @model_validator(mode="after")
    def validate_pressure_relationship(self):
        if self.systolic_bp is not None and self.diastolic_bp is not None:
            if self.systolic_bp <= self.diastolic_bp:
                raise ValueError("Systolic blood pressure must be strictly greater than diastolic blood pressure.")
        return self

class ClinicalAnalysisRequest(BaseModel):
    age: int = Field(..., ge=0, le=120, description="Patient age in years")
    sex: str = Field(..., description="Biological sex (Male, Female, Other)")
    symptoms: str = Field(..., description="Chief symptoms or comma-separated symptoms")
    duration: Optional[str] = Field("3 days", description="Duration of symptoms")
    severity: Optional[str] = Field("Moderate", description="Severity (Mild, Moderate, Severe, Critical)")
    medical_history: Optional[str] = Field("", description="Past medical history")
    current_medications: Optional[str] = Field("", description="Current medications")
    vitals: Optional[VitalsInput] = None
    clinical_narrative: Optional[str] = Field("", description="Free-text clinical description")
    selected_ml_model: Optional[str] = Field("Linear SVM", description="Classical ML model to compare")
    height: Optional[float] = Field(None, ge=30.0, le=260.0)
    weight: Optional[float] = Field(None, ge=2.0, le=400.0)
    cholesterol: Optional[int] = Field(None, ge=1, le=3)
    gluc: Optional[int] = Field(None, ge=1, le=3)
    smoke: Optional[int] = Field(None, ge=0, le=1)
    alco: Optional[int] = Field(None, ge=0, le=1)
    active: Optional[int] = Field(None, ge=0, le=1)

    @model_validator(mode="after")
    def validate_symptoms_present(self):
        sym = (self.symptoms or "").strip()
        nar = (self.clinical_narrative or "").strip()
        combined = f"{sym} {nar}".strip()
        if len(combined) < 5:
            raise ValueError("Patient symptoms or clinical narrative must contain at least 5 characters.")
        letters = re.findall(r'[a-zA-Z]', combined)
        if len(letters) < 3:
            raise ValueError("Patient symptoms must contain descriptive alphabetic words, not purely numbers or symbols.")
        return self

class MLPredictRequest(BaseModel):
    clinical_text: str = Field(..., description="Clinical text or symptom narrative")
    model_name: Optional[str] = Field("Linear SVM", description="Model name")
    top_k: Optional[int] = Field(5, ge=1, le=24, description="Number of differentials")

    @field_validator("clinical_text")
    @classmethod
    def validate_clinical_text(cls, v: str) -> str:
        s = (v or "").strip()
        if len(s) < 5:
            raise ValueError("Clinical text must be at least 5 characters long.")
        if len(re.findall(r'[a-zA-Z]', s)) < 3:
            raise ValueError("Clinical text must contain descriptive words, not purely numbers or symbols.")
        return s

class TransformerPredictRequest(BaseModel):
    clinical_text: str = Field(..., description="Clinical narrative to analyze")
    top_k: Optional[int] = Field(5, ge=1, le=24, description="Number of differentials")

    @field_validator("clinical_text")
    @classmethod
    def validate_clinical_text(cls, v: str) -> str:
        s = (v or "").strip()
        if len(s) < 5:
            raise ValueError("Clinical text must be at least 5 characters long.")
        if len(re.findall(r'[a-zA-Z]', s)) < 3:
            raise ValueError("Clinical text must contain descriptive words, not purely numbers or symbols.")
        return s

class RAGSearchRequest(BaseModel):
    query: str = Field(..., description="Search query or symptom string")
    top_k: Optional[int] = Field(4, description="Number of evidence chunks")

class LLMExplainRequest(BaseModel):
    case_context: Dict[str, Any]
    ml_prediction: Dict[str, Any]
    transformer_prediction: Dict[str, Any]
    retrieved_evidence: List[Dict[str, Any]]
    safety_flags: Optional[List[Dict[str, Any]]] = []

class DifferentialItem(BaseModel):
    rank: int = 1
    condition: str = "Condition"
    probability: float = 0.0
    percentage: str = "0.0%"

class EvidenceItem(BaseModel):
    id: Optional[str] = None
    title: str = "Medical Guideline"
    category: str = "Clinical Knowledge"
    source: str = "Evidence Source"
    source_url: Optional[str] = "https://www.ncbi.nlm.nih.gov/"
    last_updated: Optional[str] = None
    similarity_score: float = 0.0
    relevance_percentage: Optional[str] = "0.0%"
    snippet: str = ""
    full_content: Optional[str] = None

class SafetyFlagItem(BaseModel):
    flag_type: str = "ALERT"
    severity: str = "WARNING"
    message: str = ""

class ClinicalAnalysisResponse(BaseModel):
    case_id: str
    patient_profile: Dict[str, Any] = {}
    source_of_truth: Dict[str, Any] = {}
    output_validation: Dict[str, Any] = {}
    ml_prediction: Dict[str, Any] = {}
    transformer_prediction: Dict[str, Any] = {}
    concordance: Dict[str, Any] = {}
    confidence: Dict[str, Any] = {}
    top_differentials: List[DifferentialItem] = []
    retrieved_evidence: List[EvidenceItem] = []
    llm_explanation: Dict[str, Any] = {}
    safety_flags: List[SafetyFlagItem] = []
    disclaimer: str = ""
    processing_time: Dict[str, float] = {}
    database_persisted: bool = False
