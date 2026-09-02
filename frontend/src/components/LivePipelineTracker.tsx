import React from 'react';
import { CheckCircle2, Loader2, Sparkles, Database, ShieldCheck, Cpu, Brain, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

interface PipelineStage {
  id: string;
  name: string;
  category: "data" | "ml" | "transformer" | "rag" | "llm" | "safety" | "sql";
  icon: any;
  latencyKey?: string;
}

const STAGES: PipelineStage[] = [
  { id: "validation", name: "Input Validation", category: "data", icon: CheckCircle2, latencyKey: "preprocessing_ms" },
  { id: "preprocessing", name: "Text Preprocessing", category: "data", icon: CheckCircle2, latencyKey: "preprocessing_ms" },
  { id: "classical_ml", name: "Classical ML Baseline", category: "ml", icon: Brain, latencyKey: "classical_ml_ms" },
  { id: "biobert", name: "BioBERT Transformer", category: "transformer", icon: Cpu, latencyKey: "transformer_ms" },
  { id: "rag", name: "Vector RAG Retrieval", category: "rag", icon: BookOpen, latencyKey: "rag_retrieval_ms" },
  { id: "safety", name: "Safety & Red-Flag Check", category: "safety", icon: ShieldCheck, latencyKey: "safety_check_ms" },
  { id: "llm", name: "LLM Contextual Synthesis", category: "llm", icon: Sparkles, latencyKey: "llm_synthesis_ms" },
  { id: "sql", name: "PostgreSQL Persistence", category: "sql", icon: Database }
];

interface Props {
  isAnalyzing: boolean;
  timings?: Record<string, number>;
  activeStageIndex?: number;
}

export const LivePipelineTracker: React.FC<Props> = ({ isAnalyzing, timings, activeStageIndex = 8 }) => {
  return (
    <div className="p-4 rounded-card bg-dark-surface border border-dark-border">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-dark-secondary font-mono-tech flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-ai animate-ping' : 'bg-semantic-success'}`} />
          End-to-End Clinical Intelligence Pipeline
        </h4>
        {timings?.total_pipeline_ms && (
          <span className="text-xs font-mono-tech px-2 py-0.5 rounded bg-dark-elevated text-ai border border-dark-strongBorder">
            Latency: {timings.total_pipeline_ms}ms
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const isComplete = !isAnalyzing || idx < activeStageIndex;
          const isCurrent = isAnalyzing && idx === activeStageIndex;
          const latency = stage.latencyKey && timings ? timings[stage.latencyKey] : undefined;

          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-2.5 rounded-button border text-left transition-all ${
                isCurrent
                  ? 'bg-ai/10 border-ai text-dark-text shadow-sm shadow-ai/30 ring-1 ring-ai/50'
                  : isComplete
                  ? 'bg-dark-elevated/70 border-dark-strongBorder text-dark-text'
                  : 'bg-dark-deep border-dark-border text-dark-muted'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-ai animate-spin' : isComplete ? 'text-semantic-success' : 'text-dark-muted'}`} />
                {isCurrent && <Loader2 className="w-3 h-3 text-ai animate-spin" />}
                {isComplete && !isAnalyzing && (
                  <span className="text-[10px] font-mono-tech text-semantic-success">✓</span>
                )}
              </div>
              <p className="text-[11px] font-medium leading-tight line-clamp-1">{stage.name}</p>
              {latency !== undefined && isComplete && (
                <p className="text-[9px] font-mono-tech text-dark-muted mt-1">{latency}ms</p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
