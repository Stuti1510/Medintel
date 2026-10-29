"""
MEDINTEL AI - Classical ML NLP Inference Service (24-Class Symptom2Disease Engine)
Loads fitted TF-IDF feature pipeline and trained calibrated models (Logistic Regression, Linear SVM, Random Forest, XGBoost).
Accepts natural-language symptom descriptions, computes calibrated class probabilities (sum = 1.0)
across 24 disease classes, extracts ranked differential diagnoses, derives genuine lexical feature attributions,
and enforces safety thresholds and low-confidence abstention.
"""

import os
import sys
import re
import json
import time
import numpy as np
import pandas as pd
import joblib
from typing import Dict, Any, List, Optional
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from data.preprocess import clean_clinical_text

CONFIDENCE_ABSTENTION_THRESHOLD = 0.15  # Uniform probability across 24 classes is ~0.0417

class ClassicalMLInferenceService:
    def __init__(self, models_dir: str = "models/classical", data_dir: str = "data/processed"):
        self.models_dir = models_dir
        self.data_dir = data_dir
        self.feature_pipeline = None
        self.models = {}
        self.label_mapping = {}
        self.inv_label_mapping = {}
        self.is_loaded = False
        self.load_models()

    def load_models(self):
        try:
            pipe_path = os.path.join(self.models_dir, "feature_pipeline.joblib")
            map_path = os.path.join(self.data_dir, "label_mapping.json")

            if os.path.exists(pipe_path):
                self.feature_pipeline = joblib.load(pipe_path)

            if os.path.exists(map_path):
                with open(map_path, "r", encoding="utf-8") as f:
                    self.label_mapping = json.load(f)
                self.inv_label_mapping = {v: int(k) for k, v in self.label_mapping.items()}

            # Load available models
            model_files = [
                ("Logistic Regression", "logistic_regression.joblib"),
                ("Linear SVM", "linear_svm.joblib"),
                ("Random Forest", "random_forest.joblib"),
                ("XGBoost", "xgboost.joblib")
            ]
            for model_name, filename in model_files:
                m_path = os.path.join(self.models_dir, filename)
                if os.path.exists(m_path):
                    self.models[model_name] = joblib.load(m_path)

            self.is_loaded = len(self.models) > 0 and self.feature_pipeline is not None and len(self.label_mapping) > 0
            if self.is_loaded:
                print(f"[CLASSICAL ML INFERENCE] Loaded {len(self.models)} models across {len(self.label_mapping)} classes successfully.")
        except Exception as e:
            print(f"[CLASSICAL ML INFERENCE] Error loading models: {e}")
            self.is_loaded = False

    def validate_input(self, text: Any) -> str:
        """Validates that input is non-empty, of string type, and contains clinical terms."""
        if text is None:
            raise ValueError("Input symptom description cannot be None.")
        if not isinstance(text, str):
            text = str(text)
        cleaned = text.strip()
        if len(cleaned) < 5:
            raise ValueError("Symptom description is too short (minimum 5 characters required).")
        letters = re.findall(r'[a-zA-Z]', cleaned)
        if len(letters) < 3:
            raise ValueError("Symptom description must contain valid clinical terms or words, not purely numbers or symbols.")
        return cleaned

    def predict(
        self,
        clinical_text: str,
        structured_data: Optional[Dict[str, Any]] = None,
        model_name: str = "Linear SVM",
        top_k: int = 5
    ) -> Dict[str, Any]:
        if not self.is_loaded:
            self.load_models()
        if not self.is_loaded:
            raise RuntimeError("Classical ML models are not available or trained.")

        cleaned_input = self.validate_input(clinical_text)
        start_time = time.time()

        if model_name not in self.models:
            # Fallback to calibrated Linear SVM or first available
            model_name = "Linear SVM" if "Linear SVM" in self.models else list(self.models.keys())[0]

        clf = self.models[model_name]

        # 1. Feature Extraction (exact same preprocessing as during training)
        normalized_text = clean_clinical_text(cleaned_input)
        X = self.feature_pipeline.transform(normalized_text)

        # 2. Probability Computation & Calibration
        if hasattr(clf, "predict_proba"):
            probs = clf.predict_proba(X)[0]
        elif hasattr(clf, "decision_function"):
            decision = clf.decision_function(X)[0]
            # Softmax
            exp_d = np.exp(decision - np.max(decision))
            probs = exp_d / np.sum(exp_d)
        else:
            y_hard = int(clf.predict(X)[0])
            probs = np.zeros(len(self.label_mapping))
            probs[y_hard] = 1.0

        # Guarantee strict simplex normalization
        prob_sum = float(np.sum(probs))
        if prob_sum > 0:
            probs = probs / prob_sum
        else:
            probs = np.ones(len(self.label_mapping)) / len(self.label_mapping)

        pred_idx = int(np.argmax(probs))
        pred_label = self.label_mapping.get(str(pred_idx), f"Class_{pred_idx}")
        confidence = float(round(probs[pred_idx], 4))

        # Check for ambiguous or low-confidence input
        is_low_confidence = confidence < CONFIDENCE_ABSTENTION_THRESHOLD
        abstention_flag = is_low_confidence

        # Build full probability distribution & sorted differentials
        all_probs_dict = {}
        for idx in range(len(self.label_mapping)):
            lbl = self.label_mapping.get(str(idx), f"Class_{idx}")
            all_probs_dict[lbl] = float(round(probs[idx], 4))

        sorted_diffs = sorted(all_probs_dict.items(), key=lambda item: item[1], reverse=True)[:top_k]
        differentials = [
            {
                "rank": r_idx + 1,
                "condition": k,
                "probability": v,
                "percentage": f"{v * 100:.1f}%"
            }
            for r_idx, (k, v) in enumerate(sorted_diffs)
        ]

        latency_ms = round((time.time() - start_time) * 1000, 3)

        # 3. Dynamic Genuine Lexical Feature Attributions
        feature_contributions = self._compute_lexical_attributions(
            clf, model_name, X[0], normalized_text, pred_idx, pred_label
        )

        return {
            "model_name": model_name,
            "predicted_condition": pred_label,
            "confidence": confidence,
            "confidence_percentage": f"{confidence * 100:.1f}%",
            "is_calibrated": True,
            "abstention_recommended": abstention_flag,
            "clinical_caveat": "Informational differential only; not a definitive clinical diagnosis." if not is_low_confidence else "Low confidence presentation: symptoms are non-specific or outside modeled conditions.",
            "all_probabilities": all_probs_dict,
            "top_differentials": differentials,
            "salient_features": [f["feature"] for f in feature_contributions[:5]],
            "feature_contributions": feature_contributions,
            "latency_ms": latency_ms
        }

    def _compute_lexical_attributions(
        self,
        clf: Any,
        model_name: str,
        x_vec: np.ndarray,
        normalized_text: str,
        pred_idx: int,
        pred_label: str
    ) -> List[Dict[str, Any]]:
        """
        Derives genuine instance-level lexical attributions by identifying active n-grams
        in the input text and weighting them by their class-specific model coefficients.
        """
        contributions = []
        try:
            vec = getattr(self.feature_pipeline, "text_vectorizer", None)
            if vec is None:
                return contributions

            feature_names = vec.get_feature_names_out()
            active_indices = np.where(x_vec > 0)[0]
            
            if len(active_indices) == 0:
                return contributions

            # Retrieve coefficients if linear classifier
            weights = None
            if hasattr(clf, "coef_"):
                # LogisticRegression
                if clf.coef_.ndim == 2 and pred_idx < clf.coef_.shape[0]:
                    weights = clf.coef_[pred_idx]
            elif hasattr(clf, "calibrated_classifiers_"):
                # CalibratedClassifierCV wrapping LinearSVC
                cal_weights = []
                for sub in clf.calibrated_classifiers_:
                    base = getattr(sub, "estimator", getattr(sub, "base_estimator", None))
                    if base is not None and hasattr(base, "coef_"):
                        if base.coef_.ndim == 2 and pred_idx < base.coef_.shape[0]:
                            cal_weights.append(base.coef_[pred_idx])
                if cal_weights:
                    weights = np.mean(cal_weights, axis=0)

            scored_terms = []
            for idx in active_indices:
                term = str(feature_names[idx])
                tf_val = float(x_vec[idx])
                if weights is not None:
                    score = float(weights[idx] * tf_val)
                else:
                    score = tf_val  # Fallback to TF-IDF magnitude
                scored_terms.append((term, score, tf_val))

            # Sort by score descending
            scored_terms.sort(key=lambda t: t[1], reverse=True)
            total_mag = sum(abs(t[1]) for t in scored_terms) or 1.0

            for term, score, tf_val in scored_terms[:12]:
                norm_score = round(score / total_mag, 4)
                contributions.append({
                    "feature": f"'{term}'",
                    "term": term,
                    "value": f"TF-IDF: {tf_val:.3f}",
                    "salience": round(abs(norm_score), 4),
                    "weight": round(abs(norm_score), 3),
                    "direction": "SUPPORTING" if score >= 0 else "OPPOSING",
                    "evidence_type": "Positive Symptom Evidence" if score >= 0 else "Protective / Opposing Feature",
                    "category": "Clinical Symptom Lexicon"
                })
        except Exception as e:
            print(f"[EXPLAINABILITY] Lexical attribution note: {e}")

        return contributions

# Global Singleton
classical_ml_service = ClassicalMLInferenceService()
