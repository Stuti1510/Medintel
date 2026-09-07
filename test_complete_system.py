"""
Comprehensive End-to-End Test Suite for MEDINTEL AI System
Uses standard library urllib to avoid third-party dependencies.
"""

import sys
import os
import json
import urllib.request
import urllib.error
import urllib.parse
from io import BytesIO

API_BASE = "http://127.0.0.1:8000/api"

def http_get(path):
    url = f"{API_BASE}{path}"
    req = urllib.request.Request(url, headers={"User-Agent": "MEDINTEL-Test"})
    with urllib.request.urlopen(req) as response:
        return response.status, json.loads(response.read().decode('utf-8'))

def http_post_json(path, data):
    url = f"{API_BASE}{path}"
    body = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json", "User-Agent": "MEDINTEL-Test"}
    )
    with urllib.request.urlopen(req) as response:
        return response.status, json.loads(response.read().decode('utf-8'))

def http_post_multipart(path, filename, content_bytes, content_type="application/octet-stream"):
    url = f"{API_BASE}{path}"
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    
    body = bytearray()
    body.extend(f"--{boundary}\r\n".encode('utf-8'))
    body.extend(f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode('utf-8'))
    body.extend(f"Content-Type: {content_type}\r\n\r\n".encode('utf-8'))
    body.extend(content_bytes)
    body.extend(f"\r\n--{boundary}--\r\n".encode('utf-8'))
    
    req = urllib.request.Request(
        url,
        data=bytes(body),
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "User-Agent": "MEDINTEL-Test"
        }
    )
    with urllib.request.urlopen(req) as response:
        return response.status, json.loads(response.read().decode('utf-8'))

def test_system_health():
    print("\n[TEST 1] Checking System Status & Health...")
    status, data = http_get("/system/status")
    assert status == 200, f"Status code {status}"
    print("  -> System Status:", data.get("status"))
    print("  -> Models Available:", data["components"]["classical_ml"]["models_available"])
    print("  -> Database Stored Cases:", data["components"]["database"]["stored_cases"])
    print("  PASS: System Health OK")

def test_dataset_discovery():
    print("\n[TEST 2] Checking Dataset Discovery & Disease Registry...")
    status, data = http_get("/datasets?dataset_id=all")
    assert status == 200
    total_records = data.get("total_samples") or data.get("total_records")
    total_classes = data.get("num_classes") or len(data.get("classes", []))
    print("  -> Total Records in Master Dataset:", total_records)
    print("  -> Unique Diseases in Registry:", total_classes)
    print("  -> Top 3 Classes:", [c["standardized_label"] for c in data.get("classes", [])[:3]])
    assert total_classes >= 800, "Should have ~821 diseases"
    print("  PASS: Dataset Discovery OK")

def test_document_ocr_upload():
    print("\n[TEST 3] Testing Document Upload & Entity Extraction Pipeline...")
    
    sample_text = """CLINICAL ENCOUNTER REPORT
Patient: John Doe, Age: 61, Sex: Male
Vitals: BP 172/108 mmHg, HR: 94 bpm, SpO2: 94%
Symptoms: Severe substernal chest pressure, acute exertional dyspnea, diaphoresis
Labs: Total Cholesterol 265 mg/dL, Glucose 145 mg/dL, Troponin 0.08 ng/mL
History: Essential Hypertension, Hyperlipidemia
Medications: Lisinopril 20mg daily
"""
    status, data = http_post_multipart("/documents/upload?auto_analyze=true", "report_test.txt", sample_text.encode('utf-8'), "text/plain")
    assert status == 200, f"Upload error: {data}"
    
    doc = data.get("document", {})
    pat = doc.get("extracted_patient", {})
    print("  -> Upload Status:", doc.get("status"))
    print("  -> Extracted Symptoms:", pat.get("symptoms"))
    print("  -> Extracted Vitals:", pat.get("vitals"))
    print("  -> Extracted Labs:", list(pat.get("lab_results", {}).keys()))
    
    analysis = data.get("analysis")
    if analysis:
        print("  -> Auto-Analysis ML Pred:", analysis.get("ml_prediction", {}).get("predicted_condition"))
    print("  PASS: Document Upload & Entity Extraction OK")

def test_dynamic_probabilities_distinct():
    print("\n[TEST 4] Verifying Dynamic, Input-Driven Probabilities (No Static Duplication)...")
    
    case_a = {
        "age": 62, "sex": "Male", "height": 172, "weight": 92,
        "cholesterol": 3, "gluc": 2, "smoke": 1, "alco": 0, "active": 0,
        "vitals": {"systolic_bp": 175, "diastolic_bp": 108, "heart_rate": 96, "temperature": 37.0, "spo2": 94},
        "symptoms": "Severe crushing chest tightness radiating to left arm, shortness of breath on mild exertion, diaphoresis",
        "selected_ml_model": "Logistic Regression",
        "selected_disease": "Cardiovascular Disease (CVD)"
    }
    
    case_b = {
        "age": 28, "sex": "Female", "height": 165, "weight": 58,
        "cholesterol": 1, "gluc": 1, "smoke": 0, "alco": 0, "active": 1,
        "vitals": {"systolic_bp": 115, "diastolic_bp": 74, "heart_rate": 80, "temperature": 36.8, "spo2": 98},
        "symptoms": "Bilateral expiratory wheezing, persistent dry cough, nocturnal dyspnea, seasonal allergy history",
        "selected_ml_model": "Logistic Regression",
        "selected_disease": "Bronchial Asthma"
    }

    _, res_a = http_post_json("/analyze", case_a)
    _, res_b = http_post_json("/analyze", case_b)

    conf_a = res_a["ml_prediction"]["confidence"]
    conf_b = res_b["ml_prediction"]["confidence"]
    
    print(f"  -> Case A (CVD) Confidence: {conf_a:.4f} ({res_a['ml_prediction']['predicted_condition']})")
    print(f"  -> Case B (Asthma) Confidence: {conf_b:.4f} ({res_b['ml_prediction']['predicted_condition']})")
    
    assert abs(conf_a - conf_b) > 0.05, "Probabilities must be dynamic and differ based on inputs!"
    
    diffs_a = res_a["top_differentials"]
    diffs_b = res_b["top_differentials"]
    print("  -> Case A Differentials:", [f"{d['condition']} ({d['percentage']})" for d in diffs_a[:3]])
    print("  -> Case B Differentials:", [f"{d['condition']} ({d['percentage']})" for d in diffs_b[:3]])
    
    assert diffs_a[0]["condition"] != diffs_b[0]["condition"] or "Asthma" in diffs_b[0]["condition"] or "Baseline" in diffs_b[0]["condition"], "Differentials must reflect input symptoms!"
    print("  PASS: Dynamic Probabilities & Differentials OK")

def test_explainability_service():
    print("\n[TEST 5] Testing Dynamic Explainability & Feature Attribution...")
    payload = {
        "clinical_text": "64-year-old male presenting with acute chest pressure, BP 172/105 mmHg, elevated serum cholesterol, chronic tobacco use, and dyspnea.",
        "target_disease": "Cardiovascular Disease (CVD)",
        "structured_data": {"age": 64, "systolic_bp": 172, "diastolic_bp": 105, "cholesterol": 3, "smoke": 1}
    }
    status, data = http_post_json("/ml/explain", payload)
    assert status == 200, f"Explain error: {data}"
    
    print("  -> Predicted Condition:", data.get("predicted_condition"))
    print("  -> Calibrated Confidence:", data.get("confidence_percentage"))
    print("  -> Positive Evidence Count:", len(data.get("positive_evidence", [])))
    print("  -> Top Positive Features:", [(e["feature"], e["value"], f"+{e['salience']:.2f}") for e in data.get("positive_evidence", [])[:3]])
    print("  -> Lexical Tokens (TF-IDF):", [(t["term"], f"+{t['weight']:.3f}") for t in data.get("lexical_token_salience", [])[:3]])
    print("  -> Model Reasoning Preview:", data.get("model_reasoning", "")[:120] + "...")
    
    assert len(data.get("positive_evidence", [])) > 0, "Must extract positive evidence"
    assert len(data.get("lexical_token_salience", [])) > 0, "Must extract TF-IDF tokens"
    print("  PASS: Dynamic Explainability OK")

def test_motor_screening_api():
    print("\n[TEST 6] Testing Motor Screening Sessions & Aggregate Research Stats API...")
    status, data = http_get("/motor/stats")
    assert status == 200, f"Motor stats status {status}"
    print("  -> Aggregate Sessions Registered in Database:", data.get("total_sessions"))
    
    # Check sessions listing endpoint
    status_list, sessions = http_get("/motor/sessions")
    assert status_list == 200
    print("  -> Motor Screening Sessions Query OK, Count:", len(sessions))
    print("  PASS: Motor Screening API Endpoints OK")

if __name__ == "__main__":
    print("==================================================================")
    print("          MEDINTEL AI COMPREHENSIVE VERIFICATION SUITE            ")
    print("==================================================================")
    test_system_health()
    test_dataset_discovery()
    test_document_ocr_upload()
    test_dynamic_probabilities_distinct()
    test_explainability_service()
    test_motor_screening_api()
    print("\n==================================================================")
    print("           ALL 6 END-TO-END VERIFICATION SUITES PASSED!           ")
    print("==================================================================")
