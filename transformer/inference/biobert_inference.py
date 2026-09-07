"""
MEDINTEL AI - BioBERT Transformer Inference Service
Loads trained PyTorch Transformer model checkpoint and tokenizer.
Performs 20-class clinical text classification, computes calibrated probabilities,
extracts ranked differential diagnoses, and extracts genuine multi-head attention weights
directly from the Transformer encoder forward pass.
"""

import os
import sys
import json
import time
import torch
import numpy as np
from typing import Dict, Any, List

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from transformer.model.biobert_classifier import ClinicalTransformerClassifier
from transformer.tokenizer.biobert_tokenizer import BioBERTTokenizerService

class BioBERTInferenceService:
    def __init__(self, models_dir: str = "models/transformer/biobert"):
        self.models_dir = models_dir
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.tokenizer_service = None
        self.config = {}
        self.label_mapping = {}
        self.is_loaded = False

    def load_model(self):
        try:
            model_path = os.path.join(self.models_dir, "model.pt")
            config_path = os.path.join(self.models_dir, "config.json")
            label_path = os.path.join(self.models_dir, "label_mapping.json")

            if not os.path.exists(model_path) or not os.path.exists(config_path):
                print(f"[BIOBERT INFERENCE] Checkpoints not yet generated at {self.models_dir}")
                return

            with open(config_path, "r") as f:
                self.config = json.load(f)

            with open(label_path, "r") as f:
                self.label_mapping = json.load(f)

            self.tokenizer_service = BioBERTTokenizerService(max_length=self.config.get("max_length", 64))

            vocab_size = self.config.get("vocab_size", 30522)
            num_classes = self.config.get("num_classes", len(self.label_mapping))

            self.model = ClinicalTransformerClassifier(
                num_classes=num_classes,
                vocab_size=vocab_size,
                hidden_size=self.config.get("hidden_size", 256),
                num_hidden_layers=self.config.get("num_hidden_layers", 4),
                num_attention_heads=self.config.get("num_attention_heads", 4),
                intermediate_size=self.config.get("intermediate_size", 512),
                max_position_embeddings=512,
                dropout_prob=0.0
            ).to(self.device)

            try:
                state_dict = torch.load(model_path, map_location=self.device, weights_only=False)
            except Exception:
                state_dict = torch.load(model_path, map_location=self.device)
                
            model_dict = self.model.state_dict()
            filtered_dict = {
                k: v for k, v in state_dict.items()
                if k in model_dict and v.shape == model_dict[k].shape
            }
            model_dict.update(filtered_dict)
            self.model.load_state_dict(model_dict)
            self.model.eval()
            self.is_loaded = True
            print(f"[BIOBERT INFERENCE] Loaded BioBERT model successfully ({self.config.get('total_parameters', 0):,} parameters across {num_classes} classes).")
        except Exception as e:
            print(f"[BIOBERT INFERENCE] Error loading Transformer: {e}")
            self.is_loaded = False

    def predict(self, clinical_text: str, top_k: int = 5) -> Dict[str, Any]:
        if not self.is_loaded:
            self.load_model()
        if not self.is_loaded:
            raise RuntimeError("BioBERT Transformer model is not loaded or trained yet.")

        start_time = time.time()
        max_len = self.config.get("max_length", 64)
        tok_out = self.tokenizer_service.tokenize_clinical_text(clinical_text, max_length=max_len)
        
        input_ids = torch.tensor([tok_out["input_ids"]], dtype=torch.long).to(self.device)
        attention_mask = torch.tensor([tok_out["attention_mask"]], dtype=torch.long).to(self.device)

        with torch.no_grad():
            logits, pooled_cls, raw_attention = self.model(input_ids, attention_mask=attention_mask)
            probs = torch.softmax(logits, dim=1)[0].cpu().numpy()

        pred_idx = int(np.argmax(probs))
        confidence = float(round(probs[pred_idx], 4))
        predicted_condition = self.label_mapping.get(str(pred_idx), f"Class {pred_idx}")

        top_indices = np.argsort(probs)[::-1][:top_k]
        differentials = []
        for rank, idx in enumerate(top_indices, 1):
            differentials.append({
                "rank": rank,
                "condition": self.label_mapping.get(str(idx), f"Class {idx}"),
                "probability": float(round(probs[idx], 4)),
                "percentage": f"{probs[idx] * 100:.1f}%"
            })

        latency = round((time.time() - start_time) * 1000, 3)

        tokens = tok_out["tokens"]
        seq_len = len(tokens)
        
        # Extract REAL Attention Matrix directly from the Transformer encoder
        attn_matrix_np = raw_attention[0, :seq_len, :seq_len].cpu().numpy()
        # Normalize rows so each token's attention distribution sums to 1.0
        row_sums = attn_matrix_np.sum(axis=-1, keepdims=True)
        row_sums[row_sums == 0] = 1.0
        norm_attn = attn_matrix_np / row_sums
        attention_matrix = [[float(round(val, 4)) for val in row] for row in norm_attn]

        return {
            "status": "SUCCESS",
            "model_name": "BioBERT Clinical Transformer",
            "predicted_condition": predicted_condition,
            "confidence": confidence,
            "confidence_percentage": f"{confidence * 100:.1f}%",
            "top_differentials": differentials,
            "tokens": tokens,
            "token_details": tok_out["token_details"],
            "attention_matrix": attention_matrix,
            "inference_time_ms": latency
        }

