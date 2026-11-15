"""
Exact linear attributions for TF-IDF + Linear SVM text model.
Computes feature contributions directly from model weights. No SHAP or LIME.
"""

from typing import List, Dict, Any
from ml.inference.text_svm_inference import get_text_classifier

def explain_text(narrative: str, fold: int = 0, pred_class_idx: int = None, top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Computes exact linear contributions for all n-grams in the narrative.
    Returns sorted list of top-k attributions with character spans for UI highlighting.
    """
    clf = get_text_classifier(fold=fold)
    if not clf.is_loaded:
        clf.load()
        
    if pred_class_idx is None:
        res = clf.predict(narrative)
        pred_class_idx = res["prediction_index"]
        
    return clf.get_exact_attributions(narrative, pred_class_idx=pred_class_idx, top_k=top_k)
