import React, { useState, useEffect } from 'react';
import { getHealth } from '../services/api';
import { HealthStatus } from '../types';
import { Activity, Server, Database, Cpu, HardDrive, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export const SystemHealthView: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getHealth();
      setHealth(res);
    } catch (err: any) {
      setError(err.message || 'System health monitoring unreachable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-600" />
            System Infrastructure & Services Health
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time operational status for backend microservices, vector storage, and AI inference models.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <strong>Backend Disconnected:</strong> {error}
          </div>
        </div>
      )}

      {/* Main Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall API Status</div>
            <div className="text-xl font-bold text-slate-900 mt-1 capitalize flex items-center gap-2">
              {health?.status === 'healthy' ? (
                <span className="text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5" /> Operational
                </span>
              ) : (
                <span className="text-amber-600 flex items-center gap-1.5">
                  <AlertTriangle className="w-5 h-5" /> Degradation
                </span>
              )}
            </div>
          </div>
          <Server className="w-8 h-8 text-slate-400 opacity-60" />
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">LLM Inference Model</div>
            <div className="text-sm font-semibold text-slate-900 mt-1 truncate max-w-[180px]">
              {health?.chat_model || 'gpt-4o-mini'}
            </div>
            <div className="text-xs text-emerald-600 mt-0.5 font-medium">Ready & Active</div>
          </div>
          <Cpu className="w-8 h-8 text-indigo-500 opacity-60" />
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Embedding Model</div>
            <div className="text-sm font-semibold text-slate-900 mt-1 truncate max-w-[180px]">
              {health?.embed_model || 'text-embedding-3-small'}
            </div>
            <div className="text-xs text-emerald-600 mt-0.5 font-medium">Dense Vector Ready</div>
          </div>
          <HardDrive className="w-8 h-8 text-cyan-500 opacity-60" />
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vector Store (Qdrant)</div>
            <div className="text-sm font-semibold text-slate-900 mt-1 truncate max-w-[180px]">
              {health?.qdrant_url || 'Memory Vector Store'}
            </div>
            <div className="text-xs text-emerald-600 mt-0.5 font-medium">Connected</div>
          </div>
          <Database className="w-8 h-8 text-purple-500 opacity-60" />
        </div>
      </div>

      {/* Component Breakdown Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            Component Diagnostics Breakdown
          </h3>
        </div>

        <div className="divide-y divide-slate-100">
          {health?.components ? (
            Object.entries(health.components).map(([compName, compStatus]) => (
              <div key={compName} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                <span className="font-medium text-slate-800 capitalize text-sm">{compName.replace(/_/g, ' ')}</span>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {compStatus}
                </span>
              </div>
            ))
          ) : (
            <div className="p-4 text-slate-500 text-sm text-center">Loading component status diagnostics...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemHealthView;
