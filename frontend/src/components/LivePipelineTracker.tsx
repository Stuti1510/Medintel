import React from 'react';
import { CheckCircle2, Loader2, Sparkles, Database, ShieldCheck, Cpu, Brain, BookOpen } from 'lucide-react';

interface PipelineStage {
  id: string;
  name: string;
  category: "data" | "ml" | "transformer" | "rag" | "llm" | "safety" | "sql";
  icon: any;
  latencyKey?: string;
}

const STAGES: PipelineStage[] = [
  { id: "validation", name: "Input Validation", category: "data", icon: CheckCircle2, latencyKey: "preprocessing_ms" },
  { id: "preprocessing", name: "Preprocessing", category: "data", icon: CheckCircle2, latencyKey: "preprocessing_ms" },
  { id: "classical_ml", name: "Classical ML", category: "ml", icon: Brain, latencyKey: "classical_ml_ms" },
  { id: "biobert", name: "BioBERT", category: "transformer", icon: Cpu, latencyKey: "transformer_ms" },
  { id: "rag", name: "Vector RAG", category: "rag", icon: BookOpen, latencyKey: "rag_retrieval_ms" },
  { id: "safety", name: "Safety Bounds", category: "safety", icon: ShieldCheck, latencyKey: "safety_check_ms" },
  { id: "llm", name: "Grounded LLM", category: "llm", icon: Sparkles, latencyKey: "llm_synthesis_ms" },
  { id: "sql", name: "Audit Persistence", category: "sql", icon: Database }
];

interface Props {
  isAnalyzing: boolean;
  timings?: Record<string, number>;
  activeStageIndex?: number;
}

export const LivePipelineTracker: React.FC<Props> = ({ isAnalyzing, timings, activeStageIndex = 8 }) => {
  return (
    <div className="p-4 rounded-xl bg-white border border-[#e8e4dd] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-[#1b1938] animate-ping' : 'bg-emerald-500'}`} />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#292827] font-mono">
            Sequential Research Pipeline Execution
          </h4>
        </div>
        {timings?.total_pipeline_ms && (
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#fafaf8] text-[#1b1938] border border-[#e8e4dd]">
            Total: {timings.total_pipeline_ms}ms
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {STAGES.map((stage, idx) => {
          const isComplete = !isAnalyzing || idx < activeStageIndex;
          const isCurrent = isAnalyzing && idx === activeStageIndex;
          const latency = stage.latencyKey && timings ? timings[stage.latencyKey] : undefined;

          return (
            <div
              key={stage.id}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                isCurrent
                  ? 'bg-[#f5f4f0] border-[#1b1938] text-[#1b1938] shadow-sm'
                  : isComplete
                  ? 'bg-[#fafaf8] border-[#e8e4dd] text-[#292827]'
                  : 'bg-white border-[#f1f0ec] text-[#9a9794]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-[#9a9794]">0{idx + 1}</span>
                {isCurrent && <Loader2 className="w-3 h-3 text-[#1b1938] animate-spin" />}
                {isComplete && !isAnalyzing && (
                  <span className="text-[10px] text-emerald-600 font-bold">✓</span>
                )}
              </div>
              <p className="text-xs font-medium leading-snug line-clamp-1">{stage.name}</p>
              {latency !== undefined && isComplete && (
                <p className="text-[10px] font-mono text-[#73706d] mt-0.5">{latency}ms</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LivePipelineTracker;
