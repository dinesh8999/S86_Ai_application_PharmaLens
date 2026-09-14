import {
  QueryResponse,
  DocumentItem,
  DocumentDetail,
  StudySummary,
  StudyDetail,
  UsageReport,
  EvaluationResult,
  HealthStatus,
  CorpusSummary,
  DashboardMetrics,
} from '../types';

const PRODUCTION_RENDER_API = 'https://s86-ai-application-pharmalens-1.onrender.com/api';

const rawEnvApi = import.meta.env.VITE_API_BASE_URL?.trim();
const configuredBase = rawEnvApi
  ? (rawEnvApi.endsWith('/api') ? rawEnvApi.replace(/\/+$/, '') : `${rawEnvApi.replace(/\/+$/, '')}/api`)
  : null;

const isLocalBrowser =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '');

const API_BASE_URLS = [
  ...(configuredBase ? [configuredBase] : []),
  ...(isLocalBrowser
    ? ['/api', 'http://127.0.0.1:8000/api', 'http://localhost:8000/api', PRODUCTION_RENDER_API]
    : [PRODUCTION_RENDER_API, '/api']),
];

let authTokenProvider: (() => Promise<string | null>) | null = null;

export function setAuthTokenProvider(provider: () => Promise<string | null>) {
  authTokenProvider = provider;
}

async function fetchWithFallback(endpoint: string, options: RequestInit = {}): Promise<Response> {
  let lastError: any = null;

  // Clone headers and attach Authorization if available
  const headers = new Headers(options.headers || {});
  if (authTokenProvider && endpoint !== '/health') {
    try {
      const token = await authTokenProvider();
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    } catch {
      // Ignore token acquisition error for unauthenticated requests
    }
  }

  const enhancedOptions: RequestInit = {
    ...options,
    headers,
  };

  const isUploadOrLong =
    endpoint.includes('/upload') ||
    endpoint.includes('/query') ||
    endpoint.includes('/compare') ||
    endpoint.includes('/evaluation') ||
    options.body instanceof FormData;

  const timeoutMs = isUploadOrLong ? 60000 : 15000;

  for (const baseUrl of API_BASE_URLS) {
    try {
      const url = `${baseUrl}${endpoint}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, {
        ...enhancedOptions,
        signal: options.signal || controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok || res.status === 400 || res.status === 401 || res.status === 403 || res.status === 500) {
        return res;
      }
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('Backend API unreachable');
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const res = await fetchWithFallback('/dashboard');
  if (!res.ok) {
    throw new Error('Failed to fetch dashboard metrics');
  }
  return await res.json();
}

export async function getHealth(): Promise<HealthStatus> {
  const res = await fetchWithFallback('/health');
  if (!res.ok) {
    throw new Error('Health check failed');
  }
  return await res.json();
}

export async function checkHealth(): Promise<boolean> {
  try {
    const health = await getHealth();
    return health.status === 'healthy';
  } catch {
    return false;
  }
}

export async function queryResearch(
  question: string,
  top_k: number = 4,
  study_id?: string | null,
  document_type?: string | null,
  filters?: Record<string, any>
): Promise<QueryResponse> {
  const res = await fetchWithFallback('/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question,
      k: top_k,
      study_id: study_id || undefined,
      document_type: document_type || undefined,
      filters,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Query failed: ${errText}`);
  }

  return await res.json();
}

export async function queryRAG(
  question: string,
  k: number = 4,
  filters?: Record<string, any>
): Promise<QueryResponse> {
  return queryResearch(question, k, undefined, undefined, filters);
}

export async function compareStudies(
  study_id_1: string,
  study_id_2: string,
  aspect: string = 'safety and efficacy'
): Promise<QueryResponse> {
  const res = await fetchWithFallback('/compare', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ study_id_1, study_id_2, aspect }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Comparison failed: ${errText}`);
  }

  return await res.json();
}

export async function fetchStudies(): Promise<StudySummary[]> {
  const res = await fetchWithFallback('/studies');
  if (!res.ok) {
    throw new Error('Failed to fetch studies');
  }
  return await res.json();
}

export async function getStudies(): Promise<StudySummary[]> {
  return fetchStudies();
}

export async function fetchStudyDetail(studyId: string): Promise<StudyDetail> {
  const res = await fetchWithFallback(`/studies/${studyId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch study details for ${studyId}`);
  }
  return await res.json();
}

export async function fetchCorpusSummary(): Promise<CorpusSummary> {
  const res = await fetchWithFallback('/documents/summary');
  if (!res.ok) {
    throw new Error('Failed to fetch corpus summary');
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

export async function getDocuments(): Promise<DocumentItem[]> {
  return fetchDocuments();
}

export async function fetchDocumentDetail(documentIdentifier: string): Promise<DocumentDetail> {
  const res = await fetchWithFallback(`/documents/${encodeURIComponent(documentIdentifier)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch document details for ${documentIdentifier}`);
  }
  return await res.json();
}

export function getDocumentDownloadUrl(documentName: string): string {
  const base = configuredBase || (isLocalBrowser ? 'http://127.0.0.1:8000/api' : '/api');
  return `${base}/documents/download/${encodeURIComponent(documentName)}`;
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
    let detailMsg = errText;
    try {
      const parsed = JSON.parse(errText);
      detailMsg = parsed.detail || parsed.message || errText;
    } catch {}
    throw new Error(detailMsg || 'Upload failed');
  }

  return await res.json();
}

export async function fetchSourceDetail(sourceId: string): Promise<any> {
  const res = await fetchWithFallback(`/sources/${encodeURIComponent(sourceId)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch source details for ${sourceId}`);
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

export async function getUsage(): Promise<UsageReport> {
  return fetchUsageMetrics();
}

export async function fetchEvaluationResults(): Promise<EvaluationResult> {
  const res = await fetchWithFallback('/evaluation');
  if (!res.ok) {
    throw new Error('Failed to fetch evaluation results');
  }
  return await res.json();
}

export async function getEvaluation(): Promise<EvaluationResult> {
  return fetchEvaluationResults();
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
