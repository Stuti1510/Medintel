import {
  MultimodalAnalysisResponse,
  ExperimentResponse,
  DatasetSummaryResponse
} from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export class ApiError extends Error {
  url: string;
  status?: number;
  constructor(message: string, url: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.url = url;
    this.status = status;
  }
}

export async function analyzeMultimodal(formData: FormData): Promise<MultimodalAnalysisResponse> {
  const url = `${API_BASE_URL}/analyze/multimodal`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new ApiError(`Request failed (${res.status}): ${errText}`, url, res.status);
    }
    return await res.json();
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err?.message || 'Network error occurred', url);
  }
}

export async function getExperimentResults(expId: string): Promise<ExperimentResponse> {
  const url = `${API_BASE_URL}/results/${expId}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new ApiError(`Failed to fetch results for ${expId} (${res.status})`, url, res.status);
    }
    return await res.json();
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err?.message || 'Network error occurred', url);
  }
}

export async function getDatasetSummary(): Promise<DatasetSummaryResponse> {
  const url = `${API_BASE_URL}/dataset/summary`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new ApiError(`Failed to fetch dataset summary (${res.status})`, url, res.status);
    }
    return await res.json();
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err?.message || 'Network error occurred', url);
  }
}
