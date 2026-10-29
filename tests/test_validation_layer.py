"""
MEDINTEL AI - Clinical Validation Layer Tests
Verifies:
1. Step 1: Extraction and strict preservation of the Source of Truth from patient inputs without inventing missing numbers.
2. Step 2: Constrained synthesis prompt formatting and physiological conflict detection.
3. Step 3: Deterministic (non-LLM) Output Validation comparing generated summaries against the Source of Truth and triggering safe structured fallbacks on discrepancies.
4. Step 4: Accurate labeling of model classification scores and calibration status (preventing uncalibrated scores from being presented as verified disease probabilities).
5. End-to-end integration through /api/analyze.
"""

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.clinical_validator import (
    extract_source_of_truth,
    ClinicalOutputValidator,
    build_safe_structured_fallback_summary,
    StructuredClinicalData
)
from backend.app.services.clinical_orchestrator import ClinicalAnalysisOrchestrator

client = TestClient(app)

# ============================================================================
# Step 1: Source of Truth Extraction
# ============================================================================

def test_source_of_truth_extraction_preserves_exact_user_input():
    """Verify that user-provided vitals and demographics are extracted exactly as given."""
    payload = {
        "age": 63,
        "sex": "Male",
        "symptoms": "High fever, shivering, and rapid heart rate",
        "clinical_narrative": "63-year-old male presenting with acute febrile illness",
        "vitals": {
            "heart_rate": 115,
            "systolic_bp": 90,
            "diastolic_bp": 60,
            "temperature": 39.4,
            "spo2": 92
        }
    }
    sot = extract_source_of_truth(payload)
    assert sot.age == 63
    assert sot.sex == "Male"
    assert sot.heart_rate == 115
    assert sot.systolic_bp == 90
    assert sot.diastolic_bp == 60
    assert sot.temperature == 39.4
    assert sot.spo2 == 92
    assert sot.blood_pressure_str == "90/60 mmHg"
    assert sot.heart_rate_str == "115 bpm"
    assert "39.4" in sot.temperature_str
    assert sot.spo2_str == "92%"
    assert len(sot.missing_measurements) == 0

    # Verify physiological conflict detection: Low BP (90/60) with Tachycardia (115 bpm) -> shock index
    alert_types = [a["type"] for a in sot.physiological_alerts]
    assert "HEMODYNAMIC_CONFLICT_SHOCK_RISK" in alert_types
    # Pyrexia (39.4°C) with Hypoxemia (92%)
    assert "RESPIRATORY_FEBRILE_COMPROMISE" in alert_types

def test_source_of_truth_never_invents_missing_values():
    """Verify that unrecorded parameters are tracked as missing and NEVER replaced with default numbers."""
    payload = {
        "age": 42,
        "sex": "Female",
        "symptoms": "Occipital throbbing headache and light sensitivity",
        "clinical_narrative": "42-year-old female presenting with episodic migraine"
        # No vitals supplied
    }
    sot = extract_source_of_truth(payload)
    assert sot.heart_rate is None
    assert sot.systolic_bp is None
    assert sot.diastolic_bp is None
    assert sot.temperature is None
    assert sot.spo2 is None
    assert sot.blood_pressure_str == "Unrecorded (Not provided)"
    assert sot.heart_rate_str == "Unrecorded (Not provided)"
    assert "heart_rate" in sot.missing_measurements
    assert "systolic_bp" in sot.missing_measurements
    assert "temperature" in sot.missing_measurements
    assert "spo2" in sot.missing_measurements

# ============================================================================
# Step 2 & 3: Deterministic Output Validation Layer
# ============================================================================

def test_output_validator_detects_biometric_discrepancy():
    """
    Verify that if the generated text invents or distorts biometrics
    (e.g. input HR=115 bpm, but summary says HR=78 bpm), the validator flags the discrepancy.
    DOES NOT rely on another LLM call.
    """
    sot = StructuredClinicalData(
        age=63,
        sex="Male",
        symptoms="High fever, chills",
        heart_rate=115,
        systolic_bp=90,
        diastolic_bp=60,
        temperature=39.4,
        spo2=92
    )

    # Hallucinated text with wrong heart rate (78 instead of 115) and wrong BP (120/80)
    conflicting_summary = """
    ### 1. Executive Clinical Summary
    The patient is a 63-year-old Male presenting with fever.
    Vital signs: Blood Pressure 120/80 mmHg, Heart Rate: 78 bpm, Temperature: 37.0 °C, SpO2: 98%.
    """

    is_valid, discrepancies, extracted = ClinicalOutputValidator.validate(conflicting_summary, sot)
    assert is_valid is False
    assert len(discrepancies) >= 2

    fields_flagged = [d["field"] for d in discrepancies]
    assert "heart_rate" in fields_flagged
    assert "blood_pressure" in fields_flagged

    hr_disc = next(d for d in discrepancies if d["field"] == "heart_rate")
    assert hr_disc["expected"] == 115
    assert 78 in hr_disc["found"]

def test_output_validator_passes_when_source_of_truth_is_preserved():
    """Verify that when generated text accurately reproduces the Source of Truth, validation passes."""
    sot = StructuredClinicalData(
        age=63,
        sex="Male",
        symptoms="High fever, chills",
        heart_rate=115,
        systolic_bp=90,
        diastolic_bp=60,
        temperature=39.4,
        spo2=92
    )

    concordant_summary = """
    ### 1. Executive Clinical Summary
    The patient is a 63-year-old Male presenting with high fever.
    Biometrics: Blood Pressure 90/60 mmHg, Heart Rate: 115 bpm, Temperature: 39.4 °C, SpO2: 92%.
    """

    is_valid, discrepancies, extracted = ClinicalOutputValidator.validate(concordant_summary, sot)
    assert is_valid is True
    assert len(discrepancies) == 0

def test_safe_fallback_summary_remediates_discrepancy():
    """Verify that fallback summary deterministically restores exact biometrics and flags discrepancies."""
    sot = StructuredClinicalData(
        age=63,
        sex="Male",
        symptoms="High fever, chills, tachycardia",
        clinical_narrative="Patient acute presentation",
        heart_rate=115,
        systolic_bp=90,
        diastolic_bp=60,
        temperature=39.4,
        spo2=92,
        physiological_alerts=[{
            "type": "HEMODYNAMIC_CONFLICT_SHOCK_RISK",
            "severity": "CRITICAL",
            "message": "Hypotension with Tachycardia"
        }]
    )

    mock_discrepancies = [{
        "field": "heart_rate",
        "expected": 115,
        "found": [78]
    }]

    fallback = build_safe_structured_fallback_summary(
        source_of_truth=sot,
        ml_result={"model_name": "Logistic Regression", "predicted_condition": "Malaria", "confidence_percentage": "88.5%"},
        transformer_result={"predicted_condition": "Malaria", "confidence_percentage": "85.0%"},
        retrieved_evidence=[{"title": "Malaria Clinical Guideline", "source": "WHO", "snippet": "Guidelines for febrile illness."}],
        safety_flags=[{"severity": "CRITICAL", "message": "High fever with tachycardia"}],
        discrepancies=mock_discrepancies
    )

    # Must contain exact biometrics
    assert "115 bpm" in fallback
    assert "90/60 mmHg" in fallback
    assert "39.4" in fallback
    assert "92%" in fallback
    assert "Output Validation Alert" in fallback
    assert "verified clinical diagnostic probability" in fallback

    # Validating the fallback summary itself against the source of truth must PASS
    is_valid, disc, _ = ClinicalOutputValidator.validate(fallback, sot)
    assert is_valid is True
    assert len(disc) == 0

# ============================================================================
# Step 4: Prediction Display & Calibration Labels
# ============================================================================

def test_model_score_meaning_and_calibration_labels():
    """Verify that model scores are explicitly labeled with their true calibration status."""
    orchestrator = ClinicalAnalysisOrchestrator()

    # 1. Linear SVM should be marked as Calibrated Platt Scaling
    res_svm = orchestrator.analyze({
        "age": 45,
        "sex": "Female",
        "symptoms": "Itchy silver flaking patches on scalp and elbows",
        "selected_ml_model": "Linear SVM"
    })
    ml_svm = res_svm["ml_prediction"]
    assert ml_svm["is_calibrated"] is True
    assert "Platt Scaling" in ml_svm["calibration_status"]
    assert "requires independent clinical validation" in ml_svm["clinical_interpretation"]

    # 2. Logistic Regression / Random Forest should be explicitly marked as uncalibrated statistical estimates
    res_lr = orchestrator.analyze({
        "age": 45,
        "sex": "Female",
        "symptoms": "Itchy silver flaking patches on scalp and elbows",
        "selected_ml_model": "Logistic Regression"
    })
    ml_lr = res_lr["ml_prediction"]
    assert ml_lr["is_calibrated"] is False
    assert "NOT a verified clinical disease probability" in ml_lr["clinical_interpretation"]
    assert "Score" in ml_lr["score_meaning"]

# ============================================================================
# End-to-End API Integration
# ============================================================================

def test_api_analyze_e2e_source_of_truth_and_output_validation():
    """
    End-to-end test verifying:
    Patient Input → Input Validation → Structured Clinical Data → ML Prediction
    → Evidence Retrieval → Constrained Synthesis → Output Validation → Final Report
    """
    payload = {
        "age": 63,
        "sex": "Male",
        "symptoms": "Fever, chills, shivering, headache, and sweating",
        "clinical_narrative": "63-year-old male presenting with acute febrile presentation",
        "vitals": {
            "heart_rate": 115,
            "systolic_bp": 90,
            "diastolic_bp": 60,
            "temperature": 39.4,
            "spo2": 92
        },
        "selected_ml_model": "Linear SVM"
    }

    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    # 1. Source of Truth
    assert "source_of_truth" in data
    sot = data["source_of_truth"]
    assert sot["heart_rate"] == 115
    assert sot["systolic_bp"] == 90
    assert sot["diastolic_bp"] == 60
    assert sot["temperature"] == 39.4
    assert sot["spo2"] == 92

    # 2. Output Validation
    assert "output_validation" in data
    val = data["output_validation"]
    assert val["validation_passed"] is True
    assert val["status"] in ["PASSED", "DISCREPANCY_REMEDIATED"]
    assert len(val["rules_enforced"]) >= 4

    # 3. Model score annotation
    assert data["ml_prediction"]["is_calibrated"] is True
    assert "Platt" in data["ml_prediction"]["calibration_status"]
    assert "score_meaning" in data["ml_prediction"]

    # 4. LLM synthesis preserves Source of Truth
    summary = data["llm_explanation"]["explanation_markdown"]
    assert "115 bpm" in summary
    assert "90/60" in summary
    assert "39.4" in summary
    assert "92%" in summary
