# MEDINTEL AI — LLM Synthesis & Safety Engine

## The Role of the LLM: Grounded Synthesizer (Not Autonomous Diagnostician)
The LLM does NOT invent medical diagnoses. It acts as an explanation and communication layer that receives:
1. Patient demographic and vital parameters.
2. Classical ML baseline predictions and feature salience.
3. BioBERT Transformer classification outputs and probabilities.
4. Top-K evidence passages retrieved via vector search.

## Provider Adapters
- **Google Gemini**: Integrates with `gemini-1.5-flash` using `LLM_API_KEY`.
- **OpenAI**: Integrates with `gpt-4o-mini`.
- **Offline Educational Synthesizer (DEMO MODE)**: Deterministic, evidence-grounded template synthesis engine when running offline without API keys.

## Clinical Safety Guardrails & Red Flags
- **Rule-Based Emergency Detector**: Immediately flags high-acuity cardiovascular, respiratory, and neurological conditions (e.g. crushing chest pain with radiation, stroke deficits via FAST, hypoxemia with SpO2 < 90%).
- **Prescription Prohibition Filter**: Scrubs prescriptive dosage directives and converts them into educational discussions for qualified clinicians.
- **Mandatory Decision-Support Disclaimers**: Injected into every response to enforce ethical academic decision-support standards.
