"""
MEDINTEL AI - Classical ML Inference Service
Loads fitted vectorizers and trained models (Logistic Regression, Random Forest, XGBoost).
Performs inference, calculates confidence and top-K differential probabilities, and extracts salient features.
"""

import os
import json
import time
import numpy as np
import joblib
from typing import Dict, Any, List

class ClassicalMLInferenceService:
    def __init__(self, models_dir: str = "models/classical", data_dir: str = "data/processed"):
        self.models_dir = models_dir
        self.data_dir = data_dir
        self.vectorizer = None
        self.label_encoder = None
        self.models = {}
        self.label_mapping = {}
        self.is_loaded = False
        self.load_models()

    def load_models(self):
        try:
            vec_path = os.path.join(self.models_dir, "tfidf_vectorizer.joblib")
            enc_path = os.path.join(self.models_dir, "label_encoder.joblib")
            map_path = os.path.join(self.data_dir, "label_mapping.json")

            if not os.path.exists(vec_path) or not os.path.exists(enc_path):
                print(f"[CLASSICAL ML INFERENCE] Model artifacts not yet generated at {self.models_dir}")
                return

            self.vectorizer = joblib.load(vec_path)
            self.label_encoder = joblib.load(enc_path)

            if os.path.exists(map_path):
                with open(map_path, "r") as f:
                    self.label_mapping = json.load(f)
            else:
                self.label_mapping = {str(i): cls for i, cls in enumerate(self.label_encoder.classes_)}

            # Load available models
            for model_name, filename in [
                ("Logistic Regression", "logistic_regression.joblib"),
                ("Random Forest", "random_forest.joblib"),
                ("XGBoost", "xgboost.joblib")
            ]:
                m_path = os.path.join(self.models_dir, filename)
                if os.path.exists(m_path):
                    self.models[model_name] = joblib.load(m_path)

            self.is_loaded = True
            print(f"[CLASSICAL ML INFERENCE] Loaded {len(self.models)} classical models successfully.")
        except Exception as e:
            print(f"[CLASSICAL ML INFERENCE] Error loading models: {e}")
            self.is_loaded = False

    def predict(self, clinical_text: str, model_name: str = "Logistic Regression", top_k: int = 5) -> Dict[str, Any]:
        if not self.is_loaded:
            self.load_models()
        if not self.is_loaded:
            raise RuntimeError("Classical ML models are not available or trained.")

        if model_name not in self.models:
            # Fallback to first available model
            model_name = list(self.models.keys())[0]

        clf = self.models[model_name]
        start_time = time.time()

        # Vectorize input text
        X_vec = self.vectorizer.transform([clinical_text]).toarray()

        # Predict Probabilities
        if hasattr(clf, "predict_proba"):
            probs = clf.predict_proba(X_vec)[0]
        else:
            decision = clf.decision_function(X_vec)[0]
            probs = np.exp(decision) / np.sum(np.exp(decision))

        pred_idx = int(np.argmax(probs))
        confidence = float(round(probs[pred_idx], 4))
        predicted_condition = self.label_mapping.get(str(pred_idx), str(self.label_encoder.classes_[pred_idx]))
        
        # Get top-K differentials
        top_indices = np.argsort(probs)[::-1][:top_k]
        differentials = []
        for rank, idx in enumerate(top_indices, 1):
            differentials.append({
                "rank": rank,
                "condition": self.label_mapping.get(str(idx), str(self.label_encoder.classes_[idx])),
                "probability": float(round(probs[idx], 4)),
                "percentage": f"{probs[idx] * 100:.1f}%"
            })

        inference_time_ms = round((time.time() - start_time) * 1000, 2)

        # Extract top salient features (words that matched TF-IDF vocab)
        feature_names = self.vectorizer.get_feature_names_out()
        non_zero_indices = X_vec[0].nonzero()[0]
        salient_tokens = []
        for idx in non_zero_indices:
            token = feature_names[idx]
            weight = float(round(X_vec[0][idx], 4))
            salient_tokens.append({"token": token, "tfidf_weight": weight})
        salient_tokens = sorted(salient_tokens, key=lambda x: x["tfidf_weight"], reverse=True)[:10]

        return {
            "model_name": model_name,
            "model_type": "Classical ML",
            "model_version": "v1.0.0",
            "predicted_condition": predicted_condition,
            "confidence": confidence,
            "confidence_percentage": f"{confidence * 100:.1f}%",
            "top_differentials": differentials,
            "salient_features": salient_tokens,
            "inference_time_ms": inference_time_ms,
            "status": "SUCCESS"
        }
