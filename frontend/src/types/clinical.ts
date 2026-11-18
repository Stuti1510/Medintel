/**
 * TypeScript types for clinical multimodal analysis.
 * Matches backend/app/schemas/clinical_schema.py field-for-field.
 */

export interface StructuredSymptoms {
  itch?: boolean | null;
  grew?: boolean | null;
  hurt?: boolean | null;
  changed?: boolean | null;
  bleed?: boolean | null;
  elevation?: boolean | null;
  age?: number | null;
  gender?: string | null;
  region?: string | null;
  diameter_1?: number | null;
  diameter_2?: number | null;
  fitspatrick?: number | null;
  smoke?: boolean | null;
  drink?: boolean | null;
  pesticide?: boolean | null;
  skin_cancer_history?: boolean | null;
  cancer_history?: boolean | null;
}

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

export interface EvidenceItem {
  source: string;
  title: string;
  excerpt: string;
  similarity?: number | null;
}

export interface MultimodalAnalysisResponse {
  prediction: 'BCC' | 'ACK' | 'NEV' | 'SEK' | string;
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
  clinical_summary?: string | null;
  summary?: string | null;
  summary_status?: 'available' | 'unavailable' | string;
  evidence?: EvidenceItem[] | null;
  timings_ms?: Record<string, number> | null;
  model_info: string;
}
