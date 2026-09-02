import React from 'react';
import { Layers, Activity, Cpu, Brain, BookOpen, Sparkles, ShieldCheck, Database, ArrowDown, ArrowRight } from 'lucide-react';

export const ArchitecturePage: React.FC = () => {
  const pipelineSteps = [
    {
      stage: "1. Client & Presentation Layer",
      icon: Activity,
      color: "text-white",
      border: "border-dark-strongBorder",
      bg: "bg-dark-surface",
      desc: "React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion. Provides the Clinical Research Console, live pipeline tracking, attention heatmaps, and dataset inspectors."
    },
    {
      stage: "2. FastAPI Clinical Orchestrator",
      icon: Layers,
      color: "text-ai",
      border: "border-ai/40",
      bg: "bg-ai/5",
      desc: "High-performance asynchronous API gateway (/api/analyze) with strict Pydantic input validation, CORS middleware, and service lifecycles."
    },
    {
      stage: "3. Dual-Intelligence Classifier Layer",
      icon: Brain,
      color: "text-semantic-success",
      border: "border-semantic-success/40",
      bg: "bg-semantic-success/5",
      desc: "Classical ML (TF-IDF n-grams + Logistic Regression, Random Forest, XGBoost) running in parallel with BioBERT Transformer ([CLS] representation + classification head)."
    },
    {
      stage: "4. Vector RAG Knowledge Retrieval Layer",
      icon: BookOpen,
      color: "text-semantic-info",
      border: "border-semantic-info/40",
      bg: "bg-semantic-info/5",
      desc: "Dense semantic vector representations & normalized cosine similarity search over 43 verified clinical guidelines (ACC/AHA, IDSA, GINA, KDIGO, WSES)."
    },
    {
      stage: "5. Grounded LLM Contextual Synthesis & Safety",
      icon: Sparkles,
      color: "text-ai-soft",
      border: "border-ai/30",
      bg: "bg-ai/5",
      desc: "Pluggable provider adapter (Gemini, OpenAI, Offline Educational Synthesizer) with prompt engineering, red-flag emergency rule checks, and disclaimer enforcement."
    },
    {
      stage: "6. Relational Persistence Layer (PostgreSQL)",
      icon: Database,
      color: "text-semantic-success",
      border: "border-semantic-success/40",
      bg: "bg-semantic-success/5",
      desc: "SQLAlchemy ORM with 10 structured schemas (users, patient_cases, models, predictions, prediction_probabilities, model_metrics, experiments, retrieval_results, llm_interactions, safety_events)."
    }
  ];

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-ai" />
            <h1 className="text-2xl font-bold text-white tracking-tight">System Architecture & Engineering Topology</h1>
            <span className="text-[11px] font-mono-tech px-2 py-0.5 rounded bg-ai/10 text-ai border border-ai/20">
              MEDINTEL TOPOLOGY
            </span>
          </div>
          <p className="text-xs text-dark-secondary mt-1">
            Modular multi-tier architecture connecting data validation, dual-model classification, RAG retrieval, LLM reasoning, and PostgreSQL persistence.
          </p>
        </div>
      </div>

      {/* Pipeline Sequence Stack */}
      <div className="max-w-4xl mx-auto space-y-4">
        {pipelineSteps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={idx} className="space-y-4">
              <div className={`p-5 rounded-card ${step.bg} border ${step.border} space-y-2 relative transition-all hover:scale-[1.01]`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-button bg-dark-deep border border-dark-border ${step.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-dark-text">{step.stage}</h3>
                  </div>
                  <span className="text-xs font-mono-tech text-dark-muted">Tier 0{idx + 1}</span>
                </div>
                <p className="text-xs text-dark-secondary leading-relaxed pl-12">{step.desc}</p>
              </div>

              {idx < pipelineSteps.length - 1 && (
                <div className="flex justify-center my-1">
                  <ArrowDown className="w-4 h-4 text-dark-muted animate-bounce" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
