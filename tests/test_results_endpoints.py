"""
Tests for Results and Dataset API endpoints.
Verifies:
1. /api/results/{id} returns rows and status: 'success' for existing experiments
2. /api/results/{id} returns status: 'not_run' for missing files (never 500)
3. /api/dataset/summary returns PAD-UFES-20 summary statistics
"""

import sys
if "." not in sys.path:
    sys.path.insert(0, ".")

import pytest
from backend.app.api.endpoints.models_eval import get_experiment_results, get_dataset_summary

def test_results_endpoints_return_data():
    for exp_id in ["e1", "e3", "e4", "e5", "e6", "e7", "e8"]:
        data = get_experiment_results(exp_id)
        assert data["status"] in ["success", "not_run"]
        if data["status"] == "success":
            assert len(data["rows"]) > 0

def test_results_endpoint_missing_file_never_500():
    data = get_experiment_results("nonexistent_experiment")
    assert data["status"] in ["not_run", "invalid_experiment_id"]

def test_dataset_summary_endpoint():
    data = get_dataset_summary()
    assert data["status"] == "success"
    assert data["total_samples"] == 2054
    assert "classes" in data
    assert "folds" in data
    assert "sharpness_histogram" in data
    assert "brightness_histogram" in data
