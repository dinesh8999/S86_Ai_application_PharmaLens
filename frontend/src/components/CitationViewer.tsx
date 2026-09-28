import React from 'react';
import { X, FileText, CheckCircle, ExternalLink, Bookmark, Hash } from 'lucide-react';
import { CitationItem } from '../types';

interface CitationViewerProps {
  citationKey: string | null;
  citation: CitationItem | null;
  onClose: () => void;
}

export const CitationViewer: React.FC<CitationViewerProps> = ({
  citationKey,
  citation,
  onClose,
}) => {
  if (!citationKey || !citation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-darkteal-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-powder-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-darkteal-950 via-darkteal-900 to-petrol-900 text-white flex items-center justify-between border-b border-darkteal-800">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-petrol-600 text-white text-xs font-bold rounded-lg border border-powder-300/40">
              Citation {citationKey}
            </span>
            <div>
              <h3 className="font-bold text-base text-white">{citation.source}</h3>
              <p className="text-xs text-powder-200">Study ID: {citation.study_id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-powder-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-powder-50/60 rounded-xl border border-powder-100">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                Chunk ID
              </span>
              <span className="text-xs font-bold text-darkteal-900 truncate block">
                {citation.chunk_id}
              </span>
            </div>
            <div className="p-3 bg-powder-50/60 rounded-xl border border-powder-100">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                Section
              </span>
              <span className="text-xs font-bold text-darkteal-900 block">
                {citation.section || 'General'}
              </span>
            </div>
            <div className="p-3 bg-powder-50/60 rounded-xl border border-powder-100">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                Page Number
              </span>
              <span className="text-xs font-bold text-darkteal-900 block">
                {citation.page ? `Page ${citation.page}` : 'N/A'}
              </span>
            </div>
            <div className="p-3 bg-powder-100/80 rounded-xl border border-powder-200">
              <span className="text-[11px] font-semibold text-petrol-700 block uppercase">
                Vector Similarity
              </span>
              <span className="text-xs font-extrabold text-petrol-900 block">
                {(citation.score * 100).toFixed(1)}% Match
              </span>
            </div>
          </div>

          {/* Original Chunk Text */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-petrol-600" />
              <h4 className="text-xs font-bold text-darkteal-900 uppercase tracking-wider">
                Original Document Text Chunk
              </h4>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-powder-200 text-sm text-slate-800 leading-relaxed font-mono whitespace-pre-wrap">
              {citation.text}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-powder-50/60 border-t border-powder-200 flex justify-between items-center text-xs text-slate-500">
          <span className="flex items-center gap-1 text-petrol-700 font-semibold">
            <CheckCircle className="w-4 h-4 text-petrol-600" /> Verified Vector Payload Grounding
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-darkteal-900 hover:bg-darkteal-950 text-white font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Close Evidence
          </button>
        </div>
      </div>
    </div>
  );
};

