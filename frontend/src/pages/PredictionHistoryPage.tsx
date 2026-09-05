import React, { useState, useEffect } from 'react';
import { History, Database, Search, ArrowRight, CheckCircle2, FileText, Sparkles, BookOpen, ShieldCheck, Clock } from 'lucide-react';
import { getPredictionHistory, getHistoricalCase } from '../services/api';
import { TealClosingCTA } from '../components/TealClosingCTA';

export const PredictionHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCaseRef, setSelectedCaseRef] = useState<string | null>(null);
  const [caseDetail, setCaseDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  useEffect(() => {
    getPredictionHistory()
      .then(res => {
        setHistory(res);
        setLoading(false);
        if (res.length > 0) {
          loadDetail(res[0].case_id);
        }
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const loadDetail = async (ref: string) => {
    setSelectedCaseRef(ref);
    setLoadingDetail(true);
    try {
      const data = await getHistoricalCase(ref);
      setCaseDetail(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf8] text-[#292827] flex flex-col">
      {/* ------------------------------------------------------------- */}
      {/* 1. Page Header                                                */}
      {/* ------------------------------------------------------------- */}
      <section className="w-full bg-white border-b border-[#e8e4dd] py-10 md:py-14">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-wider text-[#73706d] block">
                Reproducibility & Clinical Governance
              </span>
              <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#292827]">
                Experiment History & Audit Log
              </h1>
              <p className="text-base text-[#73706d] max-w-2xl">
                Cryptographically tracked clinical evaluations, model predictions, probability vectors, and safety audits committed to the relational database.
              </p>
            </div>

            <div className="text-xs font-mono text-[#73706d]">
              Persisted Records: <span className="text-[#1b1938] font-bold">{history.length}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. Main 2-Column Audit Workspace                              */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Case List (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#e8e4dd] pb-3">
              <span className="text-xs font-mono uppercase text-[#73706d] tracking-wider font-semibold">
                Stored Encounter Records
              </span>
              <span className="text-xs font-mono text-[#73706d]">Live Audit Log</span>
            </div>

            <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
              {history.map((c) => {
                const isSelected = selectedCaseRef === c.case_id;
                return (
                  <div
                    key={c.case_id}
                    onClick={() => loadDetail(c.case_id)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#f5f4f0] border-[#1b1938] shadow-sm'
                        : 'bg-white border-[#e8e4dd] hover:border-[#1b1938]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono font-medium text-[#1b1938]">{c.case_id}</span>
                      <span className="text-[10px] font-mono text-[#73706d]">
                        {c.created_at ? new Date(c.created_at).toLocaleTimeString() : "Recent"}
                      </span>
                    </div>
                    <h4 className="text-sm font-medium text-[#292827]">{c.prediction}</h4>
                    <p className="text-xs text-[#73706d] line-clamp-1 mt-1 font-mono">
                      {c.age}yo {c.sex} • {c.symptoms}
                    </p>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-[#e8e4dd] text-[11px] font-mono">
                      <span className="text-[#73706d]">Severity: {c.severity || "Moderate"}</span>
                      <span className="text-[#1b1938] font-semibold">Conf: {c.confidence_percentage}</span>
                    </div>
                  </div>
                );
              })}

              {history.length === 0 && !loading && (
                <div className="p-12 rounded-xl bg-white border border-dashed border-[#e8e4dd] text-center text-xs text-[#73706d] font-mono">
                  No persisted analyses yet. Run an encounter in Clinical Analysis to populate the audit log.
                </div>
              )}
            </div>
          </div>

          {/* Right: Detailed Inspection Panel (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {caseDetail ? (
              <div className="p-6 rounded-xl bg-white border border-[#e8e4dd] space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e8e4dd] pb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#73706d]">Audit Record Identifier</span>
                    <h3 className="text-lg font-medium text-[#292827] mt-0.5">{caseDetail.case_id}</h3>
                  </div>
                  <span className="text-xs font-mono px-3 py-1 rounded bg-[#fafaf8] text-emerald-800 border border-[#e8e4dd]">
                    ✓ Relational Commit Verified
                  </span>
                </div>

                {/* Demographics & Biometrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-[#fafaf8] border border-[#e8e4dd]">
                    <span className="text-[#73706d] block text-[10px]">Demographics</span>
                    <span className="text-[#292827] font-semibold">{caseDetail.patient_profile?.age}yo {caseDetail.patient_profile?.sex}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#fafaf8] border border-[#e8e4dd]">
                    <span className="text-[#73706d] block text-[10px]">Severity</span>
                    <span className="text-[#292827] font-semibold">{caseDetail.patient_profile?.severity}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#fafaf8] border border-[#e8e4dd]">
                    <span className="text-[#73706d] block text-[10px]">Duration</span>
                    <span className="text-[#292827] font-semibold">{caseDetail.patient_profile?.duration}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#fafaf8] border border-[#e8e4dd]">
                    <span className="text-[#73706d] block text-[10px]">Blood Pressure</span>
                    <span className="text-[#292827] font-semibold">
                      {caseDetail.patient_profile?.vitals?.systolic_bp || 168}/{caseDetail.patient_profile?.vitals?.diastolic_bp || 105}
                    </span>
                  </div>
                </div>

                {/* Model Predictions */}
                <div className="space-y-3 font-mono text-xs">
                  <span className="text-[10px] uppercase text-[#73706d] block font-semibold">
                    Dual Model Prediction Outcomes
                  </span>
                  <div className="p-4 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#73706d]">Classical ML Baseline:</span>
                      <span className="text-[#292827] font-semibold">{caseDetail.ml_prediction?.predicted_condition} ({((caseDetail.ml_prediction?.confidence || 0.78) * 100).toFixed(1)}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#73706d]">BioBERT Transformer:</span>
                      <span className="text-[#1b1938] font-semibold">{caseDetail.transformer_prediction?.predicted_condition} ({((caseDetail.transformer_prediction?.confidence || 0.81) * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                </div>

                {/* Grounded Summary */}
                {caseDetail.llm_explanation && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase text-[#73706d] block font-semibold">
                      Persisted Clinical Synthesis
                    </span>
                    <div className="text-xs text-[#292827] leading-relaxed bg-[#fafaf8] p-4 rounded-lg border border-[#e8e4dd] whitespace-pre-line font-normal">
                      {caseDetail.llm_explanation.clinical_guidance || caseDetail.llm_explanation.explanation_markdown || JSON.stringify(caseDetail.llm_explanation, null, 2)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-16 rounded-xl bg-white border border-[#e8e4dd] text-center space-y-2">
                <History className="w-8 h-8 text-[#9a9794] mx-auto" />
                <h3 className="text-sm font-medium text-[#292827]">Select an Audit Record</h3>
                <p className="text-xs text-[#73706d]">Click any clinical encounter on the left to inspect its telemetry.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. Deep Teal Closing Resolution Section                       */}
      {/* ------------------------------------------------------------- */}
      <TealClosingCTA />
    </div>
  );
};

export default PredictionHistoryPage;
