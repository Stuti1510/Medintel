import React, { useState } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Cpu, BookOpen, AlertTriangle, Play, Loader2 } from 'lucide-react';
import { runClinicalAnalysis } from '../services/api';

export const LLMLabPage: React.FC = () => {
  const [symptoms, setSymptoms] = useState<string>(
    "58yo male with crushing substernal chest pain, radiation to left arm and jaw, diaphoresis, shortness of breath for 3 hours."
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<any>(null);

  const handleSynthesize = async () => {
    setLoading(true);
    try {
      const res = await runClinicalAnalysis({
        age: 58,
        sex: "Male",
        symptoms: symptoms,
        clinical_narrative: symptoms,
        vitals: { heart_rate: 110, systolic_bp: 165, diastolic_bp: 100, temperature: 36.8, spo2: 93 }
      });
      setResponse(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-ai" />
            <h1 className="text-2xl font-bold text-white tracking-tight">LLM Contextual Synthesis Lab</h1>
            <span className="text-[11px] font-mono-tech px-2 py-0.5 rounded bg-ai/10 text-ai border border-ai/20">
              GROUNDED SYNTHESIS
            </span>
          </div>
          <p className="text-xs text-dark-secondary mt-1">
            Visualizing how structured ML/Transformer predictions and retrieved RAG citations compose the prompt context.
          </p>
        </div>

        <button
          onClick={handleSynthesize}
          disabled={loading}
          className="px-5 py-2.5 rounded-button bg-ai hover:bg-ai-hover text-white text-xs font-semibold shadow-md shadow-ai/25 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          <span>Run Context Pipeline</span>
        </button>
      </div>

      {/* 3-Column Architecture View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Column 1: Left - Input Patient Case */}
        <div className="lg:col-span-4 p-5 rounded-card bg-dark-surface border border-dark-border space-y-4">
          <span className="text-xs font-semibold text-dark-secondary font-mono-tech uppercase block">
            Column 1: Patient Encounter Context
          </span>

          <textarea
            rows={4}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="w-full p-2.5 rounded-button bg-dark-deep border border-dark-border text-xs text-dark-text focus:border-ai focus:outline-none font-mono-tech leading-relaxed"
          />

          <div className="p-3 rounded bg-dark-deep border border-dark-border space-y-2 text-xs">
            <span className="font-semibold text-dark-text block">Clinical Parameters:</span>
            <div className="grid grid-cols-2 gap-2 text-dark-secondary font-mono-tech text-[11px]">
              <div>Age: 58 | Sex: Male</div>
              <div>HR: 110 bpm</div>
              <div>BP: 165/100 mmHg</div>
              <div>SpO2: 93%</div>
            </div>
          </div>
        </div>

        {/* Column 2: Center - AI Context Flow Pipeline */}
        <div className="lg:col-span-4 p-5 rounded-card bg-dark-surface border border-dark-border space-y-3">
          <span className="text-xs font-semibold text-ai font-mono-tech uppercase block">
            Column 2: Grounding Context Stream
          </span>

          <div className="space-y-2.5 text-xs font-mono-tech">
            {/* Step A: Transformer Output */}
            <div className="p-3 rounded bg-dark-elevated border border-dark-strongBorder space-y-1">
              <div className="flex items-center gap-1.5 text-ai">
                <Cpu className="w-3.5 h-3.5" />
                <span className="font-bold">Transformer Output (BioBERT)</span>
              </div>
              <p className="text-dark-text">
                {response ? response.transformer_prediction.predicted_condition : "Myocardial Infarction"} (Confidence: {response ? response.transformer_prediction.confidence_percentage : "98.2%"})
              </p>
            </div>

            {/* Step B: RAG Top-K */}
            <div className="p-3 rounded bg-dark-elevated border border-dark-strongBorder space-y-1">
              <div className="flex items-center gap-1.5 text-semantic-info">
                <BookOpen className="w-3.5 h-3.5" />
                <span className="font-bold">Retrieved Knowledge Citations</span>
              </div>
              <p className="text-dark-secondary text-[11px]">
                {response?.retrieved_evidence ? `${response.retrieved_evidence.length} Evidence Passages Injected` : "AHA/ACC Clinical Guidelines for AMI"}
              </p>
            </div>

            {/* Step C: System Prompt Guardrails */}
            <div className="p-3 rounded bg-dark-elevated border border-dark-strongBorder space-y-1">
              <div className="flex items-center gap-1.5 text-semantic-warning">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="font-bold">Safety & Prompt Guardrails</span>
              </div>
              <p className="text-dark-secondary text-[11px]">
                • No autonomous prescribing<br />
                • Do not fabricate diagnoses<br />
                • Mandate professional clinical review
              </p>
            </div>
          </div>
        </div>

        {/* Column 3: Right - Grounded LLM Response */}
        <div className="lg:col-span-4 p-5 rounded-card bg-dark-surface border border-dark-border space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-semantic-success font-mono-tech uppercase block">
              Column 3: Grounded Clinical Output
            </span>
            <span className="text-[10px] font-mono-tech text-dark-muted">
              {response?.llm_explanation.provider || "Demo Synthesizer"}
            </span>
          </div>

          <div className="text-xs text-dark-secondary leading-relaxed bg-dark-deep p-3.5 rounded border border-dark-border max-h-96 overflow-y-auto whitespace-pre-line space-y-2">
            {response?.llm_explanation.explanation_markdown || (
              "Click 'Run Context Pipeline' to trigger end-to-end model inference, evidence retrieval, and safety-audited synthesis."
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
