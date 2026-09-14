import React, { useState, useEffect } from 'react';
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
  Filter,
  Download,
  History,
  ShieldCheck,
  Award,
  Eye,
  X,
} from 'lucide-react';
import { queryResearch, getStudies } from '../services/api';
import { QueryResponse, CitationItem } from '../types';
import { EvidenceDrawer } from './EvidenceDrawer';

interface ResearchAssistantProps {
  prefilledStudyId?: string;
  prefilledDocName?: string;
  prefilledQuestion?: string;
  onClearPrefilledStudy?: () => void;
  onClearPrefilledDoc?: () => void;
  onClearPrefilledQuestion?: () => void;
  onOpenDocument?: (docName: string, page?: number, highlightText?: string, section?: string) => void;
}

export const ResearchAssistant: React.FC<ResearchAssistantProps> = ({
  prefilledStudyId,
  prefilledDocName,
  prefilledQuestion,
  onClearPrefilledStudy,
  onClearPrefilledDoc,
  onClearPrefilledQuestion,
  onOpenDocument,
}) => {
  const [question, setQuestion] = useState<string>(prefilledQuestion || '');
  const [topK, setTopK] = useState<number>(4);
  const [selectedStudyId, setSelectedStudyId] = useState<string>(prefilledStudyId || '');
  const [selectedDocName, setSelectedDocName] = useState<string>(prefilledDocName || '');
  const [selectedDocType, setSelectedDocType] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState<number>(0);
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [availableStudies, setAvailableStudies] = useState<string[]>([
    'STUDY-001',
    'STUDY-002',
    'STUDY-003',
    'CHECKMATE-067',
    'DAPA-HF',
    'EINSTEIN-PE',
    'EMPEROR-REDUCED',
    'KEYNOTE-006',
    'MONALEESA-2',
    'STUDY-014',
    'STUDY-019',
    'STUDY-DRUG-X',
    'SUSTAIN-6',
    'TRAILBLAZER-ALZ',
  ]);

  const [queryHistory, setQueryHistory] = useState<
    Array<{ question: string; timestamp: string; study_id?: string; answerPreview: string }>
  >([]);

  const [activeCitationMarker, setActiveCitationMarker] = useState<string | null>(null);
  const [selectedCitation, setSelectedCitation] = useState<CitationItem | null>(null);

  const loadingSteps = [
    'Searching Evidence...',
    'Analyzing Sources...',
    'Generating Grounded Answer...',
  ];

  // Rotate loading step messages during generation
  useEffect(() => {
    let timer: any;
    if (loading) {
      timer = setInterval(() => {
        setLoadingStepIndex((prev) => (prev + 1) % loadingSteps.length);
      }, 1200);
    } else {
      setLoadingStepIndex(0);
    }
    return () => clearInterval(timer);
  }, [loading]);

  // Handle prefilled study navigation from Studies tab
  useEffect(() => {
    if (prefilledStudyId) {
      setSelectedStudyId(prefilledStudyId);
    }
  }, [prefilledStudyId]);

  useEffect(() => {
    if (prefilledDocName) {
      setSelectedDocName(prefilledDocName);
    }
  }, [prefilledDocName]);

  useEffect(() => {
    if (prefilledQuestion) {
      setQuestion(prefilledQuestion);
    }
  }, [prefilledQuestion]);


  // Load study list on mount
  useEffect(() => {
    getStudies()
      .then((data) => {
        if (data && data.length > 0) {
          setAvailableStudies(data.map((s) => s.study_id));
        }
      })
      .catch(() => {
        // Fall back to default canonical list
      });
  }, []);

  const sampleQuestions = [
    'What did Study 001 evaluate?',
    'What was the primary endpoint of Study 003?',
    'What adverse events were reported in Study 003?',
    'What safety findings were reported for Drug X?',
    'What dosage information is provided in the Drug X label?',
  ];

  const handleAsk = async (queryToAsk?: string) => {
    const q = queryToAsk || question;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const filters = selectedDocName ? { document_name: selectedDocName } : undefined;
      const res = await queryResearch(
        q,
        topK,
        selectedStudyId || null,
        selectedDocType || null,
        filters
      );
      setResponse(res);

      const histItem = {
        question: q,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        study_id: selectedStudyId || undefined,
        answerPreview: res.answer.slice(0, 90) + '...',
      };
      setQueryHistory((prev) => [histItem, ...prev.slice(0, 9)]);
    } catch (err: any) {
      setError(err.message || 'Error processing research query');
    } finally {
      setLoading(false);
    }
  };

  const handleCitationClick = (marker: string) => {
    if (response?.citations && response.citations[marker]) {
      const cit = response.citations[marker];
      if (onOpenDocument) {
        onOpenDocument(
          cit.source,
          Number(cit.page) || 1,
          cit.text,
          cit.section || undefined
        );
      } else {
        setActiveCitationMarker(marker);
        setSelectedCitation(cit);
      }
    }
  };

  const exportAnswerAsMarkdown = () => {
    if (!response) return;
    const mdContent = `# PharmaLens Research Answer Export
**Timestamp**: ${new Date().toISOString()}
**Question**: ${response.question}
**Evidence Strength**: ${response.evidence_strength}
**Latency**: ${response.usage?.latency_ms ?? 0} ms

## Clinical Evidence Answer
${response.answer}

## Supporting Sources
${(response.used_citations || [])
  .map(
    (c) =>
      `- [${c.citation_id || 1}] ${c.source} (Study: ${c.study_id}) - Score: ${(c.score * 100).toFixed(1)}%\n  "${c.text}"`
  )
  .join('\n\n')}

---
*PharmaLens Clinical Research Assistant - Always verify critical clinical findings against original source documents.*
`;

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pharmalens_research_export_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderFormattedAnswer = (text: string) => {
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((part, index) => {
      if (/^\[\d+\]$/.test(part)) {
        const isAvailable = response?.citations && response.citations[part];
        return (
          <button
            key={index}
            onClick={() => isAvailable && handleCitationClick(part)}
            title={isAvailable ? `Inspect Citation ${part}` : 'Citation details unavailable'}
            className={`citation-badge px-2 py-0.5 mx-0.5 rounded text-xs font-bold transition-all ${
              isAvailable
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs cursor-pointer'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            {part}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const getEvidenceStrengthBadge = (strength: string) => {
    switch (strength) {
      case 'Strong':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Moderate':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Limited':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-rose-100 text-rose-800 border-rose-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Visible Clinical Disclaimer Banner */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5 shadow-2xs">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <span>
          <strong>PharmaLens Disclaimer:</strong> PharmaLens is an evidence-grounded research support system. Always verify critical clinical, regulatory, or safety findings against the original source documents.
        </span>
      </div>

      {/* Input Header & Filters Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-800">Ask Clinical Research Question</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Evidence-First Search</span>
        </div>

        {/* Search Input Bar */}
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
              placeholder="Ask questions across clinical trial reports, drug labels, and safety communications..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer min-w-[170px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {loadingSteps[loadingStepIndex]}
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Ask PharmaLens
              </>
            )}
          </button>
        </form>

        {/* Filters Toolbar */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-blue-600" /> Filters:
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-500 font-medium">Study:</label>
            <select
              value={selectedStudyId}
              onChange={(e) => {
                setSelectedStudyId(e.target.value);
                if (onClearPrefilledStudy && !e.target.value) {
                  onClearPrefilledStudy();
                }
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Studies</option>
              {availableStudies.map((sid) => (
                <option key={sid} value={sid}>
                  {sid}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-500 font-medium">Document Type:</label>
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="clinical_trial_report">Clinical Trial Report</option>
              <option value="drug_label">Drug Label</option>
              <option value="safety_bulletin">Safety Bulletin</option>
            </select>
          </div>

          {selectedDocName && (
            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg border border-blue-200">
              <FileText className="w-3 h-3 text-blue-600" />
              <span className="font-semibold truncate max-w-[220px]" title={selectedDocName}>
                Doc: {selectedDocName}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedDocName('');
                  if (onClearPrefilledDoc) onClearPrefilledDoc();
                }}
                className="text-blue-500 hover:text-blue-800 p-0.5 ml-1 cursor-pointer"
                title="Clear document filter"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <label className="text-slate-500 font-medium">Top K:</label>
            <select
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs"
            >
              <option value={3}>3</option>
              <option value={4}>4 (Default)</option>
              <option value={6}>6</option>
              <option value={8}>8</option>
            </select>
          </div>
        </div>

        {/* Sample Question Chips */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 font-medium">Suggested Questions:</span>
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuestion(q);
                handleAsk(q);
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-lg border border-slate-200 transition-colors text-left cursor-pointer"
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
            <p className="font-bold">System Notification</p>
            <p className="text-xs text-rose-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Initial Guidance Empty State */}
      {!response && !loading && !error && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800">
            Ask a clinical research question to search the evidence base.
          </h4>
          <p className="text-xs text-slate-500 mt-1.5 max-w-lg mx-auto">
            PharmaLens searches across 21 multi-page clinical trial reports, drug labels, and safety bulletins to produce concise answers with page-level citations.
          </p>
        </div>
      )}

      {/* Main Answer View */}
      {response && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Main Left Content Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              {/* Header Metadata Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <h3 className="font-bold text-slate-900 text-base">Clinical Evidence Answer</h3>
                  </div>

                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 ${getEvidenceStrengthBadge(
                      response.evidence_strength
                    )}`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    Evidence Strength: {response.evidence_strength}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={exportAnswerAsMarkdown}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" /> Export (.md)
                  </button>

                  {response.usage?.cache_hit ? (
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

              {response.conflicts_detected && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Conflicting Evidence Detected:</strong>
                    <p className="mt-0.5 text-amber-800">
                      {response.conflict_notes ||
                        'Retrieved sources present opposing data or study conclusions. Inspect cited sources carefully.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Formatted Grounded Answer */}
              <div className="text-slate-800 text-base leading-relaxed space-y-3 font-normal pt-1">
                {renderFormattedAnswer(response.answer)}
              </div>

              {/* Insufficient Evidence Fallback Banner */}
              {(!response.used_citations ||
                response.used_citations.length === 0 ||
                response.evidence_strength === 'Insufficient') && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Info className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>Insufficient Evidence</span>
                  </div>
                  <p className="text-slate-600 pl-6">
                    No sufficiently relevant evidence was found in the available documents to answer this question.
                  </p>
                  <p className="text-slate-400 text-[11px] pl-6">
                    Candidate documents were examined, but none met the evidence relevance threshold.
                  </p>
                </div>
              )}

              {/* Compact Query Metadata */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>
                    Latency: <strong>{response.usage?.latency_ms ?? 0} ms</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <span>
                    In Tokens: <strong>{response.usage?.input_tokens ?? 0}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Sparkles className="w-4 h-4 text-slate-400" />
                  <span>
                    Out Tokens: <strong>{response.usage?.output_tokens ?? 0}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <span>
                    Cost: <strong>${(response.usage?.estimated_cost ?? 0).toFixed(6)}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Supporting Evidence Cards (Shown only when evidence is available) */}
            {response.retrieved_chunks &&
              response.retrieved_chunks.length > 0 &&
              response.evidence_strength !== 'Insufficient' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" /> Supporting Evidence ({response.retrieved_chunks.length})
                  </h4>

                  <div className="space-y-3">
                    {response.retrieved_chunks.map((chunk, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 font-semibold text-slate-700">
                          <span className="flex items-center gap-1.5 text-blue-700 font-bold">
                            <span className="px-1.5 py-0.5 bg-blue-100 rounded text-[11px]">[{idx + 1}]</span>
                            {chunk.source}
                          </span>
                          <div className="flex items-center gap-2 text-[11px]">
                            {chunk.study_id && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-medium">
                                Study: {chunk.study_id}
                              </span>
                            )}
                            {chunk.page && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-medium">
                                Page: {chunk.page}
                              </span>
                            )}
                            {chunk.section && (
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200 font-medium">
                                {chunk.section}
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-slate-700 font-mono text-[11px] leading-relaxed bg-white p-3 rounded-lg border border-slate-200/80">
                          "{chunk.text}"
                        </p>

                        {onOpenDocument && (
                          <div className="pt-1 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">
                              Similarity score: {(chunk.score * 100).toFixed(1)}%
                            </span>
                            <button
                              onClick={() =>
                                onOpenDocument(
                                  chunk.source,
                                  Number(chunk.page) || 1,
                                  chunk.text,
                                  chunk.section || undefined
                                )
                              }
                              className="px-2.5 py-1 bg-white hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" /> Open Source (Page {chunk.page || 1})
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>

          {/* Right Sidebar: Explicitly Cited Sources & History */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 sticky top-20">
              <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Explicitly Cited Sources ({response.used_citations?.length || 0})
              </h3>

              {response.used_citations && response.used_citations.length > 0 ? (
                <div className="space-y-3">
                  {response.used_citations.map((cit, i) => {
                    const marker = `[${cit.citation_id || i + 1}]`;
                    return (
                      <div
                        key={i}
                        onClick={() => handleCitationClick(marker)}
                        className="p-4 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 hover:border-blue-300 rounded-xl transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="px-2 py-0.5 bg-blue-600 text-white font-bold text-xs rounded">
                            {marker}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-blue-500 group-hover:text-blue-700" />
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 truncate">{cit.source}</h4>
                        <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                          <span>Study: {cit.study_id}</span>
                          <span className="text-emerald-600 font-semibold">{(cit.score * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No explicit citations relied upon in this answer.
                </p>
              )}

              {queryHistory.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-slate-400" /> Recent Query History
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {queryHistory.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setQuestion(item.question);
                          handleAsk(item.question);
                        }}
                        className="w-full p-2.5 bg-slate-50 hover:bg-blue-50 rounded-lg text-left border border-slate-200 transition-colors text-xs space-y-1 cursor-pointer"
                      >
                        <p className="font-semibold text-slate-800 line-clamp-1">{item.question}</p>
                        <p className="text-[10px] text-slate-400 flex justify-between">
                          <span>{item.timestamp}</span>
                          <span>{item.study_id || 'All Studies'}</span>
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Evidence Drawer Modal */}
      <EvidenceDrawer
        citation={selectedCitation}
        citationMarker={activeCitationMarker}
        onClose={() => {
          setActiveCitationMarker(null);
          setSelectedCitation(null);
        }}
      />
    </div>
  );
};

export default ResearchAssistant;
