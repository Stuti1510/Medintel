"""
MEDINTEL AI - FastAPI Endpoints Integration Tests
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
    assert len(data["comparison"]) >= 4

def test_full_clinical_analysis():
    payload = {
        "age": 58,
        "sex": "Male",
        "symptoms": "crushing substernal chest pain, radiation to left arm and jaw, diaphoresis, shortness of breath",
        "duration": "3 hours",
        "severity": "Critical",
        "clinical_narrative": "58-year-old male with acute crushing chest pain radiating to left arm for 3 hours. HR 110, BP 165/100, Temp 36.8, SpO2 93%.",
        "vitals": {
            "heart_rate": 110,
            "systolic_bp": 165,
            "diastolic_bp": 100,
            "temperature": 36.8,
            "spo2": 93
        }
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["transformer_prediction"]["predicted_condition"] == "Myocardial Infarction"
    assert len(res["top_differentials"]) > 0
    assert len(res["retrieved_evidence"]) > 0
    assert len(res["safety_flags"]) > 0
    assert res["database_persisted"] is True
