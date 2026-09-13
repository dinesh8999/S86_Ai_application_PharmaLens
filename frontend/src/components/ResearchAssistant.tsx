import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Send,
  Loader2,
  FileText,
  Clock,
  Zap,
  DollarSign,
  Info,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { queryRAG } from '../services/api';
import { QueryResponse, CitationItem } from '../types';
import { CitationViewer } from './CitationViewer';

export const ResearchAssistant: React.FC = () => {
  const [question, setQuestion] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeCitationKey, setActiveCitationKey] = useState<string | null>(null);
  const [selectedCitation, setSelectedCitation] = useState<CitationItem | null>(null);

  const sampleQuestions = [
    'What did Study 001 evaluate?',
    'What was the primary endpoint of Study 001?',
    'What was the most common adverse event reported?',
    'What are the contraindications for Drug X?',
    'What are the inclusion criteria for Study 002?',
    'What is the recommended dosage of Drug Z for pediatric cancer?', // Out-of-domain fallback test!
  ];

  const handleAsk = async (queryToAsk?: string) => {
    const q = queryToAsk || question;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await queryRAG(q);
      setResponse(res);
    } catch (err: any) {
      setError(err.message || 'Error processing query');
    } finally {
      setLoading(false);
    }
  };

  const handleCitationClick = (key: string) => {
    if (response?.citations[key]) {
      setActiveCitationKey(key);
      setSelectedCitation(response.citations[key]);
    }
  };

  // Render answer string with interactive clickable citation badges [1], [2]
  const renderFormattedAnswer = (text: string) => {
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((part, index) => {
      if (/^\[\d+\]$/.test(part)) {
        const isAvailable = response?.citations[part];
        return (
          <button
            key={index}
            onClick={() => isAvailable && handleCitationClick(part)}
            title={isAvailable ? `Inspect Citation ${part}` : 'Citation Unavailable'}
            className={`citation-badge ${
              isAvailable ? 'hover:bg-blue-600 hover:text-white' : 'opacity-60 cursor-not-allowed'
            }`}
          >
            {part}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="space-y-6">
      {/* Input Header Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold text-slate-800">Ask Clinical Research Question</h3>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask natural language questions across clinical trial reports, protocols, safety bulletins..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Retrieving...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Ask PharmaLens
              </>
            )}
          </button>
        </form>

        {/* Sample Question Chips */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 font-medium">Sample Queries:</span>
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuestion(q);
                handleAsk(q);
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-lg border border-slate-200 transition-colors text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Execution Error</p>
            <p className="text-xs text-rose-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Answer & Evidence Grid */}
      {response && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Main Answer View */}
          <div className="lg:col-[span_2] space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <h3 className="font-bold text-slate-900 text-base">Grounded AI Answer</h3>
                </div>

                {/* Cache Badge */}
                <div className="flex items-center gap-2 text-xs">
                  {response.usage.cache_hit ? (
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-semibold rounded-md border border-amber-200 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-600" /> Cache HIT
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 font-medium rounded-md border border-slate-200">
                      Cache MISS
                    </span>
                  )}
                </div>
              </div>

              {/* Answer Text */}
              <div className="text-slate-800 text-base leading-relaxed space-y-3 font-normal pt-1">
                {renderFormattedAnswer(response.answer)}
              </div>

              {/* No Source Fallback Warning */}
              {Object.keys(response.citations).length === 0 && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    No grounded evidence was found in the vector database. Zero-hallucination guardrail activated safely.
                  </span>
                </div>
              )}

              {/* Usage & Latency Metadata Bar */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Latency: <strong>{response.usage.latency_ms} ms</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <span>In Tokens: <strong>{response.usage.input_tokens}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Sparkles className="w-4 h-4 text-slate-400" />
                  <span>Out Tokens: <strong>{response.usage.output_tokens}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <span>Cost: <strong>${response.usage.estimated_cost.toFixed(6)}</strong></span>
                </div>
              </div>
            </div>

            {/* Retrieved Evidence Blocks */}
            {response.chunks.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" /> Retrieved Vector Context Chunks ({response.chunks.length})
                </h4>

                <div className="space-y-3">
                  {response.chunks.map((chunk, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center justify-between font-semibold text-slate-700">
                        <span className="flex items-center gap-1.5 text-blue-700">
                          <span className="px-1.5 py-0.5 bg-blue-100 rounded text-[11px]">[{idx + 1}]</span>
                          {chunk.source}
                        </span>
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                          {(chunk.score * 100).toFixed(1)}% Match
                        </span>
                      </div>
                      <p className="text-slate-700 font-mono text-[11px] leading-relaxed line-clamp-3">
                        {chunk.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Source Citation Side Panel */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 sticky top-20">
              <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Source Citations
              </h3>

              {Object.keys(response.citations).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(response.citations).map(([key, cit]) => (
                    <div
                      key={key}
                      onClick={() => handleCitationClick(key)}
                      className="p-4 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 hover:border-blue-300 rounded-xl transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-2 py-0.5 bg-blue-600 text-white font-bold text-xs rounded">
                          {key}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-blue-500 group-hover:text-blue-700" />
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 truncate">{cit.source}</h4>
                      <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                        <span>Chunk: {cit.chunk_id}</span>
                        <span>Section: {cit.section || 'General'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No citation mappings present for this query.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal viewer for inspectable citations */}
      <CitationViewer
        citationKey={activeCitationKey}
        citation={selectedCitation}
        onClose={() => {
          setActiveCitationKey(null);
          setSelectedCitation(null);
        }}
      />
    </div>
  );
};
