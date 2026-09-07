"""
MEDINTEL AI - Medical Transformer / BioBERT Classifier Architecture
PyTorch implementation of Clinical Transformer with Multi-Head Self-Attention layers
that extract genuine attention weights, pooled [CLS] representations, and 20-class disease probabilities.
"""

import torch
import torch.nn as nn
from typing import Optional, Dict, Any, Tuple, List

class ClinicalSelfAttentionLayer(nn.Module):
    """Multi-Head Self-Attention Layer with explicit attention weight extraction."""
    def __init__(self, hidden_size: int = 256, num_attention_heads: int = 4, intermediate_size: int = 512, dropout_prob: float = 0.1):
        super().__init__()
        self.num_heads = num_attention_heads
        self.head_dim = hidden_size // num_attention_heads
        self.all_head_size = self.num_heads * self.head_dim
        
        self.query = nn.Linear(hidden_size, self.all_head_size)
        self.key = nn.Linear(hidden_size, self.all_head_size)
        self.value = nn.Linear(hidden_size, self.all_head_size)
        self.dropout = nn.Dropout(dropout_prob)
        
        # Dense projection & LayerNorm
        self.dense = nn.Linear(hidden_size, hidden_size)
        self.layer_norm1 = nn.LayerNorm(hidden_size, eps=1e-12)
        
        # Feed-forward network & LayerNorm
        self.intermediate = nn.Sequential(
            nn.Linear(hidden_size, intermediate_size),
            nn.GELU(),
            nn.Dropout(dropout_prob),
            nn.Linear(intermediate_size, hidden_size),
            nn.Dropout(dropout_prob)
        )
        self.layer_norm2 = nn.LayerNorm(hidden_size, eps=1e-12)

    def transpose_for_scores(self, x: torch.Tensor) -> torch.Tensor:
        new_shape = x.size()[:-1] + (self.num_heads, self.head_dim)
        x = x.view(*new_shape)
        return x.permute(0, 2, 1, 3)

    def forward(self, hidden_states: torch.Tensor, attention_mask: Optional[torch.Tensor] = None) -> Tuple[torch.Tensor, torch.Tensor]:
        q = self.transpose_for_scores(self.query(hidden_states))
        k = self.transpose_for_scores(self.key(hidden_states))
        v = self.transpose_for_scores(self.value(hidden_states))
        
        # Attention scores (batch, heads, seq_len, seq_len)
        scores = torch.matmul(q, k.transpose(-1, -2)) / (self.head_dim ** 0.5)
        
        if attention_mask is not None:
            if attention_mask.dim() == 2:
                mask = attention_mask.unsqueeze(1).unsqueeze(2)
            else:
                mask = attention_mask
            scores = scores + ((1.0 - mask) * -10000.0)
            
        attn_probs = torch.softmax(scores, dim=-1)
        attn_probs_dropped = self.dropout(attn_probs)
        
        context = torch.matmul(attn_probs_dropped, v)
        context = context.permute(0, 2, 1, 3).contiguous()
        new_shape = context.size()[:-2] + (self.all_head_size,)
        context = context.view(*new_shape)
        
        # Residual + LayerNorm
        hidden_states = self.layer_norm1(hidden_states + self.dropout(self.dense(context)))
        # FFN + LayerNorm
        hidden_states = self.layer_norm2(hidden_states + self.intermediate(hidden_states))
        
        return hidden_states, attn_probs

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
        self.num_layers = num_hidden_layers
        
        # Word and Position Embeddings
        self.word_embeddings = nn.Embedding(vocab_size, hidden_size, padding_idx=0)
        self.position_embeddings = nn.Embedding(max_position_embeddings, hidden_size)
        self.layer_norm = nn.LayerNorm(hidden_size, eps=1e-12)
        self.dropout = nn.Dropout(dropout_prob)
        
        # Transformer Encoder Layers with attention retention
        self.layers = nn.ModuleList([
            ClinicalSelfAttentionLayer(
                hidden_size=hidden_size,
                num_attention_heads=num_attention_heads,
                intermediate_size=intermediate_size,
                dropout_prob=dropout_prob
            )
            for _ in range(num_hidden_layers)
        ])
        
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
        attention_mask: Optional[torch.Tensor] = None,
        return_all_attentions: bool = False
    ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """
        Forward pass through embeddings, Transformer encoder layers, and classification head.
        Returns (logits, pooled_cls_output, last_layer_attention_weights).
        """
        seq_length = input_ids.size(1)
        position_ids = torch.arange(seq_length, dtype=torch.long, device=input_ids.device)
        position_ids = position_ids.unsqueeze(0).expand_as(input_ids)
        
        # Embedding sum
        embeddings = self.word_embeddings(input_ids) + self.position_embeddings(position_ids)
        embeddings = self.layer_norm(embeddings)
        hidden_states = self.dropout(embeddings)
        
        all_attentions = []
        for layer in self.layers:
            hidden_states, attn_weights = layer(hidden_states, attention_mask=attention_mask)
            all_attentions.append(attn_weights)
        
        # Extract [CLS] representation (first token)
        cls_rep = hidden_states[:, 0, :]
        pooled_output = self.pooler(cls_rep)
        
        # Classification
        dropped = self.classifier_dropout(pooled_output)
        logits = self.classifier(dropped)
        
        # Mean across attention heads in the final encoder layer: (batch, seq_len, seq_len)
        final_attention = all_attentions[-1].mean(dim=1)
        
        return logits, pooled_output, final_attention

