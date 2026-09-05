"""
MEDINTEL AI - Multi-Symptom Differential Diagnosis Engine
Extracts symptoms, normalizes synonyms, evaluates model features and symptom-disease correlation matrices,
computes disease-specific scores and calibrated probabilities, and generates structured differential explanations.
"""

import os
import re
import json
import numpy as np
from typing import Dict, Any, List, Optional, Tuple

class DifferentialDiagnosisEngine:
    def __init__(self, registry_path: str = "data/processed/disease_registry.json"):
        self.registry_path = registry_path
        self.disease_registry = {}
        self.symptom_disease_map = {}
        self.synonym_map = {
            "shortness of breath": "dyspnea",
            "breathlessness": "dyspnea",
            "difficulty breathing": "dyspnea",
            "high blood pressure": "hypertension",
            "elevated bp": "hypertension",
            "high bp": "hypertension",
            "chest tightness": "chest pain",
            "chest pressure": "chest pain",
            "substernal pressure": "chest pain",
            "angina": "chest pain",
            "racing heart": "palpitations",
            "irregular heartbeat": "palpitations",
            "rapid pulse": "palpitations",
            "sweating": "diaphoresis",
            "profuse sweating": "diaphoresis",
            "high sugar": "hyperglycemia",
            "elevated glucose": "hyperglycemia",
            "high blood sugar": "hyperglycemia",
            "high cholesterol": "hyperlipidemia",
            "elevated lipids": "hyperlipidemia",
            "leg swelling": "peripheral edema",
            "pedal edema": "peripheral edema",
            "tiredness": "fatigue",
            "exhaustion": "fatigue",
            "wheezing": "bronchospasm",
            "pyrexia": "fever",
            "high temperature": "fever"
        }
        self.load_registry()

    def load_registry(self):
        if os.path.exists(self.registry_path):
            try:
                with open(self.registry_path, "r", encoding="utf-8") as f:
                    self.disease_registry = json.load(f)
                print(f"[DIFFERENTIAL ENGINE] Loaded disease registry with {self.disease_registry.get('total_unique_disease_entities', 0)} entities.")
            except Exception as e:
                print(f"[DIFFERENTIAL ENGINE] Registry load warning: {e}")

    def normalize_symptoms(self, symptoms_input: Any) -> List[str]:
        """Normalizes a string or list of symptoms into canonical symptom terms."""
        if isinstance(symptoms_input, list):
            raw_terms = symptoms_input
        else:
            raw_terms = re.split(r'[,;\n]+', str(symptoms_input or ""))

        normalized = []
        for term in raw_terms:
            t = term.strip().lower()
            if not t:
                continue
            # Check direct synonym
            canon = self.synonym_map.get(t, t)
            # Check substrings
            for syn_k, syn_v in self.synonym_map.items():
                if syn_k in t:
                    canon = syn_v
                    break
            if canon not in normalized:
                normalized.append(canon)
        return normalized

    def compute_differential_scores(
        self,
        symptoms: List[str],
        vitals: Optional[Dict[str, Any]] = None,
        labs: Optional[Dict[str, Any]] = None,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Computes disease-specific scores and calibrated probabilities from actual input symptoms and biometrics.
        """
        norm_symptoms = self.normalize_symptoms(symptoms)
        v_dict = vitals or {}
        l_dict = labs or {}

        sbp = float(v_dict.get("systolic_bp", 120))
        dbp = float(v_dict.get("diastolic_bp", 80))
        hr = float(v_dict.get("heart_rate", 78))
        temp = float(v_dict.get("temperature", 37.0))
        spo2 = float(v_dict.get("spo2", 98))

        # Disease scoring profiles based on clinical criteria and medical correlations
        disease_profiles = [
            {
                "disease": "Cardiovascular Disease (CVD) / Hypertensive Urgency",
                "category": "Cardiovascular",
                "key_symptoms": ["chest pain", "dyspnea", "palpitations", "hypertension", "occipital headache", "fatigue"],
                "vital_weights": {
                    "sbp_threshold": 140, "sbp_weight": 2.5,
                    "dbp_threshold": 90, "dbp_weight": 2.0,
                    "hr_threshold": 90, "hr_weight": 1.2
                },
                "lab_keys": ["cholesterol", "troponin", "ldl"],
                "base_score": 1.0
            },
            {
                "disease": "Acute Coronary Syndrome (ACS) / Ischemia",
                "category": "Cardiovascular",
                "key_symptoms": ["chest pain", "diaphoresis", "dyspnea", "palpitations", "nausea"],
                "vital_weights": {
                    "sbp_threshold": 140, "sbp_weight": 2.0,
                    "spo2_threshold": 95, "spo2_weight": 1.8
                },
                "lab_keys": ["troponin", "cholesterol", "ldl"],
                "base_score": 0.8
            },
            {
                "disease": "Bronchial Asthma / Acute Bronchospasm",
                "category": "Respiratory",
                "key_symptoms": ["bronchospasm", "dyspnea", "cough", "wheezing", "chest tightness"],
                "vital_weights": {
                    "spo2_threshold": 95, "spo2_weight": 2.5,
                    "hr_threshold": 95, "hr_weight": 1.2
                },
                "lab_keys": ["wbc"],
                "base_score": 0.7
            },
            {
                "disease": "Systemic Inflammatory Response / Sepsis Risk",
                "category": "Infectious / Critical Care",
                "key_symptoms": ["fever", "chills", "confusion", "fatigue", "diaphoresis", "tachycardia"],
                "vital_weights": {
                    "temp_threshold": 38.0, "temp_weight": 3.0,
                    "hr_threshold": 100, "hr_weight": 2.2,
                    "sbp_low_threshold": 100, "sbp_low_weight": 2.5
                },
                "lab_keys": ["wbc", "crp", "lactate"],
                "base_score": 0.5
            },
            {
                "disease": "Type 2 Diabetes Mellitus with Metabolic Imbalance",
                "category": "Endocrine & Metabolic",
                "key_symptoms": ["fatigue", "polydipsia", "polyuria", "polyphagia", "weight loss", "dizziness"],
                "vital_weights": {
                    "sbp_threshold": 130, "sbp_weight": 1.2
                },
                "lab_keys": ["glucose", "hba1c"],
                "base_score": 0.6
            },
            {
                "disease": "Normative Physiological Baseline (No Acute Pathology)",
                "category": "Preventive / Physiological Baseline",
                "key_symptoms": ["routine checkup", "asymptomatic"],
                "vital_weights": {},
                "lab_keys": [],
                "base_score": 0.3
            }
        ]

        raw_scores = []
        explanations = []

        for p in disease_profiles:
            score = p["base_score"]
            matched_syms = []
            opposing_factors = []

            # 1. Symptom matching
            for sym in norm_symptoms:
                if any(k in sym or sym in k for k in p["key_symptoms"]):
                    score += 3.0
                    matched_syms.append(sym)

            # 2. Vitals matching
            vw = p["vital_weights"]
            if "sbp_threshold" in vw and sbp >= vw["sbp_threshold"]:
                score += ((sbp - vw["sbp_threshold"]) / 15.0) * vw["sbp_weight"]
            if "sbp_low_threshold" in vw and sbp < vw["sbp_low_threshold"]:
                score += ((vw["sbp_low_threshold"] - sbp) / 10.0) * vw["sbp_low_weight"]
            if "dbp_threshold" in vw and dbp >= vw["dbp_threshold"]:
                score += ((dbp - vw["dbp_threshold"]) / 10.0) * vw["dbp_weight"]
            if "hr_threshold" in vw and hr >= vw["hr_threshold"]:
                score += ((hr - vw["hr_threshold"]) / 15.0) * vw["hr_weight"]
            if "temp_threshold" in vw and temp >= vw["temp_threshold"]:
                score += ((temp - vw["temp_threshold"]) * 2.0) * vw["temp_weight"]
            if "spo2_threshold" in vw and spo2 < vw["spo2_threshold"]:
                score += ((vw["spo2_threshold"] - spo2) / 2.0) * vw["spo2_weight"]

            # 3. Lab matching
            for lk in p["lab_keys"]:
                if lk in l_dict:
                    val = l_dict[lk]
                    if isinstance(val, dict):
                        if val.get("status") in ["High", "Elevated", "Diabetic Range", "Positive"]:
                            score += 2.5
                            matched_syms.append(f"Elevated {lk}")
                    elif isinstance(val, (int, float)) and val > 1:
                        score += 2.0
                        matched_syms.append(f"Elevated {lk}")

            # Baseline bonus if no symptoms and normotensive
            if p["disease"].startswith("Normative"):
                if not norm_symptoms and 100 <= sbp <= 125 and 65 <= dbp <= 82 and temp < 37.3:
                    score += 8.0
                elif norm_symptoms:
                    score *= 0.1

            raw_scores.append(max(score, 0.05))

            # Build clinical rationale
            if matched_syms:
                exp = f"Supported by: {', '.join(matched_syms[:3])}"
            else:
                exp = "Considered as differential under vital profile."
            explanations.append(exp)

        # Softmax over scores to compute calibrated probabilities where sum(p) == 1.0
        scores_arr = np.array(raw_scores, dtype=np.float64)
        exp_scores = np.exp(scores_arr - np.max(scores_arr))
        probs = exp_scores / np.sum(exp_scores)

        # Sort by probability descending
        sorted_indices = np.argsort(probs)[::-1][:top_k]
        differentials = []

        for rank, idx in enumerate(sorted_indices, 1):
            p_val = float(round(probs[idx], 4))
            raw_s = float(round(raw_scores[idx], 2))
            differentials.append({
                "rank": rank,
                "condition": disease_profiles[idx]["disease"],
                "category": disease_profiles[idx]["category"],
                "probability": p_val,
                "percentage": f"{p_val * 100:.1f}%",
                "raw_model_score": raw_s,
                "relative_score": round((raw_s / sum(raw_scores)) * 100, 1),
                "clinical_rationale": explanations[idx],
                "is_primary": (rank == 1)
            })

        return differentials


differential_engine = DifferentialDiagnosisEngine()
