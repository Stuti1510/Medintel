"""
MEDINTEL AI - Clinical Safety Enforcement & Disclaimer Engine
Enforces academic decision-support constraints, scrubs prescriptive commands,
and injects mandatory medical disclaimers.
"""

from typing import Dict, Any, List
from llm.safety.red_flags import scan_clinical_red_flags

MANDATORY_SAFETY_DISCLAIMER = (
    "CLINICAL DECISION-SUPPORT NOTICE: MEDINTEL AI is an academic research decision-support prototype "
    "designed to assist clinical exploration through machine learning, Transformer analysis, and evidence retrieval. "
    "This system does NOT provide a formal medical diagnosis or prescribe clinical treatments. "
    "All interpretations, predictions, and recommendations must be reviewed and verified by a licensed healthcare professional."
)

class ClinicalSafetyChecker:
    @staticmethod
    def audit_and_sanitize_response(
        llm_response: str,
        patient_text: str,
        vitals: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        flags = scan_clinical_red_flags(patient_text, vitals)
        has_critical = any(f["severity"] == "CRITICAL" for f in flags)
        
        # Scrub unsafe prescription claims if any exist in the response
        sanitized_text = llm_response
        unsafe_phrases = [
            ("take this medication", "discuss this medication with your physician"),
            ("guaranteed cure", "potential therapeutic option"),
            ("100% diagnosis", "statistical model prediction"),
            ("you must take", "a clinician may consider")
        ]
        for bad_p, good_p in unsafe_phrases:
            sanitized_text = sanitized_text.replace(bad_p, good_p).replace(bad_p.capitalize(), good_p.capitalize())

        return {
            "is_safe": True,
            "has_critical_emergency": has_critical,
            "safety_flags": flags,
            "sanitized_response": sanitized_text,
            "disclaimer": MANDATORY_SAFETY_DISCLAIMER
        }
