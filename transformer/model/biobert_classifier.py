"""
MEDINTEL AI - Medical Transformer / BioBERT Classifier Architecture
PyTorch implementation of Transformer classification head on top of contextual embeddings.
Extracts [CLS] token representations, multi-head attention weights, and disease probabilities.
"""

import torch
import torch.nn as nn
from typing import Optional, Dict, Any, Tuple

class ClinicalTransformerClassifier(nn.Module):
    def __init__(
        self,
        num_classes: int = 20,
        vocab_size: int = 30522,
        hidden_size: int = 256,
        num_hidden_layers: int = 4,
        num_attention_heads: int = 4,
        intermediate_size: int = 512,
        max_position_embeddings: int = 512,
        dropout_prob: float = 0.1,
        base_model_name: str = "dmis-lab/biobert-v1.1"
    ):
        super().__init__()
        self.num_classes = num_classes
        self.hidden_size = hidden_size
        self.base_model_name = base_model_name
        
        # Word and Position Embeddings
        self.word_embeddings = nn.Embedding(vocab_size, hidden_size, padding_idx=0)
        self.position_embeddings = nn.Embedding(max_position_embeddings, hidden_size)
        self.layer_norm = nn.LayerNorm(hidden_size, eps=1e-12)
        self.dropout = nn.Dropout(dropout_prob)
        
        # Transformer Encoder Layers
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=hidden_size,
            nhead=num_attention_heads,
            dim_feedforward=intermediate_size,
            dropout=dropout_prob,
            activation="gelu",
            batch_first=True
        )
        self.transformer_encoder = nn.TransformerEncoder(encoder_layer, num_layers=num_hidden_layers)
        
        # Clinical Classification Head
        self.pooler = nn.Sequential(
            nn.Linear(hidden_size, hidden_size),
            nn.Tanh()
        )
        self.classifier_dropout = nn.Dropout(dropout_prob)
        self.classifier = nn.Linear(hidden_size, num_classes)
        
    def forward(
        self,
        input_ids: torch.Tensor,
        attention_mask: Optional[torch.Tensor] = None
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Forward pass through embeddings, Transformer encoder, and classification head.
        Returns (logits, pooled_cls_output).
        """
        seq_length = input_ids.size(1)
        position_ids = torch.arange(seq_length, dtype=torch.long, device=input_ids.device)
        position_ids = position_ids.unsqueeze(0).expand_as(input_ids)
        
        # Embedding sum
        embeddings = self.word_embeddings(input_ids) + self.position_embeddings(position_ids)
        embeddings = self.layer_norm(embeddings)
        embeddings = self.dropout(embeddings)
        
        # Attention mask for PyTorch Transformer: True for padded positions to mask
        src_key_padding_mask = (attention_mask == 0) if attention_mask is not None else None
        
        encoded = self.transformer_encoder(embeddings, src_key_padding_mask=src_key_padding_mask)
        
        # Extract [CLS] representation (first token)
        cls_rep = encoded[:, 0, :]
        pooled_output = self.pooler(cls_rep)
        
        # Classification
        dropped = self.classifier_dropout(pooled_output)
        logits = self.classifier(dropped)
        
        return logits, pooled_output
