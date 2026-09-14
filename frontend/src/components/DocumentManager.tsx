import React, { useState, useEffect } from 'react';
import { fetchDocuments, fetchCorpusSummary, uploadDocument } from '../services/api';
import { DocumentItem, CorpusSummary } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Upload,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle,
  BookOpen,
  Eye,
  Stethoscope,
  Info,
  Download,
  Database,
  ArrowRight,
  Layers,
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
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

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
    if (!isAdmin) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setUploadSuccess(null);

    try {
      const res = await uploadDocument(file);
      setUploadSuccess(`Successfully ingested ${res.document_name} (${res.chunks_created} vector chunks created)`);
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
      (doc.drug && doc.drug.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.sponsor && doc.sponsor.toLowerCase().includes(searchQuery.toLowerCase()));

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
      {/* Role-Specific Header Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${
                isAdmin
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <Stethoscope className="w-3.5 h-3.5" />}
              {isAdmin
                ? 'Administrative Portal · Ingestion & Indexing Access'
                : 'Clinical Researcher Portal · Verified Knowledge Base'}
            </span>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className={`w-6 h-6 ${isAdmin ? 'text-indigo-600' : 'text-blue-600'}`} />
            {isAdmin ? 'Document Management & Ingestion Workspace' : 'Clinical Document Library'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            {isAdmin
              ? 'Upload, index, and manage multi-page clinical trial reports, package inserts, and pharmacovigilance bulletins. Files are chunked and embedded (3072-dim) into Qdrant.'
              : 'Explore verified clinical trial reports, drug labels, and safety communications curated by compliance administrators. Click any document to launch the Multi-Page Document Viewer.'}
          </p>
        </div>

        {/* Upload Button: ONLY visible for ADMIN role */}
        {isAdmin && (
          <label className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer self-start md:self-auto shrink-0">
            <Upload className={`w-4 h-4 ${uploading ? 'animate-spin' : ''}`} />
            <span>{uploading ? 'Ingesting Document...' : 'Upload Clinical Document'}</span>
            <input
              type="file"
              accept=".pdf,.txt,.md,.docx"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Researcher View Information Notice */}
      {!isAdmin && (
        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-3 shadow-sm">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Institutional Repository:</strong> You are viewing approved clinical research assets. File uploads are restricted to authorized Compliance Administrators to maintain rigorous evidentiary provenance. Click <strong>Inspect Document</strong> to read extracted text with page flipping and in-document search.
          </div>
        </div>
      )}

      {/* Admin Ingestion Success Alert */}
      {uploadSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs sm:text-sm text-emerald-800 flex items-center gap-2.5 shadow-sm">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{uploadSuccess}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs sm:text-sm text-rose-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Corpus Scale Metric Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Repository</div>
            <div className="text-2xl font-extrabold text-indigo-600 mt-1.5">{summary.total_documents} Docs</div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">{summary.total_pages} Pages · {summary.total_chunks} Chunks</div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Clinical Reports</div>
            <div className="text-2xl font-extrabold text-blue-600 mt-1.5">{summary.clinical_reports_count}</div>
            <div className="text-xs text-blue-600 mt-0.5 font-medium">Phase II - IV Trial CSRs</div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Drug Package Labels</div>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1.5">{summary.drug_labels_count}</div>
            <div className="text-xs text-emerald-600 mt-0.5 font-medium">FDA / EMA Package Inserts</div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Safety Bulletins</div>
            <div className="text-2xl font-extrabold text-amber-600 mt-1.5">{summary.safety_bulletins_count}</div>
            <div className="text-xs text-amber-600 mt-0.5 font-medium">Pharmacovigilance Alerts</div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm col-span-2 lg:col-span-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Vector Points</div>
            <div className="text-2xl font-extrabold text-purple-600 mt-1.5">{summary.total_chunks}</div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">3072-dim Qdrant Chunks</div>
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row items-center gap-3.5">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by document name, study ID, drug name, or sponsor..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 flex-1 md:flex-none">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full md:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
            >
              <option value="all">All Document Types ({documents.length})</option>
              <option value="clinical_trial_report">Clinical Trial Reports</option>
              <option value="drug_label">Drug Package Inserts</option>
              <option value="safety_bulletin">Safety Bulletins</option>
            </select>
          </div>

          <select
            value={studyFilter}
            onChange={(e) => setStudyFilter(e.target.value)}
            className="w-full md:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
          >
            <option value="all">All Clinical Studies ({uniqueStudies.length})</option>
            {uniqueStudies.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Indexed Documents</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
              {filteredDocuments.length}
            </span>
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            {isAdmin ? 'Ingestion Status: Verified & Indexed' : 'Ready for Evidence Extraction'}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <div className="inline-block animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-3" />
            <p>Loading clinical document library...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">No matching documents found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider">
                  <th className="py-3 px-5">Document Name</th>
                  <th className="py-3 px-4">Document Type</th>
                  <th className="py-3 px-4">Study / Drug</th>
                  <th className="py-3 px-4">Sponsor</th>
                  <th className="py-3 px-4 text-center">Pages / Chunks</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredDocuments.map((doc) => (
                  <tr
                    key={doc.document_name}
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    onClick={() => handleOpenDoc(doc.document_name)}
                  >
                    <td className="py-3.5 px-5 font-semibold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="truncate max-w-xs md:max-w-md font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                          {doc.document_name}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getDocTypeBadge(
                          doc.document_type
                        )}`}
                      >
                        {formatDocTypeLabel(doc.document_type)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{doc.study_id}</div>
                      {doc.drug && (
                        <div className="text-[11px] text-slate-500">{doc.drug}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="text-xs">{doc.sponsor || 'Regulatory Authority'}</span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono text-xs">
                      <span className="font-bold text-slate-900">{doc.page_count || 1}</span>
                      <span className="text-slate-400"> pgs · </span>
                      <span className="font-bold text-indigo-600">{doc.chunk_count || 1}</span>
                      <span className="text-slate-400"> chks</span>
                    </td>

                    <td
                      className="py-3.5 px-5 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenDoc(doc.document_name)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all cursor-pointer shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>

                        {onAskAboutStudy && doc.study_id && doc.study_id !== 'GENERAL' && (
                          <button
                            type="button"
                            onClick={() => onAskAboutStudy(doc.study_id)}
                            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-all cursor-pointer"
                            title={`Ask inquiry about ${doc.study_id}`}
                          >
                            <span>Ask Study</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
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
