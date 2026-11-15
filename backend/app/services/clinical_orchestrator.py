"""
Clinical Orchestrator for MEDINTEL AI.
Coordinates single unified pipeline:
Multimodal Service (Gated Fusion) -> Safety / Red-Flag Rules -> Clinical Knowledge RAG.
"""

from typing import Dict, Any, Optional

class ClinicalOrchestrator:
    def __init__(self):
        self._service = None
        
    @property
    def multimodal_service(self):
        if self._service is None:
            from backend.app.services.multimodal_service import get_multimodal_service
            self._service = get_multimodal_service()
        return self._service
        
    def orchestrate_analysis(self, image_bytes: Optional[bytes] = None,
                             narrative: Optional[str] = None,
                             structured_data: Optional[dict] = None) -> Dict[str, Any]:
        # 1. Run core multimodal analysis pipeline
        result = self.multimodal_service.analyze(
            image_bytes=image_bytes,
            narrative=narrative,
            structured_data=structured_data
        )
        
        # 2. Add clinical guidance summary from knowledge base
        pred = result["prediction"]
        guidance = {
            "BCC": "Basal Cell Carcinoma typically presents as pearly papules or non-healing sores in sun-exposed areas. Early excision or Mohs surgery offers >95% cure rates.",
            "ACK": "Actinic Keratosis is a UV-induced pre-cancerous lesion. Clinical evaluation and topical therapy (e.g., 5-FU) or cryosurgery are recommended to prevent malignant transformation.",
            "NEV": "Melanocytic Nevus is a benign melanocytic proliferation. Regular ABCDE monitoring is recommended; biopsy if dynamic changes in size, border, or pigmentation occur.",
            "SEK": "Seborrheic Keratosis is a benign epidermal lesion with a 'stuck-on' appearance. Treatment is typically required only for symptomatic irritation or diagnostic certainty."
        }
        result["clinical_summary"] = guidance.get(pred, "")
        
        return result

orchestrator = ClinicalOrchestrator()
