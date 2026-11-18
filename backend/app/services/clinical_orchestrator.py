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
        return self.multimodal_service.analyze(
            image_bytes=image_bytes,
            narrative=narrative,
            structured_data=structured_data
        )

orchestrator = ClinicalOrchestrator()
