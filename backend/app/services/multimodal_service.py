"""
Core Multimodal Clinical Analysis Service.
Loads EfficientNet, Linear SVM, U-Net restorer, and Gated Fusion once at startup.
Single deployed pipeline: quality check -> enhancement if needed -> gated multimodal inference -> XAI.
"""

from pathlib import Path
import os
import cv2
import numpy as np
import torch
import torchvision.transforms as T
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parents[3]

from vision.enhancement.infer_restore import get_restorer
from vision.classification.image_model import EfficientNetB0Classifier
from ml.inference.text_svm_inference import get_text_classifier
from multimodal.fusion_model import MultimodalClassifier
from vision.preprocessing.quality import assess_image_quality, needs_enhancement
from backend.app.services.explainability_service import explainability_service
from data.multimodal.build_pad_ufes_dataset import build_patient_narrative

CLASSES = ["BCC", "ACK", "NEV", "SEK"]

class MultimodalService:
    def __init__(self, fold: int = 0):
        self.fold = fold
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"Initializing MultimodalService (fold={fold}, device={self.device})...")
        
        # 1. Text classifier (TF-IDF + Calibrated Linear SVM)
        self.text_classifier = get_text_classifier(fold=fold)
        
        # 2. Image classifier (EfficientNet-B0)
        img_ckpt = PROJECT_ROOT / f"models/image_cls/efficientnet_fold{fold}.pt"
        self.image_model = EfficientNetB0Classifier(num_classes=4, pretrained=False).to(self.device)
        if img_ckpt.exists():
            self.image_model.load_state_dict(torch.load(str(img_ckpt), map_location=self.device))
        self.image_model.eval()
        
        # 3. Restoration model (U-Net)
        unet_ckpt = PROJECT_ROOT / f"models/restore/unet_fold{fold}.pt"
        self.restorer = get_restorer(str(unet_ckpt) if unet_ckpt.exists() else None, device=str(self.device))
        
        # 4. Gated Fusion model (deployed architecture)
        self.fusion_model = MultimodalClassifier(fusion="gated", img_dim=1280, txt_dim=4, d=64, num_classes=4).to(self.device)
        fusion_ckpt = PROJECT_ROOT / f"models/fusion/fusion_gated_fold{fold}.pt"
        if fusion_ckpt.exists():
            checkpoint = torch.load(str(fusion_ckpt), map_location=self.device)
            if isinstance(checkpoint, dict) and "fusion_model" in checkpoint:
                self.fusion_model.load_state_dict(checkpoint["fusion_model"])
            else:
                self.fusion_model.load_state_dict(checkpoint)
        self.fusion_model.eval()
        
        self.normalize = T.Compose([
            T.Resize(256),
            T.CenterCrop(224),
            T.ToTensor(),
            T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        print("MultimodalService initialized successfully!")
        
    def analyze(self, image_bytes: bytes = None, narrative: str = None,
                structured_data: dict = None) -> dict:
        """
        Executes single deployed pipeline:
        quality check -> enhance if needed -> EfficientNet-B0 + Linear SVM -> gated fusion -> XAI.
        """
        # Determine narrative
        if not narrative and structured_data:
            narrative = build_patient_narrative(structured_data)
        if not narrative:
            narrative = "Patient presents for dermatological assessment of a cutaneous lesion."
            
        # 1. Text inference
        txt_res = self.text_classifier.predict(narrative)
        txt_decision_scores = np.array(txt_res["decision_scores"], dtype=np.float32)
        txt_probs = txt_res["probabilities_array"]
        
        # 2. Image inference & quality check
        img_rgb = None
        enhanced_rgb = None
        enhancement_applied = False
        enhancement_method = "none"
        quality_info = {"blur": 0.0, "brightness": 0.0, "noise": 0.0, "q": 0.0}
        
        if image_bytes and len(image_bytes) > 0:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img_bgr is not None:
                # Resize if max side > 1024
                h, w = img_bgr.shape[:2]
                max_side = max(h, w)
                if max_side > 1024:
                    scale = 1024.0 / max_side
                    img_bgr = cv2.resize(img_bgr, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
                    
                img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
                quality_info = assess_image_quality(img_rgb)
                
                # Check if enhancement needed
                if needs_enhancement(quality_info["q"], threshold=0.55):
                    enhanced_rgb = self.restorer.restore(img_rgb)
                    enhancement_applied = True
                    enhancement_method = "unet" if self.restorer.is_loaded else "clahe_gamma"
                else:
                    enhanced_rgb = img_rgb.copy()
                    
        # 3. Multimodal Gated Fusion
        if img_rgb is not None:
            active_img = enhanced_rgb if enhanced_rgb is not None else img_rgb
            pil_img = Image.fromarray(active_img)
            img_tensor = self.normalize(pil_img).unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                img_feat = self.image_model.extract_features(img_tensor)
                txt_feat = torch.tensor(txt_decision_scores).unsqueeze(0).to(self.device)
                q_t = torch.tensor([[quality_info["q"]]], dtype=torch.float32).to(self.device)
                
                logits, g_weight = self.fusion_model(img_feat, txt_feat, q_t)
                fused_probs = torch.softmax(logits, dim=1).cpu().numpy()[0]
                img_weight = float(g_weight.mean().item())
        else:
            # Text-only fallback
            fused_probs = np.array(txt_probs, dtype=np.float32)
            img_weight = 0.0
            
        pred_idx = int(np.argmax(fused_probs))
        pred_class = CLASSES[pred_idx]
        conf = float(fused_probs[pred_idx])
        
        # 4. Generate Explainability package
        xai_info = explainability_service.explain_multimodal(
            image_rgb=img_rgb,
            enhanced_rgb=enhanced_rgb if enhancement_applied else None,
            narrative=narrative,
            pred_class_idx=pred_idx,
            image_model=self.image_model if img_rgb is not None else None,
            gate_image_weight=img_weight,
            enhancement_applied=enhancement_applied,
            enhancement_method=enhancement_method
        )
        
        # 5. Check clinical red flags
        red_flag = None
        lower_narrative = narrative.lower()
        if "bleeding" in lower_narrative or "bleed" in lower_narrative:
            red_flag = "Red Flag Alert: Lesion exhibits bleeding upon contact. Biopsy and urgent dermoscopic evaluation recommended."
        elif "growing" in lower_narrative or "enlargement" in lower_narrative or "evolved" in lower_narrative:
            red_flag = "Clinical Note: Progressive morphological growth observed. Dermatological excision evaluation indicated."
            
        return {
            "prediction": pred_class,
            "confidence": round(conf, 4),
            "probabilities": {CLASSES[i]: round(float(fused_probs[i]), 4) for i in range(4)},
            "quality": xai_info["quality"],
            "enhancement_applied": enhancement_applied,
            "enhancement_method": enhancement_method,
            "modality_weights": xai_info["modality_weights"],
            "text_attributions": xai_info["text_attributions"],
            "gradcam_base64": xai_info["gradcam_base64"],
            "enhanced_image_base64": xai_info["enhanced_image_base64"],
            "narrative_used": narrative,
            "safety_alert": red_flag,
            "model_info": "EfficientNet-B0 + TF-IDF Linear SVM, quality-aware gated fusion"
        }

_multimodal_service = None

def get_multimodal_service() -> MultimodalService:
    global _multimodal_service
    if _multimodal_service is None:
        _multimodal_service = MultimodalService(fold=0)
    return _multimodal_service
