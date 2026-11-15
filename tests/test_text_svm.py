"""
Unit tests for text classifier (TF-IDF + Calibrated Linear SVM).
Verifies:
1. Only Linear SVM is importable (no alternative algorithms)
2. Probabilities sum to 1.0
3. Attributions are computed and have valid structure
"""

import sys
if "." not in sys.path:
    sys.path.insert(0, ".")

import pytest
import numpy as np
from ml.inference.text_svm_inference import get_text_classifier

def test_only_linear_svm_is_present():
    # Attempting to import non-selected models from the repository must fail
    with pytest.raises((ImportError, ModuleNotFoundError)):
        from ml.training import train_classical
    with pytest.raises((ImportError, ModuleNotFoundError)):
        from ml.inference import classical_inference
    with pytest.raises((ImportError, ModuleNotFoundError)):
        import transformer
    with pytest.raises((ImportError, ModuleNotFoundError)):
        from ml import logistic_regression
    with pytest.raises((ImportError, ModuleNotFoundError)):
        from ml import random_forest

def test_text_svm_probabilities_sum_to_one():
    clf = get_text_classifier(fold=0)
    sample_text = "Patient is a 65-year-old female presenting with an elevated skin lesion on the face that bleeds easily."
    res = clf.predict(sample_text)
    
    probs = res["probabilities_array"]
    assert len(probs) == 4, f"Expected 4 class probabilities, got {len(probs)}"
    assert np.isclose(sum(probs), 1.0, atol=1e-4), f"Probabilities do not sum to 1: {sum(probs)}"
    assert res["prediction"] in ["BCC", "ACK", "NEV", "SEK"]
    assert len(res["decision_scores"]) == 4

def test_text_attributions_structure():
    clf = get_text_classifier(fold=0)
    sample_text = "Patient is a 70-year-old male with an elevated painful lesion on the arm that has grown."
    res = clf.predict(sample_text)
    
    top_ngrams = res["top_ngrams"]
    assert isinstance(top_ngrams, list)
    for item in top_ngrams:
        assert "ngram" in item
        assert "weight" in item
        assert "start" in item
        assert "end" in item
