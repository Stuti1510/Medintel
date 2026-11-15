"""
Multimodal fusion models for skin lesion classification.
Supports:
1. late fusion (baseline)
2. concatenation fusion (baseline)
3. quality-aware gated fusion (deployed model)
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Tuple, Optional

class ProjectionHead(nn.Module):
    def __init__(self, in_features: int, out_features: int = 64, dropout: float = 0.3):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_features, out_features),
            nn.LayerNorm(out_features),
            nn.GELU(),
            nn.Dropout(dropout)
        )
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)

class MultimodalClassifier(nn.Module):
    def __init__(self, fusion: str = "gated", img_dim: int = 1280, txt_dim: int = 4,
                 d: int = 64, num_classes: int = 4, dropout: float = 0.3):
        super().__init__()
        if fusion not in ["late", "concat", "gated"]:
            raise ValueError(f"Unknown fusion type: {fusion}. Expected 'late', 'concat', or 'gated'.")
        self.fusion = fusion
        self.d = d
        self.num_classes = num_classes
        
        # Projections
        self.proj_img = ProjectionHead(img_dim, d, dropout=dropout)
        self.proj_txt = ProjectionHead(txt_dim, d, dropout=dropout)
        
        if self.fusion == "concat":
            # [h_img; h_txt] -> MLP(128 -> 64 -> 4)
            self.head = nn.Sequential(
                nn.Linear(2 * d, d),
                nn.GELU(),
                nn.Dropout(dropout),
                nn.Linear(d, num_classes)
            )
        elif self.fusion == "gated":
            # W_g [h_img; h_txt; q] -> sigmoid
            # q has dimension 1 -> Total input = 64 + 64 + 1 = 129
            self.gate = nn.Sequential(
                nn.Linear(2 * d + 1, d),
                nn.Sigmoid()
            )
            # MLP(h) -> logits
            self.head = nn.Sequential(
                nn.Linear(d, d),
                nn.GELU(),
                nn.Dropout(dropout),
                nn.Linear(d, num_classes)
            )
        elif self.fusion == "late":
            # Image classifier head + Text classifier head
            self.img_head = nn.Linear(d, num_classes)
            self.txt_head = nn.Linear(d, num_classes)
            # Scalar weight w for image modality (initialized to 0.5)
            self.late_weight = nn.Parameter(torch.tensor(0.5))
            
    def forward(self, img_feat: torch.Tensor, txt_feat: torch.Tensor,
                q: Optional[torch.Tensor] = None) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        img_feat: (B, 1280) EfficientNet pooled features
        txt_feat: (B, 4) SVM decision scores
        q: (B, 1) image quality score in [0, 1]
        Returns: (logits, image_weight)
        """
        h_img = self.proj_img(img_feat)
        h_txt = self.proj_txt(txt_feat)
        
        if self.fusion == "concat":
            h = torch.cat([h_img, h_txt], dim=1)
            logits = self.head(h)
            img_weight = torch.full((img_feat.size(0),), 0.5, device=img_feat.device)
            return logits, img_weight
            
        elif self.fusion == "gated":
            if q is None:
                q = torch.full((img_feat.size(0), 1), 0.5, device=img_feat.device)
            elif q.dim() == 1:
                q = q.unsqueeze(1)
                
            gate_in = torch.cat([h_img, h_txt, q], dim=1) # (B, 129)
            g = self.gate(gate_in)                         # (B, 64)
            h = g * h_img + (1.0 - g) * h_txt              # (B, 64)
            logits = self.head(h)
            img_weight = g.mean(dim=1)                     # (B,) scalar weight
            return logits, img_weight
            
        elif self.fusion == "late":
            logits_img = self.img_head(h_img)
            logits_txt = self.txt_head(h_txt)
            probs_img = F.softmax(logits_img, dim=1)
            probs_txt = F.softmax(logits_txt, dim=1)
            w = torch.clamp(self.late_weight, 0.0, 1.0)
            fused_probs = w * probs_img + (1.0 - w) * probs_txt
            # Log probabilities as logits for cross-entropy
            logits = torch.log(torch.clamp(fused_probs, 1e-7, 1.0))
            img_weight = torch.full((img_feat.size(0),), float(w.item()), device=img_feat.device)
            return logits, img_weight
