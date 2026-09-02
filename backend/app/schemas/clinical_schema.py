"""
MEDINTEL AI - Pydantic Request & Response Schemas
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class VitalsInput(BaseModel):
    heart_rate: Optional[int] = Field(None, description="Heart rate in bpm")
    systolic_bp: Optional[int] = Field(None, description="Systolic blood pressure in mmHg")
    diastolic_bp: Optional[int] = Field(None, description="Diastolic blood pressure in mmHg")
    temperature: Optional[float] = Field(None, description="Body temperature in Celsius")
    spo2: Optional[int] = Field(None, description="Oxygen saturation in %")

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
    selected_ml_model: Optional[str] = Field("Logistic Regression", description="Classical ML model to compare")

class MLPredictRequest(BaseModel):
    clinical_text: str = Field(..., description="Clinical text or symptom narrative")
    model_name: Optional[str] = Field("Logistic Regression", description="Model name")
    top_k: Optional[int] = Field(5, description="Number of differentials")

class TransformerPredictRequest(BaseModel):
    clinical_text: str = Field(..., description="Clinical narrative to analyze")
    top_k: Optional[int] = Field(5, description="Number of differentials")

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
