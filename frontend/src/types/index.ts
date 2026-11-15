export interface QualityAssessment {
  blur: number;
  brightness: number;
  noise: number;
  q: number;
}

export interface ModalityWeights {
  image: number;
  text: number;
}

export interface TextAttribution {
  ngram: string;
  weight: number;
  start: number;
  end: number;
}

export interface MultimodalAnalysisResponse {
  prediction: 'BCC' | 'ACK' | 'NEV' | 'SEK';
  confidence: number;
  probabilities: Record<string, number>;
  quality: QualityAssessment;
  enhancement_applied: boolean;
  enhancement_method: string;
  modality_weights: ModalityWeights;
  text_attributions: TextAttribution[];
  gradcam_base64?: string | null;
  enhanced_image_base64?: string | null;
  narrative_used: string;
  safety_alert?: string | null;
  clinical_summary?: string;
  model_info: string;
}

export interface ExperimentResultRow {
  [key: string]: any;
}

export interface ExperimentResponse {
  rows: ExperimentResultRow[];
  status: 'success' | 'not_run' | 'invalid_experiment_id' | 'error';
  count?: number;
  message?: string;
}

export interface DatasetFoldDist {
  fold: string;
  BCC: number;
  ACK: number;
  NEV: number;
  SEK: number;
  total: number;
}

export interface HistogramBin {
  bin: string;
  count: number;
}

export interface DatasetSummaryResponse {
  status: 'success' | 'not_run' | 'error';
  total_samples?: number;
  num_patients?: number;
  classes?: Record<string, number>;
  folds?: DatasetFoldDist[];
  sharpness_histogram?: HistogramBin[];
  brightness_histogram?: HistogramBin[];
  message?: string;
}
