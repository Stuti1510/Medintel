"""
MEDINTEL AI - Vector Store Engine with Metadata Filtering
Indexes medical knowledge chunks and executes normalized cosine similarity vector search
with metadata filtering (disease tag, source, category).
"""

import os
import json
import numpy as np
from typing import List, Dict, Any, Optional

DEFAULT_INDEX_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../vectorstore/medical_index.json")
)

class MedicalVectorStore:
    def __init__(self, index_path: str = DEFAULT_INDEX_PATH):
        self.index_path = index_path
        self.documents: List[Dict[str, Any]] = []
        self.embeddings: np.ndarray = np.empty((0, 0), dtype=np.float32)
        self.load_index()

    def add_documents(self, docs: List[Dict[str, Any]], embeddings: np.ndarray):
        self.documents = list(docs)
        self.embeddings = np.array(embeddings, dtype=np.float32)

    def search(
        self,
        query_embedding: np.ndarray,
        top_k: int = 4,
        min_score: float = 0.05,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        if len(self.documents) == 0 or self.embeddings.size == 0:
            return []

        # Cosine similarity (dot product over normalized embeddings)
        query_vec = query_embedding.reshape(1, -1)
        sim_scores = np.dot(self.embeddings, query_vec.T).flatten()

        # Apply metadata filters if specified
        filtered_indices = []
        filter_dict = filters or {}
        
        disease_filter = filter_dict.get("disease", "").lower()
        category_filter = filter_dict.get("category", "").lower()
        source_filter = filter_dict.get("source", "").lower()

        for idx, doc in enumerate(self.documents):
            if disease_filter:
                doc_title = doc.get("title", "").lower()
                doc_content = doc.get("full_content", "").lower()
                doc_cat = doc.get("category", "").lower()
                if disease_filter not in doc_title and disease_filter not in doc_content and disease_filter not in doc_cat:
                    # Give penalty if disease filter specified but not present
                    sim_scores[idx] *= 0.5

            if category_filter and category_filter != "all":
                if category_filter not in doc.get("category", "").lower():
                    continue

            if source_filter and source_filter != "all":
                if source_filter not in doc.get("source", "").lower():
                    continue

            filtered_indices.append(idx)

        if not filtered_indices:
            filtered_indices = list(range(len(self.documents)))

        # Sort filtered documents by score descending
        sorted_indices = sorted(filtered_indices, key=lambda i: sim_scores[i], reverse=True)[:top_k]
        results = []

        for idx in sorted_indices:
            if idx >= len(self.documents):
                continue
            score = float(sim_scores[idx])
            if score < min_score:
                continue
            doc = self.documents[idx].copy()
            doc["similarity_score"] = round(score, 4)
            doc["relevance_percentage"] = f"{round(score * 100, 1)}%"
            results.append(doc)

        return results

    def save_index(self):
        os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
        data = {
            "documents": self.documents,
            "embeddings": self.embeddings.tolist()
        }
        with open(self.index_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"[VECTOR STORE] Saved index with {len(self.documents)} documents to {self.index_path}")

    def load_index(self):
        if os.path.exists(self.index_path):
            try:
                with open(self.index_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                self.documents = data.get("documents", [])
                raw_emb = data.get("embeddings", [])
                if raw_emb:
                    self.embeddings = np.array(raw_emb, dtype=np.float32)
                print(f"[VECTOR STORE] Loaded {len(self.documents)} documents from {self.index_path}")
            except Exception as e:
                print(f"[VECTOR STORE] Failed loading index: {e}")
