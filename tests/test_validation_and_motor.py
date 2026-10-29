"""
MEDINTEL AI - Validation & Motor Screening Regression Tests
Verifies fixes for:
- Bug 1 & 2: Motor screening session constraints, trial coordinate boundaries, and completion invariants.
- Bug 3: Prevention of disease prediction when input symptoms/narratives are empty, null, or whitespace.
- Bug 4: Physiological domain bounds validation for vitals (BP, HR, Temp, SpO2) preventing faulty or impossible predictions.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.clinical_orchestrator import ClinicalAnalysisOrchestrator
from ml.inference.classical_inference import ClassicalMLInferenceService

client = TestClient(app)

# ============================================================================
# Bug 3: Missing / Empty / Whitespace-only Input Validation
# ============================================================================

def test_api_analyze_rejects_empty_symptoms():
    """Verify that /api/analyze rejects empty symptoms with HTTP 422."""
    payload = {
        "age": 45,
        "sex": "Female",
        "symptoms": "",
        "clinical_narrative": ""
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert any("at least 5 characters" in str(err) or "symptoms" in str(err).lower() for err in data["detail"])

def test_api_analyze_rejects_whitespace_only_symptoms():
    """Verify that /api/analyze rejects whitespace-only symptoms with HTTP 422."""
    payload = {
        "age": 52,
        "sex": "Male",
        "symptoms": "    \n\t   ",
        "clinical_narrative": "   "
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert any("at least 5 characters" in str(err) for err in data["detail"])

def test_api_analyze_rejects_purely_numeric_or_symbolic_symptoms():
    """Verify that /api/analyze rejects inputs lacking descriptive alphabetic words."""
    payload = {
        "age": 30,
        "sex": "Female",
        "symptoms": "1234567890 !@#$$%",
        "clinical_narrative": ""
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert any("alphabetic words" in str(err) for err in data["detail"])

def test_api_ml_predict_rejects_empty_clinical_text():
    """Verify that /api/ml/predict rejects empty string with HTTP 422."""
    response = client.post("/api/ml/predict", json={"clinical_text": ""})
    assert response.status_code == 422

    response_ws = client.post("/api/ml/predict", json={"clinical_text": "   \n\t "})
    assert response_ws.status_code == 422

def test_orchestrator_raises_on_empty_input():
    """Verify that orchestrator directly raises ValueError when clinical symptoms are missing."""
    orchestrator = ClinicalAnalysisOrchestrator()
    with pytest.raises(ValueError, match="No clinical symptoms or narrative provided"):
        orchestrator.analyze({
            "age": 50,
            "sex": "Male",
            "symptoms": "",
            "clinical_narrative": ""
        })

def test_classical_inference_raises_on_empty_input():
    """Verify that classical inference service directly raises ValueError on empty or whitespace strings."""
    service = ClassicalMLInferenceService()
    with pytest.raises(ValueError, match="too short|minimum 5 characters"):
        service.predict("")
    with pytest.raises(ValueError, match="too short|minimum 5 characters"):
        service.predict("   ")
    with pytest.raises(ValueError, match="too short|minimum 5 characters"):
        service.predict("abc")
    with pytest.raises(ValueError, match="cannot be None"):
        service.predict(None)
    with pytest.raises(ValueError, match="not purely numbers or symbols"):
        service.predict("1234567890")

# ============================================================================
# Bug 4: Physiological Domain Bounds & Faulty Predictions
# ============================================================================

def test_api_analyze_rejects_impossible_systolic_bp():
    """Verify that systolic blood pressure > 300 mmHg is rejected."""
    payload = {
        "age": 55,
        "sex": "Male",
        "symptoms": "Occipital headache and dizziness",
        "vitals": {
            "systolic_bp": 500,  # Impossible
            "diastolic_bp": 80
        }
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 422

def test_api_analyze_rejects_inverted_blood_pressure():
    """Verify that systolic BP <= diastolic BP is rejected."""
    payload = {
        "age": 55,
        "sex": "Male",
        "symptoms": "Occipital headache and dizziness",
        "vitals": {
            "systolic_bp": 80,
            "diastolic_bp": 120  # Systolic < Diastolic is physiologically impossible
        }
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert any("strictly greater than diastolic" in str(err) for err in data["detail"])

def test_api_analyze_rejects_impossible_heart_rate():
    """Verify that heart rate outside [20, 280] is rejected."""
    payload_high = {
        "age": 40,
        "sex": "Female",
        "symptoms": "Chest palpitations and sweating",
        "vitals": {"heart_rate": 350}  # Impossible
    }
    assert client.post("/api/analyze", json=payload_high).status_code == 422

    payload_low = {
        "age": 40,
        "sex": "Female",
        "symptoms": "Chest palpitations and sweating",
        "vitals": {"heart_rate": 10}  # Below viable range
    }
    assert client.post("/api/analyze", json=payload_low).status_code == 422

def test_api_analyze_rejects_impossible_temperature():
    """Verify that body temperature outside [28.0, 45.0] °C is rejected."""
    payload = {
        "age": 35,
        "sex": "Male",
        "symptoms": "High fever and shivering",
        "vitals": {"temperature": 55.0}  # Lethal / impossible
    }
    assert client.post("/api/analyze", json=payload).status_code == 422

def test_api_analyze_rejects_impossible_spo2():
    """Verify that SpO2 outside [40, 100]% is rejected."""
    payload_high = {
        "age": 60,
        "sex": "Male",
        "symptoms": "Shortness of breath",
        "vitals": {"spo2": 105}
    }
    assert client.post("/api/analyze", json=payload_high).status_code == 422

    payload_low = {
        "age": 60,
        "sex": "Male",
        "symptoms": "Shortness of breath",
        "vitals": {"spo2": 25}
    }
    assert client.post("/api/analyze", json=payload_low).status_code == 422

def test_api_analyze_accepts_valid_physiological_vitals():
    """Verify that realistic vitals within bounds pass validation and yield predictions."""
    payload = {
        "age": 48,
        "sex": "Male",
        "symptoms": "Occipital headache, pounding chest, blurred vision, exertional fatigue",
        "vitals": {
            "systolic_bp": 155,
            "diastolic_bp": 98,
            "heart_rate": 88,
            "temperature": 37.1,
            "spo2": 97
        }
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "ml_prediction" in data
    assert data["ml_prediction"]["predicted_condition"] in [
        "Hypertension", "Migraine", "Cervical spondylosis", "Heart attack"
    ] or len(data["ml_prediction"]["predicted_condition"]) > 0

# ============================================================================
# Bug 1 & 2: Motor Screening Session & Trial Validation
# ============================================================================

def test_motor_session_cannot_be_complete_with_zero_trials():
    """Verify that a session marked COMPLETE with 0 trials is rejected with HTTP 422."""
    payload = {
        "session_reference": "EMPTY-COMPLETE-SESSION-001",
        "overall_quality": "HIGH QUALITY",
        "completion_status": "COMPLETE",
        "trials": []
    }
    response = client.post("/api/motor/sessions", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert any("cannot be marked as COMPLETE without recorded trial" in str(err) for err in data["detail"])

def test_motor_trial_rejects_out_of_bound_metrics():
    """Verify that trials with impossible metrics (e.g. negative reaction time) are rejected."""
    payload_neg_rt = {
        "session_reference": "INVALID-RT-SESSION-002",
        "completion_status": "PARTIAL",
        "trials": [
            {
                "test_type": "reaction-time",
                "trial_number": 1,
                "reaction_time_ms": -120.0  # Impossible negative reaction time
            }
        ]
    }
    assert client.post("/api/motor/sessions", json=payload_neg_rt).status_code == 422

    payload_overflow_path = {
        "session_reference": "INVALID-PATH-SESSION-003",
        "completion_status": "PARTIAL",
        "trials": [
            {
                "test_type": "motor-stability",
                "trial_number": 1,
                "path_efficiency_pct": 150.0  # Cannot exceed 100%
            }
        ]
    }
    assert client.post("/api/motor/sessions", json=payload_overflow_path).status_code == 422
