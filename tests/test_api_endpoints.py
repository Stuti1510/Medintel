"""
MEDINTEL AI - FastAPI Endpoints Integration Tests (4-Dataset System)
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_system_status():
    response = client.get("/api/system/status")
    assert response.status_code == 200
    data = response.json()
    assert "components" in data
    assert data["components"]["classical_ml"]["status"] == "ONLINE"
    assert data["components"]["biobert_transformer"]["status"] == "READY"

def test_evaluation_benchmarks():
    response = client.get("/api/evaluation")
    assert response.status_code == 200
    data = response.json()
    assert "comparison" in data
    assert len(data["comparison"]) >= 3

def test_datasets_endpoints():
    res = client.get("/api/datasets?dataset_id=cardio_train")
    assert res.status_code == 200
    data = res.json()
    assert "all_datasets" in data
    assert len(data["all_datasets"]) >= 4

    res_all = client.get("/api/datasets?dataset_id=all")
    assert res_all.status_code == 200
    assert res_all.json()["num_classes"] >= 100

    res_dis = client.get("/api/datasets/diseases")
    assert res_dis.status_code == 200
    assert "unified_disease_classes" in res_dis.json()

    res_prev = client.get("/api/datasets/preview?dataset_id=cardio_train&limit=5")
    assert res_prev.status_code == 200
    p_data = res_prev.json()
    assert "rows" in p_data
    assert len(p_data["rows"]) == 5

def test_full_clinical_analysis():
    payload = {
        "age": 58,
        "sex": "Male",
        "symptoms": "High blood pressure (168/105 mmHg), occipital headache, palpitations, exertional dyspnea",
        "duration": "2 weeks",
        "severity": "Critical",
        "clinical_narrative": "58-year-old male presenting with Stage 2 hypertensive urgency, BP 168/105 mmHg, serum cholesterol above normal, chronic tobacco use.",
        "vitals": {
            "heart_rate": 96,
            "systolic_bp": 168,
            "diastolic_bp": 105,
            "temperature": 36.8,
            "spo2": 95
        },
        "height": 172,
        "weight": 88,
        "cholesterol": 2,
        "gluc": 2,
        "smoke": 1,
        "alco": 0,
        "active": 0
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    res = response.json()
    valid_classes = {"No Cardiovascular Disease", "Cardiovascular Disease"}
    assert res["ml_prediction"]["predicted_condition"] in valid_classes
    assert len(res["top_differentials"]) > 0
    assert len(res["retrieved_evidence"]) > 0
    assert isinstance(res["safety_flags"], list)
    assert res["database_persisted"] is True
