"""
MEDINTEL AI - LLM Service Engine
Orchestrates prompt formatting, provider routing, safety audits, and structured explanation parsing.
"""

import os
import sys
from typing import Dict, Any, List

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from llm.providers.adapter import GeminiProvider, OpenAIProvider, DemoProvider, BaseLLMProvider
from llm.prompts.clinical_prompts import CLINICAL_SYSTEM_INSTRUCTION, CLINICAL_CASE_PROMPT_TEMPLATE
from llm.safety.safety_checker import ClinicalSafetyChecker

class LLMServiceEngine:
    def __init__(self):
        self.provider: BaseLLMProvider = self._initialize_provider()

    def _initialize_provider(self) -> BaseLLMProvider:
        provider_type = os.getenv("LLM_PROVIDER", "demo").lower()
        api_key = os.getenv("LLM_API_KEY", "")
        demo_mode = os.getenv("DEMO_MODE", "false").lower() == "true"

        if demo_mode or provider_type == "demo" or not api_key:
            return DemoProvider()

        if provider_type == "gemini":
            model_name = os.getenv("LLM_MODEL", "gemini-1.5-flash")
            return GeminiProvider(api_key=api_key, model_name=model_name)
        elif provider_type == "openai":
            model_name = os.getenv("LLM_MODEL", "gpt-4o-mini")
            return OpenAIProvider(api_key=api_key, model_name=model_name)
        else:
            return DemoProvider()

    def explain_case(
        self,
        patient_case: Dict[str, Any],
        ml_result: Dict[str, Any],
        transformer_result: Dict[str, Any],
        retrieved_evidence: List[Dict[str, Any]],
        safety_flags: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        # 1. Format evidence text
        evidence_snippets = []
        for idx, ev in enumerate(retrieved_evidence, 1):
            evidence_snippets.append(
                f"[{idx}] {ev.get('title')} ({ev.get('source')} - Score: {ev.get('similarity_score')}):\n{ev.get('snippet')}"
            )
        evidence_text = "\n\n".join(evidence_snippets) if evidence_snippets else "No high-similarity evidence documents retrieved."

        # 2. Format differentials summary
        diffs = transformer_result.get("top_differentials", ml_result.get("top_differentials", []))
        diffs_summary = ", ".join([f"{d.get('rank')}. {d.get('condition')} ({d.get('percentage')})" for d in diffs[:3]])

        # 3. Format safety flags text
        flags_text = "\n".join([f"- [{f.get('severity')}] {f.get('message')}" for f in safety_flags]) if safety_flags else "No emergency red flags triggered."

        # 4. Construct formatted prompt
        prompt = CLINICAL_CASE_PROMPT_TEMPLATE.format(
            age=patient_case.get("age", "Unknown"),
            sex=patient_case.get("sex", "Unknown"),
            duration=patient_case.get("duration", "Recent"),
            severity=patient_case.get("severity", "Moderate"),
            symptoms=patient_case.get("symptoms", ""),
            narrative=patient_case.get("clinical_narrative", ""),
            history=patient_case.get("medical_history", "None reported"),
            medications=patient_case.get("current_medications", "None"),
            heart_rate=patient_case.get("heart_rate", "N/A"),
            systolic_bp=patient_case.get("systolic_bp", "N/A"),
            diastolic_bp=patient_case.get("diastolic_bp", "N/A"),
            temperature=patient_case.get("temperature", "N/A"),
            spo2=patient_case.get("spo2", "N/A"),
            ml_model=ml_result.get("model_name", "Classical ML"),
            ml_prediction=ml_result.get("predicted_condition", "Unknown"),
            ml_confidence=ml_result.get("confidence_percentage", "N/A"),
            transformer_prediction=transformer_result.get("predicted_condition", "Unknown"),
            transformer_confidence=transformer_result.get("confidence_percentage", "N/A"),
            differentials_summary=diffs_summary,
            retrieved_evidence_text=evidence_text,
            safety_flags_text=flags_text
        )

        # 5. Invoke provider
        raw_output = self.provider.generate(prompt, CLINICAL_SYSTEM_INSTRUCTION)

        # 6. Safety Audit & Sanitization
        audit_result = ClinicalSafetyChecker.audit_and_sanitize_response(
            llm_response=raw_output["text"],
            patient_text=f"{patient_case.get('symptoms', '')} {patient_case.get('clinical_narrative', '')}",
            vitals=patient_case
        )

        return {
            "provider": raw_output["provider"],
            "model_name": raw_output["model_name"],
            "mode": raw_output["mode"],
            "explanation_markdown": audit_result["sanitized_response"],
            "safety_flags": audit_result["safety_flags"],
            "has_critical_emergency": audit_result["has_critical_emergency"],
            "disclaimer": audit_result["disclaimer"],
            "latency_ms": raw_output["latency_ms"]
        }
