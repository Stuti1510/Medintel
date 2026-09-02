import {
  ClinicalAnalysisRequest,
  ClinicalAnalysisResponse,
  ClassicalMLResult,
  TransformerResult,
  EvidenceItem,
  SystemStatusResponse,
  EvaluationBenchmarkResponse
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

export async function searchRAGEvidence(query: string, topK = 4): Promise<{ query: string; evidence: EvidenceItem[]; retrieval_time_ms: number }> {
  const res = await fetch(`${API_BASE}/rag/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, top_k: topK })
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
  if (!res.ok) throw new Error("LLM synthesis failed");
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

export async function getDatasetProfile(): Promise<any> {
  const res = await fetch(`${API_BASE}/datasets`);
  if (!res.ok) throw new Error("Failed to fetch dataset profile");
  return res.json();
}

export async function getDatasetPreview(limit = 25, offset = 0): Promise<any> {
  const res = await fetch(`${API_BASE}/datasets/preview?limit=${limit}&offset=${offset}`);
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
