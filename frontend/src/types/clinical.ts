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
  selected_disease?: string;
  height?: number;
  weight?: number;
  cholesterol?: number;
  gluc?: number;
  smoke?: number;
  alco?: number;
  active?: number;
}

export interface DifferentialItem {
  rank: number;
  condition: string;
  category?: string;
  probability: number;
  percentage: string;
  raw_model_score?: number;
  relative_score?: number;
  clinical_rationale?: string;
  is_primary?: boolean;
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
  feature?: string;
  token?: string;
  value?: string;
  salience?: number;
  tfidf_weight?: number;
  weight?: number;
  direction?: "SUPPORTING" | "OPPOSING";
  evidence_type?: string;
  category?: string;
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
  model_type?: string;
  model_version?: string;
  predicted_condition: string;
  confidence?: number;
  confidence_score?: number;
  confidence_percentage?: string;
  all_probabilities?: Record<string, number>;
  top_differentials: DifferentialItem[];
  salient_features?: SalientFeature[];
  feature_contributions?: SalientFeature[];
  extracted_features?: Record<string, any>;
  inference_time_ms?: number;
  latency_ms?: number;
  status?: string;
}

export interface TransformerResult {
  model_name: string;
  model_type?: string;
  model_version?: string;
  architecture?: string;
  predicted_condition: string;
  confidence?: number;
  confidence_percentage?: string;
  top_differentials: DifferentialItem[];
  inference_time_ms?: number;
  latency_ms?: number;
  tokens?: string[];
  token_details?: TokenDetail[];
  attention_matrix?: number[][];
  hidden_size?: number;
  num_heads?: number;
  total_parameters?: number;
  status?: string;
}

export interface LLMExplanationResult {
  provider?: string;
  model_name?: string;
  mode?: string;
  clinical_guidance?: string;
  explanation_markdown?: string;
  safety_flags?: SafetyFlagItem[];
  has_critical_emergency?: boolean;
  disclaimer?: string;
  latency_ms?: number;
}

export interface ClinicalAnalysisResponse {
  case_id?: string;
  case_reference?: string;
  patient_profile?: Record<string, any>;
  ml_prediction: ClassicalMLResult;
  transformer_prediction: TransformerResult;
  concordance?: {
    is_concordant: boolean;
    ml_condition: string;
    transformer_condition: string;
    concordance_level: string;
  };
  confidence?: {
    combined_score: number;
    combined_percentage: string;
    interpretation: string;
    is_high_confidence: boolean;
  };
  top_differentials: DifferentialItem[];
  retrieved_evidence: EvidenceItem[];
  llm_explanation: LLMExplanationResult;
  safety_flags: SafetyFlagItem[];
  disclaimer?: string;
  processing_time?: Record<string, number>;
  database_persisted?: boolean;
}

export interface LabResultDetail {
  value: number;
  unit: string;
  status: string;
  reference_range: string;
}

export interface ExtractedPatient {
  symptoms: string[];
  lab_results: Record<string, LabResultDetail>;
  vitals: Record<string, number>;
  medical_history: string[];
  medications: string[];
  age: number | null;
  sex: string | null;
  duration: string;
  other_findings: string[];
  uncertain_fields: string[];
  source_text: string;
}

export interface DocumentUploadResult {
  filename: string;
  file_type: string;
  status: "SUCCESS" | "ERROR";
  error?: string;
  pages_count?: number;
  raw_text_length?: number;
  raw_text?: string;
  normalized_text?: string;
  extracted_patient?: ExtractedPatient;
  metadata?: Record<string, any>;
  processing_time_ms?: number;
}

export interface DocumentUploadResponse {
  document: DocumentUploadResult;
  analysis?: ClinicalAnalysisResponse | null;
  status: "SUCCESS" | "ERROR";
}

export interface PositiveEvidenceItem {
  feature: string;
  value: string;
  support_level: string;
  salience: number;
  category: string;
}

export interface NegativeEvidenceItem {
  feature: string;
  value: string;
  effect: string;
  salience: number;
  category: string;
}

export interface LexicalTokenItem {
  term: string;
  weight: number;
  category: string;
}

export interface ExplainabilityResult {
  predicted_condition: string;
  confidence: number;
  confidence_percentage: string;
  model_name: string;
  feature_contributions: SalientFeature[];
  positive_evidence: PositiveEvidenceItem[];
  negative_evidence: NegativeEvidenceItem[];
  lexical_token_salience: LexicalTokenItem[];
  retrieved_evidence: EvidenceItem[];
  model_reasoning: string;
  uncertainty_note: string;
  tokens?: string[];
  token_details?: TokenDetail[];
  attention_matrix?: number[][];
}

export interface SystemStatusResponse {
  status: string;
  benchmark_architecture?: string;
  components: {
    classical_ml: { status: string; models_available: string[] };
    biobert_transformer: { status: string; base_architecture: string; mode: string };
    rag_vector_engine: { status: string; vector_store: string };
    llm_engine: { status: string; provider: string; mode: string };
    database: { status: string; type: string; stored_cases: number; registered_models: number };
  };
  datasets_ready?: boolean;
  dataset_ready?: boolean;
}

export interface ModelComparisonItem {
  model_name: string;
  type: string;
  accuracy: number;
  balanced_accuracy?: number;
  roc_auc?: number;
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
