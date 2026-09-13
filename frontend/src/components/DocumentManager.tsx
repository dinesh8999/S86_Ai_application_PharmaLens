import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  Loader2,
  AlertCircle,
  Plus,
  RefreshCw,
  Layers,
  Calendar,
} from 'lucide-react';
import { fetchDocuments, uploadDocument } from '../services/api';
import { DocumentItem } from '../types';

export const DocumentManager: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [studyId, setStudyId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const data = await fetchDocuments();
      setDocuments(data);
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Error loading documents' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setMessage(null);
    try {
      const res = await uploadDocument(selectedFile, studyId.trim() || undefined);
      setMessage({
        type: 'success',
        text: `Successfully ingested "${res.source}" (${res.chunks_indexed} chunks indexed).`,
      });
      setSelectedFile(null);
      setStudyId('');
      loadDocs();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to upload document.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-base">Upload & Ingest Research Documents</h3>
          </div>
          <button
            onClick={loadDocs}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            title="Refresh documents list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Select File (PDF, TXT, MD, DOCX)
              </label>
              <input
                type="file"
                accept=".pdf,.txt,.md,.docx,.json"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 bg-slate-50 border border-slate-200 rounded-xl p-1.5"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Study ID (Optional)
              </label>
              <input
                type="text"
                value={studyId}
                onChange={(e) => setStudyId(e.target.value)}
                placeholder="e.g. STUDY-001 or SAFETY-BULLETIN"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Ingesting & Chunking...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Ingest Document into Qdrant
                </>
              )}
            </button>
          </div>
        </form>

        {message && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}
      </div>

      {/* Document List */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" /> Indexed Knowledge Base Documents ({documents.length})
        </h3>

        {loading ? (
          <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-xs font-medium">Loading documents from vector store...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No documents indexed yet. Upload a PDF/TXT or trigger system sample documents.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc, idx) => (
              <div
                key={idx}
                className="p-5 bg-slate-50 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded">
                      {doc.doc_type}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded border border-emerald-200 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> {doc.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 truncate mb-1" title={doc.document_name}>
                    {doc.document_name}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">Study ID: {doc.study_id}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-slate-400" /> <strong>{doc.chunk_count}</strong> Chunks
                  </span>
                  <span className="flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> {doc.upload_date}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
