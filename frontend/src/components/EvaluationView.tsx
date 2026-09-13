import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Play, Loader2, Award, Target, FileCheck, ShieldAlert } from 'lucide-react';
import { fetchEvaluationResults, runEvaluation } from '../services/api';
import { EvaluationResult } from '../types';

export const EvaluationView: React.FC = () => {
  const [evalData, setEvalData] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [running, setRunning] = useState<boolean>(false);

  const loadEval = async () => {
    setLoading(true);
    try {
      const data = await fetchEvaluationResults();
      setEvalData(data);
    } catch (err) {
      console.error('Error fetching eval:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEval();
  }, []);

  const handleRunEval = async () => {
    setRunning(true);
    try {
      const data = await runEvaluation();
      setEvalData(data);
    } catch (err) {
      console.error('Error running eval:', err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <Award className="w-6 h-6 text-blue-600" /> RAG System Evaluation & Quality Assurance
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Automated benchmark evaluation for Grounding, Correctness, and Source Citation Accuracy.
          </p>
        </div>

        <button
          onClick={handleRunEval}
          disabled={running}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all shrink-0"
        >
          {running ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Evaluating RAG Benchmarks...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" /> Run Benchmark Evaluation Suite
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-xs font-medium">Computing RAG metric scores...</span>
        </div>
      ) : evalData ? (
        <>
          {/* Summary Score Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 bg-white rounded-2xl border border-blue-100 shadow-sm">
              <div className="flex justify-between items-center text-xs text-slate-500 font-semibold mb-2">
                <span>Overall Quality Score</span>
                <Award className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-3xl font-extrabold text-blue-900">
                {(evalData.overall_score * 100).toFixed(0)}%
              </div>
              <p className="text-[11px] text-blue-600 mt-1 font-medium">Weighted RAG performance</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-emerald-100 shadow-sm">
              <div className="flex justify-between items-center text-xs text-slate-500 font-semibold mb-2">
                <span>Correctness Score</span>
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-900">
                {(evalData.avg_correctness * 100).toFixed(0)}%
              </div>
              <p className="text-[11px] text-emerald-600 mt-1 font-medium">Fact point matching</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-teal-100 shadow-sm">
              <div className="flex justify-between items-center text-xs text-slate-500 font-semibold mb-2">
                <span>Grounding Score</span>
                <FileCheck className="w-5 h-5 text-teal-600" />
              </div>
              <div className="text-3xl font-extrabold text-teal-900">
                {(evalData.avg_grounding * 100).toFixed(0)}%
              </div>
              <p className="text-[11px] text-teal-600 mt-1 font-medium">Context support ratio</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-indigo-100 shadow-sm">
              <div className="flex justify-between items-center text-xs text-slate-500 font-semibold mb-2">
                <span>Citation Accuracy</span>
                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-3xl font-extrabold text-indigo-900">
                {(evalData.avg_citation_accuracy * 100).toFixed(0)}%
              </div>
              <p className="text-[11px] text-indigo-600 mt-1 font-medium">Verified citation links</p>
            </div>
          </div>

          {/* Test Questions Details Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
              Benchmark Question Detailed Evaluation ({evalData.details?.length || 0})
            </h3>

            <div className="space-y-3">
              {evalData.details?.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">
                      Q{item.id}: {item.question}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded font-bold text-[11px] border ${
                        item.status === 'PASS'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border-rose-200'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <p className="text-slate-700 font-mono text-[11px] bg-white p-2.5 rounded border border-slate-200">
                    {item.answer}
                  </p>

                  <div className="flex items-center gap-4 text-slate-500 font-medium pt-1 text-[11px]">
                    <span>Correctness: <strong className="text-slate-800">{item.correctness}</strong></span>
                    <span>Grounding: <strong className="text-slate-800">{item.grounding}</strong></span>
                    <span>Citation Accuracy: <strong className="text-slate-800">{item.citation_accuracy}</strong></span>
                    <span>Overall: <strong className="text-blue-700">{item.overall_score}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
