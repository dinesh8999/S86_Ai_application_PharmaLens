export interface CitationItem {
  source: string;
  chunk_id: string;
  chunk_index: number;
  study_id: string;
  section?: string | null;
  page?: number | null;
  score: number;
  text: string;
}

export type CitationMap = Record<string, CitationItem>;

export interface ChunkItem {
  score: number;
  chunk_id: string;
  text: string;
  source: string;
  study_id: string;
  page?: number | null;
  section?: string | null;
  chunk_index?: number | null;
  metadata?: Record<string, any>;
}

export interface UsageMetadata {
  request_id?: string;
  cache_hit: boolean;
  input_tokens: number;
  output_tokens: number;
  estimated_cost: number;
  latency_ms: number;
  error?: string | null;
}

export interface QueryResponse {
  answer: string;
  citations: CitationMap;
  sources: string[];
  chunks: ChunkItem[];
  usage: UsageMetadata;
}

export interface DocumentItem {
  document_name: string;
  study_id: string;
  chunk_count: number;
  status: string;
  upload_date: string;
  doc_type: string;
}

export interface UsageReport {
  total_requests: number;
  cache_hits: number;
  cache_misses: number;
  cache_hit_rate: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_estimated_cost: number;
  average_latency_ms: number;
  errors: number;
}

export interface EvaluationItem {
  id: number;
  question: string;
  answer: string;
  citations: CitationMap;
  correctness: number;
  grounding: number;
  citation_accuracy: number;
  overall_score: number;
  status: 'PASS' | 'FAIL';
}

export interface EvaluationResult {
  questions: number;
  avg_correctness: number;
  avg_grounding: number;
  avg_citation_accuracy: number;
  overall_score: number;
  failures: Array<{
    question: string;
    answer: string;
    overall_score: number;
  }>;
  details: EvaluationItem[];
}
