export * from './clinical';

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
