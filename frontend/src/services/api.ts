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

const API_BASE_URLS = [
  ...(configuredBase ? [configuredBase] : []),
  PRODUCTION_RENDER_API,
  '/api',
  'http://localhost:8000/api',
  'http://127.0.0.1:8000/api',
];

let authTokenProvider: (() => Promise<string | null>) | null = null;

export function setAuthTokenProvider(provider: () => Promise<string | null>) {
  authTokenProvider = provider;
}

async function fetchWithFallback(endpoint: string, options: RequestInit = {}): Promise<Response> {
  let lastError: any = null;

  // Clone headers and attach Authorization if available
  const headers = new Headers(options.headers || {});
  if (authTokenProvider) {
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

  for (const baseUrl of API_BASE_URLS) {
    try {
      const url = `${baseUrl}${endpoint}`;
      const res = await fetch(url, enhancedOptions);
      if (res.ok || res.status === 400 || res.status === 500) {
        return res;
      }
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('Backend API unreachable on both /api and http://localhost:8000/api');
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
  return `http://localhost:8000/api/documents/download/${encodeURIComponent(documentName)}`;
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
