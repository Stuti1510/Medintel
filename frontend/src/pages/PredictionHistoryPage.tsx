import React, { useState, useEffect } from 'react';
import { History, Database, Search, ArrowRight, CheckCircle2, ChevronRight, FileText, Sparkles, BookOpen } from 'lucide-react';
import { getPredictionHistory, getHistoricalCase } from '../services/api';

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
    <div className="min-h-screen bg-dark-bg text-dark-text p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-ai" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Prediction Audit Trail & History</h1>
            <span className="text-[11px] font-mono-tech px-2 py-0.5 rounded bg-semantic-success/15 text-semantic-success border border-semantic-success/30">
              POSTGRESQL AUDIT
            </span>
          </div>
          <p className="text-xs text-dark-secondary mt-1">
            Persisted clinical evaluations, model differentials, RAG citations, and safety events stored via SQLAlchemy ORM.
          </p>
        </div>

        <div className="text-xs font-mono-tech text-dark-muted">
          Persisted Records: {history.length}
        </div>
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Case List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase text-dark-secondary font-mono-tech">
              Stored Clinical Encounters
            </h3>
          </div>

          <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
            {history.map((c) => {
              const isSelected = selectedCaseRef === c.case_id;
              return (
                <div
                  key={c.case_id}
                  onClick={() => loadDetail(c.case_id)}
                  className={`p-4 rounded-button border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-ai/10 border-ai shadow-sm shadow-ai/25 ring-1 ring-ai/40'
                      : 'bg-dark-surface border-dark-border hover:border-dark-strongBorder'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono-tech font-bold text-ai">{c.case_id}</span>
                    <span className="text-[10px] font-mono-tech text-dark-muted">
                      {c.created_at ? new Date(c.created_at).toLocaleTimeString() : "Just now"}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-dark-text">{c.prediction}</h4>
                  <p className="text-xs text-dark-secondary line-clamp-1 mt-1 font-mono-tech">
                    {c.age}yo {c.sex} • {c.symptoms}
                  </p>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-dark-border/60 text-[10px] font-mono-tech">
                    <span className="text-dark-muted">Severity: {c.severity || "Moderate"}</span>
                    <span className="text-semantic-success font-semibold">Confidence: {c.confidence_percentage}</span>
                  </div>
                </div>
              );
            })}

            {history.length === 0 && !loading && (
              <div className="p-8 rounded bg-dark-surface border border-dashed border-dark-border text-center text-xs text-dark-muted">
                No analyses run yet. Run a case in the Clinical Analysis console to persist records to PostgreSQL.
              </div>
            )}
          </div>
        </div>

        {/* Right: Detailed Loaded Case View */}
        <div className="lg:col-span-7 space-y-4">
          {caseDetail ? (
            <div className="space-y-4">
              {/* Profile Card */}
              <div className="p-5 rounded-card bg-dark-surface border border-dark-border space-y-3">
                <div className="flex justify-between items-center border-b border-dark-border pb-3">
                  <div>
                    <span className="text-[10px] font-mono-tech uppercase text-dark-muted">AUDIT RECORD</span>
                    <h3 className="text-lg font-bold text-dark-text">{caseDetail.case_id}</h3>
                  </div>
                  <span className="text-xs font-mono-tech px-2.5 py-1 rounded bg-dark-deep text-semantic-success border border-dark-strongBorder">
                    ✓ PERSISTED IN DB
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono-tech">
                  <div className="p-2 rounded bg-dark-deep border border-dark-border">
                    <span className="text-dark-muted block text-[10px]">Demographics</span>
                    <span className="text-dark-text font-semibold">{caseDetail.patient_profile.age}yo {caseDetail.patient_profile.sex}</span>
                  </div>
                  <div className="p-2 rounded bg-dark-deep border border-dark-border">
                    <span className="text-dark-muted block text-[10px]">Severity</span>
                    <span className="text-semantic-warning font-semibold">{caseDetail.patient_profile.severity}</span>
                  </div>
                  <div className="p-2 rounded bg-dark-deep border border-dark-border">
                    <span className="text-dark-muted block text-[10px]">Duration</span>
                    <span className="text-dark-text font-semibold">{caseDetail.patient_profile.duration}</span>
                  </div>
                  <div className="p-2 rounded bg-dark-deep border border-dark-border">
                    <span className="text-dark-muted block text-[10px]">Heart Rate</span>
                    <span className="text-dark-text font-semibold">{caseDetail.patient_profile.vitals?.heart_rate || 80} bpm</span>
                  </div>
                </div>

                <div className="text-xs space-y-1 bg-dark-deep p-3 rounded border border-dark-border">
                  <span className="text-dark-muted font-mono-tech text-[10px] uppercase block">Encounter Narrative:</span>
                  <p className="text-dark-secondary leading-relaxed font-sans">{caseDetail.patient_profile.clinical_narrative || caseDetail.patient_profile.symptoms}</p>
                </div>
              </div>

              {/* Differentials Stored */}
              {caseDetail.top_differentials && caseDetail.top_differentials.length > 0 && (
                <div className="p-4 rounded-card bg-dark-surface border border-dark-border space-y-2">
                  <span className="text-xs font-semibold text-dark-secondary font-mono-tech uppercase block">
                    Stored Differentials
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {caseDetail.top_differentials.slice(0, 3).map((d: any) => (
                      <div key={d.rank} className="p-2.5 rounded bg-dark-elevated border border-dark-strongBorder text-xs">
                        <span className="text-[10px] font-mono-tech text-dark-muted">Rank {d.rank}</span>
                        <p className="font-bold text-dark-text truncate">{d.condition}</p>
                        <span className="text-ai font-mono-tech text-[11px] font-semibold">{d.percentage}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* LLM Stored Explanation */}
              <div className="p-5 rounded-card bg-dark-surface border border-dark-border space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-ai" />
                  <h4 className="text-sm font-semibold text-dark-text">Synthesized Clinical Guidance</h4>
                </div>
                <div className="text-xs text-dark-secondary leading-relaxed bg-dark-deep p-4 rounded border border-dark-border whitespace-pre-line space-y-2">
                  {caseDetail.llm_explanation?.explanation_markdown}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded bg-dark-surface border border-dashed border-dark-border text-center text-xs text-dark-muted">
              Select a historical case from the list on the left to inspect its stored database record.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
