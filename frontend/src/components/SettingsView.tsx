import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Server, Database, Cpu, CheckCircle, RefreshCw } from 'lucide-react';
import { checkHealth } from '../services/api';

export const SettingsView: React.FC = () => {
  const [healthy, setHealthy] = useState<boolean | null>(null);
  const [checking, setChecking] = useState<boolean>(false);

  const verify = async () => {
    setChecking(true);
    const ok = await checkHealth();
    setHealthy(ok);
    setChecking(false);
  };

  useEffect(() => {
    verify();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2 mb-4">
          <SettingsIcon className="w-5 h-5 text-petrol-600" /> PharmaLens Configuration & Infrastructure
        </h3>

        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-petrol-600" />
              <div>
                <h4 className="font-bold text-xs text-slate-900">FastAPI Backend Service</h4>
                <p className="text-[11px] text-slate-500">http://localhost:8000</p>
              </div>
            </div>
            <button
              onClick={verify}
              disabled={checking}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} /> Test API
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-darkteal-700" />
              <div>
                <h4 className="font-bold text-xs text-slate-900">Qdrant Vector Database</h4>
                <p className="text-[11px] text-slate-500">Collection: <code>rag_chunks</code> | Vector Dim: 3072</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-powder-100 text-petrol-900 text-[11px] font-bold rounded-md border border-powder-300">
              Cosine Similarity
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 text-crimson-600" />
              <div>
                <h4 className="font-bold text-xs text-slate-900">AI Models Integration</h4>
                <p className="text-[11px] text-slate-500">Chat: <code>gemini-3.6-flash</code> | Embedding: <code>gemini-embedding-001</code></p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-powder-100 text-petrol-900 text-[11px] font-bold rounded-md border border-powder-300">
              Google Gemini API
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
