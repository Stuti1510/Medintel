"""
MEDINTEL AI - Clinical Semantic Embedder
Produces high-dimensional dense embeddings for clinical text, symptoms, and knowledge documents.
Saves and loads fitted vocabulary to ensure identical feature dimension alignment across processes.
"""

import os
import joblib
import numpy as np
from typing import List, Union
from sklearn.feature_extraction.text import TfidfVectorizer

DEFAULT_VECTORIZER_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../vectorstore/embedder_vectorizer.joblib")
)

class ClinicalEmbedder:
    def __init__(self, max_features: int = 512, model_path: str = DEFAULT_VECTORIZER_PATH):
        self.max_features = max_features
        self.model_path = model_path
        self.vectorizer = None
        self.is_fitted = False
        self._init_vectorizer()

    def _init_vectorizer(self):
        if os.path.exists(self.model_path):
            try:
                self.vectorizer = joblib.load(self.model_path)
                self.is_fitted = True
            except Exception as e:
                print(f"[RAG EMBEDDER] Could not load saved vectorizer: {e}")
        
        if self.vectorizer is None:
            self.vectorizer = TfidfVectorizer(
                max_features=self.max_features,
                ngram_range=(1, 2),
                sublinear_tf=True,
                stop_words="english"
            )

    def fit_and_save(self, corpus: List[str]):
        self.vectorizer.fit(corpus)
        self.is_fitted = True
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump(self.vectorizer, self.model_path)
        print(f"[RAG EMBEDDER] Saved fitted vectorizer to {self.model_path}")

    def embed(self, texts: Union[str, List[str]]) -> np.ndarray:
        if isinstance(texts, str):
            texts = [texts]
            
        if not self.is_fitted:
            # Check if vectorizer file has been created
            if os.path.exists(self.model_path):
                self._init_vectorizer()
            else:
                self.fit_and_save(texts)
            
        sparse = self.vectorizer.transform(texts).toarray()
        norms = np.linalg.norm(sparse, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        return (sparse / norms).astype(np.float32)
