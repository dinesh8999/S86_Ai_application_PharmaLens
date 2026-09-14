export type EvidenceStrength = 'Strong' | 'Moderate' | 'Limited' | 'Insufficient';

export interface CitationItem {
  citation_id?: number | string;
  source: string;
  chunk_id: string;
  chunk_index?: number;
  study_id: string;
  section?: string | null;
  page?: number | string | null;
  score: number;
  text: string;
  explanation?: string | null;
}

export type CitationMap = Record<string, CitationItem>;

export interface ChunkItem {
  score: number;
  chunk_id: string;
  text: string;
  source: string;
  study_id: string;
  document_type?: string;
  page?: number | string | null;
  section?: string | null;
  chunk_index?: number | null;
  metadata?: Record<string, any>;
}

export interface UsageMetadata {
  request_id: string;
  cache_hit: boolean;
  input_tokens: number;
  output_tokens: number;
  estimated_cost: number;
  latency_ms: number;
  error?: string | null;
}

export interface QueryResponse {
  question: string;
  answer: string;
  citations: CitationMap;
  sources: string[];
  retrieved_chunks: ChunkItem[];
  context_chunks: ChunkItem[];
  used_citations: CitationItem[];
  evidence_strength: EvidenceStrength;
  conflicts_detected: boolean;
  conflict_notes?: string | null;
  chunks: ChunkItem[];
  usage: UsageMetadata;
}

export interface CorpusSummary {
  total_documents: number;
  total_pages: number;
  total_chunks: number;
  clinical_reports_count: number;
  drug_labels_count: number;
  safety_bulletins_count: number;
  regulatory_guidance_count: number;
  document_type_breakdown?: Record<string, number>;
}

export interface DocumentItem {
  document_id?: string;
  document_name: string;
  study_id: string;
  source?: string;
  chunk_count: number;
  page_count?: number;
  document_type?: string;
  sponsor?: string;
  phase?: string;
  drug?: string;
  synthetic_demo_document?: boolean;
  status: string;
  upload_date?: string;
  uploaded_at?: string;
  doc_type?: string;
}

export interface DocumentPage {
  page_number: number;
  sections: string[];
  text: string;
}

export interface DocumentDetail {
  document_id: string;
  document_name: string;
  study_id: string;
  document_type: string;
  raw_document_type?: string;
  sponsor?: string;
  phase?: string;
  drug?: string;
  provenance: string;
  synthetic_demo_document?: boolean;
  page_count: number;
  chunk_count: number;
  pages: DocumentPage[];
  raw_content: string;
  has_file_on_disk?: boolean;
}

export interface StudySummary {
  study_id: string;
  study_name: string;
  drug_name: string;
  sponsor?: string;
  phase?: string;
  document_count: number;
  chunk_count: number;
  available_evidence: string[];
  documents?: string[];
}

export interface StudyDetail {
  study_id: string;
  study_name: string;
  drug_name: string;
  sponsor?: string;
  phase: string;
  overview: string;
  efficacy: string;
  safety: string;
  adverse_events: string[];
  endpoints: string[];
  sources: string[];
  chunk_count: number;
}

export interface UsageReport {
  total_queries: number;
  total_requests?: number;
  cached_queries: number;
  cache_hits?: number;
  cache_misses?: number;
  cache_hit_rate_percent: number;
  cache_hit_rate?: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  total_estimated_cost?: number;
  avg_latency_ms: number;
  average_latency_ms?: number;
  llm_requests: number;
  embedding_requests: number;
  errors?: number;
}

export interface QuestionEvalResult {
  id: string;
  question: string;
  expected_answer: string;
  actual_answer: string;
  answer?: string;
  correctness_score: number;
  correctness?: number;
  grounding_score: number;
  grounding?: number;
  citation_accuracy: number;
  overall_score: number;
  passed: boolean;
  status?: 'PASS' | 'FAIL';
  used_citations: string[];
  citations?: CitationMap;
  failure_reason?: string | null;
}

export interface EvaluationResult {
  timestamp: string;
  total_questions: number;
  questions?: number;
  passed_questions: number;
  failed_questions: number;
  avg_correctness: number;
  avg_grounding: number;
  avg_citation_accuracy: number;
  overall_system_score: number;
  overall_score?: number;
  recall_at_k?: number;
  mrr?: number;
  avg_latency_ms?: number;
  cache_hit_rate?: number;
  question_results: QuestionEvalResult[];
  details?: QuestionEvalResult[];
  failures?: Array<{
    question: string;
    answer: string;
    overall_score: number;
  }>;
}

export interface HealthStatus {
  status: string;
  service: string;
  components: Record<string, string>;
  chat_model: string;
  embed_model: string;
  qdrant_url: string;
}

export interface RecentQueryItem {
  request_id: string;
  timestamp: string;
  question: string;
  evidence_strength: EvidenceStrength;
  latency_ms: number;
  cache_hit: boolean;
  sources_count: number;
}

export interface DashboardMetrics {
  user?: {
    name?: string;
    email?: string;
    role?: string;
  };
  knowledge_base: {
    total_studies: number;
    total_documents: number;
    total_pages: number;
    total_chunks: number;
    breakdown: {
      clinical_trial_reports: number;
      drug_labels: number;
      safety_bulletins: number;
    };
  };
  activity: {
    total_queries: number;
    cached_queries: number;
    cache_hit_rate_percent: number;
    avg_latency_ms: number;
    estimated_cost_usd: number;
  };
  rag_quality: {
    total_questions: number;
    avg_correctness: number;
    avg_grounding: number;
    avg_citation_accuracy: number;
    overall_score: number;
    status: string;
  };
  recent_queries: RecentQueryItem[];
  system_status: {
    api: string;
    qdrant: string;
    llm: string;
  };
}

