import React, { useState, useEffect } from 'react';
import { fetchEvaluationResults, runEvaluation } from '../services/api';
import { EvaluationResult } from '../types';
import { RefreshCw, Play, CheckCircle, XCircle, Award, Target, FileText } from 'lucide-react';

export const EvaluationView: React.FC = () => {
  const [data, setData] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvaluation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchEvaluationResults();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load evaluation metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvaluation();
  }, []);

  const handleRunEvaluation = async () => {
    setEvaluating(true);
    setError(null);
    try {
      const res = await runEvaluation();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to execute RAG evaluation suite');
    } finally {
      setEvaluating(false);
    }
  };

  const getMetricBadge = (score: number) => {
    if (score >= 0.85) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (score >= 0.7) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-rose-100 text-rose-800 border-rose-300';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-indigo-600" />
            RAG Benchmark & Quality Evaluation
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Automated test suite measuring correctness, grounding, citation accuracy, and hallucination prevention.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadEvaluation}
            disabled={loading || evaluating}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleRunEvaluation}
            disabled={evaluating}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium shadow-sm disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${evaluating ? 'animate-spin' : ''}`} />
            {evaluating ? 'Evaluating Pipeline...' : 'Run Benchmark Evaluation'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Summary Stat Cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall RAG Score</div>
            <div className="text-2xl font-bold text-indigo-600 mt-2">
              {((data.overall_system_score ?? data.overall_score ?? 0) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Passed {data.passed_questions ?? 0} of {data.total_questions ?? data.questions ?? 0} test cases
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Factual Correctness</div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {((data.avg_correctness ?? 0) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500 mt-1">Semantic overlap with ground truth</div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Context Grounding</div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {((data.avg_grounding ?? 0) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500 mt-1">Evidence support & zero hallucination</div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Citation Precision</div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {((data.avg_citation_accuracy ?? 0) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500 mt-1">Valid chunk & study attribution</div>
          </div>
        </div>
      )}

      {/* Benchmark Results Table */}
      {data && data.question_results && data.question_results.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              Detailed Benchmark Test Results
            </h3>
            <span className="text-xs text-slate-500">
              Evaluated on {new Date(data.timestamp).toLocaleString()}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {data.question_results.map((q, idx) => (
              <div key={q.id || idx} className="p-5 hover:bg-slate-50/50 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {q.passed || q.status === 'PASS' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                      )}
                      <h4 className="font-medium text-slate-900 text-base">{q.question}</h4>
                    </div>
                    <div className="text-sm text-slate-600 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="text-xs font-medium text-slate-500 uppercase">System Generated Answer:</div>
                      <p className="mt-1">{q.actual_answer || q.answer}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium border ${getMetricBadge(
                        q.overall_score ?? 0
                      )}`}
                    >
                      Overall: {((q.overall_score ?? 0) * 100).toFixed(0)}%
                    </span>
                    <div className="text-xs text-slate-500 text-right space-y-0.5">
                      <div>Correctness: {((q.correctness_score ?? q.correctness ?? 0) * 100).toFixed(0)}%</div>
                      <div>Grounding: {((q.grounding_score ?? q.grounding ?? 0) * 100).toFixed(0)}%</div>
                      <div>Citations: {((q.citation_accuracy ?? 0) * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                </div>

                {q.used_citations && q.used_citations.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Citations: {q.used_citations.join(', ')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationView;
