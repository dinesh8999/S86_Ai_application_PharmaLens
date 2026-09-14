import React, { useState, useEffect } from 'react';
import { fetchDocuments, fetchCorpusSummary, uploadDocument } from '../services/api';
import { DocumentItem, CorpusSummary } from '../types';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Layers,
  ShieldCheck,
  CheckCircle,
  FileCheck,
  Building2,
  BookOpen,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { DocumentViewer } from './DocumentViewer';

interface DocumentManagerProps {
  onOpenDocument?: (docName: string) => void;
  onAskAboutStudy?: (studyId: string) => void;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  onOpenDocument,
  onAskAboutStudy,
}) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [summary, setSummary] = useState<CorpusSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [studyFilter, setStudyFilter] = useState<string>('all');
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [internalViewerDoc, setInternalViewerDoc] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [docsRes, summaryRes] = await Promise.all([
        fetchDocuments(),
        fetchCorpusSummary(),
      ]);
      setDocuments(docsRes);
      setSummary(summaryRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load document library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setUploadSuccess(null);

    try {
      const res = await uploadDocument(file);
      setUploadSuccess(`Successfully ingested ${res.document_name} (${res.chunks_created} chunks created)`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.study_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.drug && doc.drug.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType =
      typeFilter === 'all' || doc.document_type === typeFilter;

    const matchesStudy =
      studyFilter === 'all' || doc.study_id === studyFilter;

    return matchesSearch && matchesType && matchesStudy;
  });

  const getDocTypeBadge = (type?: string) => {
    switch (type) {
      case 'clinical_trial_report':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'drug_label':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'safety_bulletin':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const formatDocTypeLabel = (type?: string) => {
    switch (type) {
      case 'clinical_trial_report':
        return 'Clinical Trial Report';
      case 'drug_label':
        return 'FDA / EMA Drug Label';
      case 'safety_bulletin':
        return 'Safety Bulletin / Alert';
      default:
        return type || 'Regulatory Document';
    }
  };

  const uniqueStudies = Array.from(new Set(documents.map((d) => d.study_id))).sort();

  const handleOpenDoc = (docName: string) => {
    if (onOpenDocument) {
      onOpenDocument(docName);
    } else {
      setInternalViewerDoc(docName);
    }
  };

  if (internalViewerDoc) {
    return (
      <div className="h-[calc(100vh-7rem)]">
        <DocumentViewer
          documentName={internalViewerDoc}
          onClose={() => setInternalViewerDoc(null)}
          onAskAboutStudy={onAskAboutStudy}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Corpus Scale Header Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            Clinical Knowledge Base & Document Repository
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Operating over a multi-page, multi-study clinical trial and regulatory knowledge base with page-level provenance.
          </p>
        </div>

        <label className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium shadow-sm cursor-pointer self-start md:self-auto">
          <Upload className={`w-4 h-4 ${uploading ? 'animate-spin' : ''}`} />
          {uploading ? 'Ingesting Document...' : 'Upload Clinical Document'}
          <input
            type="file"
            accept=".pdf,.txt,.md,.docx"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {uploadSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Corpus Scale Stat Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Corpus Scale</div>
            <div className="text-2xl font-bold text-indigo-600 mt-2">{summary.total_documents} Documents</div>
            <div className="text-xs text-slate-500 mt-1">{summary.total_pages} Pages | {summary.total_chunks} Chunks</div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Clinical Reports</div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{summary.clinical_reports_count}</div>
            <div className="text-xs text-blue-600 mt-1 font-medium">Phase 1 - Phase 3 Trials</div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Drug Package Labels</div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{summary.drug_labels_count}</div>
            <div className="text-xs text-emerald-600 mt-1 font-medium">FDA / EMA Package Inserts</div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Safety Bulletins</div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{summary.safety_bulletins_count}</div>
            <div className="text-xs text-amber-600 mt-1 font-medium">MedWatch & PRAC Alerts</div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Indexed Vector Points</div>
            <div className="text-2xl font-bold text-cyan-600 mt-2">{summary.total_chunks}</div>
            <div className="text-xs text-slate-500 mt-1">Cosine similarity indexed</div>
          </div>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents by name, study ID, or drug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Filter className="w-4 h-4 text-slate-400" />
            <span>Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="all">All Document Types</option>
              <option value="clinical_trial_report">Clinical Trial Reports</option>
              <option value="drug_label">Drug Package Labels</option>
              <option value="safety_bulletin">Safety Bulletins</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Study:</span>
            <select
              value={studyFilter}
              onChange={(e) => setStudyFilter(e.target.value)}
              className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none max-w-[180px]"
            >
              <option value="all">All Studies ({uniqueStudies.length})</option>
              {uniqueStudies.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            Indexed Documents ({filteredDocuments.length} shown)
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading corpus documents...</div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No documents matching current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-medium text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Document Name</th>
                  <th className="py-3 px-4">Document Type</th>
                  <th className="py-3 px-4">Study ID</th>
                  <th className="py-3 px-4">Pages</th>
                  <th className="py-3 px-4">Chunks</th>
                  <th className="py-3 px-4">Provenance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredDocuments.map((doc, idx) => (
                  <tr
                    key={doc.document_id || idx}
                    onClick={() => handleOpenDoc(doc.document_name)}
                    className="hover:bg-blue-50/60 transition cursor-pointer group"
                    title="Click to inspect full document content"
                  >
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500 group-hover:text-blue-700 transition flex-shrink-0" />
                        <span className="truncate max-w-[280px] group-hover:text-blue-700 font-semibold transition" title={doc.document_name}>
                          {doc.document_name}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${getDocTypeBadge(doc.document_type)}`}>
                        {formatDocTypeLabel(doc.document_type)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 font-mono text-xs font-semibold">
                      {doc.study_id}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {doc.page_count ?? 1} pages
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {doc.chunk_count} chunks
                    </td>

                    <td className="py-3.5 px-4">
                      {doc.synthetic_demo_document ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                          Synthetic Demo
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                          <ShieldCheck className="w-3 h-3" /> Authoritative Public
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-medium flex items-center gap-1 w-fit">
                        <FileCheck className="w-3 h-3" /> Indexed
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDoc(doc.document_name);
                        }}
                        className="px-3 py-1 bg-white hover:bg-blue-600 text-slate-700 hover:text-white border border-slate-300 hover:border-blue-600 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ml-auto shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentManager;
