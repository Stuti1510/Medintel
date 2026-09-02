"""
MEDINTEL AI - Clinical Red-Flag Rule Engine
Identifies high-acuity medical emergency patterns from clinical inputs, vitals, and narratives.
"""

import re
from typing import List, Dict, Any

RED_FLAG_PATTERNS = [
    {
        "flag_type": "ACUTE_CORONARY_SYNDROME",
        "severity": "CRITICAL",
        "keywords": ["crushing chest pain", "substernal pressure", "radiation to left arm", "radiation to jaw", "diaphoresis", "cold sweat"],
        "message": "Potential Acute Coronary Syndrome / Myocardial Infarction indicators detected. Requires immediate emergency medical assessment (ECG & serial cardiac troponins)."
    },
    {
        "flag_type": "ACUTE_STROKE_SYMPTOMS",
        "severity": "CRITICAL",
        "keywords": ["facial droop", "slurred speech", "arm weakness", "hemiparesis", "aphasia", "loss of balance", "sudden numbness"],
        "message": "Focal acute neurological deficits detected (FAST criteria). Time-sensitive emergency neurovascular evaluation required."
    },
    {
        "flag_type": "SEVERE_HYPOXEMIA_RESPIRATORY_DISTRESS",
        "severity": "CRITICAL",
        "keywords": ["severe shortness of breath", "gasping", "inability to breathe", "cyanosis", "stridor"],
        "condition_fn": lambda vitals: vitals.get("spo2", 100) < 90,
        "message": "Severe hypoxemia (SpO2 < 90%) or acute respiratory compromise detected. Urgent oxygenation and airway evaluation required."
    },
    {
        "flag_type": "PULMONARY_EMBOLISM_SUSPICION",
        "severity": "CRITICAL",
        "keywords": ["sudden dyspnea", "hemoptysis", "pleuritic chest pain", "unilateral leg swelling", "calf pain", "dvt"],
        "message": "High-risk features for Acute Pulmonary Embolism or Deep Vein Thrombosis identified. Urgent CTPA / D-dimer investigation advised."
    },
    {
        "flag_type": "ACUTE_SURGICAL_ABDOMEN",
        "severity": "WARNING",
        "keywords": ["rebound tenderness", "guarding", "rigid abdomen", "migrating right lower quadrant pain", "mcburney point"],
        "message": "Signs suggestive of acute surgical abdomen or appendicitis. Urgent surgical consultation and imaging recommended."
    },
    {
        "flag_type": "MALIGNANT_HYPERTENSION",
        "severity": "WARNING",
        "condition_fn": lambda vitals: vitals.get("systolic_bp", 120) >= 180 or vitals.get("diastolic_bp", 80) >= 120,
        "message": "Hypertensive crisis range detected (BP ≥ 180/120 mmHg). Urgent clinical evaluation for acute target organ injury advised."
    }
]

def scan_clinical_red_flags(clinical_text: str, vitals: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    vitals = vitals or {}
    text_lower = clinical_text.lower()
    detected_flags = []

    for rule in RED_FLAG_PATTERNS:
        matched = False
        # Check keyword matches
        if "keywords" in rule:
            for kw in rule["keywords"]:
                if kw in text_lower:
                    matched = True
                    break
                    
        # Check vital rule matches
        if "condition_fn" in rule:
            try:
                if rule["condition_fn"](vitals):
                    matched = True
            except Exception:
                pass

        if matched:
            detected_flags.append({
                "flag_type": rule["flag_type"],
                "severity": rule["severity"],
                "message": rule["message"]
            })

    return detected_flags
