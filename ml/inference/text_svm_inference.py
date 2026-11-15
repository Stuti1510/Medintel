"""
Inference wrapper for the TF-IDF + Calibrated Linear SVM model.
Outputs probabilities (4,), decision scores (4,), and top n-gram attributions.
"""

import os
import joblib
import numpy as np
from typing import Dict, Any, List, Tuple

CLASSES = ["BCC", "ACK", "NEV", "SEK"]

class TextSVMClassifier:
    def __init__(self, fold: int = 0, model_dir: str = None):
        self.fold = fold
        if model_dir is None:
            model_dir = f"models/text_svm/fold{fold}"
        self.model_dir = model_dir
        self.vectorizer_path = os.path.join(model_dir, "vectorizer.joblib")
        self.model_path = os.path.join(model_dir, "model.joblib")
        
        self.vectorizer = None
        self.calibrated_model = None
        self.is_loaded = False
        
        if os.path.exists(self.vectorizer_path) and os.path.exists(self.model_path):
            self.load()
            
    def load(self):
        self.vectorizer = joblib.load(self.vectorizer_path)
        self.calibrated_model = joblib.load(self.model_path)
        self.is_loaded = True
        
    def get_decision_scores(self, X_tfidf) -> np.ndarray:
        """
        Extracts 4-class decision function scores from the underlying LinearSVC
        averaged across calibration estimators.
        """
        # CalibratedClassifierCV stores fitted base estimators in calibrated_classifiers_
        scores = []
        for cc in self.calibrated_model.calibrated_classifiers_:
            # In scikit-learn, cc.estimator is the underlying LinearSVC
            svc = getattr(cc, "estimator", None) or getattr(cc, "base_estimator", None)
            if svc is not None and hasattr(svc, "decision_function"):
                df = svc.decision_function(X_tfidf)
                scores.append(df)
                
        if scores:
            avg_scores = np.mean(scores, axis=0) # shape (N, 4)
            return avg_scores
        else:
            # Fallback to log probabilities if base estimators not directly accessible
            probs = self.calibrated_model.predict_proba(X_tfidf)
            return np.log(np.clip(probs, 1e-6, 1.0))
            
    def get_exact_attributions(self, narrative: str, pred_class_idx: int, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Exact linear attribution: TF-IDF value * LinearSVC.coef_[pred_class]
        averaged over the calibration folds.
        Maps back to character spans of the narrative for UI highlighting.
        """
        if not self.is_loaded or not narrative:
            return []
            
        X_vec = self.vectorizer.transform([narrative])
        feature_names = self.vectorizer.get_feature_names_out()
        
        # Average coefficients over calibration estimators
        coefs = []
        for cc in self.calibrated_model.calibrated_classifiers_:
            svc = getattr(cc, "estimator", None) or getattr(cc, "base_estimator", None)
            if svc is not None and hasattr(svc, "coef_"):
                coefs.append(svc.coef_)
        if coefs:
            avg_coef = np.mean(coefs, axis=0) # shape (4, V)
        else:
            return []
            
        class_coef = avg_coef[pred_class_idx] # shape (V,)
        
        # Compute exact contribution per feature: value * weight
        coo = X_vec.tocoo()
        contributions = []
        lower_narrative = narrative.lower()
        
        for col, val in zip(coo.col, coo.data):
            feat_name = feature_names[col]
            weight = float(val * class_coef[col])
            
            # Find character span (start, end)
            pattern = feat_name.lower()
            start = lower_narrative.find(pattern)
            end = start + len(pattern) if start != -1 else -1
            
            contributions.append({
                "ngram": feat_name,
                "weight": round(weight, 4),
                "tfidf": round(float(val), 4),
                "coef": round(float(class_coef[col]), 4),
                "start": start,
                "end": end
            })
            
        # Sort by absolute weight descending
        contributions.sort(key=lambda x: abs(x["weight"]), reverse=True)
        return contributions[:top_k]
        
    def predict(self, narrative: str) -> Dict[str, Any]:
        """
        Runs text inference on a single narrative string.
        """
        if not self.is_loaded:
            self.load()
            
        X_vec = self.vectorizer.transform([narrative])
        probs = self.calibrated_model.predict_proba(X_vec)[0]
        decision_scores = self.get_decision_scores(X_vec)[0]
        pred_idx = int(np.argmax(probs))
        
        top_ngrams = self.get_exact_attributions(narrative, pred_idx, top_k=5)
        
        return {
            "prediction": CLASSES[pred_idx],
            "prediction_index": pred_idx,
            "probabilities": {CLASSES[i]: round(float(probs[i]), 4) for i in range(4)},
            "probabilities_array": [float(p) for p in probs],
            "decision_scores": [float(s) for s in decision_scores],
            "top_ngrams": top_ngrams
        }

_cached_text_classifier = {}

def get_text_classifier(fold: int = 0) -> TextSVMClassifier:
    global _cached_text_classifier
    if fold not in _cached_text_classifier:
        _cached_text_classifier[fold] = TextSVMClassifier(fold=fold)
    return _cached_text_classifier[fold]
