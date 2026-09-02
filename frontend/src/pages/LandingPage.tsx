import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Cpu, Brain, BookOpen, Sparkles, ShieldCheck, ChevronRight, Play, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const LandingPage: React.FC = () => {
  const [selectedDemo, setSelectedDemo] = useState(0);

  const demoCases = [
    {
      title: "Acute Chest Pain",
      age: 58,
      sex: "Male",
      symptoms: "Crushing substernal chest pressure, radiation to left arm and jaw, diaphoresis, dyspnea",
      mlPrediction: "Myocardial Infarction",
      mlConfidence: "96.4%",
      transformerPrediction: "Myocardial Infarction",
      transformerConfidence: "98.2%",
      flag: "CRITICAL: Acute Coronary Syndrome",
      ragCitation: "AHA/ACC Clinical Guidelines on AMI"
    },
    {
      title: "Productive Respiratory Infection",
      age: 64,
      sex: "Female",
      symptoms: "High fever, productive cough with rust-colored sputum, pleuritic chest pain, rigors",
      mlPrediction: "Pneumonia",
      mlConfidence: "98.1%",
      transformerPrediction: "Pneumonia",
      transformerConfidence: "99.0%",
      flag: "WARNING: High Fever & Consolidation",
      ragCitation: "IDSA/ATS Guidelines on Community-Acquired Pneumonia"
    },
    {
      title: "Acute Migrating Abdominal Pain",
      age: 23,
      sex: "Male",
      symptoms: "Periumbilical visceral pain migrating to right lower quadrant, McBurney tenderness, nausea, low grade fever",
      mlPrediction: "Acute Appendicitis",
      mlConfidence: "97.5%",
      transformerPrediction: "Acute Appendicitis",
      transformerConfidence: "98.8%",
      flag: "WARNING: Surgical Abdomen Evaluation",
      ragCitation: "WSES Jerusalem Guidelines on Appendicitis"
    }
  ];

  const currentDemo = demoCases[selectedDemo];

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      {/* Hero Section */}
      <section className="relative pt-20 pb-28 overflow-hidden border-b border-dark-border">
        {/* Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-ai/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dark-surface border border-dark-strongBorder text-xs font-mono-tech text-ai"
            >
              <span className="w-2 h-2 rounded-full bg-semantic-success animate-pulse" />
              <span>RESEARCH PROTOTYPE • ML + BIOBERT + RAG + LLM</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight"
            >
              Clinical Intelligence, <br />
              <span className="bg-gradient-to-r from-ai via-ai-soft to-white bg-clip-text text-transparent">
                Made Interpretable.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base sm:text-lg text-dark-secondary leading-relaxed"
            >
              An end-to-end clinical decision-support system uniting classical machine learning baselines,
              medical Transformers (BioBERT), vector-retrieved evidence grounding, and safety-verified LLM synthesis.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-4 pt-2"
            >
              <Link
                to="/clinical-analysis"
                className="px-6 py-3.5 rounded-button text-sm font-semibold bg-ai hover:bg-ai-hover text-white shadow-lg shadow-ai/30 hover:scale-[1.02] transition-all flex items-center gap-2"
              >
                <Activity className="w-4 h-4" />
                <span>Run Clinical Analysis</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
              <Link
                to="/transformer-lab"
                className="px-6 py-3.5 rounded-button text-sm font-semibold bg-dark-surface hover:bg-dark-elevated text-dark-text border border-dark-strongBorder transition-all flex items-center gap-2"
              >
                <Cpu className="w-4 h-4 text-ai" />
                <span>Transformer Lab</span>
              </Link>
            </motion.div>

            {/* Live Telemetry Status Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left"
            >
              <div className="p-3 rounded-button bg-dark-surface/80 border border-dark-border">
                <span className="text-[10px] font-mono-tech text-dark-muted block">CLASSICAL ML</span>
                <span className="text-xs font-semibold text-semantic-success flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-semantic-success" /> ONLINE (LR, RF, XGB)
                </span>
              </div>
              <div className="p-3 rounded-button bg-dark-surface/80 border border-dark-border">
                <span className="text-[10px] font-mono-tech text-dark-muted block">MEDICAL TRANSFORMER</span>
                <span className="text-xs font-semibold text-semantic-info flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-semantic-info" /> BioBERT-v1.1 READY
                </span>
              </div>
              <div className="p-3 rounded-button bg-dark-surface/80 border border-dark-border">
                <span className="text-[10px] font-mono-tech text-dark-muted block">VECTOR RAG</span>
                <span className="text-xs font-semibold text-ai flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-ai" /> EVIDENCE GROUNDED
                </span>
              </div>
              <div className="p-3 rounded-button bg-dark-surface/80 border border-dark-border">
                <span className="text-[10px] font-mono-tech text-dark-muted block">DATABASE</span>
                <span className="text-xs font-semibold text-dark-text flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-semantic-success" /> POSTGRESQL / SQLITE
                </span>
              </div>
            </motion.div>
          </div>

          {/* Interactive Hero Console Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-14 max-w-5xl mx-auto rounded-hero glass-panel-elevated p-6 border border-dark-strongBorder shadow-2xl relative"
          >
            <div className="flex items-center justify-between border-b border-dark-border pb-4 mb-5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-semantic-critical" />
                <span className="w-3 h-3 rounded-full bg-semantic-warning" />
                <span className="w-3 h-3 rounded-full bg-semantic-success" />
                <span className="ml-3 text-xs font-mono-tech text-dark-secondary">
                  MEDINTEL RESEARCH CONSOLE • LIVE DEMONSTRATION
                </span>
              </div>
              {/* Demo selector pills */}
              <div className="flex items-center gap-1 bg-dark-deep p-1 rounded-full border border-dark-border">
                {demoCases.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedDemo(i)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      selectedDemo === i ? 'bg-ai text-white shadow-sm' : 'text-dark-muted hover:text-dark-text'
                    }`}
                  >
                    {d.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Left Input Overview */}
              <div className="md:col-span-5 space-y-3 bg-dark-surface p-4 rounded-card border border-dark-border">
                <span className="text-[11px] font-mono-tech text-ai uppercase font-semibold">1. Clinical Presentation</span>
                <div className="text-xs space-y-2">
                  <p className="text-dark-secondary">
                    <strong className="text-dark-text">Patient:</strong> {currentDemo.age} yo {currentDemo.sex}
                  </p>
                  <p className="text-dark-secondary leading-relaxed bg-dark-deep p-2.5 rounded border border-dark-border">
                    "{currentDemo.symptoms}"
                  </p>
                </div>
                <div className="p-2.5 rounded bg-semantic-critical/10 border border-semantic-critical/30 text-semantic-critical text-[11px] font-mono-tech">
                  ⚠ {currentDemo.flag}
                </div>
              </div>

              {/* Middle Model Predictions */}
              <div className="md:col-span-4 space-y-3 bg-dark-surface p-4 rounded-card border border-dark-border">
                <span className="text-[11px] font-mono-tech text-ai uppercase font-semibold">2. Dual Intelligence</span>
                <div className="space-y-3">
                  <div className="p-2.5 rounded bg-dark-elevated border border-dark-strongBorder">
                    <div className="flex justify-between text-xs font-mono-tech">
                      <span className="text-dark-muted">CLASSICAL ML</span>
                      <span className="text-semantic-success">{currentDemo.mlConfidence}</span>
                    </div>
                    <p className="text-xs font-bold text-dark-text mt-1">{currentDemo.mlPrediction}</p>
                  </div>
                  <div className="p-2.5 rounded bg-dark-elevated border border-dark-strongBorder">
                    <div className="flex justify-between text-xs font-mono-tech">
                      <span className="text-ai">BIOBERT TRANSFORMER</span>
                      <span className="text-ai">{currentDemo.transformerConfidence}</span>
                    </div>
                    <p className="text-xs font-bold text-dark-text mt-1">{currentDemo.transformerPrediction}</p>
                  </div>
                </div>
              </div>

              {/* Right RAG & Synthesis */}
              <div className="md:col-span-3 space-y-3 bg-dark-surface p-4 rounded-card border border-dark-border">
                <span className="text-[11px] font-mono-tech text-ai uppercase font-semibold">3. RAG Grounding</span>
                <div className="p-2.5 rounded bg-dark-elevated border border-dark-strongBorder text-[11px] space-y-1">
                  <span className="text-dark-muted font-mono-tech block">TOP EVIDENCE CHUNK</span>
                  <p className="text-dark-text font-medium">{currentDemo.ragCitation}</p>
                  <span className="text-[10px] text-semantic-info font-mono-tech">Similarity Score: 0.942</span>
                </div>
                <Link
                  to="/clinical-analysis"
                  className="w-full py-2 rounded-button bg-ai/20 hover:bg-ai/30 text-ai text-xs font-semibold flex items-center justify-center gap-1 border border-ai/40 transition-all"
                >
                  Analyze Case <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3 Pillar Architecture Section */}
      <section className="py-20 border-b border-dark-border bg-dark-deep/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-mono-tech text-ai uppercase font-semibold">THE AI PIPELINE IS THE PRODUCT</span>
            <h2 className="text-3xl font-bold text-white">Three Layers of Medical Machine Intelligence</h2>
            <p className="text-sm text-dark-secondary">
              We never hide models behind a generic chatbot. Every layer has distinct scientific responsibilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="p-6 rounded-card bg-dark-surface border border-dark-border hover:border-ai/40 transition-all space-y-4">
              <div className="w-10 h-10 rounded-button bg-semantic-success/15 border border-semantic-success/30 flex items-center justify-center text-semantic-success">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-dark-text">1. Classical ML Baseline</h3>
              <p className="text-xs text-dark-secondary leading-relaxed">
                Logistic Regression, Random Forest, and XGBoost trained on TF-IDF clinical vocabulary matrices.
                Establishes the transparent benchmark on untouched test data.
              </p>
              <ul className="text-xs font-mono-tech text-dark-muted space-y-1">
                <li>• High-speed inference (&lt;1ms)</li>
                <li>• Transparent feature weights</li>
                <li>• No data leakage protocol</li>
              </ul>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-card bg-dark-surface border border-dark-border hover:border-ai/40 transition-all space-y-4">
              <div className="w-10 h-10 rounded-button bg-ai/15 border border-ai/30 flex items-center justify-center text-ai">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-dark-text">2. BioBERT Transformer</h3>
              <p className="text-xs text-dark-secondary leading-relaxed">
                Biomedical BERT Transformer with WordPiece tokenization and custom classification head.
                Captures nuanced contextual semantic relationships across clinical narratives.
              </p>
              <ul className="text-xs font-mono-tech text-dark-muted space-y-1">
                <li>• Real PyTorch model & tokenizer</li>
                <li>• Multi-head self-attention heatmap</li>
                <li>• [CLS] pooler representation</li>
              </ul>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-card bg-dark-surface border border-dark-border hover:border-ai/40 transition-all space-y-4">
              <div className="w-10 h-10 rounded-button bg-semantic-info/15 border border-semantic-info/30 flex items-center justify-center text-semantic-info">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-dark-text">3. Vector RAG & Grounded LLM</h3>
              <p className="text-xs text-dark-secondary leading-relaxed">
                Normalized cosine similarity vector retrieval grounds the output in peer-reviewed clinical guidelines.
                The LLM synthesizes reasoning without inventing diagnoses.
              </p>
              <ul className="text-xs font-mono-tech text-dark-muted space-y-1">
                <li>• Verified medical guidelines</li>
                <li>• Rule-based red-flag triage</li>
                <li>• PostgreSQL audit logging</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Explore the Clinical Intelligence Console
          </h2>
          <p className="text-sm text-dark-secondary max-w-xl mx-auto">
            Test custom clinical narratives, inspect attention heatmaps, compare model confusion matrices, and review PostgreSQL historical cases.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Link
              to="/clinical-analysis"
              className="px-6 py-3 rounded-button bg-ai hover:bg-ai-hover text-white text-sm font-semibold shadow-lg shadow-ai/30 transition-all flex items-center gap-2"
            >
              <span>Launch Clinical Console</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/presentation"
              className="px-6 py-3 rounded-button bg-dark-surface hover:bg-dark-elevated text-dark-text border border-dark-strongBorder text-sm font-semibold transition-all"
            >
              Presentation Mode
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
