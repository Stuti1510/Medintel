"""
MEDINTEL AI - Interactive Viva Examination System
Generates dynamic contextual defense questions across 12 research categories (medical concepts,
dataset provenance, transformer attention, RAG vector retrieval, explainability, differential diagnosis,
methodology, limitations, ethics), and evaluates student responses with RAG grounding and multi-criteria scoring.
"""

import os
import re
import uuid
import json
import time
from fastapi import APIRouter, HTTPException, Body, Query, Request
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from rag.retrieval.retriever import RAGRetrieverService

router = APIRouter(prefix="/api/viva", tags=["Viva Examination System"])

rag_retriever = RAGRetrieverService()

# In-memory session store
VIVA_SESSIONS: Dict[str, Dict[str, Any]] = {}

QUESTION_CATEGORIES = [
    "Data Provenance & Leakage Prevention",
    "Tabular Preprocessing & Normalization",
    "Classical ML Architecture & Training",
    "Loss Functions & Calibration",
    "Transformer Architecture & BioBERT Attention",
    "Embeddings & Representation Space",
    "RAG Retrieval & Vector Store Grounding",
    "Grounded LLM Synthesis & Safety Guardrails",
    "Explainability & Attribution",
    "Multi-Symptom Differential Diagnosis",
    "Failure Modes & Limitation Awareness",
    "Research Roadmap & Clinical Translation"
]

class VivaStartRequest(BaseModel):
    selected_disease: Optional[str] = "Cardiovascular Disease (CVD)"
    symptoms: Optional[str] = "Elevated blood pressure (168/105 mmHg), occipital headache, exertional dyspnea"
    model_name: Optional[str] = "Logistic Regression"
    dataset_id: Optional[str] = "cardio_train"
    candidate_name: Optional[str] = "Research Fellow"
    context_data: Optional[Dict[str, Any]] = None

class VivaAnswerRequest(BaseModel):
    session_id: str
    question_id: int
    question_text: Optional[str] = None
    category: Optional[str] = None
    candidate_answer: Optional[str] = None
    user_answer: Optional[str] = None
    follow_up_answers: Optional[List[str]] = None

def generate_contextual_questions(
    disease: str,
    symptoms: str,
    model: str,
    dataset: str
) -> List[Dict[str, Any]]:
    """Generates 12 contextual questions specifically tailored to the active disease, model, and dataset."""
    questions = [
        {
            "id": 1,
            "category": "Data Provenance & Leakage Prevention",
            "question": f"What architectural guardrails were implemented in MEDINTEL to guarantee zero data leakage between training, validation, and held-out test splits (N=10,296)?",
            "expected_concepts": ["Held-out test split isolation", "Stratified splitting", "Independent transformer fitting", "Patient ID exclusion"],
            "difficulty": "Hard"
        },
        {
            "id": 2,
            "category": "Tabular Preprocessing & Normalization",
            "question": f"How did MEDINTEL handle class imbalance across the 4 integrated datasets (including {dataset}) without distorting the empirical test distribution?",
            "expected_concepts": ["Pre-split balancing", "Controlled undersampling", "Preserving raw records", "Stratified sampling"],
            "difficulty": "Hard"
        },
        {
            "id": 3,
            "category": "Classical ML Architecture & Training",
            "question": f"Why is {model} utilized as a clinical baseline, and how are its decision boundaries or feature coefficients interpreted clinically?",
            "expected_concepts": ["Log-odds ratio", "Feature coefficients", "L2 regularization", "Linear interpretability"],
            "difficulty": "Intermediate"
        },
        {
            "id": 4,
            "category": "Loss Functions & Calibration",
            "question": "How are probability distributions calibrated in MEDINTEL to ensure Expected Calibration Error (ECE < 0.05) and minimize Brier score?",
            "expected_concepts": ["Expected Calibration Error", "Platt scaling", "Temperature scaling", "Reliability bins"],
            "difficulty": "Hard"
        },
        {
            "id": 5,
            "category": "Transformer Architecture & BioBERT Attention",
            "question": f"Describe how BioBERT's 4-head self-attention mechanism processes clinical narrative tokens compared to traditional n-gram or bag-of-words approaches.",
            "expected_concepts": ["Multi-head attention", "Contextual embeddings", "WordPiece tokenization", "Bidirectional context"],
            "difficulty": "Hard"
        },
        {
            "id": 6,
            "category": "Embeddings & Representation Space",
            "question": "How does MEDINTEL map unstructured clinical text into high-dimensional biomedical representation vectors?",
            "expected_concepts": ["Hidden size (256d)", "CLS token pooling", "Cosine similarity", "Representation geometry"],
            "difficulty": "Intermediate"
        },
        {
            "id": 7,
            "category": "RAG Retrieval & Vector Store Grounding",
            "question": f"How does normalized cosine similarity in the Vector RAG engine ensure that evidence retrieved for {disease} prevents generative hallucinations?",
            "expected_concepts": ["Dense embeddings", "Normalized cosine similarity", "Metadata filtering", "Grounded context injection"],
            "difficulty": "Hard"
        },
        {
            "id": 8,
            "category": "Grounded LLM Synthesis & Safety Guardrails",
            "question": "What deterministic safety rules and emergency red-flag thresholds trigger immediate clinician escalation?",
            "expected_concepts": ["Emergency red-flag override", "Stage 2 Hypertensive Crisis", "SpO2 threshold", "Non-generative constraints"],
            "difficulty": "Intermediate"
        },
        {
            "id": 9,
            "category": "Explainability & Attribution",
            "question": f"In evaluating {disease}, how does the explainability module differentiate between positive supporting evidence and negative/protective features?",
            "expected_concepts": ["Feature salience", "Directionality", "Reference baseline deviation", "Instance-level attribution"],
            "difficulty": "Intermediate"
        },
        {
            "id": 10,
            "category": "Multi-Symptom Differential Diagnosis",
            "question": f"When a patient presents with symptoms ({symptoms[:50]}...), what secondary conditions must be included in the differential diagnosis, and how are their probabilities calibrated?",
            "expected_concepts": ["Softmax normalization", "Rule-out criteria", "Clinical presentation overlap", "Calibrated probabilities"],
            "difficulty": "Hard"
        },
        {
            "id": 11,
            "category": "Failure Modes & Limitation Awareness",
            "question": f"What are the primary clinical and algorithmic failure modes when deploying automated diagnostic predictions for {disease} in emergency settings?",
            "expected_concepts": ["Lack of physical examination", "Dataset bias", "Uncalibrated tail distributions", "Clinician verification required"],
            "difficulty": "Intermediate"
        },
        {
            "id": 12,
            "category": "Research Roadmap & Clinical Translation",
            "question": "How can MEDINTEL be expanded to incorporate multimodal medical imaging (DICOM ECG / Chest Radiographs) and FHIR clinical interoperability?",
            "expected_concepts": ["Vision transformers (ViT)", "Multimodal fusion layers", "Cross-attention", "FHIR interoperability"],
            "difficulty": "Intermediate"
        }
    ]
    return questions

@router.post("/start")
async def start_viva_session(payload: Optional[VivaStartRequest] = None):
    """Initializes a new interactive Viva Examination Session."""
    if payload is None:
        payload = VivaStartRequest()

    session_id = f"VIVA-{uuid.uuid4().hex[:8].upper()}"
    
    questions = generate_contextual_questions(
        disease=payload.selected_disease or "Cardiovascular Disease (CVD)",
        symptoms=payload.symptoms or "Elevated blood pressure (168/105 mmHg), occipital headache, exertional dyspnea",
        model=payload.model_name or "Logistic Regression",
        dataset=payload.dataset_id or "cardio_train"
    )

    session_data = {
        "session_id": session_id,
        "candidate_name": payload.candidate_name or "Research Fellow",
        "selected_disease": payload.selected_disease or "Cardiovascular Disease (CVD)",
        "symptoms": payload.symptoms or "Elevated blood pressure",
        "model_name": payload.model_name or "Logistic Regression",
        "dataset_id": payload.dataset_id or "cardio_train",
        "start_time": time.time(),
        "total_questions": len(questions),
        "current_index": 0,
        "questions": questions,
        "history": [],
        "total_score": 0,
        "is_completed": False
    }

    VIVA_SESSIONS[session_id] = session_data

    return {
        "status": "SESSION_STARTED",
        "session_id": session_id,
        "total_questions": len(questions),
        "available_categories": QUESTION_CATEGORIES,
        "initial_question": questions[0],
        "first_question": questions[0],
        "message": "Viva defense session initialized successfully.",
        "context": {
            "disease": payload.selected_disease,
            "symptoms": payload.symptoms,
            "model": payload.model_name
        }
    }

@router.get("/question")
@router.post("/question")
async def get_viva_question(
    session_id: str = Query(default=None),
    category: Optional[str] = Query(default=None),
    difficulty: Optional[str] = Query(default=None),
    question_index: Optional[int] = Query(default=None),
    request: Request = None
):
    """Fetches the current or requested question in the active Viva session."""
    # Check json body if available
    body_data = {}
    if request and request.method == "POST":
        try:
            body_data = await request.json()
        except Exception:
            body_data = {}
            
    sid = session_id or body_data.get("session_id")
    if not sid:
        raise HTTPException(status_code=400, detail="session_id is required")

    session = VIVA_SESSIONS.get(sid)
    if not session:
        raise HTTPException(status_code=404, detail="Viva session not found.")

    questions = session["questions"]
    req_cat = category or body_data.get("category")
    req_diff = difficulty or body_data.get("difficulty")
    req_idx = question_index if question_index is not None else body_data.get("question_index")

    if req_cat:
        matching = [q for q in questions if q["category"].lower() == req_cat.lower()]
        if matching:
            if req_diff:
                diff_match = [q for q in matching if q["difficulty"].lower() == req_diff.lower()]
                selected_q = diff_match[0] if diff_match else matching[0]
            else:
                selected_q = matching[0]
            return selected_q

    idx = req_idx if req_idx is not None else session["current_index"]
    if idx < 0 or idx >= len(questions):
        idx = 0

    session["current_index"] = idx
    return questions[idx]

@router.post("/evaluate")
async def evaluate_viva_answer(payload: VivaAnswerRequest):
    """Evaluates candidate response across correctness, relevance, completeness, and technical depth."""
    session = VIVA_SESSIONS.get(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Viva session not found.")

    answer_text = (payload.candidate_answer or payload.user_answer or "").strip()
    if len(answer_text) < 5:
        return {
            "session_id": payload.session_id,
            "question_id": payload.question_id,
            "score": 25,
            "grade": "Needs Improvement",
            "criteria": {
                "correctness": 20,
                "relevance": 25,
                "completeness": 15,
                "technical_depth": 20
            },
            "matched_concepts": [],
            "expected_concepts": [],
            "feedback": "Your response is too brief. Please provide a substantive clinical or technical explanation addressing the question requirements.",
            "grounding_evidence": []
        }

    q_data = next((q for q in session["questions"] if q["id"] == payload.question_id), None)
    expected_concepts = q_data["expected_concepts"] if q_data else []
    q_text = payload.question_text or (q_data["question"] if q_data else "")

    # Retrieve grounding knowledge for evaluation
    rag_res = rag_retriever.search_evidence(f"{q_text} {session.get('selected_disease', '')}", top_k=2)
    evidence_cards = rag_res.get("evidence", [])

    ans_low = answer_text.lower()
    matched_concepts = [c for c in expected_concepts if any(w.lower() in ans_low for w in c.split())]
    concept_ratio = len(matched_concepts) / max(len(expected_concepts), 1)

    # Word count and depth heuristic
    word_count = len(answer_text.split())
    depth_score = min(word_count / 30.0, 1.0)

    # Calculate dimension scores
    correctness = int(round(45 + (concept_ratio * 40) + min(depth_score * 15, 15)))
    relevance = int(round(50 + (concept_ratio * 35) + min(depth_score * 15, 15)))
    completeness = int(round(40 + (concept_ratio * 40) + min(depth_score * 20, 20)))
    tech_depth = int(round(45 + (concept_ratio * 35) + min(depth_score * 20, 20)))

    # Cap all scores at 98
    correctness = min(max(correctness, 20), 98)
    relevance = min(max(relevance, 20), 98)
    completeness = min(max(completeness, 20), 98)
    tech_depth = min(max(tech_depth, 20), 98)

    overall_score = int(round((correctness * 0.35) + (relevance * 0.25) + (completeness * 0.20) + (tech_depth * 0.20)))

    if overall_score >= 85:
        grade = "A+ (Outstanding Distinction)"
        feedback = f"Outstanding clinical and architectural reasoning! You accurately defended key concepts ({', '.join(matched_concepts if matched_concepts else expected_concepts[:2])}) with precise terminology, statistical rigor, and methodology."
    elif overall_score >= 70:
        grade = "A (Proficient Pass)"
        feedback = f"Solid answer demonstrating good comprehension. To achieve full mastery, expand on {', '.join([c for c in expected_concepts if c not in matched_concepts][:2]) if len(matched_concepts) < len(expected_concepts) else 'clinical edge cases'}."
    elif overall_score >= 55:
        grade = "B (Satisfactory)"
        feedback = f"Adequate answer covering baseline points. Consider discussing {', '.join(expected_concepts[:3])} to substantiate methodological decisions."
    else:
        grade = "C (Needs Revision)"
        feedback = f"Foundational understanding noted, but lacks technical precision. Make sure to explicitly discuss {', '.join(expected_concepts[:3])} to support your defense."

    eval_result = {
        "session_id": payload.session_id,
        "question_id": payload.question_id,
        "score": overall_score,
        "grade": grade,
        "criteria": {
            "correctness": correctness,
            "relevance": relevance,
            "completeness": completeness,
            "technical_depth": tech_depth
        },
        "matched_concepts": matched_concepts,
        "expected_concepts": expected_concepts,
        "feedback": feedback,
        "grounding_evidence": evidence_cards
    }

    # Record in session history
    session["history"].append(eval_result)
    session["current_index"] = min(session["current_index"] + 1, len(session["questions"]) - 1)
    session["total_score"] = int(round(sum(h["score"] for h in session["history"]) / len(session["history"])))

    return eval_result

@router.post("/end")
async def end_viva_session(
    session_id: Optional[str] = Query(default=None),
    request: Request = None
):
    """Concludes the Viva examination and generates a final defense assessment report."""
    sid = session_id
    if not sid and request:
        try:
            b = await request.json()
            sid = b.get("session_id")
        except Exception:
            sid = None

    if not sid:
        # Fallback to last active session
        if VIVA_SESSIONS:
            sid = list(VIVA_SESSIONS.keys())[-1]
        else:
            raise HTTPException(status_code=400, detail="session_id is required")

    session = VIVA_SESSIONS.get(sid)
    if not session:
        raise HTTPException(status_code=404, detail="Viva session not found.")

    session["is_completed"] = True
    history = session.get("history", [])
    total_answered = len(history)
    avg_score = session.get("total_score", 0)

    if avg_score >= 85:
        verdict = "PASSED WITH DISTINCTION"
    elif avg_score >= 65:
        verdict = "PASSED"
    else:
        verdict = "REMEDIATION RECOMMENDED"

    return {
        "session_id": sid,
        "candidate_name": session.get("candidate_name", "Candidate"),
        "verdict": verdict,
        "average_grade": verdict,
        "final_score": avg_score,
        "questions_answered": total_answered,
        "total_questions_answered": total_answered,
        "total_questions": len(session.get("questions", [])),
        "history": history,
        "summary": f"Candidate completed defense across {total_answered} questions on {session.get('selected_disease')}. Overall performance achieved {avg_score}/100 ({verdict})."
    }
