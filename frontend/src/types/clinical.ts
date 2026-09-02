export interface VitalsInput {
  heart_rate?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  temperature?: number;
  spo2?: number;
}

export interface ClinicalAnalysisRequest {
  age: number;
  sex: string;
  symptoms: string;
  duration?: string;
  severity?: string;
  medical_history?: string;
  current_medications?: string;
  vitals?: VitalsInput;
  clinical_narrative?: string;
  selected_ml_model?: string;
}

export interface DifferentialItem {
  rank: number;
  condition: string;
  probability: number;
  percentage: string;
}

export interface EvidenceItem {
  id?: string;
  title: string;
  category: string;
  source: string;
  source_url: string;
  last_updated?: string;
  similarity_score: number;
  relevance_percentage: string;
  snippet: string;
  full_content?: string;
}

export interface SafetyFlagItem {
  flag_type: string;
  severity: "CRITICAL" | "WARNING" | "ADVISORY";
  message: string;
}

export interface SalientFeature {
  token: string;
  tfidf_weight: number;
}

export interface TokenDetail {
  position: number;
  token: string;
  token_id: number;
  attention_mask: number;
  is_special: boolean;
}

export interface ClassicalMLResult {
  model_name: string;
  model_type: string;
  model_version: string;
  predicted_condition: string;
  confidence: number;
  confidence_percentage: string;
  top_differentials: DifferentialItem[];
  salient_features?: SalientFeature[];
  inference_time_ms: number;
  status: string;
}

export interface TransformerResult {
  model_name: string;
  model_type: string;
  model_version: string;
  architecture: string;
  predicted_condition: string;
  confidence: number;
  confidence_percentage: string;
  top_differentials: DifferentialItem[];
  inference_time_ms: number;
  tokens?: string[];
  token_details?: TokenDetail[];
  attention_matrix?: number[][];
  hidden_size?: number;
  num_heads?: number;
  total_parameters?: number;
  status: string;
}

export interface LLMExplanationResult {
  provider: string;
  model_name: string;
  mode: string;
  explanation_markdown: string;
  safety_flags: SafetyFlagItem[];
  has_critical_emergency: boolean;
  disclaimer: string;
  latency_ms: number;
}

export interface ClinicalAnalysisResponse {
  case_id: string;
  patient_profile: Record<string, any>;
  ml_prediction: ClassicalMLResult;
  transformer_prediction: TransformerResult;
  concordance: {
    is_concordant: boolean;
    ml_condition: string;
    transformer_condition: string;
    concordance_level: string;
  };
  confidence: {
    combined_score: number;
    combined_percentage: string;
    interpretation: string;
    is_high_confidence: boolean;
  };
  top_differentials: DifferentialItem[];
  retrieved_evidence: EvidenceItem[];
  llm_explanation: LLMExplanationResult;
  safety_flags: SafetyFlagItem[];
  disclaimer: string;
  processing_time: Record<string, number>;
  database_persisted: boolean;
}

export interface SystemStatusResponse {
  status: string;
  components: {
    classical_ml: { status: string; models_available: string[] };
    biobert_transformer: { status: string; base_architecture: string; mode: string };
    rag_vector_engine: { status: string; vector_store: string };
    llm_engine: { status: string; provider: string; mode: string };
    database: { status: string; type: string; stored_cases: number; registered_models: number };
  };
  dataset_ready: boolean;
}

export interface ModelComparisonItem {
  model_name: string;
  type: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  latency_ms: number;
  size_kb: number;
}

export interface EvaluationBenchmarkResponse {
  classical_ml: Record<string, any>;
  transformer: Record<string, any>;
  comparison: ModelComparisonItem[];
}
