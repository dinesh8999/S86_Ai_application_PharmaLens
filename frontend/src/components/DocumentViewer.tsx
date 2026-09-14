import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  MessageSquare,
  FlaskConical,
  ShieldCheck,
  FileText,
  Layers,
  AlertCircle,
  X,
  Bookmark,
  ExternalLink,
} from 'lucide-react';
import { DocumentDetail, DocumentPage } from '../types';
import { fetchDocumentDetail, getDocumentDownloadUrl } from '../services/api';

export interface DocumentViewerProps {
  documentName: string;
  initialPage?: number;
  highlightText?: string;
  section?: string;
  onClose: () => void;
  onAskAboutDocument?: (docName: string) => void;
  onAskAboutStudy?: (studyId: string) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentName,
  initialPage = 1,
  highlightText,
  section,
  onClose,
  onAskAboutDocument,
  onAskAboutStudy,
}) => {
  const [docDetail, setDocDetail] = useState<DocumentDetail | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const citedPageRef = useRef<HTMLDivElement>(null);

  const loadDocument = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDocumentDetail(documentName);
      setDocDetail(data);
      // Ensure initial page is within range
      const targetPage = initialPage > 0 && initialPage <= (data.page_count || 1) ? initialPage : 1;
      setCurrentPage(targetPage);
    } catch (err: any) {
      setError(err.message || 'Unable to load this document.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocument();
  }, [documentName]);

  // When initialPage changes externally (e.g. clicking different citation)
  useEffect(() => {
    if (initialPage && docDetail) {
      const targetPage = Math.max(1, Math.min(initialPage, docDetail.page_count || 1));
      setCurrentPage(targetPage);
    }
  }, [initialPage, docDetail]);

  // Keyboard navigation for page flip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        goToPrevPage();
      } else if (e.key === 'ArrowRight') {
        goToNextPage();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, docDetail]);

  // Scroll to cited evidence on page load
  useEffect(() => {
    if (citedPageRef.current) {
      citedPageRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (contentContainerRef.current) {
      contentContainerRef.current.scrollTop = 0;
    }
  }, [currentPage, highlightText]);

  const totalPages = docDetail?.page_count || (docDetail?.pages?.length ?? 1);

  const goToPrevPage = () => {
    setCurrentPage((p) => Math.max(1, p - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((p) => Math.min(totalPages, p + 1));
  };

  const currentDocPage: DocumentPage | undefined = useMemo(() => {
    if (!docDetail?.pages || docDetail.pages.length === 0) return undefined;
    return docDetail.pages.find((p) => p.page_number === currentPage) || docDetail.pages[0];
  }, [docDetail, currentPage]);

  // Determine which pages contain search query
  const searchMatchesByPage = useMemo(() => {
    const map: Record<number, number> = {};
    if (!searchQuery.trim() || !docDetail?.pages) return map;
    const query = searchQuery.toLowerCase();
    docDetail.pages.forEach((p) => {
      const occurrences = p.text.toLowerCase().split(query).length - 1;
      if (occurrences > 0) {
        map[p.page_number] = occurrences;
      }
    });
    return map;
  }, [searchQuery, docDetail]);

  const totalSearchMatches = useMemo(() => {
    return Object.values(searchMatchesByPage).reduce((acc, count) => acc + count, 0);
  }, [searchMatchesByPage]);

  // Format document type badge
  const getDocTypeBadgeClass = (type?: string) => {
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
        return 'Drug Label';
      case 'safety_bulletin':
        return 'Safety Bulletin';
      default:
        return type || 'Document';
    }
  };

  // Helper to highlight search matches and cited text
  const renderHighlightedContent = (rawText: string) => {
    if (!rawText) return <p className="text-slate-400 italic">No content recorded on this page.</p>;

    // If there is cited highlight text for this page
    const isCitedPage = currentPage === initialPage;
    let cleanHighlight = highlightText?.trim();

    // Split text into paragraphs
    const paragraphs = rawText.split(/\n\s*\n/);

    return paragraphs.map((para, pIdx) => {
      // Check if paragraph is a section header (starts with # or numbers)
      const isHeader = /^#{1,4}\s+/.test(para) || /^[0-9]+(\.[0-9]+)*\s+[A-Z]/.test(para);

      // Check if this paragraph contains the cited text snippet
      const containsCitedText =
        isCitedPage &&
        cleanHighlight &&
        cleanHighlight.length > 15 &&
        para.toLowerCase().includes(cleanHighlight.slice(0, 30).toLowerCase());

      return (
        <div
          key={pIdx}
          ref={containsCitedText ? citedPageRef : undefined}
          className={`mb-4 transition-colors ${
            containsCitedText
              ? 'p-4 bg-amber-50/80 border-l-4 border-amber-500 rounded-r-xl shadow-xs'
              : ''
          }`}
        >
          {containsCitedText && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">
              <Bookmark className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>Cited Evidence Passage</span>
            </div>
          )}

          {isHeader ? (
            <h3 className="text-sm font-bold text-slate-900 mt-2 mb-1">
              {highlightSearchTerms(para.replace(/^#{1,4}\s+/, ''))}
            </h3>
          ) : (
            <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
              {highlightSearchTerms(para)}
            </p>
          )}
        </div>
      );
    });
  };

  // Helper to highlight active search query
  const highlightSearchTerms = (text: string) => {
    if (!searchQuery.trim()) return text;
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-amber-200 text-slate-900 font-medium px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-xl animate-fadeIn">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex items-start md:items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer shrink-0"
            title="Return to library"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2
                className="text-base font-bold text-slate-900 truncate max-w-[320px] md:max-w-md"
                title={docDetail?.document_name || documentName}
              >
                {docDetail?.document_name || documentName}
              </h2>
              {docDetail && (
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full border font-semibold ${getDocTypeBadgeClass(
                    docDetail.document_type
                  )}`}
                >
                  {formatDocTypeLabel(docDetail.document_type)}
                </span>
              )}
            </div>

            {docDetail && (
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                <span className="font-mono font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                  {docDetail.study_id}
                </span>
                <span>•</span>
                <span>{totalPages} Pages</span>
                <span>•</span>
                <span>{docDetail.chunk_count} Chunks</span>
                <span>•</span>
                {docDetail.synthetic_demo_document ? (
                  <span className="text-purple-700 font-medium">Synthetic Demo</span>
                ) : (
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Authoritative Public
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Search in Document Bar & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search in document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-8 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44 sm:w-56 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {searchQuery && (
            <span className="text-xs font-semibold px-2 py-1 bg-amber-100 text-amber-800 rounded-lg whitespace-nowrap">
              {totalSearchMatches} match{totalSearchMatches !== 1 ? 'es' : ''}
            </span>
          )}

          {onAskAboutDocument && docDetail && (
            <button
              onClick={() => onAskAboutDocument(docDetail.document_name)}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Query Research Assistant focused on this document"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask About Document</span>
            </button>
          )}

          {onAskAboutStudy && docDetail && docDetail.study_id && docDetail.study_id !== 'N/A' && (
            <button
              onClick={() => onAskAboutStudy(docDetail.study_id)}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer"
              title={`Ask questions about study ${docDetail.study_id}`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask About Study</span>
            </button>
          )}

          {docDetail?.has_file_on_disk && (
            <a
              href={getDocumentDownloadUrl(docDetail.document_name)}
              target="_blank"
              rel="noopener noreferrer"
              download={docDetail.document_name}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition flex items-center gap-1.5"
              title="Download source document text file"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Download</span>
            </a>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-semibold text-slate-700">Loading document source content...</p>
          <p className="text-xs text-slate-400 mt-1">Reading preserved page boundaries and sections</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white text-center">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Unable to load this document</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md">{error}</p>
          <button
            onClick={loadDocument}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Side: Page Navigation List */}
          <div className="w-48 sm:w-64 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-200 bg-slate-100/70 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" /> Pages ({totalPages})
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Jump to page</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pgNum) => {
                const isActive = pgNum === currentPage;
                const isCited = pgNum === initialPage && highlightText;
                const matchCount = searchMatchesByPage[pgNum] || 0;
                const pageData = docDetail?.pages?.find((p) => p.page_number === pgNum);
                const firstSection = pageData?.sections?.[0];

                return (
                  <button
                    key={pgNum}
                    onClick={() => setCurrentPage(pgNum)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : isCited
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold'
                        : 'text-slate-700 hover:bg-slate-200/60'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <FileText className={`w-3.5 h-3.5 ${isActive ? 'text-blue-100' : 'text-slate-400'}`} />
                        <span>Page {pgNum}</span>
                        {isCited && !isActive && (
                          <span className="text-[10px] bg-amber-500 text-white px-1 rounded font-bold">
                            Cited
                          </span>
                        )}
                      </div>
                      {firstSection && (
                        <p
                          className={`text-[10px] truncate max-w-[170px] mt-0.5 ${
                            isActive ? 'text-blue-100' : 'text-slate-400'
                          }`}
                          title={firstSection}
                        >
                          {firstSection}
                        </p>
                      )}
                    </div>

                    {matchCount > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                          isActive
                            ? 'bg-white text-blue-700'
                            : 'bg-amber-200 text-amber-900'
                        }`}
                      >
                        {matchCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Side: Document Content Display */}
          <div
            ref={contentContainerRef}
            className="flex-1 bg-white overflow-y-auto p-6 sm:p-8 flex flex-col"
          >
            {/* Page Header Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-6">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-slate-900 text-white font-bold rounded-lg text-xs">
                  Page {currentPage} of {totalPages}
                </span>
                {currentDocPage?.sections && currentDocPage.sections.length > 0 && (
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                    {currentDocPage.sections.join(' · ')}
                  </span>
                )}
              </div>

              {currentPage === initialPage && highlightText && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 border border-amber-300 rounded-lg text-xs font-bold text-amber-800">
                  <Bookmark className="w-3.5 h-3.5 text-amber-600" />
                  <span>Targeted Cited Page</span>
                </div>
              )}
            </div>

            {/* Render Page Text */}
            <div className="flex-1 max-w-4xl">
              {currentDocPage ? (
                renderHighlightedContent(currentDocPage.text)
              ) : docDetail?.raw_content ? (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                    Page boundaries were not explicitly parsed for this source; showing full document content.
                  </div>
                  <pre className="text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed">
                    {highlightSearchTerms(docDetail.raw_content)}
                  </pre>
                </div>
              ) : (
                <p className="text-slate-400 italic">No text recorded for this document.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Footer Navigation Bar */}
      <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-600 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevPage}
            disabled={currentPage <= 1 || loading}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Previous
          </button>

          <span className="font-medium text-slate-700 mx-2">
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </span>

          <button
            onClick={goToNextPage}
            disabled={currentPage >= totalPages || loading}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-slate-400 text-[11px]">
          <span>Use keyboard <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-slate-600">←</kbd> <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-slate-600">→</kbd> to flip pages</span>
          <span>•</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-slate-600">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
