import React, { useState, useEffect } from 'react';
import { BarChart3, Zap, DollarSign, Clock, AlertTriangle, RefreshCw, FileCode } from 'lucide-react';
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
          className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
          title="Refresh metrics"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {usage && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Total Requests</span>
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{usage.total_requests}</div>
            <div className="text-xs text-slate-500 flex justify-between pt-2 border-t border-slate-100">
              <span>Hits: <strong>{usage.cache_hits}</strong></span>
              <span>Misses: <strong>{usage.cache_misses}</strong></span>
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Cache Hit Rate</span>
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-3xl font-extrabold text-amber-600">
              {(usage.cache_hit_rate * 100).toFixed(1)}%
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
            <div className="text-3xl font-extrabold text-teal-700">{usage.average_latency_ms} ms</div>
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
              {usage.total_input_tokens.toLocaleString()}
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
              {usage.total_output_tokens.toLocaleString()}
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
              ${usage.total_estimated_cost.toFixed(4)}
            </div>
            <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
              Errors logged: <strong>{usage.errors}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
