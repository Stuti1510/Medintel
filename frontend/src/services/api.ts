import {
  MultimodalAnalysisResponse,
  ExperimentResponse,
  DatasetSummaryResponse
} from '../types';

export type { MultimodalAnalysisResponse, ExperimentResponse, DatasetSummaryResponse };

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export class ApiError extends Error {
  url: string;
  status?: number;
  detail?: string;
  constructor(message: string, url: string, status?: number, detail?: string) {
    super(message);
    this.name = 'ApiError';
    this.url = url;
    this.status = status;
    this.detail = detail;
  }
}

export async function analyzeMultimodal(
  formData: FormData,
  externalSignal?: AbortSignal
): Promise<MultimodalAnalysisResponse> {
  const url = `${API_BASE_URL}/analyze/multimodal`;
  const controller = new AbortController();
  const timeoutMs = 120000; // 120 seconds
  let didTimeout = false;

  const timer = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeoutMs);

  if (externalSignal) {
    externalSignal.addEventListener('abort', () => {
      controller.abort();
    });
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      let detail = '';
      try {
        const errJson = await res.json();
        if (typeof errJson.detail === 'string') {
          detail = errJson.detail;
        } else if (Array.isArray(errJson.detail)) {
          detail = errJson.detail.map((d: any) => `${d.loc?.join('.') || 'field'}: ${d.msg}`).join(', ');
        } else {
          detail = JSON.stringify(errJson);
        }
      } catch {
        detail = await res.text();
      }

      if (res.status === 422) {
        throw new ApiError(`Input Validation Error (422): ${detail}`, url, 422, detail);
      }
      if (res.status === 503) {
        throw new ApiError(`Service Unavailable (503): ${detail}`, url, 503, detail);
      }
      throw new ApiError(`Request failed (${res.status}): ${detail}`, url, res.status, detail);
    }
    return await res.json();
  } catch (err: any) {
    clearTimeout(timer);
    if (didTimeout) {
      throw new ApiError('The analysis took longer than 2 minutes. Please check the backend.', url, 408);
    }
    if (externalSignal?.aborted || err?.name === 'AbortError') {
      throw new ApiError('Analysis cancelled by user.', url, 499);
    }
    if (err instanceof ApiError) throw err;
    const msg = err?.message || 'Network error occurred';
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Load failed')) {
      throw new ApiError('Cannot reach the MEDINTEL server at http://localhost:8000 within 5 seconds. Ensure uvicorn is running.', url);
    }
    throw new ApiError(msg, url);
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

export interface SystemStatusResponse {
  status: 'ready' | 'degraded' | 'loading' | 'offline' | 'error' | 'unavailable' | string;
  service: string;
  dataset: string;
  model?: string;
  missing_path?: string;
  models?: {
    image: string;
    text: string;
    restoration: string;
    fusion: string;
  };
}

export async function getSystemStatus(): Promise<SystemStatusResponse> {
  const url = `${API_BASE_URL}/status`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new ApiError(`Health check failed (${res.status})`, url, res.status);
    }
    return await res.json();
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err?.message || 'Network error occurred', url);
  }
}

export interface SampleCase {
  disease: string;
  displayName: string;
  img_id: string;
  narrative: string;
  symptoms: Record<string, 'yes' | 'no' | 'not_sure'>;
  age: string;
  gender: string;
  region: string;
  diameter1: string;
  diameter2: string;
  image_base64: string | null;
  has_image: boolean;
}

export async function getSampleCases(): Promise<SampleCase[]> {
  const url = `${API_BASE_URL}/samples`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new ApiError(`Failed to fetch sample cases (${res.status})`, url, res.status);
    }
    return await res.json();
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err?.message || 'Network error occurred', url);
  }
}
