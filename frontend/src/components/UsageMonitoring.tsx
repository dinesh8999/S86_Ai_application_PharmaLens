import React, { useState, useEffect } from 'react';
import { BarChart3, Zap, DollarSign, Clock, RefreshCw, FileCode, Layers } from 'lucide-react';
import { fetchUsageMetrics } from '../services/api';
import { UsageReport } from '../types';

export const UsageMonitoring: React.FC = () => {
  const [usage, setUsage] = useState<UsageReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadUsage = async () => {
    setLoading(true);
    try {
      const data = await fetchUsageMetrics();
      setUsage(data);
    } catch (err) {
      console.error('Error loading usage:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsage();
  }, []);

  // Safe fallback extractors
  const totalQueries = usage?.total_queries ?? usage?.total_requests ?? 0;
  const cachedQueries = usage?.cached_queries ?? usage?.cache_hits ?? 0;
  const cacheMisses = usage?.cache_misses ?? Math.max(totalQueries - cachedQueries, 0);
  const cacheHitRate = usage?.cache_hit_rate_percent ?? ((usage?.cache_hit_rate ?? 0) * 100);
  const avgLatency = usage?.avg_latency_ms ?? usage?.average_latency_ms ?? 0;
  const totalInputTokens = usage?.total_input_tokens ?? 0;
  const totalOutputTokens = usage?.total_output_tokens ?? 0;
  const estimatedCost = usage?.estimated_cost_usd ?? usage?.total_estimated_cost ?? 0;
  const llmRequests = usage?.llm_requests ?? Math.max(totalQueries - cachedQueries, 0);
  const embeddingRequests = usage?.embedding_requests ?? Math.max(totalQueries - cachedQueries, 0);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" /> RAG Analytics & Usage Monitoring
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Real-time tracking for token consumption, cache performance, cost estimation, and request latency.
          </p>
        </div>
        <button
          onClick={loadUsage}
          className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
          title="Refresh metrics"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 flex justify-center items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-xs font-medium">Loading usage statistics...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Total Research Queries</span>
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{totalQueries}</div>
            <div className="text-xs text-slate-500 flex justify-between pt-2 border-t border-slate-100">
              <span>Cache Hits: <strong>{cachedQueries}</strong></span>
              <span>Cache Misses: <strong>{cacheMisses}</strong></span>
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Cache Hit Rate</span>
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-3xl font-extrabold text-amber-600">
              {cacheHitRate.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
              Response cache TTL: 900s
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Average Latency</span>
              <Clock className="w-5 h-5 text-teal-600" />
            </div>
            <div className="text-3xl font-extrabold text-teal-700">{avgLatency.toFixed(1)} ms</div>
            <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
              Vector retrieval + LLM generation
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Total Input Tokens</span>
              <FileCode className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-3xl font-extrabold text-indigo-900">
              {totalInputTokens.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
              Prompt & context chunks
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Total Output Tokens</span>
              <FileCode className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-3xl font-extrabold text-purple-900">
              {totalOutputTokens.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
              Grounded AI generated answers
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Total Estimated Cost</span>
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-700">
              ${estimatedCost.toFixed(4)}
            </div>
            <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex justify-between">
              <span>LLM Requests: <strong>{llmRequests}</strong></span>
              <span>Embed Requests: <strong>{embeddingRequests}</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
