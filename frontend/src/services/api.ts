import {
  QueryResponse,
  DocumentItem,
  UsageReport,
  EvaluationResult,
} from '../types';

const API_BASE_URLS = ['http://localhost:8000/api', 'http://127.0.0.1:8000/api', '/api'];

async function fetchWithFallback(endpoint: string, options?: RequestInit): Promise<Response> {
  let lastError: any = null;
  for (const baseUrl of API_BASE_URLS) {
    try {
      const url = `${baseUrl}${endpoint}`;
      const res = await fetch(url, options);
      if (res.ok || res.status === 400 || res.status === 500) {
        return res;
      }
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('Backend API unreachable on both /api and http://localhost:8000/api');
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetchWithFallback('/health');
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === 'healthy';
  } catch {
    return false;
  }
}

export async function queryRAG(
  question: string,
  k: number = 4,
  filters?: Record<string, any>
): Promise<QueryResponse> {
  const res = await fetchWithFallback('/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question, k, filters }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Query failed: ${errText}`);
  }

  return await res.json();
}

export async function fetchDocuments(): Promise<DocumentItem[]> {
  const res = await fetchWithFallback('/documents');
  if (!res.ok) {
    throw new Error('Failed to fetch documents');
  }
  return await res.json();
}

export async function uploadDocument(file: File, studyId?: string): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  if (studyId) {
    formData.append('study_id', studyId);
  }

  const res = await fetchWithFallback('/documents/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Upload failed: ${errText}`);
  }

  return await res.json();
}

export async function fetchUsageMetrics(): Promise<UsageReport> {
  const res = await fetchWithFallback('/usage');
  if (!res.ok) {
    throw new Error('Failed to fetch usage metrics');
  }
  return await res.json();
}

export async function fetchEvaluationResults(): Promise<EvaluationResult> {
  const res = await fetchWithFallback('/evaluation');
  if (!res.ok) {
    throw new Error('Failed to fetch evaluation results');
  }
  return await res.json();
}

export async function runEvaluation(): Promise<EvaluationResult> {
  const res = await fetchWithFallback('/evaluation/run', {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error('Failed to trigger evaluation');
  }
  return await res.json();
}
