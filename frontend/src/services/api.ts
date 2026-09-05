import {
  ClinicalAnalysisRequest,
  ClinicalAnalysisResponse,
  ClassicalMLResult,
  TransformerResult,
  EvidenceItem,
  SystemStatusResponse,
  EvaluationBenchmarkResponse,
  DocumentUploadResponse,
  ExplainabilityResult,
  VivaQuestion,
  VivaEvaluationResult
} from '../types/clinical';

const API_BASE = "http://localhost:8000/api";

export async function runClinicalAnalysis(payload: ClinicalAnalysisRequest): Promise<ClinicalAnalysisResponse> {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Network error" }));
    throw new Error(err.detail || `Analysis failed (${res.status})`);
  }
  return res.json();
}

export async function uploadMedicalDocument(file: File, autoAnalyze = true): Promise<DocumentUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/documents/upload?auto_analyze=${autoAnalyze}`, {
    method: "POST",
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || `Upload failed (${res.status})`);
  }
  return res.json();
}

export async function getExplainability(
  clinicalText: string,
  structuredData: Record<string, any> = {},
  targetDisease?: string
): Promise<ExplainabilityResult> {
  const res = await fetch(`${API_BASE}/ml/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clinical_text: clinicalText,
      structured_data: structuredData,
      target_disease: targetDisease
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Explainability failed" }));
    throw new Error(err.detail || `Explainability failed (${res.status})`);
  }
  return res.json();
}

export async function computeMultiSymptomDifferential(
  symptoms: string | string[],
  structuredData: Record<string, any> = {},
  targetDisease?: string
): Promise<{ primary_diagnosis: string; confidence: number; differentials: any[]; symptom_count: number }> {
  const symptomsStr = Array.isArray(symptoms) ? symptoms.join(", ") : symptoms;
  const res = await fetch(`${API_BASE}/differential/compute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      symptoms: symptomsStr,
      structured_data: structuredData,
      target_disease: targetDisease
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Differential failed" }));
    throw new Error(err.detail || `Differential failed (${res.status})`);
  }
  return res.json();
}

export async function predictClassicalML(clinicalText: string, modelName = "Logistic Regression"): Promise<ClassicalMLResult> {
  const res = await fetch(`${API_BASE}/ml/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clinical_text: clinicalText, model_name: modelName })
  });
  if (!res.ok) throw new Error("ML prediction failed");
  return res.json();
}

export async function predictTransformer(clinicalText: string): Promise<TransformerResult> {
  const res = await fetch(`${API_BASE}/transformer/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clinical_text: clinicalText })
  });
  if (!res.ok) throw new Error("Transformer prediction failed");
  return res.json();
}

export async function searchRAGEvidence(
  query: string,
  topK = 4,
  filterDisease?: string,
  filterCategory?: string
): Promise<{ query: string; evidence: EvidenceItem[]; retrieval_time_ms: number }> {
  const res = await fetch(`${API_BASE}/rag/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      top_k: topK,
      filter_disease: filterDisease,
      filter_category: filterCategory
    })
  });
  if (!res.ok) throw new Error("RAG retrieval failed");
  return res.json();
}

export async function explainWithLLM(payload: any): Promise<any> {
  const res = await fetch(`${API_BASE}/llm/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("LLM explanation failed");
  return res.json();
}

// Viva Defense Endpoints
export async function startVivaSession(contextData?: Record<string, any>): Promise<{
  session_id: string;
  total_questions: number;
  available_categories: string[];
  initial_question: VivaQuestion;
  message: string;
}> {
  const res = await fetch(`${API_BASE}/viva/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ context_data: contextData || {} })
  });
  if (!res.ok) throw new Error("Failed to start Viva session");
  return res.json();
}

export async function getVivaQuestion(
  sessionId: string,
  category?: string,
  difficulty?: string
): Promise<VivaQuestion> {
  let url = `${API_BASE}/viva/question?session_id=${encodeURIComponent(sessionId)}`;
  if (category) url += `&category=${encodeURIComponent(category)}`;
  if (difficulty) url += `&difficulty=${encodeURIComponent(difficulty)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to get Viva question");
  return res.json();
}

export async function evaluateVivaAnswer(
  sessionId: string,
  questionId: number,
  candidateAnswer: string,
  followUpAnswers: string[] = []
): Promise<VivaEvaluationResult> {
  const res = await fetch(`${API_BASE}/viva/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      question_id: questionId,
      candidate_answer: candidateAnswer,
      follow_up_answers: followUpAnswers
    })
  });
  if (!res.ok) throw new Error("Failed to evaluate Viva answer");
  return res.json();
}

export async function endVivaSession(sessionId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/viva/end?session_id=${encodeURIComponent(sessionId)}`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to end Viva session");
  return res.json();
}

export async function getSystemStatus(): Promise<SystemStatusResponse> {
  const res = await fetch(`${API_BASE}/system/status`);
  if (!res.ok) throw new Error("Failed to fetch system status");
  return res.json();
}

export async function getEvaluationBenchmarks(): Promise<EvaluationBenchmarkResponse> {
  const res = await fetch(`${API_BASE}/evaluation`);
  if (!res.ok) throw new Error("Failed to fetch evaluation metrics");
  return res.json();
}

export async function getDatasetProfile(datasetId: string = "all"): Promise<any> {
  const res = await fetch(`${API_BASE}/datasets?dataset_id=${encodeURIComponent(datasetId)}`);
  if (!res.ok) throw new Error("Failed to fetch dataset profile");
  return res.json();
}

export async function getGlobalDiseaseRegistry(): Promise<any> {
  const res = await fetch(`${API_BASE}/datasets/diseases`);
  if (!res.ok) throw new Error("Failed to fetch global disease registry");
  return res.json();
}

export async function getDatasetPreview(limit = 25, offset = 0, datasetId: string = "all"): Promise<any> {
  const res = await fetch(`${API_BASE}/datasets/preview?limit=${limit}&offset=${offset}&dataset_id=${encodeURIComponent(datasetId)}`);
  if (!res.ok) throw new Error("Failed to fetch dataset preview");
  return res.json();
}

export async function getModels(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/models`);
  if (!res.ok) throw new Error("Failed to fetch models");
  return res.json();
}

export async function getExperiments(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/experiments`);
  if (!res.ok) throw new Error("Failed to fetch experiments");
  return res.json();
}

export async function getPredictionHistory(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/history`);
  if (!res.ok) throw new Error("Failed to fetch prediction history");
  return res.json();
}

export async function getHistoricalCase(caseReference: string): Promise<any> {
  const res = await fetch(`${API_BASE}/history/${caseReference}`);
  if (!res.ok) throw new Error("Failed to fetch historical case");
  return res.json();
}
