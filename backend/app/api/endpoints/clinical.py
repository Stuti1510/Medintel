"""
Clinical API Endpoints for MEDINTEL AI.
Provides POST /api/analyze/multimodal.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import json

from backend.app.schemas.clinical_schema import MultimodalAnalysisResponse
from backend.app.services.clinical_orchestrator import orchestrator
from backend.app.services.multimodal_service import ModelUnavailableError

router = APIRouter()

@router.post("/analyze/multimodal", response_model=MultimodalAnalysisResponse)
async def analyze_multimodal(
    image: Optional[UploadFile] = File(None),
    narrative: Optional[str] = Form(None),
    itch: Optional[str] = Form(None),
    grew: Optional[str] = Form(None),
    hurt: Optional[str] = Form(None),
    changed: Optional[str] = Form(None),
    bleed: Optional[str] = Form(None),
    elevation: Optional[str] = Form(None),
    age: Optional[str] = Form(None),
    gender: Optional[str] = Form(None),
    region: Optional[str] = Form(None),
    diameter_1: Optional[str] = Form(None),
    diameter_2: Optional[str] = Form(None),
    fitspatrick: Optional[str] = Form(None),
    smoke: Optional[str] = Form(None),
    drink: Optional[str] = Form(None),
    pesticide: Optional[str] = Form(None),
    skin_cancer_history: Optional[str] = Form(None),
    cancer_history: Optional[str] = Form(None)
):
    """
    Multimodal skin lesion analysis endpoint.
    Accepts: image (JPEG/PNG, <= 10MB) + symptom narrative or structured clinical fields.
    Executes: quality check -> enhancement if needed -> gated multimodal classification -> XAI.
    """
    image_bytes = None
    if image is not None:
        # Validate format
        content_type = image.content_type or ""
        filename = (image.filename or "").lower()
        if content_type not in ["image/jpeg", "image/png", "image/webp"] and not (filename.endswith(".jpg") or filename.endswith(".jpeg") or filename.endswith(".png")):
            raise HTTPException(status_code=400, detail="Only JPEG and PNG images are supported.")
                
        # Read and check size
        image_bytes = await image.read()
        if image_bytes and len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image file exceeds maximum allowed size of 10 MB.")
            
    # Structured fields dict
    def to_bool(val):
        if val is None:
            return None
        s = str(val).strip().lower()
        if s in ["true", "1", "yes"]:
            return True
        if s in ["false", "0", "no"]:
            return False
        return None
        
    structured_data = {
        "itch": to_bool(itch),
        "grew": to_bool(grew),
        "hurt": to_bool(hurt),
        "changed": to_bool(changed),
        "bleed": to_bool(bleed),
        "elevation": to_bool(elevation),
        "age": age,
        "gender": gender,
        "region": region,
        "diameter_1": diameter_1,
        "diameter_2": diameter_2,
        "fitspatrick": fitspatrick,
        "smoke": to_bool(smoke),
        "drink": to_bool(drink),
        "pesticide": to_bool(pesticide),
        "skin_cancer_history": to_bool(skin_cancer_history),
        "cancer_history": to_bool(cancer_history)
    }
    
    try:
        result = orchestrator.orchestrate_analysis(
            image_bytes=image_bytes,
            narrative=narrative,
            structured_data=structured_data
        )
        return result
    except ModelUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Multimodal analysis failed: {str(e)}")

@router.get("/samples")
def get_canonical_samples():
    """
    Returns 4 verified held-out test samples (one each for BCC, ACK, NEV, SEK)
    from PAD-UFES-20 test split with images, narratives, and clinical metadata.
    Enables one-click sample demonstration in the user interface.
    """
    try:
        from backend.app.services.sample_cases import get_sample_cases_with_images
        return get_sample_cases_with_images()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load sample cases: {str(e)}")
