"""
Pydantic schemas for clinical multimodal analysis.
No model selection or algorithm parameters are exposed.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any

class StructuredSymptoms(BaseModel):
    itch: Optional[bool] = None
    grew: Optional[bool] = None
    hurt: Optional[bool] = None
    changed: Optional[bool] = None
    bleed: Optional[bool] = None
    elevation: Optional[bool] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    region: Optional[str] = None
    diameter_1: Optional[float] = None
    diameter_2: Optional[float] = None
    fitspatrick: Optional[int] = None
    smoke: Optional[bool] = None
    drink: Optional[bool] = None
    pesticide: Optional[bool] = None
    skin_cancer_history: Optional[bool] = None
    cancer_history: Optional[bool] = None

class QualityAssessment(BaseModel):
    blur: float
    brightness: float
    noise: float
    q: float

class ModalityWeights(BaseModel):
    image: float
    text: float

class TextAttribution(BaseModel):
    ngram: str
    weight: float
    start: int
    end: int

class MultimodalAnalysisResponse(BaseModel):
    prediction: str
    confidence: float
    probabilities: Dict[str, float]
    quality: QualityAssessment
    enhancement_applied: bool
    enhancement_method: str
    modality_weights: ModalityWeights
    text_attributions: List[TextAttribution]
    gradcam_base64: Optional[str] = None
    enhanced_image_base64: Optional[str] = None
    narrative_used: str
    safety_alert: Optional[str] = None
    model_info: str = "EfficientNet-B0 + TF-IDF Linear SVM, quality-aware gated fusion"
