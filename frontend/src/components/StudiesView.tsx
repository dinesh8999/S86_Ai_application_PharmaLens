import React, { useState, useEffect } from 'react';
import { getStudies, fetchStudyDetail } from '../services/api';
import { StudySummary, StudyDetail } from '../types';
import { Building2, FileText, FlaskConical, MessageSquare, Search, Layers, ChevronRight, X, ShieldAlert, Eye } from 'lucide-react';

interface StudiesViewProps {
  onAskAboutStudy?: (studyId: string) => void;
  onOpenDocument?: (docName: string) => void;
}

export const StudiesView: React.FC<StudiesViewProps> = ({ onAskAboutStudy, onOpenDocument }) => {
  const [studies, setStudies] = useState<StudySummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudyDetail, setSelectedStudyDetail] = useState<StudyDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  const loadStudies = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStudies();
      setStudies(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load study registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudies();
  }, []);

  const handleOpenDetail = async (studyId: string) => {
    setLoadingDetail(true);
    try {
      const detail = await fetchStudyDetail(studyId);
      setSelectedStudyDetail(detail);
    } catch (err: any) {
      setError(err.message || `Failed to fetch details for ${studyId}`);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredStudies = studies.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.study_id.toLowerCase().includes(q) ||
      s.study_name.toLowerCase().includes(q) ||
      s.drug_name.toLowerCase().includes(q) ||
      (s.sponsor && s.sponsor.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-indigo-600" />
            Clinical Studies Registry
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Aggregated registry of clinical trials and drug portfolios indexed across the research knowledge base.
          </p>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-indigo-600">{studies.length} Studies</div>
          <div className="text-xs text-slate-500">Active in vector index</div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Search Input */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search studies by ID, trial name, drug, or sponsor..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-sm border-0 focus:outline-none focus:ring-0 text-slate-900"
        />
      </div>

      {/* Study Cards Grid */}
      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm">Loading clinical studies registry...</div>
      ) : filteredStudies.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-sm">No studies found matching "{searchQuery}".</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStudies.map((study) => (
            <div
              key={study.study_id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-100">
                    {study.study_id}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {study.phase || 'Phase 3'}
                  </span>
                </div>

                <h3 className="font-semibold text-slate-900 mt-3 text-base line-clamp-2" title={study.study_name}>
                  {study.study_name}
                </h3>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-3.5 h-3.5 text-slate-400" />
                    <span>Drug: <strong>{study.drug_name}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Sponsor: <strong>{study.sponsor || 'Pharmaceutical Sponsor'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Linked Documents: <strong>{study.document_count}</strong> ({study.chunk_count} chunks)</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {study.available_evidence.map((ev) => (
                    <span
                      key={ev}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium capitalize"
                    >
                      {ev.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenDetail(study.study_id)}
                  className="text-xs font-medium text-slate-700 hover:text-indigo-600 flex items-center gap-1 transition"
                >
                  View Details & Documents <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {onAskAboutStudy && (
                  <button
                    onClick={() => onAskAboutStudy(study.study_id)}
                    className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium transition flex items-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3" /> Query Study
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Study Detail Modal */}
      {selectedStudyDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-100">
                  {selectedStudyDetail.study_id}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">{selectedStudyDetail.study_name}</h3>
                <div className="text-xs text-slate-500 mt-0.5">Sponsor: {selectedStudyDetail.sponsor} | Phase: {selectedStudyDetail.phase}</div>
              </div>
              <button
                onClick={() => setSelectedStudyDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-700">
              <div>
                <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider text-slate-500">Overview</h4>
                <p className="mt-1 bg-slate-50 p-3 rounded-lg border border-slate-100">{selectedStudyDetail.overview}</p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider text-slate-500">Efficacy Summary</h4>
                <p className="mt-1 bg-blue-50/50 p-3 rounded-lg border border-blue-100 text-blue-900">{selectedStudyDetail.efficacy}</p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider text-slate-500">Safety & Adverse Events</h4>
                <p className="mt-1 bg-amber-50/50 p-3 rounded-lg border border-amber-100 text-amber-900">{selectedStudyDetail.safety}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedStudyDetail.adverse_events.map((ae) => (
                    <span key={ae} className="text-xs px-2.5 py-1 rounded bg-amber-100 text-amber-800 font-medium">
                      {ae}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider text-slate-500">Linked Documents ({selectedStudyDetail.sources.length})</h4>
                <div className="mt-2 space-y-1.5">
                  {selectedStudyDetail.sources.map((src) => (
                    <div key={src} className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 transition text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="font-semibold text-slate-800 truncate">{src}</span>
                      </div>
                      {onOpenDocument && (
                        <button
                          onClick={() => {
                            setSelectedStudyDetail(null);
                            onOpenDocument(src);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-blue-600 text-slate-700 hover:text-white border border-slate-300 hover:border-blue-600 rounded-lg text-xs font-semibold transition flex items-center gap-1 shrink-0 shadow-2xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Open Document
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              {onAskAboutStudy && (
                <button
                  onClick={() => {
                    const sid = selectedStudyDetail.study_id;
                    setSelectedStudyDetail(null);
                    onAskAboutStudy(sid);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                >
                  Ask Assistant About {selectedStudyDetail.study_id}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudiesView;
