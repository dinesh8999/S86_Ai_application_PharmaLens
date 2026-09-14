import React from 'react';
import {
  Dna,
  Search,
  BookOpen,
  FileText,
  ShieldCheck,
  Stethoscope,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Database,
  Cpu,
  AlertCircle,
} from 'lucide-react';
import { UserRole } from '../context/AuthContext';

interface LandingPageProps {
  onOpenLogin: (role: UserRole) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      {/* Subtle light ambient background lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-gradient-to-b from-blue-100/70 via-indigo-50/40 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[800px] -left-48 w-[600px] h-[600px] bg-cyan-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[1400px] -right-48 w-[700px] h-[700px] bg-indigo-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-slate-200 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-cyan-600 rounded-xl text-white shadow-md shadow-blue-500/20">
              <Dna className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">PharmaLens</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Clinical Research Intelligence</p>
            </div>
          </div>

          {/* Quick Nav Anchors */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">
              Platform Features
            </a>
            <a href="#architecture" className="hover:text-blue-600 transition-colors">
              Grounded RAG Pipeline
            </a>
            <a href="#corpus" className="hover:text-blue-600 transition-colors">
              Canonical Corpus
            </a>
            <a href="#benchmarks" className="hover:text-blue-600 transition-colors">
              Evaluation Metrics
            </a>
          </nav>

          {/* Role Login Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenLogin('RESEARCHER')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-600 bg-white hover:bg-slate-50 border border-slate-300 shadow-sm transition-all cursor-pointer"
            >
              <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
              <span>Researcher Login</span>
            </button>

            <button
              onClick={() => onOpenLogin('ADMIN')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              <span>Admin Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Release Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Evidence-First Retrieval · Verified Multi-Page Provenance</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-950 tracking-tight max-w-4xl mx-auto leading-[1.1]">
          Instant, Grounded Intelligence Across Clinical Trials & Drug Labels
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
          Eliminate hundreds of manual research hours. PharmaLens performs semantic retrieval over complex clinical study reports, FDA package inserts, and safety bulletins—delivering concise, grounded answers with exact page-level citations.
        </p>

        {/* Dual Role Portal Gateways */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">
          {/* Gateway 1: Clinical Researcher */}
          <div className="p-7 rounded-2xl bg-white border border-blue-200 hover:border-blue-400 shadow-lg shadow-blue-500/5 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Stethoscope className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Investigator Portal
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              Clinical Researcher Workspace
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Ask natural language research inquiries, compare study endpoints, and deep-link directly into extracted multi-page clinical documents.
            </p>
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Verified trial search</span>
              <button
                onClick={() => onOpenLogin('RESEARCHER')}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 group-hover:text-blue-700 transition-colors cursor-pointer"
              >
                <span>Enter Researcher Portal</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Gateway 2: Compliance & Administrator */}
          <div className="p-7 rounded-2xl bg-white border border-indigo-200 hover:border-indigo-400 shadow-lg shadow-indigo-500/5 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Administrative Portal
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Compliance & Admin Workspace
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Execute automated QA evaluation benchmark test sets, track real-time token consumption, inspect system latencies, and manage audit logs.
            </p>
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Audited administrative suite</span>
              <button
                onClick={() => onOpenLogin('ADMIN')}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 group-hover:text-indigo-700 transition-colors cursor-pointer"
              >
                <span>Enter Admin Portal</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Live Corpus Scale Metrics Bar */}
        <div className="mt-16 pt-8 border-t border-slate-200 max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
            Indexed Canonical Knowledge Base Scale
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-3xl font-extrabold text-blue-600">14</div>
              <div className="text-xs text-slate-600 mt-1 font-semibold">Clinical Studies</div>
            </div>
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-3xl font-extrabold text-indigo-600">21</div>
              <div className="text-xs text-slate-600 mt-1 font-semibold">Source Documents</div>
            </div>
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-3xl font-extrabold text-emerald-600">295</div>
              <div className="text-xs text-slate-600 mt-1 font-semibold">Indexed Pages</div>
            </div>
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-3xl font-extrabold text-amber-600">632</div>
              <div className="text-xs text-slate-600 mt-1 font-semibold">Qdrant Chunks</div>
            </div>
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
              <div className="text-3xl font-extrabold text-purple-600">89%</div>
              <div className="text-xs text-slate-600 mt-1 font-semibold">RAG Benchmark</div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Showcase Section */}
      <section id="architecture" className="py-20 bg-white border-y border-slate-200 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-3">
              <Cpu className="w-3.5 h-3.5" />
              <span>Evidence-First Pipeline</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Grounded RAG Architecture with Exact Citations
            </h2>
            <p className="mt-3 text-slate-600 text-sm leading-relaxed">
              Every query flows through an audited multi-stage retrieval and relevance pipeline designed to prevent hallucinations and maintain audit trails.
            </p>
          </div>

          {/* Interactive Visual Flow */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 relative">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-sm border border-blue-200 mb-3">
                1
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Semantic Embedding</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Query is mapped to a 3072-dimensional vector embedding capturing clinical nomenclature.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 relative">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-sm border border-indigo-200 mb-3">
                2
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Qdrant Vector Retrieval</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Cosine similarity search retrieves candidate chunks across clinical reports and package inserts.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 relative">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-extrabold flex items-center justify-center text-sm border border-emerald-200 mb-3">
                3
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Relevance Filter (≥ 0.40)</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Strict threshold cuts unrelated candidates. If no chunks pass, system executes zero-hallucination refusal.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 relative">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 font-extrabold flex items-center justify-center text-sm border border-purple-200 mb-3">
                4
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Grounded Answer & [1] [2] Citations</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Gemini 3.6-flash generates a concise response with interactive citation tags deep-linking into document pages.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Pillars */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Designed for Clinical & Regulatory Precision
          </h2>
          <p className="mt-3 text-slate-600 text-sm leading-relaxed">
            Every feature in PharmaLens is structured around evidentiary integrity, source transparency, and non-hallucinatory AI assistance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 w-fit mb-4">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Evidence-Grounded Assistant</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Synthesizes complex drug efficacy, safety warnings, and adverse events with inline citation badges. Insufficient evidence triggers an explicit disclaimer.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 w-fit mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Clinical Studies Registry</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Explore 14 indexed clinical trials (e.g. CHECKMATE-067, DAPA-HF, KEYNOTE-006) with detailed endpoints, investigational drugs, and linked evidence documents.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 w-fit mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Multi-Page Document Viewer</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Inspect original extracted document pages with clear typography, section navigation, and in-document keyword search for rapid verification.
            </p>
          </div>
        </div>
      </section>

      {/* Canonical Corpus Section */}
      <section id="corpus" className="py-20 bg-slate-100/70 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-3">
                <Database className="w-3.5 h-3.5" />
                <span>Validated Research Assets</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                21 Canonical Clinical Documents
              </h2>
              <p className="text-slate-600 text-sm mt-2 max-w-2xl">
                Pre-indexed across clinical trial reports, regulatory package inserts, and post-marketing safety communications.
              </p>
            </div>

            <button
              onClick={() => onOpenLogin('RESEARCHER')}
              className="self-start md:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-600/20"
            >
              <span>Explore In Library</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Category 1 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Clinical Reports</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono font-bold">13 Docs</span>
              </div>
              <p className="text-xs text-slate-600 mb-3">Comprehensive trial reports including STUDY-001, CHECKMATE-067, DAPA-HF, EINSTEIN-PE, and EMPEROR-REDUCED.</p>
              <div className="text-[11px] text-slate-400 font-mono font-medium">~220 pages indexed</div>
            </div>

            {/* Category 2 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Drug Labels</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono font-bold">4 Docs</span>
              </div>
              <p className="text-xs text-slate-600 mb-3">US FDA Package Inserts including Keytruda, Kisunla, Ozempic, and Xarelto package documentation.</p>
              <div className="text-[11px] text-slate-400 font-mono font-medium">~45 pages indexed</div>
            </div>

            {/* Category 3 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Safety Bulletins</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-mono font-bold">4 Docs</span>
              </div>
              <p className="text-xs text-slate-600 mb-3">Post-marketing alerts, EMA safety communications, and FDA Black Box warnings.</p>
              <div className="text-[11px] text-slate-400 font-mono font-medium">~30 pages indexed</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benchmarks Section (Executive Dark Navy Highlight Card) */}
      <section id="benchmarks" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold mb-4">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Gold-Standard Evaluation Suite</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Benchmark Validated for Clinical Integrity
              </h2>
              <p className="mt-3 text-slate-300 text-sm leading-relaxed">
                Automated evaluation ensures accurate citation linkage, faithful context grounding, and refusal behavior on queries with no supporting evidence.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <button
                  onClick={() => onOpenLogin('RESEARCHER')}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-950 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  <ArrowRight className="w-4 h-4 text-blue-600" />
                  <span>Launch Research Workspace</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                <div className="text-3xl font-extrabold text-emerald-400">100%</div>
                <div className="text-xs text-slate-300 font-semibold mt-1">Citation Accuracy</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Verified references</div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                <div className="text-3xl font-extrabold text-indigo-400">100%</div>
                <div className="text-xs text-slate-300 font-semibold mt-1">Correctness</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Benchmark fidelity</div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                <div className="text-3xl font-extrabold text-blue-400">69%</div>
                <div className="text-xs text-slate-300 font-semibold mt-1">Strict Grounding</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Context faith score</div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                <div className="text-3xl font-extrabold text-purple-400">89%</div>
                <div className="text-xs text-slate-300 font-semibold mt-1">Overall Score</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Gold QA benchmark</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Regulatory Disclaimer Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Research Decision Support Notice:</strong> PharmaLens is an evidence-grounded research intelligence assistant designed to accelerate literature and regulatory review. Critical clinical or regulatory decisions must always be verified against the original trial reports and package inserts. Not intended for direct clinical diagnostic use.
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Dna className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-slate-900">PharmaLens · Clinical Research Intelligence</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
            <span>FastAPI ASGI Active</span>
            <span>·</span>
            <span>Qdrant 3072-dim</span>
            <span>·</span>
            <span>Gemini 3.6-flash</span>
          </div>

          <p className="text-xs text-slate-500">
            © 2026 PharmaLens. Evidence-First Clinical RAG.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
