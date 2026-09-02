"""
MEDINTEL AI - Vector Store Engine
Indexes medical knowledge chunks and executes normalized cosine similarity vector search.
"""

import os
import json
import numpy as np
from typing import List, Dict, Any, Tuple

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

    def search(self, query_embedding: np.ndarray, top_k: int = 4, min_score: float = 0.05) -> List[Dict[str, Any]]:
        if len(self.documents) == 0 or self.embeddings.size == 0:
            return []

        # Cosine similarity (since embeddings are L2 normalized, dot product is cosine similarity)
        query_vec = query_embedding.reshape(1, -1)
        sim_scores = np.dot(self.embeddings, query_vec.T).flatten()

        top_indices = np.argsort(sim_scores)[::-1][:top_k]
        results = []

        for idx in top_indices:
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
