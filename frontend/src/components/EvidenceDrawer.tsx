import React from 'react';
import { X, FileText, CheckCircle, Award, Tag } from 'lucide-react';
import { CitationItem } from '../types';

interface EvidenceDrawerProps {
  citation: CitationItem | null;
  citationMarker: string | null;
  onClose: () => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  citation,
  citationMarker,
  onClose,
}) => {
  if (!citation) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-blue-500/20">
              {citationMarker || `[${citation.citation_id || 1}]`}
            </span>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Cited Supporting Evidence</h3>
              <p className="text-xs text-slate-500 font-medium">Traceable source context verification</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <p className="text-[11px] font-semibold uppercase text-slate-400">Document Source</p>
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate">{citation.source}</span>
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase text-slate-400">Study ID</p>
              <p className="text-sm font-semibold text-blue-700 mt-0.5">
                {citation.study_id || 'STUDY-001'}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase text-slate-400">Section / Page</p>
              <p className="text-xs font-medium text-slate-700 mt-0.5">
                {citation.section || 'General'} {citation.page ? `(Page ${citation.page})` : ''}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase text-slate-400">Vector Retrieval Score</p>
              <p className="text-xs font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                {(citation.score * 100).toFixed(1)}% Similarity
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Why this supports the answer
            </h4>
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 leading-relaxed font-medium">
              {citation.explanation ||
                `This context chunk directly documents findings from ${citation.source} regarding study endpoints, safety criteria, or clinical parameters.`}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-blue-500" />
              Exact Supporting Source Excerpt
            </h4>
            <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs leading-relaxed border border-slate-800 shadow-inner whitespace-pre-wrap">
              "{citation.text}"
            </div>
          </div>

          <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-500 flex items-center justify-between border border-slate-200">
            <span>Chunk Identifier: <code className="text-slate-800 font-mono">{citation.chunk_id}</code></span>
            <span className="text-[11px] text-slate-400">Grounded Evidence</span>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
