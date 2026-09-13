import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardCards } from './components/DashboardCards';
import { ResearchAssistant } from './components/ResearchAssistant';
import { DocumentManager } from './components/DocumentManager';
import { EvaluationView } from './components/EvaluationView';
import { UsageMonitoring } from './components/UsageMonitoring';
import { SettingsView } from './components/SettingsView';
import { fetchDocuments, fetchUsageMetrics } from './services/api';
import { DocumentItem, UsageReport } from './types';
import { ShieldCheck, Sparkles, FileText } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [usage, setUsage] = useState<UsageReport | null>(null);

  const loadOverviewData = async () => {
    try {
      const [docs, u] = await Promise.all([
        fetchDocuments().catch(() => []),
        fetchUsageMetrics().catch(() => null),
      ]);
      setDocuments(docs);
      setUsage(u);
    } catch (err) {
      console.error('Error loading overview:', err);
    }
  };

  useEffect(() => {
    loadOverviewData();
  }, [activeTab]);

  const getPageTitle = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Clinical Research Intelligence Dashboard';
      case 'assistant':
        return 'PharmaLens Research Assistant';
      case 'documents':
        return 'Clinical Documents & Knowledge Base';
      case 'evaluation':
        return 'RAG Evaluation & Quality Assurance';
      case 'monitoring':
        return 'Usage Analytics & Performance Monitoring';
      case 'settings':
        return 'System Configuration';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Navigation Sidebar */}
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={getPageTitle(activeTab)} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Dashboard Banner */}
              <div className="p-6 bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 text-white rounded-2xl shadow-lg relative overflow-hidden">
                <div className="relative z-10 max-w-2xl space-y-2">
                  <span className="px-3 py-1 bg-blue-500/30 text-blue-200 border border-blue-400/30 rounded-full text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-300" /> Zero-Hallucination Grounded Engine
                  </span>
                  <h2 className="text-2xl font-extrabold tracking-tight">
                    Accelerate Pharmaceutical Discovery with Grounded AI
                  </h2>
                  <p className="text-sm text-blue-100/90 leading-relaxed">
                    Search clinical trial reports, safety bulletins, and drug labels with instant semantic retrieval, traceable source citations, and verified evidence.
                  </p>
                  <div className="pt-2 flex gap-3">
                    <button
                      onClick={() => setActiveTab('assistant')}
                      className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" /> Start Research Question
                    </button>
                    <button
                      onClick={() => setActiveTab('documents')}
                      className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-2 border border-white/20"
                    >
                      <FileText className="w-4 h-4" /> Upload Clinical Document
                    </button>
                  </div>
                </div>
              </div>

              {/* Cards Grid */}
              <DashboardCards
                documentCount={documents.length}
                usage={usage}
                onNavigate={setActiveTab}
              />

              {/* Quick Research Query Prompt */}
              <ResearchAssistant />
            </div>
          )}

          {activeTab === 'assistant' && <ResearchAssistant />}
          {activeTab === 'documents' && <DocumentManager />}
          {activeTab === 'evaluation' && <EvaluationView />}
          {activeTab === 'monitoring' && <UsageMonitoring />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
};

export default App;
