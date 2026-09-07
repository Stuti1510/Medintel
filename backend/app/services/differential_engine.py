"""
MEDINTEL AI - Multi-Symptom Differential Diagnosis Engine
Evaluates patient symptoms, normalized synonyms, vital signs, and laboratory findings
across 20 canonical disease conditions to compute clinical scores, calibrated softmax probabilities,
supporting findings, and structured differential rationales.
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
        self.synonym_map = {
            "shortness of breath": "dyspnea",
            "breathlessness": "dyspnea",
            "difficulty breathing": "dyspnea",
            "high blood pressure": "hypertension",
            "elevated bp": "hypertension",
            "high bp": "hypertension",
            "chest tightness": "chest pain",
            "chest pressure": "chest pain",
            "substernal pain": "chest pain",
            "angina": "chest pain",
            "racing heart": "palpitations",
            "irregular heartbeat": "palpitations",
            "rapid pulse": "palpitations",
            "tachycardia": "palpitations",
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
            "high temperature": "fever",
            "acid reflux": "heartburn",
            "acid regurgitation": "heartburn",
            "frequent urination": "polyuria",
            "excessive thirst": "polydipsia",
            "joint stiffness": "polyarthritis"
        }
        self.disease_profiles = self._init_disease_profiles()
        self.load_registry()

    def _init_disease_profiles(self) -> List[Dict[str, Any]]:
        return [
            {
                "disease": "Acute Appendicitis",
                "category": "Gastrointestinal Surgery",
                "key_symptoms": ["right lower quadrant abdominal pain", "periumbilical pain", "mcburney", "rebound tenderness", "nausea", "vomiting", "low grade fever", "anorexia"],
                "vital_weights": {"temp_threshold": 37.8, "temp_weight": 2.5, "hr_threshold": 95, "hr_weight": 1.5},
                "lab_keys": ["wbc", "crp"],
                "base_score": 0.5
            },
            {
                "disease": "Acute Bronchitis",
                "category": "Pulmonology / Respiratory",
                "key_symptoms": ["cough", "productive cough", "purulent sputum", "rhonchi", "chest wall soreness", "substernal burning", "mild dyspnea", "fatigue"],
                "vital_weights": {"temp_threshold": 37.5, "temp_weight": 1.5, "hr_threshold": 90, "hr_weight": 1.0},
                "lab_keys": [],
                "base_score": 0.5
            },
            {
                "disease": "Atopic Dermatitis",
                "category": "Dermatology",
                "key_symptoms": ["pruritus", "intense itching", "erythematous plaques", "lichenification", "dry skin", "flexural eczema", "excoriation"],
                "vital_weights": {},
                "lab_keys": ["ige"],
                "base_score": 0.4
            },
            {
                "disease": "Bronchial Asthma",
                "category": "Pulmonology / Respiratory",
                "key_symptoms": ["bronchospasm", "wheezing", "expiratory wheezing", "dyspnea", "chest tightness", "nocturnal cough", "prolonged expiratory phase"],
                "vital_weights": {"spo2_threshold": 95, "spo2_weight": 2.5, "hr_threshold": 95, "hr_weight": 1.2},
                "lab_keys": [],
                "base_score": 0.6
            },
            {
                "disease": "Chronic Kidney Disease",
                "category": "Nephrology",
                "key_symptoms": ["fatigue", "peripheral edema", "bilateral leg swelling", "pallor", "nocturia", "metallic taste", "hypertension", "elevated creatinine"],
                "vital_weights": {"sbp_threshold": 140, "sbp_weight": 2.0, "dbp_threshold": 90, "dbp_weight": 1.5},
                "lab_keys": ["creatinine", "urea", "gfr"],
                "base_score": 0.5
            },
            {
                "disease": "GERD",
                "category": "Gastroenterology",
                "key_symptoms": ["heartburn", "retrosternal heartburn", "acid regurgitation", "sour taste", "water brash", "globus sensation", "nocturnal dry cough", "epigastric burning"],
                "vital_weights": {},
                "lab_keys": [],
                "base_score": 0.5
            },
            {
                "disease": "Gastroenteritis",
                "category": "Gastroenterology / Infectious",
                "key_symptoms": ["watery diarrhea", "diarrhea", "nausea", "vomiting", "diffuse crampy abdominal pain", "hyperactive bowel sounds", "myalgia", "dehydration"],
                "vital_weights": {"temp_threshold": 37.8, "temp_weight": 2.0, "hr_threshold": 95, "hr_weight": 1.5},
                "lab_keys": [],
                "base_score": 0.5
            },
            {
                "disease": "Hypertension",
                "category": "Cardiology / Vascular",
                "key_symptoms": ["hypertension", "occipital headache", "morning headache", "dizziness", "facial flushing", "blurred vision", "epistaxis", "exertional palpitation"],
                "vital_weights": {"sbp_threshold": 140, "sbp_weight": 3.5, "dbp_threshold": 90, "dbp_weight": 3.0},
                "lab_keys": ["cholesterol"],
                "base_score": 0.6
            },
            {
                "disease": "Hyperthyroidism",
                "category": "Endocrinology",
                "key_symptoms": ["weight loss", "heat intolerance", "palpitations", "tachycardia", "resting tremor", "fine tremor", "exophthalmos", "goiter", "hyperactivity"],
                "vital_weights": {"hr_threshold": 100, "hr_weight": 3.0, "sbp_threshold": 135, "sbp_weight": 1.5},
                "lab_keys": ["tsh", "free_t4"],
                "base_score": 0.5
            },
            {
                "disease": "Infectious Mononucleosis",
                "category": "Infectious Disease",
                "key_symptoms": ["fever", "high fever", "profound fatigue", "sore throat", "exudative pharyngitis", "posterior cervical lymphadenopathy", "palatal petechiae", "splenomegaly"],
                "vital_weights": {"temp_threshold": 38.2, "temp_weight": 3.0, "hr_threshold": 100, "hr_weight": 1.5},
                "lab_keys": ["wbc", "atypical_lymphocytes"],
                "base_score": 0.5
            },
            {
                "disease": "Iron Deficiency Anemia",
                "category": "Hematology",
                "key_symptoms": ["pallor", "pale conjunctiva", "fatigue", "weakness", "exertional dyspnea", "dizziness", "atrophic glossitis", "koilonychia", "spoon nails", "pica craving"],
                "vital_weights": {"hr_threshold": 90, "hr_weight": 1.5},
                "lab_keys": ["hemoglobin", "ferritin"],
                "base_score": 0.5
            },
            {
                "disease": "Ischemic Stroke",
                "category": "Neurology / Vascular",
                "key_symptoms": ["facial droop", "unilateral arm weakness", "hemiparesis", "slurred speech", "dysarthria", "aphasia", "sudden numbness", "ataxia"],
                "vital_weights": {"sbp_threshold": 150, "sbp_weight": 2.5, "dbp_threshold": 95, "dbp_weight": 2.0},
                "lab_keys": [],
                "base_score": 0.5
            },
            {
                "disease": "Major Depressive Disorder",
                "category": "Psychiatry",
                "key_symptoms": ["depressed mood", "anhedonia", "early morning awakening", "insomnia", "psychomotor retardation", "feelings of worthlessness", "diminished concentration", "unintended weight loss"],
                "vital_weights": {},
                "lab_keys": [],
                "base_score": 0.4
            },
            {
                "disease": "Migraine with Aura",
                "category": "Neurology",
                "key_symptoms": ["unilateral throbbing headache", "pulsating headache", "scintillating scotoma", "visual aura", "photophobia", "phonophobia", "nausea"],
                "vital_weights": {},
                "lab_keys": [],
                "base_score": 0.5
            },
            {
                "disease": "Myocardial Infarction",
                "category": "Cardiology / Critical Care",
                "key_symptoms": ["chest pain", "crushing substernal chest pain", "radiation to left arm", "radiation to jaw", "diaphoresis", "dyspnea", "nausea", "lightheadedness"],
                "vital_weights": {"hr_threshold": 95, "hr_weight": 2.0, "sbp_threshold": 140, "sbp_weight": 2.0, "spo2_threshold": 94, "spo2_weight": 2.0},
                "lab_keys": ["troponin", "ck_mb"],
                "base_score": 0.6
            },
            {
                "disease": "Pneumonia",
                "category": "Pulmonology / Infectious",
                "key_symptoms": ["productive cough", "rust-colored sputum", "high fever", "pleuritic chest pain", "dyspnea", "chills", "bronchial breath sounds", "dullness to percussion"],
                "vital_weights": {"temp_threshold": 38.3, "temp_weight": 3.0, "spo2_threshold": 93, "spo2_weight": 3.0, "hr_threshold": 100, "hr_weight": 1.5},
                "lab_keys": ["wbc", "crp"],
                "base_score": 0.6
            },
            {
                "disease": "Pulmonary Embolism",
                "category": "Pulmonology / Vascular",
                "key_symptoms": ["acute dyspnea", "sudden onset pleuritic chest pain", "tachypnea", "tachycardia", "hemoptysis", "syncope", "unilateral leg swelling", "dvt history"],
                "vital_weights": {"hr_threshold": 105, "hr_weight": 3.0, "spo2_threshold": 92, "spo2_weight": 3.5},
                "lab_keys": ["d_dimer", "troponin"],
                "base_score": 0.6
            },
            {
                "disease": "Rheumatoid Arthritis",
                "category": "Rheumatology",
                "key_symptoms": ["symmetric polyarthritis", "mcp and pip joints", "morning stiffness", "joint swelling and warmth", "swan neck deformities", "rheumatoid nodules", "fatigue"],
                "vital_weights": {},
                "lab_keys": ["rf", "anti_ccp", "esr", "crp"],
                "base_score": 0.5
            },
            {
                "disease": "Type 2 Diabetes Mellitus",
                "category": "Endocrinology / Metabolic",
                "key_symptoms": ["polyuria", "polydipsia", "unexplained weight loss", "blurred vision", "persistent fatigue", "tingling paresthesia in feet", "hyperglycemia"],
                "vital_weights": {"sbp_threshold": 130, "sbp_weight": 1.5},
                "lab_keys": ["glucose", "hba1c"],
                "base_score": 0.6
            },
            {
                "disease": "Urinary Tract Infection",
                "category": "Urology / Infectious",
                "key_symptoms": ["dysuria", "burning micturition", "urinary frequency", "urinary urgency", "suprapubic tenderness", "cloudy foul-smelling urine", "fever"],
                "vital_weights": {"temp_threshold": 37.8, "temp_weight": 2.0, "hr_threshold": 90, "hr_weight": 1.0},
                "lab_keys": ["leukocyte_esterase", "nitrite", "wbc"],
                "base_score": 0.5
            }
        ]

    def load_registry(self):
        if os.path.exists(self.registry_path):
            try:
                with open(self.registry_path, "r", encoding="utf-8") as f:
                    self.disease_registry = json.load(f)
            except Exception as e:
                print(f"[DIFFERENTIAL ENGINE] Registry load warning: {e}")

    def normalize_symptoms(self, symptoms_input: Any) -> List[str]:
        """Normalizes a string or list of symptoms into canonical clinical symptom terms."""
        if isinstance(symptoms_input, list):
            raw_terms = symptoms_input
        else:
            raw_terms = re.split(r'[,;\n]+', str(symptoms_input or ""))

        normalized = []
        for term in raw_terms:
            t = term.strip().lower()
            if not t:
                continue
            canon = self.synonym_map.get(t, t)
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
        norm_symptoms = self.normalize_symptoms(symptoms)
        v_dict = vitals or {}
        l_dict = labs or {}

        sbp = float(v_dict.get("systolic_bp", 120))
        dbp = float(v_dict.get("diastolic_bp", 80))
        hr = float(v_dict.get("heart_rate", 78))
        temp = float(v_dict.get("temperature", 37.0))
        spo2 = float(v_dict.get("spo2", 98))

        raw_scores = []
        explanations = []

        for p in self.disease_profiles:
            score = p["base_score"]
            matched_syms = []

            # 1. Symptom matching
            for sym in norm_symptoms:
                if any(k in sym or sym in k for k in p["key_symptoms"]):
                    score += 3.5
                    matched_syms.append(sym)

            # 2. Vitals matching
            vw = p.get("vital_weights", {})
            if "sbp_threshold" in vw and sbp >= vw["sbp_threshold"]:
                score += ((sbp - vw["sbp_threshold"]) / 15.0) * vw["sbp_weight"]
            if "dbp_threshold" in vw and dbp >= vw["dbp_threshold"]:
                score += ((dbp - vw["dbp_threshold"]) / 10.0) * vw["dbp_weight"]
            if "hr_threshold" in vw and hr >= vw["hr_threshold"]:
                score += ((hr - vw["hr_threshold"]) / 15.0) * vw["hr_weight"]
            if "temp_threshold" in vw and temp >= vw["temp_threshold"]:
                score += ((temp - vw["temp_threshold"]) * 2.0) * vw["temp_weight"]
            if "spo2_threshold" in vw and spo2 < vw["spo2_threshold"]:
                score += ((vw["spo2_threshold"] - spo2) / 2.0) * vw["spo2_weight"]

            # 3. Lab matching
            for lk in p.get("lab_keys", []):
                if lk in l_dict:
                    val = l_dict[lk]
                    if isinstance(val, dict) and val.get("status") in ["High", "Elevated", "Diabetic Range", "Positive"]:
                        score += 2.5
                        matched_syms.append(f"Elevated {lk}")
                    elif isinstance(val, (int, float)) and val > 1:
                        score += 2.0
                        matched_syms.append(f"Elevated {lk}")

            raw_scores.append(max(score, 0.05))

            if matched_syms:
                exp = f"Supported by: {', '.join(matched_syms[:3])}"
            else:
                exp = f"Considered under physiological vital profile (BP {sbp:.0f}/{dbp:.0f}, HR {hr:.0f})."
            explanations.append(exp)

        # Softmax over scores to compute calibrated probabilities summing to 1.0
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
                "condition": self.disease_profiles[idx]["disease"],
                "category": self.disease_profiles[idx]["category"],
                "probability": p_val,
                "percentage": f"{p_val * 100:.1f}%",
                "raw_model_score": raw_s,
                "supporting_findings": [explanations[idx]] if explanations[idx] else [],
                "clinical_rationale": explanations[idx],
                "is_primary": (rank == 1)
            })

        return differentials

differential_engine = DifferentialDiagnosisEngine()
