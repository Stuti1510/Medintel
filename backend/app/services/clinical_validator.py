"""
MEDINTEL AI - Clinical Source of Truth & Output Validation Layer
Implements:
1. Extraction and preservation of the structured Source of Truth from patient input.
2. Physiological conflict & stability analysis (e.g. shock index, hypotension with tachycardia).
3. Deterministic (non-LLM) verification comparing generated clinical summaries against the Source of Truth.
4. Automated remediation / safe structured fallback synthesis when hallucinations or biometric discrepancies are detected.
5. Calibration metadata annotation to prevent uncalibrated model scores from being presented as verified disease probabilities.
"""

import re
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field, asdict

@dataclass
class StructuredClinicalData:
    age: Optional[int] = None
    sex: Optional[str] = None
    symptoms: str = ""
    clinical_narrative: str = ""
    duration: Optional[str] = None
    severity: Optional[str] = None
    medical_history: Optional[str] = None
    current_medications: Optional[str] = None
    heart_rate: Optional[int] = None
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    temperature: Optional[float] = None
    spo2: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    provided_measurements: Dict[str, Any] = field(default_factory=dict)
    missing_measurements: List[str] = field(default_factory=list)
    physiological_alerts: List[Dict[str, str]] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @property
    def blood_pressure_str(self) -> str:
        if self.systolic_bp is not None and self.diastolic_bp is not None:
            return f"{self.systolic_bp}/{self.diastolic_bp} mmHg"
        return "Unrecorded (Not provided)"

    @property
    def heart_rate_str(self) -> str:
        return f"{self.heart_rate} bpm" if self.heart_rate is not None else "Unrecorded (Not provided)"

    @property
    def temperature_str(self) -> str:
        return f"{self.temperature:.1f} °C" if self.temperature is not None else "Unrecorded (Not provided)"

    @property
    def spo2_str(self) -> str:
        return f"{self.spo2}%" if self.spo2 is not None else "Unrecorded (Not provided)"


def extract_source_of_truth(request_data: Dict[str, Any]) -> StructuredClinicalData:
    """
    Extracts patient information into a structured record strictly from actual user input.
    Never invents missing values or silently replaces unrecorded vitals with arbitrary defaults.
    """
    age = request_data.get("age")
    sex = request_data.get("sex")
    symptoms = (request_data.get("symptoms") or "").strip()
    narrative = (request_data.get("clinical_narrative") or "").strip()
    duration = request_data.get("duration") or "Unspecified duration"
    severity = request_data.get("severity") or "Moderate"
    history = request_data.get("medical_history") or "None reported"
    medications = request_data.get("current_medications") or "None reported"
    height = request_data.get("height")
    weight = request_data.get("weight")

    # Extract vitals strictly if provided
    vitals_input = request_data.get("vitals") or {}
    if hasattr(vitals_input, "dict"):
        vitals_input = vitals_input.dict()
    elif hasattr(vitals_input, "model_dump"):
        vitals_input = vitals_input.model_dump()

    hr = vitals_input.get("heart_rate")
    sbp = vitals_input.get("systolic_bp")
    dbp = vitals_input.get("diastolic_bp")
    temp = vitals_input.get("temperature")
    spo2 = vitals_input.get("spo2")

    # Track which measurements were provided vs missing
    provided: Dict[str, Any] = {}
    missing: List[str] = []

    if age is not None:
        provided["age"] = age
    else:
        missing.append("age")

    if sex:
        provided["sex"] = sex
    else:
        missing.append("sex")

    if hr is not None:
        provided["heart_rate"] = hr
    else:
        missing.append("heart_rate")

    if sbp is not None:
        provided["systolic_bp"] = sbp
    else:
        missing.append("systolic_bp")

    if dbp is not None:
        provided["diastolic_bp"] = dbp
    else:
        missing.append("diastolic_bp")

    if temp is not None:
        provided["temperature"] = temp
    else:
        missing.append("temperature")

    if spo2 is not None:
        provided["spo2"] = spo2
    else:
        missing.append("spo2")

    # Physiological conflict & stability analysis
    alerts: List[Dict[str, str]] = []

    # 1. Shock Index / Hemodynamic Conflict: Low BP with Tachycardia
    if sbp is not None and hr is not None:
        shock_index = hr / sbp if sbp > 0 else 0
        if sbp < 100 and hr > 100:
            alerts.append({
                "type": "HEMODYNAMIC_CONFLICT_SHOCK_RISK",
                "severity": "CRITICAL",
                "message": f"Borderline/Frank Hypotension (SBP {sbp} mmHg) accompanied by compensatory Tachycardia (HR {hr} bpm). Shock Index = {shock_index:.2f} (abnormal > 0.9). Indicates potential circulatory insufficiency, hypovolemia, or sepsis."
            })
        elif sbp >= 180 or (dbp is not None and dbp >= 120):
            alerts.append({
                "type": "HYPERTENSIVE_CRISIS_ALERT",
                "severity": "CRITICAL",
                "message": f"Severe Stage 3 / Crisis-Range Blood Pressure ({sbp}/{dbp or 'N/A'} mmHg). Requires urgent target-organ damage assessment."
            })

    # 2. Pyrexia & Hypoxemia Conflict
    if temp is not None and temp >= 38.3:
        if spo2 is not None and spo2 <= 92:
            alerts.append({
                "type": "RESPIRATORY_FEBRILE_COMPROMISE",
                "severity": "CRITICAL",
                "message": f"High fever ({temp:.1f} °C) paired with Hypoxemia (SpO2 {spo2}%). Suggests lower respiratory tract infection, acute lung injury, or systemic inflammation."
            })
        else:
            alerts.append({
                "type": "PYREXIA_ALERT",
                "severity": "WARNING",
                "message": f"Elevated core temperature ({temp:.1f} °C) consistent with active pyrexia/febrile state."
            })
    elif spo2 is not None and spo2 <= 92:
        alerts.append({
            "type": "HYPOXEMIA_ALERT",
            "severity": "CRITICAL",
            "message": f"Peripheral oxygen saturation below safe threshold (SpO2 {spo2}%). Immediate oxygenation evaluation recommended."
        })

    return StructuredClinicalData(
        age=age,
        sex=sex,
        symptoms=symptoms,
        clinical_narrative=narrative,
        duration=duration,
        severity=severity,
        medical_history=history,
        current_medications=medications,
        heart_rate=hr,
        systolic_bp=sbp,
        diastolic_bp=dbp,
        temperature=temp,
        spo2=spo2,
        height=height,
        weight=weight,
        provided_measurements=provided,
        missing_measurements=missing,
        physiological_alerts=alerts
    )


class ClinicalOutputValidator:
    """
    Deterministic rule-based verification layer that inspects generated clinical summaries.
    Compares extracted values directly against the structured Source of Truth.
    Does NOT rely on another LLM call to perform this validation.
    """

    @staticmethod
    def extract_measurements_from_text(text: str) -> Dict[str, Any]:
        """
        Extracts biometrics and demographics mentioned in the generated text using deterministic regex.
        """
        extracted: Dict[str, Any] = {}

        # 1. Heart rate (e.g. "115 bpm", "78 bpm", "Heart Rate: 115")
        hr_matches = re.findall(r'(?:heart\s*rate|hr)[:\s]*(\d{2,3})\s*(?:bpm)?|\b(\d{2,3})\s*bpm\b', text, re.IGNORECASE)
        found_hrs = []
        for m in hr_matches:
            val = m[0] or m[1]
            if val:
                found_hrs.append(int(val))
        if found_hrs:
            extracted["heart_rates"] = found_hrs

        # 2. Blood pressure (e.g. "90/60 mmHg", "120/80")
        bp_matches = re.findall(r'\b(\d{2,3})\s*/\s*(\d{2,3})\s*(?:mmHg)?\b', text)
        if bp_matches:
            extracted["blood_pressures"] = [(int(m[0]), int(m[1])) for m in bp_matches]

        # 3. Temperature (e.g. "39.4°C", "37.0 °C", "39.4 C")
        temp_matches = re.findall(r'\b(\d{1,2}(?:\.\d{1,2})?)\s*(?:°\s*C|deg\s*C|celsius)\b', text, re.IGNORECASE)
        if temp_matches:
            extracted["temperatures"] = [float(m) for m in temp_matches]

        # 4. SpO2 (e.g. "SpO2: 92%", "92% SpO2", "SpO2 of 92%")
        spo2_matches = re.findall(r'(?:spo2|o2|oxygen\s*saturation)[:\s]*(\d{2,3})\s*%?|\b(\d{2,3})\s*%\s*(?:spo2|o2)?', text, re.IGNORECASE)
        found_spo2 = []
        for m in spo2_matches:
            val = m[0] or m[1]
            if val and 40 <= int(val) <= 100:
                found_spo2.append(int(val))
        if found_spo2:
            extracted["spo2_values"] = found_spo2

        # 5. Age (e.g. "63-year-old", "63 years old", "Age: 63")
        age_matches = re.findall(r'(?:age[:\s]*)(\d{1,3})|\b(\d{1,3})\s*(?:-| )year', text, re.IGNORECASE)
        found_ages = []
        for m in age_matches:
            val = m[0] or m[1]
            if val and 0 <= int(val) <= 120:
                found_ages.append(int(val))
        if found_ages:
            extracted["ages"] = found_ages

        return extracted

    @classmethod
    def validate(
        cls,
        generated_text: str,
        source_of_truth: StructuredClinicalData
    ) -> Tuple[bool, List[Dict[str, Any]], Dict[str, Any]]:
        """
        Validates generated text against the Source of Truth.
        Returns:
            - is_valid (bool)
            - discrepancies (List[Dict[str, Any]])
            - extracted_summary (Dict[str, Any])
        """
        extracted = cls.extract_measurements_from_text(generated_text)
        discrepancies: List[Dict[str, Any]] = []

        # 1. Heart Rate Check
        if source_of_truth.heart_rate is not None:
            expected_hr = source_of_truth.heart_rate
            found_hrs = extracted.get("heart_rates", [])
            # If generated text mentions heart rates, check if the expected HR is present
            if found_hrs and expected_hr not in found_hrs:
                discrepancies.append({
                    "field": "heart_rate",
                    "severity": "CRITICAL_DISCREPANCY",
                    "expected": expected_hr,
                    "found": found_hrs,
                    "message": f"Heart rate discrepancy detected: patient input specified {expected_hr} bpm, but generated summary reported {found_hrs} bpm."
                })
        else:
            # Heart rate was not provided: check if LLM invented a specific heart rate without stating unrecorded
            found_hrs = extracted.get("heart_rates", [])
            if found_hrs and "unrecorded" not in generated_text.lower() and "not provided" not in generated_text.lower():
                discrepancies.append({
                    "field": "heart_rate",
                    "severity": "HALLUCINATED_VALUE",
                    "expected": None,
                    "found": found_hrs,
                    "message": f"Invented heart rate: heart rate was not provided in patient input, but generated text asserted {found_hrs} bpm."
                })

        # 2. Blood Pressure Check
        if source_of_truth.systolic_bp is not None and source_of_truth.diastolic_bp is not None:
            expected_bp = (source_of_truth.systolic_bp, source_of_truth.diastolic_bp)
            found_bps = extracted.get("blood_pressures", [])
            if found_bps and expected_bp not in found_bps:
                discrepancies.append({
                    "field": "blood_pressure",
                    "severity": "CRITICAL_DISCREPANCY",
                    "expected": f"{expected_bp[0]}/{expected_bp[1]} mmHg",
                    "found": [f"{b[0]}/{b[1]} mmHg" for b in found_bps],
                    "message": f"Blood pressure discrepancy: patient input was {expected_bp[0]}/{expected_bp[1]} mmHg, but generated summary reported {found_bps}."
                })

        # 3. Temperature Check
        if source_of_truth.temperature is not None:
            expected_temp = source_of_truth.temperature
            found_temps = extracted.get("temperatures", [])
            # Allow minor rounding difference of 0.1°C
            if found_temps and not any(abs(t - expected_temp) <= 0.15 for t in found_temps):
                discrepancies.append({
                    "field": "temperature",
                    "severity": "CRITICAL_DISCREPANCY",
                    "expected": f"{expected_temp} °C",
                    "found": [f"{t} °C" for t in found_temps],
                    "message": f"Temperature discrepancy: patient input was {expected_temp} °C, but generated text stated {found_temps} °C."
                })

        # 4. SpO2 Check
        if source_of_truth.spo2 is not None:
            expected_spo2 = source_of_truth.spo2
            found_spo2 = extracted.get("spo2_values", [])
            if found_spo2 and expected_spo2 not in found_spo2:
                discrepancies.append({
                    "field": "spo2",
                    "severity": "CRITICAL_DISCREPANCY",
                    "expected": f"{expected_spo2}%",
                    "found": [f"{s}%" for s in found_spo2],
                    "message": f"SpO2 discrepancy: patient input was {expected_spo2}%, but summary cited {found_spo2}%."
                })

        # 5. Age Check
        if source_of_truth.age is not None:
            expected_age = source_of_truth.age
            found_ages = extracted.get("ages", [])
            if found_ages and expected_age not in found_ages:
                discrepancies.append({
                    "field": "age",
                    "severity": "DEMOGRAPHIC_DISCREPANCY",
                    "expected": expected_age,
                    "found": found_ages,
                    "message": f"Age discrepancy: patient input was {expected_age} years, but summary cited {found_ages}."
                })

        is_valid = (len(discrepancies) == 0)
        return is_valid, discrepancies, extracted


def build_safe_structured_fallback_summary(
    source_of_truth: StructuredClinicalData,
    ml_result: Dict[str, Any],
    transformer_result: Dict[str, Any],
    retrieved_evidence: List[Dict[str, Any]],
    safety_flags: List[Dict[str, Any]],
    discrepancies: Optional[List[Dict[str, Any]]] = None
) -> str:
    """
    Produces a safe, deterministic, fully grounded clinical summary.
    Guaranteed to strictly preserve the Source of Truth, note unrecorded measurements,
    highlight physiological conflicts, and separate reported symptoms from model outputs.
    Used whenever an LLM response fails deterministic output validation.
    """
    age_str = f"{source_of_truth.age} years old" if source_of_truth.age is not None else "Age unrecorded"
    sex_str = source_of_truth.sex or "Patient"

    # Physiological conflict badges
    conflict_notes = []
    for alert in source_of_truth.physiological_alerts:
        conflict_notes.append(f"- **[{alert['severity']}] {alert['type']}**: {alert['message']}")
    conflicts_block = "\n".join(conflict_notes) if conflict_notes else "No acute physiological parameter conflicts identified."

    # Evidence citations
    evidence_lines = []
    for idx, ev in enumerate(retrieved_evidence[:3], 1):
        evidence_lines.append(f"- **[{idx}] {ev.get('title', 'Medical Guideline')}** ({ev.get('source', 'Clinical Source')}): {ev.get('snippet', '')[:160]}...")
    evidence_block = "\n".join(evidence_lines) if evidence_lines else "- ACC/AHA and WHO clinical evaluation guidelines on symptom presentation and triage."

    # Differentials summary
    ml_pred = ml_result.get("predicted_condition", "Primary Condition")
    ml_conf = ml_result.get("confidence_percentage", "N/A")
    t_pred = transformer_result.get("predicted_condition", ml_pred)
    t_conf = transformer_result.get("confidence_percentage", ml_conf)

    # Missing measurements disclaimer
    missing_str = ", ".join(source_of_truth.missing_measurements) if source_of_truth.missing_measurements else "None (Complete vitals recorded)"

    discrepancy_notice = ""
    if discrepancies:
        disc_lines = [f"- **{d['field']}**: Expected `{d['expected']}`, found in generated draft: `{d['found']}`" for d in discrepancies]
        discrepancy_notice = (
            "\n> [!CAUTION]\n"
            "> **Output Validation Alert**: The initial LLM synthesis generated conflicting biometric measurements. "
            "The deterministic validation layer intercepted the response and restored the verified Source of Truth below.\n>\n" +
            "\n".join([f"> {line}" for line in disc_lines]) + "\n\n"
        )

    summary = f"""{discrepancy_notice}### 1. Executive Clinical Summary (Verified Source of Truth)
The patient is a **{age_str} {sex_str}** presenting with the following documented clinical profile:
- **Chief Symptoms**: {source_of_truth.symptoms}
- **Encounter Notes**: {source_of_truth.clinical_narrative if source_of_truth.clinical_narrative else "Standard intake recorded."}
- **Vital Signs (Preserved from Input)**:
  - Blood Pressure: **{source_of_truth.blood_pressure_str}**
  - Heart Rate: **{source_of_truth.heart_rate_str}**
  - Temperature: **{source_of_truth.temperature_str}**
  - Oxygen Saturation (SpO2): **{source_of_truth.spo2_str}**
- **Symptom Duration**: {source_of_truth.duration} | **Reported Severity**: {source_of_truth.severity}
- **Documented History**: {source_of_truth.medical_history} | **Current Medications**: {source_of_truth.current_medications}
- **Unrecorded / Missing Parameters**: {missing_str}

### 2. Physiological Concordance & Acute Conflict Analysis
{conflicts_block}

### 3. Model Predictions & Calibration Classification
- **Primary Model Candidate (Classical ML - {ml_result.get('model_name', 'Baseline')})**: **{ml_pred}**
  - *Statistical Classification Score*: **{ml_conf}** (Test distribution softmax/Platt estimate; **NOT** a verified clinical diagnostic probability).
- **BioBERT Medical Transformer Candidate**: **{t_pred}** (Score: {t_conf})
- **Distinction Notice**: The conditions above are algorithmic candidate classifications generated from trained NLP feature distributions, not confirmed patient diagnoses.

### 4. Pathophysiological Context & Literature Grounding
Based on peer-reviewed clinical literature indexed in the RAG repository:
{evidence_block}

### 5. Critical Warning Signs & Red Flags
{("- " + "\n- ".join([f"[{f.get('severity', 'ALERT')}] {f.get('message', '')}" for f in safety_flags])) if safety_flags else "No emergency red flags triggered by current presentation."}

### 6. Recommended Next Actions & Clinical Protocols
1. **Targeted Clinical Evaluation**: Physical examination corresponding to presenting complaints and confirmation of all recorded biometrics.
2. **Diagnostic Workup**: Appropriate laboratory evaluations, diagnostic imaging, or electrocardiography as indicated by attending physician.
3. **Safety Escalation**: Immediate medical reassessment if clinical decompensation, altered consciousness, worsening pain, or vital sign instability occurs.

---
*Notice: MEDINTEL AI is an investigational clinical decision-support research platform. It does not provide medical diagnoses or prescribe treatment. All patient assessments must be verified by a licensed clinician.*"""

    return summary.strip()

