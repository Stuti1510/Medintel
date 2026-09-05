import React from 'react';
import { Layers, Activity, Cpu, Brain, BookOpen, Sparkles, ShieldCheck, Database, ArrowDown } from 'lucide-react';
import { TealClosingCTA } from '../components/TealClosingCTA';

export const ArchitecturePage: React.FC = () => {
  const pipelineSteps = [
    {
      stage: "1. Client & Research Console Layer",
      icon: Activity,
      desc: "React 18 + TypeScript + Vite with Inter variable typography, publication-grade visualization matrices, and accessible responsive interfaces."
    },
    {
      stage: "2. FastAPI Orchestration & Validation Gateway",
      icon: Layers,
      desc: "High-performance asynchronous API gateway (/api/analyze) with strict Pydantic input validation, CORS middleware, and automated error boundaries."
    },
    {
      stage: "3. Dual-Intelligence Classification Layer",
      icon: Brain,
      desc: "Balanced Classical ML baselines (Logistic Regression, Random Forest, XGBoost) running in parallel with PyTorch Medical BioBERT contextual representation."
    },
    {
      stage: "4. Dense Vector RAG Knowledge Retrieval Layer",
      icon: BookOpen,
      desc: "Dense semantic vector representations and normalized cosine similarity search across 43 verified clinical guidelines (ACC/AHA, IDSA, GINA, KDIGO)."
    },
    {
      stage: "5. Grounded LLM Contextual Synthesis & Safety",
      icon: Sparkles,
      desc: "Constrained clinical synthesizer enforcing structured reasoning sections, deterministic vital sign threshold rules, and triage disclaimer validation."
    },
    {
      stage: "6. Relational Persistence Layer (PostgreSQL / SQLite)",
      icon: Database,
      desc: "SQLAlchemy ORM with structured schemas tracking patient encounters, models, predictions, probability vectors, retrieval results, and audit events."
    }
  ];

  const relationalTables = [
    { name: "patient_cases", role: "Clinical encounters, age, sex, vitals, symptoms, narratives" },
    { name: "models", role: "Model registry, architecture type, weights path, configuration" },
    { name: "predictions", role: "Inference outcomes, top predicted condition, latency, timestamp" },
    { name: "prediction_probabilities", role: "Full softmax multiclass probability vectors per case" },
    { name: "model_metrics", role: "Empirical test evaluation metrics (accuracy, precision, recall, F1)" },
    { name: "retrieval_results", role: "RAG top-K retrieved evidence passages and cosine similarity scores" },
    { name: "llm_interactions", role: "Synthesized markdown guidance, prompt tokens, model provider" },
    { name: "safety_events", role: "Emergency red-flag rule triggers, vital violations, triage levels" }
  ];

  return (
    <div className="min-h-screen bg-[#fafaf8] text-[#292827] flex flex-col">
      {/* ------------------------------------------------------------- */}
      {/* 1. Page Header                                                */}
      {/* ------------------------------------------------------------- */}
      <section className="w-full bg-white border-b border-[#e8e4dd] py-10 md:py-14">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[#73706d] block">
              Engineering Topology & Data Flow
            </span>
            <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#292827]">
              System Architecture
            </h1>
            <p className="text-base text-[#73706d] max-w-2xl">
              Modular multi-tier architecture connecting data preprocessing, dual-model classification, RAG retrieval, LLM synthesis, and relational audit persistence.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. Pipeline Sequence Stack                                    */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-10 flex-1">
        <div className="max-w-3xl mx-auto space-y-3">
          {pipelineSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="space-y-3">
                <div className="p-6 rounded-xl bg-white border border-[#e8e4dd] space-y-2 hover:border-[#1b1938]/40 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] text-[#1b1938]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="text-base font-medium text-[#292827]">{step.stage}</h3>
                    </div>
                    <span className="text-xs font-mono text-[#73706d]">Tier 0{idx + 1}</span>
                  </div>
                  <p className="text-xs text-[#73706d] leading-relaxed pl-11">{step.desc}</p>
                </div>

                {idx < pipelineSteps.length - 1 && (
                  <div className="flex justify-center my-0.5">
                    <ArrowDown className="w-3.5 h-3.5 text-[#9a9794]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Relational Schema Table Visualizer */}
        <div className="max-w-3xl mx-auto p-6 rounded-xl bg-white border border-[#e8e4dd] space-y-4">
          <div className="border-b border-[#e8e4dd] pb-3">
            <h3 className="text-sm font-medium text-[#292827] flex items-center gap-2">
              <Database className="w-4 h-4 text-[#1b1938]" />
              <span>Relational Database Schema Entities (SQLAlchemy / PostgreSQL)</span>
            </h3>
            <p className="text-xs text-[#73706d] mt-0.5">Structured entity relationships for clinical case persistence and audit traceability.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            {relationalTables.map((t) => (
              <div key={t.name} className="p-3.5 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] space-y-1">
                <span className="font-semibold text-[#1b1938] block">{t.name}</span>
                <p className="text-[11px] text-[#73706d]">{t.role}</p>
              </div>
            ))}
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

export default ArchitecturePage;
