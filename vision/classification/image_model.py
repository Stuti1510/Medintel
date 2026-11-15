"""
EfficientNet-B0 image classifier for 4-class skin lesion diagnosis.
Exposes 1280-dimensional pooled visual embedding for multimodal fusion.
"""

import os
os.environ["HF_HUB_OFFLINE"] = "1"

import torch
import torch.nn as nn
import timm

class EfficientNetB0Classifier(nn.Module):
    def __init__(self, num_classes: int = 4, pretrained: bool = True, drop_rate: float = 0.2):
        super().__init__()
        # Load backbone with offline fallback
        try:
            self.backbone = timm.create_model(
                "efficientnet_b0",
                pretrained=pretrained,
                num_classes=0,
                drop_rate=drop_rate
            )
        except Exception:
            self.backbone = timm.create_model(
                "efficientnet_b0",
                pretrained=False,
                num_classes=0,
                drop_rate=drop_rate
            )
        self.num_features = self.backbone.num_features # 1280
        self.classifier = nn.Linear(self.num_features, num_classes)
        
    def extract_features(self, x: torch.Tensor) -> torch.Tensor:
        """Extracts 1280-d pooled feature embedding."""
        return self.backbone(x)
        
    def forward(self, x: torch.Tensor, return_embedding: bool = False):
        embedding = self.extract_features(x)
        logits = self.classifier(embedding)
        if return_embedding:
            return logits, embedding
        return logits
