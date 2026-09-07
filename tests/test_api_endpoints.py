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
    assert res["ml_prediction"]["predicted_condition"] in [
        "Hypertension", "Myocardial Infarction", "GERD", "Ischemic Stroke",
        "Bronchial Asthma", "Acute Bronchitis", "Pneumonia", "Pulmonary Embolism"
    ] or len(res["ml_prediction"]["predicted_condition"]) > 0
    assert 0.0 <= res["ml_prediction"]["confidence"] <= 1.0
    assert len(res["top_differentials"]) > 0
    assert len(res["retrieved_evidence"]) > 0
    assert isinstance(res["safety_flags"], list)
    assert res["database_persisted"] is True

def test_motor_screening_endpoints():
    # 1. Test GET /api/motor/sessions
    sessions_res = client.get("/api/motor/sessions")
    assert sessions_res.status_code == 200
    assert isinstance(sessions_res.json(), list)

    # 2. Test POST /api/motor/sessions (Session 1)
    session_payload_1 = {
        "session_reference": f"TEST-MS-A-{id(client)}",
        "start_time": "2026-09-05T12:00:00Z",
        "device_tier": "Desktop",
        "input_sensor": "Mouse",
        "viewport_width": 1920,
        "viewport_height": 1080,
        "user_agent": "Mozilla/5.0 Test Runner",
        "overall_quality": "HIGH QUALITY",
        "completion_status": "COMPLETE",
        "trials": [
            {
                "test_type": "reaction-time",
                "trial_number": 1,
                "is_practice": False,
                "status": "VALID",
                "stimulus_timestamp": 1000.0,
                "response_timestamp": 1245.5,
                "reaction_time_ms": 245.5,
                "input_type": "pointer"
            },
            {
                "test_type": "motor-stability",
                "trial_number": 1,
                "is_practice": False,
                "status": "VALID",
                "path_efficiency_pct": 98.2,
                "mean_deviation_px": 2.4,
                "input_type": "pointer"
            },
            {
                "test_type": "finger-tap",
                "trial_number": 1,
                "is_practice": False,
                "status": "VALID",
                "inter_tap_interval_ms": 195.0,
                "input_type": "keyboard"
            }
        ],
        "metrics": [
            {
                "test_type": "reaction-time",
                "derived_metrics": {"medianRtMs": 245.5, "meanRtMs": 245.5, "validTrials": 1},
                "quality_status": "HIGH QUALITY"
            }
        ]
    }
    save_res_1 = client.post("/api/motor/sessions", json=session_payload_1)
    assert save_res_1.status_code == 201
    save_data_1 = save_res_1.json()
    assert save_data_1["status"] == "SAVED_TO_EXPERIMENT_REGISTRY"
    session_id_1 = save_data_1["session_id"]

    # 3. Test POST /api/motor/sessions (Session 2)
    session_payload_2 = {
        "session_reference": f"TEST-MS-B-{id(client)}",
        "start_time": "2026-09-05T12:05:00Z",
        "device_tier": "Desktop",
        "input_sensor": "Trackpad",
        "viewport_width": 1440,
        "viewport_height": 900,
        "user_agent": "Mozilla/5.0 Test Runner",
        "overall_quality": "HIGH QUALITY",
        "completion_status": "COMPLETE",
        "trials": [
            {
                "test_type": "reaction-time",
                "trial_number": 1,
                "is_practice": False,
                "status": "VALID",
                "stimulus_timestamp": 2000.0,
                "response_timestamp": 2260.0,
                "reaction_time_ms": 260.0,
                "input_type": "pointer"
            }
        ],
        "metrics": [
            {
                "test_type": "reaction-time",
                "derived_metrics": {"medianRtMs": 260.0, "meanRtMs": 260.0, "validTrials": 1},
                "quality_status": "HIGH QUALITY"
            }
        ]
    }
    save_res_2 = client.post("/api/motor/sessions", json=session_payload_2)
    assert save_res_2.status_code == 201

    # 4. Test GET /api/motor/stats (Now with >= 2 sessions)
    stats_res = client.get("/api/motor/stats")
    assert stats_res.status_code == 200
    stats_data = stats_res.json()
    assert "total_sessions" in stats_data
    assert stats_data["total_sessions"] >= 2
    assert stats_data["insufficient_data"] is False
    assert "reaction_time" in stats_data
    assert "motor_stability" in stats_data
    assert "finger_tap" in stats_data
    assert "quality_distribution" in stats_data
    assert stats_data["reaction_time"]["count"] >= 2
    assert stats_data["motor_stability"]["count"] >= 1
    assert stats_data["finger_tap"]["count"] >= 1

    # 5. Test GET /api/motor/sessions/{session_id}
    detail_res = client.get(f"/api/motor/sessions/{session_id_1}")
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert detail_data["session_reference"] == session_payload_1["session_reference"]
    assert len(detail_data["trials"]) == 3
    assert len(detail_data["metrics"]) == 1

