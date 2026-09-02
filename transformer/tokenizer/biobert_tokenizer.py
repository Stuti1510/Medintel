"""
MEDINTEL AI - BioBERT Clinical Tokenizer
Integrates HuggingFace AutoTokenizer / WordPiece clinical tokenizer.
Provides tokenization, token IDs, attention masks, and character offset mapping for the Transformer Lab.
"""

import os
from typing import Dict, Any, List
from transformers import AutoTokenizer, BertTokenizer

class BioBERTTokenizerService:
    def __init__(self, model_name: str = "bert-base-uncased", max_length: int = 128):
        self.model_name = model_name
        self.max_length = max_length
        self.tokenizer = None
        self._initialize_tokenizer()

    def _initialize_tokenizer(self):
        try:
            # Attempt to load BioBERT or fallback to bert-base-uncased
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            print(f"[TOKENIZER] Initialized HuggingFace tokenizer ({self.model_name})")
        except Exception as e:
            print(f"[TOKENIZER] Loading bert-base-uncased fallback due to: {e}")
            try:
                self.tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
            except Exception:
                # Basic subword fallback if offline
                from transformers import BasicTokenizer
                self.tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased", local_files_only=False)

    def tokenize_clinical_text(self, text: str, max_length: int = None) -> Dict[str, Any]:
        """
        Tokenizes clinical narrative and returns structured token objects for interactive visualization.
        """
        if self.tokenizer is None:
            self._initialize_tokenizer()
            
        max_len = max_length or self.max_length
        encoded = self.tokenizer(
            text,
            max_length=max_len,
            padding="max_length",
            truncation=True,
            return_offsets_mapping=True,
            return_tensors="pt"
        )
        
        input_ids = encoded["input_ids"][0].tolist()
        attention_mask = encoded["attention_mask"][0].tolist()
        offset_mapping = encoded.get("offset_mapping", None)
        
        tokens = self.tokenizer.convert_ids_to_tokens(input_ids)
        
        # Build token details list for frontend table/visualizer
        token_details = []
        for i, (tok, tid, mask) in enumerate(zip(tokens, input_ids, attention_mask)):
            # Skip excess padding in detailed token list for readability, but keep mask info
            if tok == "[PAD]" and i > 25:
                continue
            token_details.append({
                "position": i,
                "token": tok,
                "token_id": tid,
                "attention_mask": mask,
                "is_special": tok in ["[CLS]", "[SEP]", "[PAD]", "[UNK]", "[MASK]"]
            })
            
        return {
            "tokens": tokens,
            "input_ids": input_ids,
            "attention_mask": attention_mask,
            "token_count": len([m for m in attention_mask if m == 1]),
            "token_details": token_details,
            "raw_text": text
        }
