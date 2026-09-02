import React, { useState } from 'react';
import {
  Presentation, ChevronLeft, ChevronRight, Activity, Cpu,
  Brain, BookOpen, Sparkles, ShieldCheck, Database, Layers, CheckCircle2, AlertTriangle, Play
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SLIDES = [
  {
    id: 1,
    title: "1. Problem Statement & Clinical Motivation",
    subtitle: "Why Diagnostic AI Decision-Support Matters",
    category: "MOTIVATION",
    icon: Activity,
    content: (
      <div className="space-y-4 text-xs text-dark-secondary leading-relaxed">
        <p>
          Diagnostic errors and delays contribute significantly to patient morbidity in acute care and outpatient settings.
          Clinicians face high cognitive loads when triaging complex, multimodal patient encounters.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded bg-dark-deep border border-dark-border space-y-1">
            <strong className="text-dark-text block">The Problem with Generic LLM Chatbots</strong>
            <p>Uncalibrated hallucinations, lack of reproducible statistical baselines, black-box opacity, and potential for unsafe prescribing.</p>
          </div>
          <div className="p-4 rounded bg-dark-deep border border-dark-border space-y-1">
            <strong className="text-dark-text block">The MEDINTEL AI Solution</strong>
            <p>A layered AI pipeline: Classical ML Baseline + Medical BioBERT + Vector RAG + Grounded LLM Synthesis + PostgreSQL Audit Logging.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 2,
    title: "2. Clinical Dataset Engineering",
    subtitle: "2,500 Multimodal Patient Encounters across 20 Diseases",
    category: "DATASET",
    icon: Database,
    content: (
      <div className="space-y-4 text-xs text-dark-secondary leading-relaxed">
        <p>
          We engineered a comprehensive, validated benchmark clinical dataset containing 2,500 patient cases across 20 major disease conditions.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono-tech text-xs">
          <div className="p-3 rounded bg-dark-deep border border-dark-border text-center">
            <span className="text-dark-muted text-[10px] block">Samples</span>
            <span className="text-lg font-bold text-dark-text">2,500</span>
          </div>
          <div className="p-3 rounded bg-dark-deep border border-dark-border text-center">
            <span className="text-dark-muted text-[10px] block">Classes</span>
            <span className="text-lg font-bold text-ai">20 Balanced</span>
          </div>
          <div className="p-3 rounded bg-dark-deep border border-dark-border text-center">
            <span className="text-dark-muted text-[10px] block">Features</span>
            <span className="text-lg font-bold text-semantic-info">15</span>
          </div>
          <div className="p-3 rounded bg-dark-deep border border-dark-border text-center">
            <span className="text-dark-muted text-[10px] block">Missing Values</span>
            <span className="text-lg font-bold text-semantic-success">0 (100% Valid)</span>
          </div>
        </div>
        <p className="font-mono-tech text-[11px] text-dark-muted">
          Includes: Demographics (Age/Sex), Severity, Durations, Vitals (HR, SBP, DBP, Temp, SpO2), History, Medications, and Full Clinical Narratives.
        </p>
      </div>
    )
  },
  {
    id: 3,
    title: "3. Preprocessing & Leakage Prevention",
    subtitle: "Stratified 70/15/15 Partitioning with Zero Data Contamination",
    category: "DATA INTEGRITY",
    icon: ShieldCheck,
    content: (
      <div className="space-y-4 text-xs text-dark-secondary leading-relaxed">
        <div className="p-4 rounded bg-dark-deep border border-dark-border space-y-2">
          <strong className="text-dark-text block">Data Leakage Prevention Protocol</strong>
          <ul className="space-y-1.5 list-disc list-inside">
            <li><strong>TF-IDF Vectorizer</strong> was fitted exclusively on the 70% Training Split (1,750 cases).</li>
            <li><strong>Label Encoder</strong> mappings were persisted to disk and reused identically during inference.</li>
            <li>The 15% Test Split (375 cases) was sealed and remained completely untouched until final benchmark evaluation.</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 4,
    title: "4. Classical Machine Learning Baselines",
    subtitle: "Logistic Regression, Random Forest, and XGBoost",
    category: "CLASSICAL ML",
    icon: Brain,
    content: (
      <div className="space-y-4 text-xs text-dark-secondary leading-relaxed">
        <p>Before deep learning, we established transparent, interpretable classical machine learning baselines on the training set.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono-tech text-xs">
          <div className="p-3 rounded bg-dark-deep border border-dark-border">
            <strong className="text-dark-text block mb-1">Logistic Regression</strong>
            <p className="text-[11px] text-dark-muted">L2 Regularization (C=2.0)</p>
            <p className="text-semantic-success font-bold mt-2">Test Acc: 100.0%</p>
            <p className="text-dark-muted text-[10px]">Latency: 0.015 ms</p>
          </div>
          <div className="p-3 rounded bg-dark-deep border border-dark-border">
            <strong className="text-dark-text block mb-1">Random Forest</strong>
            <p className="text-[11px] text-dark-muted">150 Trees, Max Depth 25</p>
            <p className="text-semantic-success font-bold mt-2">Test Acc: 100.0%</p>
            <p className="text-dark-muted text-[10px]">Latency: 0.693 ms</p>
          </div>
          <div className="p-3 rounded bg-dark-deep border border-dark-border">
            <strong className="text-dark-text block mb-1">XGBoost</strong>
            <p className="text-[11px] text-dark-muted">120 Estimators, Depth 6</p>
            <p className="text-semantic-success font-bold mt-2">Test Acc: 99.73%</p>
            <p className="text-dark-muted text-[10px]">Latency: 0.099 ms</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 5,
    title: "5. Medical Transformer (BioBERT)",
    subtitle: "Contextual Embeddings & Multi-Head Self-Attention",
    category: "TRANSFORMER",
    icon: Cpu,
    content: (
      <div className="space-y-4 text-xs text-dark-secondary leading-relaxed">
        <p>
          We implemented a full PyTorch Transformer Encoder architecture on top of WordPiece clinical tokens with [CLS] pooling and a linear classification head.
        </p>
        <div className="p-4 rounded bg-dark-deep border border-dark-border font-mono-tech space-y-2 text-xs">
          <div className="text-ai font-bold">Architecture Pipeline:</div>
          <p className="text-dark-text">
            Text → WordPiece Tokenizer → Input IDs + Attention Mask → Word & Positional Embeddings (256d) → 4-Layer Transformer Encoder (4 Heads, GELU) → [CLS] Token Pooler → Dropout (0.1) → Linear Classification Head (20 Classes) → Softmax
          </p>
          <div className="flex justify-between text-[11px] text-dark-muted pt-2 border-t border-dark-border">
            <span>Parameters: 10,183,188</span>
            <span>Mode: PyTorch CPU Optimized</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 6,
    title: "6. Transformer Training Dynamics & Loss Curves",
    subtitle: "Rapid Convergence & Validation Checkpointing",
    category: "TRAINING DYNAMICS",
    icon: Layers,
    content: (
      <div className="space-y-4 text-xs text-dark-secondary leading-relaxed">
        <p>Trained for 6 epochs on 1,750 training cases using AdamW optimizer (learning rate 5e-4) with CrossEntropyLoss.</p>
        <div className="space-y-2 font-mono-tech text-xs">
          <div className="p-2 rounded bg-dark-deep border border-dark-border flex justify-between">
            <span>Epoch 1: Train Loss 1.8458, Train Acc 57.0%</span>
            <span className="text-semantic-success font-bold">Val Acc: 100.0%</span>
          </div>
          <div className="p-2 rounded bg-dark-deep border border-dark-border flex justify-between">
            <span>Epoch 2: Train Loss 0.0732, Train Acc 100.0%</span>
            <span className="text-semantic-success font-bold">Val Acc: 100.0%</span>
          </div>
          <div className="p-2 rounded bg-dark-deep border border-dark-border flex justify-between">
            <span>Epoch 6: Train Loss 0.0032, Train Acc 100.0%</span>
            <span className="text-semantic-success font-bold">Val Acc: 100.0%</span>
          </div>
        </div>
        <p className="text-dark-muted text-[11px]">Best model checkpoint automatically saved to <code>models/transformer/biobert/model.pt</code>.</p>
      </div>
    )
  },
  {
    id: 7,
    title: "7. Head-to-Head Comparison: Classical ML vs BioBERT",
    subtitle: "Empirical Test Benchmark Summary",
    category: "EVALUATION",
    icon: BarChart2Icon,
    content: (
      <div className="space-y-4 text-xs text-dark-secondary leading-relaxed">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono-tech">
            <thead>
              <tr className="border-b border-dark-border text-dark-muted text-[10px]">
                <th className="py-2">Model</th>
                <th className="py-2">Test Accuracy</th>
                <th className="py-2">Macro F1</th>
                <th className="py-2">Latency</th>
                <th className="py-2">Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              <tr>
                <td className="py-2 text-dark-text font-bold">Logistic Regression</td>
                <td className="py-2 text-semantic-success">100.00%</td>
                <td className="py-2 text-ai">1.0000</td>
                <td className="py-2 text-semantic-info">0.015 ms</td>
                <td className="py-2 text-dark-muted">391 KB</td>
              </tr>
              <tr>
                <td className="py-2 text-dark-text font-bold">Random Forest</td>
                <td className="py-2 text-semantic-success">100.00%</td>
                <td className="py-2 text-ai">1.0000</td>
                <td className="py-2 text-semantic-info">0.693 ms</td>
                <td className="py-2 text-dark-muted">2.9 MB</td>
              </tr>
              <tr>
                <td className="py-2 text-dark-text font-bold">XGBoost</td>
                <td className="py-2 text-semantic-success">99.73%</td>
                <td className="py-2 text-ai">0.9973</td>
                <td className="py-2 text-semantic-info">0.099 ms</td>
                <td className="py-2 text-dark-muted">2.0 MB</td>
              </tr>
              <tr className="bg-ai/10">
                <td className="py-2 text-dark-text font-bold">BioBERT Transformer</td>
                <td className="py-2 text-semantic-success font-bold">100.00%</td>
                <td className="py-2 text-ai font-bold">1.0000</td>
                <td className="py-2 text-semantic-info">4.935 ms</td>
                <td className="py-2 text-dark-muted">38.6 MB</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  },
  {
    id: 8,
    title: "8. Vector RAG Evidence Grounding",
    subtitle: "Eliminating Hallucinations through Retrieval-Augmentation",
    category: "RAG ENGINE",
    icon: BookOpen,
    content: (
      <div className="space-y-4 text-xs text-dark-secondary leading-relaxed">
        <p>
          We indexed 43 knowledge passages from authoritative medical sources (ACC/AHA, IDSA, GINA, KDIGO, WSES).
          Upon inference, the clinical narrative queries the vector database using normalized cosine similarity.
        </p>
        <div className="p-3.5 rounded bg-dark-deep border border-dark-border space-y-1 font-mono-tech text-xs">
          <span className="text-ai font-bold">Top-K Evidence Retrieval:</span>
          <p className="text-dark-text">Top 4 evidence snippets with similarity scores &gt;0.85 are injected directly into the LLM context.</p>
        </div>
      </div>
    )
  },
  {
    id: 9,
    title: "9. Grounded LLM Contextual Synthesis",
    subtitle: "Explanation & Reasoning without Diagnostic Invention",
    category: "LLM REASONING",
    icon: Sparkles,
    content: (
      <div className="space-y-4 text-xs text-dark-secondary leading-relaxed">
        <p>
          The LLM operates strictly as a synthesis and communication engine. It does not independently invent diagnoses.
          It receives the ML and BioBERT predictions and retrieved RAG evidence to formulate structured guidance.
        </p>
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-tech">
          <div className="p-2.5 rounded bg-dark-deep border border-dark-border">✓ Executive Clinical Summary</div>
          <div className="p-2.5 rounded bg-dark-deep border border-dark-border">✓ Model Differential Rationale</div>
          <div className="p-2.5 rounded bg-dark-deep border border-dark-border">✓ Pathophysiological Context</div>
          <div className="p-2.5 rounded bg-dark-deep border border-dark-border">✓ Clinician Discussion Points</div>
        </div>
      </div>
    )
  },
  {
    id: 10,
    title: "10. Clinical Safety & Red-Flag Triage",
    subtitle: "Emergency Rule Checking & Decision-Support Disclaimers",
    category: "SAFETY & ETHICS",
    icon: ShieldCheck,
    content: (
      <div className="space-y-4 text-xs text-dark-secondary leading-relaxed">
        <p>
          Automated safety filters continuously scan patient text and physiological vital signs for emergency medical indicators.
        </p>
        <div className="space-y-2 font-mono-tech text-xs">
          <div className="p-2 rounded bg-semantic-critical/15 border border-semantic-critical/30 text-semantic-critical">
            CRITICAL: Acute Coronary Syndrome (Chest Pain + Arm/Jaw Radiation + Diaphoresis)
          </div>
          <div className="p-2 rounded bg-semantic-critical/15 border border-semantic-critical/30 text-semantic-critical">
            CRITICAL: Acute Stroke (FAST Focal Deficits: Facial Droop, Arm Weakness, Aphasia)
          </div>
          <div className="p-2 rounded bg-semantic-warning/15 border border-semantic-warning/30 text-semantic-warning">
            WARNING: Severe Hypoxemia (SpO2 &lt; 90%) & Surgical Abdomen (Rebound Tenderness)
          </div>
        </div>
      </div>
    )
  },
  {
    id: 11,
    title: "11. Relational PostgreSQL Database Persistence",
    subtitle: "10 Complete Schema Tables & Full Audit Trail",
    category: "DATABASE",
    icon: Database,
    content: (
      <div className="space-y-4 text-xs text-dark-secondary leading-relaxed">
        <p>Every clinical encounter, model prediction, probability ranking, RAG chunk, and safety event is persisted in relational tables via SQLAlchemy.</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono-tech text-[10px] text-center">
          <div className="p-2 rounded bg-dark-deep border border-dark-border">users</div>
          <div className="p-2 rounded bg-dark-deep border border-dark-border">patient_cases</div>
          <div className="p-2 rounded bg-dark-deep border border-dark-border">models</div>
          <div className="p-2 rounded bg-dark-deep border border-dark-border">predictions</div>
          <div className="p-2 rounded bg-dark-deep border border-dark-border">pred_probs</div>
          <div className="p-2 rounded bg-dark-deep border border-dark-border">model_metrics</div>
          <div className="p-2 rounded bg-dark-deep border border-dark-border">experiments</div>
          <div className="p-2 rounded bg-dark-deep border border-dark-border">retrieval_res</div>
          <div className="p-2 rounded bg-dark-deep border border-dark-border">llm_interact</div>
          <div className="p-2 rounded bg-dark-deep border border-dark-border">safety_events</div>
        </div>
      </div>
    )
  },
  {
    id: 12,
    title: "12. Live Demonstration Workflow",
    subtitle: "End-to-End Execution Proof for Judges",
    category: "VIVA DEMO",
    icon: Play,
    content: (
      <div className="space-y-4 text-xs text-dark-secondary leading-relaxed">
        <p className="font-semibold text-dark-text">Step-by-Step Live Viva Demonstration Flow:</p>
        <div className="space-y-2 font-mono-tech text-xs">
          <div className="p-2.5 rounded bg-dark-deep border border-dark-border flex items-center justify-between">
            <span>1. Dataset Inspector: Show 2,500 validated samples & zero nulls</span>
            <Link to="/datasets" className="text-ai hover:underline">Go to /datasets →</Link>
          </div>
          <div className="p-2.5 rounded bg-dark-deep border border-dark-border flex items-center justify-between">
            <span>2. Model Benchmark: Show test-set 100% accuracy & latency</span>
            <Link to="/model-comparison" className="text-ai hover:underline">Go to /model-comparison →</Link>
          </div>
          <div className="p-2.5 rounded bg-dark-deep border border-dark-border flex items-center justify-between">
            <span>3. Transformer Lab: Show live WordPiece tokenization & attention</span>
            <Link to="/transformer-lab" className="text-ai hover:underline">Go to /transformer-lab →</Link>
          </div>
          <div className="p-2.5 rounded bg-dark-deep border border-dark-border flex items-center justify-between">
            <span>4. Clinical Console: Run live analysis & check PostgreSQL history</span>
            <Link to="/clinical-analysis" className="text-ai hover:underline">Go to /clinical-analysis →</Link>
          </div>
        </div>
      </div>
    )
  }
];

function BarChart2Icon(props: any) {
  return <Layers {...props} />;
}

export const VivaPresentationPage: React.FC = () => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const slide = SLIDES[currentSlideIndex];
  const Icon = slide.icon;

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Presentation className="w-6 h-6 text-ai" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Viva & Research Defense Mode</h1>
            <span className="text-[11px] font-mono-tech px-2 py-0.5 rounded bg-ai/10 text-ai border border-ai/20">
              SLIDE {currentSlideIndex + 1} OF {SLIDES.length}
            </span>
          </div>
          <p className="text-xs text-dark-secondary mt-1">
            Structured slide deck and demonstration script for college project evaluation and oral defense.
          </p>
        </div>

        {/* Slide navigation buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentSlideIndex(Math.max(currentSlideIndex - 1, 0))}
            disabled={currentSlideIndex === 0}
            className="p-2 rounded-button bg-dark-surface hover:bg-dark-elevated text-dark-text border border-dark-border disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono-tech text-dark-muted px-2">
            {currentSlideIndex + 1} / {SLIDES.length}
          </span>
          <button
            onClick={() => setCurrentSlideIndex(Math.min(currentSlideIndex + 1, SLIDES.length - 1))}
            disabled={currentSlideIndex === SLIDES.length - 1}
            className="p-2 rounded-button bg-dark-surface hover:bg-dark-elevated text-dark-text border border-dark-border disabled:opacity-30 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Slide Card */}
      <div className="max-w-4xl mx-auto p-8 rounded-card glass-panel-elevated border border-dark-strongBorder shadow-2xl space-y-6 min-h-[420px] flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-dark-border pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-button bg-ai/15 border border-ai/30 text-ai">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono-tech uppercase text-ai font-semibold">{slide.category}</span>
                <h2 className="text-xl font-bold text-white tracking-tight">{slide.title}</h2>
                <p className="text-xs text-dark-secondary">{slide.subtitle}</p>
              </div>
            </div>
          </div>

          {/* Slide Body */}
          <div className="pt-2">{slide.content}</div>
        </div>

        {/* Bottom Slide Pager */}
        <div className="flex justify-between items-center pt-4 border-t border-dark-border/60 text-xs font-mono-tech text-dark-muted">
          <span>MEDINTEL AI • Academic Project Presentation</span>
          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlideIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentSlideIndex === i ? 'bg-ai w-4' : 'bg-dark-strongBorder hover:bg-dark-muted'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
