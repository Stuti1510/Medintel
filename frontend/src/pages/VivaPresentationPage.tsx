import React, { useState, useEffect } from 'react';
import {
  Presentation, ChevronLeft, ChevronRight, Activity, Cpu,
  Brain, BookOpen, Sparkles, ShieldCheck, Database, Layers, CheckCircle2,
  ArrowRight, Award, HelpCircle, Check, X, RefreshCw, Send, Loader2,
  AlertTriangle, BookMarked, UserCheck, BarChart3, FileCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  startVivaSession, getVivaQuestion, evaluateVivaAnswer, endVivaSession
} from '../services/api';
import { VivaQuestion, VivaEvaluationResult } from '../types/clinical';
import { EvidenceCard } from '../components/EvidenceCard';

const CATEGORIES = [
  "Data Provenance & Leakage Prevention",
  "Tabular Preprocessing & Normalization",
  "Classical ML Architecture & Training",
  "Loss Functions & Calibration",
  "Transformer Architecture & BioBERT Attention",
  "Embeddings & Representation Space",
  "RAG Retrieval & Vector Store Grounding",
  "Grounded LLM Synthesis & Safety Guardrails",
  "Explainability & Attribution",
  "Multi-Symptom Differential Diagnosis",
  "Failure Modes & Limitation Awareness",
  "Research Roadmap & Clinical Translation"
];

export const VivaPresentationPage: React.FC = () => {
  const [mode, setMode] = useState<"interactive" | "slides">("interactive");
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);

  // Interactive Viva State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORIES[0]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<"Easy" | "Intermediate" | "Hard">("Intermediate");
  const [currentQuestion, setCurrentQuestion] = useState<VivaQuestion | null>(null);
  const [candidateAnswer, setCandidateAnswer] = useState<string>("");
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<VivaEvaluationResult | null>(null);
  const [defenseHistory, setDefenseHistory] = useState<Array<{ question: VivaQuestion; eval: VivaEvaluationResult }>>([]);
  const [sessionSummary, setSessionSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState<boolean>(false);

  // Initialize viva session on load
  const initSession = async () => {
    setError(null);
    setLoadingQuestion(true);
    try {
      const session = await startVivaSession();
      setSessionId(session.session_id);
      setCurrentQuestion(session.initial_question);
      setSelectedCategory(session.initial_question.category);
      setCandidateAnswer("");
      setEvaluationResult(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to initialize Viva session");
    } finally {
      setLoadingQuestion(false);
    }
  };

  useEffect(() => {
    initSession();
  }, []);

  const handleFetchNextQuestion = async (cat?: string, diff?: string) => {
    if (!sessionId) return;
    setLoadingQuestion(true);
    setError(null);
    setEvaluationResult(null);
    setCandidateAnswer("");
    try {
      const q = await getVivaQuestion(sessionId, cat || selectedCategory, diff || selectedDifficulty);
      setCurrentQuestion(q);
    } catch (err: any) {
      setError(err.message || "Failed to fetch question");
    } finally {
      setLoadingQuestion(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!sessionId || !currentQuestion || !candidateAnswer.trim()) return;
    setIsEvaluating(true);
    setError(null);
    try {
      const res = await evaluateVivaAnswer(sessionId, currentQuestion.id, candidateAnswer);
      setEvaluationResult(res);
      setDefenseHistory(prev => [...prev, { question: currentQuestion, eval: res }]);
    } catch (err: any) {
      setError(err.message || "Evaluation failed");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleEndSession = async () => {
    if (!sessionId) return;
    try {
      const summary = await endVivaSession(sessionId);
      setSessionSummary(summary);
    } catch (err: any) {
      console.error(err);
    }
  };

  // Static Slides for Presentation Mode
  const slides = [
    {
      id: 1,
      title: "Problem Statement & Clinical Motivation",
      subtitle: "Why Layered Diagnostic AI Decision-Support Matters",
      category: "MOTIVATION",
      icon: Activity,
      content: (
        <div className="space-y-6 text-sm text-[#bcbac9] leading-relaxed">
          <p className="text-base text-white">
            Cardiovascular diseases and acute clinical complications require rapid, interpretable triage under high uncertainty. Clinicians must synthesize complex biometric parameters without relying on opaque, ungrounded black-box models.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-5 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] space-y-2">
              <span className="text-xs font-mono uppercase text-[#c9b4fa] block">The Limitation of Standalone LLMs</span>
              <p className="text-xs text-[#bcbac9] leading-relaxed">Uncalibrated probability vectors, lack of empirical statistical baselines, zero test-set grounding, and risk of severe hallucinations.</p>
            </div>
            <div className="p-5 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] space-y-2">
              <span className="text-xs font-mono uppercase text-[#a3cfcf] block">The MEDINTEL 4-Dataset Architecture</span>
              <p className="text-xs text-[#bcbac9] leading-relaxed">A 9-stage research workflow: Cleaned 4-Dataset Pipeline + Balanced Training + Classical ML Baselines + BioBERT Attention + Vector RAG (43 Guidelines) + Relational Persistence.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "4-Dataset Clinical Benchmark Architecture",
      subtitle: "316,185 Verified Patient Records Across 821 Disease Entities",
      category: "DATASET",
      icon: Database,
      content: (
        <div className="space-y-6 text-sm text-[#bcbac9] leading-relaxed">
          <p className="text-base text-white">
            We integrated 4 authentic clinical datasets into a multi-specialty clinical intelligence framework with zero synthetic fabrication:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-4 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] text-center space-y-1">
              <span className="text-[#bcbac9] text-[10px] block">cardio_train</span>
              <span className="text-base font-semibold text-white">68,638 Clean</span>
              <span className="text-[10px] text-[#5a5772] block">2 Binary Classes</span>
            </div>
            <div className="p-4 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] text-center space-y-1">
              <span className="text-[#bcbac9] text-[10px] block">heart_disease</span>
              <span className="text-base font-semibold text-[#c9b4fa]">302 Patients</span>
              <span className="text-[10px] text-[#5a5772] block">2 Diagnostic Classes</span>
            </div>
            <div className="p-4 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] text-center space-y-1">
              <span className="text-[#bcbac9] text-[10px] block">disease_profile</span>
              <span className="text-base font-semibold text-[#a3cfcf]">300 Profiles</span>
              <span className="text-[10px] text-[#5a5772] block">116 Diagnoses</span>
            </div>
            <div className="p-4 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] text-center space-y-1">
              <span className="text-[#bcbac9] text-[10px] block">symptoms_augmented</span>
              <span className="text-base font-semibold text-emerald-400">246,945 Rows</span>
              <span className="text-[10px] text-[#5a5772] block">773 Multi-Class</span>
            </div>
          </div>
          <p className="font-mono text-xs text-[#bcbac9] bg-[#0e0c1f] p-3 rounded-lg border border-[#3f3a52]">
            Data Quality Protocol: Removed 1,362 physiological corruptions (negative BP, extreme outliers) and 723 duplicated encounters. Excluded patient IDs to prevent data leakage.
          </p>
        </div>
      )
    },
    {
      id: 3,
      title: "Leakage-Safe Splitting & Training-Only Balancing",
      subtitle: "48,552 Balanced Training Records vs 10,296 Untouched Test Records",
      category: "METHODOLOGY",
      icon: Layers,
      content: (
        <div className="space-y-6 text-sm text-[#bcbac9] leading-relaxed">
          <p className="text-base text-white">
            To uphold clinical research integrity, all feature scalers, categorical encoders, and class balancing operations were fitted strictly on the training partition.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] space-y-1">
              <span className="text-white block font-medium">Training Split (70%)</span>
              <div className="text-emerald-400 text-lg font-semibold">48,552 Balanced</div>
              <p className="text-[11px] text-[#bcbac9]">50% Class 0 / 50% Class 1 parity via stratified oversampling.</p>
            </div>
            <div className="p-4 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] space-y-1">
              <span className="text-white block font-medium">Validation Split (15%)</span>
              <div className="text-[#a3cfcf] text-lg font-semibold">10,296 Records</div>
              <p className="text-[11px] text-[#bcbac9]">Untouched empirical distribution for hyperparameter tuning.</p>
            </div>
            <div className="p-4 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] space-y-1">
              <span className="text-white block font-medium">Held-Out Test Split (15%)</span>
              <div className="text-[#c9b4fa] text-lg font-semibold">10,296 Records</div>
              <p className="text-[11px] text-[#bcbac9]">100% untouched real data for final scientific evaluation.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "Classical Machine Learning Benchmarks",
      subtitle: "Logistic Regression (73.15%), Random Forest (72.96%), XGBoost (72.94%)",
      category: "BENCHMARKS",
      icon: Cpu,
      content: (
        <div className="space-y-6 text-sm text-[#bcbac9] leading-relaxed">
          <p className="text-base text-white">
            Empirical evaluation across 10,296 untouched test instances confirms consistent convergence across linear and tree-based architectures:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] space-y-1">
              <span className="text-white block font-medium">Logistic Regression (L2)</span>
              <div className="text-emerald-400 text-xl font-semibold">73.15% Acc</div>
              <div className="text-[11px] text-[#bcbac9]">Macro F1: 0.7308 • ROC-AUC: 0.7982</div>
            </div>
            <div className="p-4 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] space-y-1">
              <span className="text-white block font-medium">Random Forest (150 Trees)</span>
              <div className="text-[#c9b4fa] text-xl font-semibold">72.96% Acc</div>
              <div className="text-[11px] text-[#bcbac9]">Macro F1: 0.7289 • ROC-AUC: 0.7950</div>
            </div>
            <div className="p-4 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] space-y-1">
              <span className="text-white block font-medium">XGBoost (Depth 6)</span>
              <div className="text-[#a3cfcf] text-xl font-semibold">72.94% Acc</div>
              <div className="text-[11px] text-[#bcbac9]">Macro F1: 0.7286 • ROC-AUC: 0.7946</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: "BioBERT Contextual Attention & Transformers",
      subtitle: "WordPiece Tokenization & 4-Layer Multi-Head Self-Attention",
      category: "TRANSFORMER",
      icon: Brain,
      content: (
        <div className="space-y-6 text-sm text-[#bcbac9] leading-relaxed">
          <p className="text-base text-white">
            Medical BioBERT processes unstructured clinical symptoms, patient histories, and narrative encounter notes:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] text-center">
              <span className="text-[#5a5772] text-[10px] block">Vocabulary</span>
              <span className="text-white font-medium">30,522 Tokens</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] text-center">
              <span className="text-[#5a5772] text-[10px] block">Hidden Dim</span>
              <span className="text-[#c9b4fa] font-medium">256-Dimensional</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] text-center">
              <span className="text-[#5a5772] text-[10px] block">Attention Heads</span>
              <span className="text-[#a3cfcf] font-medium">4 Heads / Layer</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] text-center">
              <span className="text-[#5a5772] text-[10px] block">Total Parameters</span>
              <span className="text-emerald-400 font-medium">10,120,452</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: "Vector RAG Clinical Evidence Grounding",
      subtitle: "Normalized Cosine Retrieval Across 43 Peer-Reviewed Guidelines",
      category: "RETRIEVAL",
      icon: BookOpen,
      content: (
        <div className="space-y-6 text-sm text-[#bcbac9] leading-relaxed">
          <p className="text-base text-white">
            To prevent generative fabrication, every diagnostic inference is referenced against vector-indexed medical literature:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-4 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] space-y-1">
              <span className="text-white font-semibold block">ACC / AHA Guidelines</span>
              <p className="text-[11px] text-[#bcbac9]">Cardiovascular risk thresholds, lipid management & hypertensive crisis triage.</p>
            </div>
            <div className="p-4 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] space-y-1">
              <span className="text-[#c9b4fa] font-semibold block">GINA Asthma Strategy</span>
              <p className="text-[11px] text-[#bcbac9]">Bronchospasm severity grading, nocturnal symptom evaluation & inhaled corticosteroids.</p>
            </div>
            <div className="p-4 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] space-y-1">
              <span className="text-[#a3cfcf] font-semibold block">IDSA / ATS Sepsis Protocol</span>
              <p className="text-[11px] text-[#bcbac9]">qSOFA vitals assessment, serum lactate thresholds & empiric antibiotic timing.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 7,
      title: "Grounded LLM Synthesis & Deterministic Safety",
      subtitle: "Constrained Clinical Guidance with Emergency Red-Flag Triage",
      category: "SYNTHESIS",
      icon: Sparkles,
      content: (
        <div className="space-y-6 text-sm text-[#bcbac9] leading-relaxed">
          <p className="text-base text-white">
            The synthesis tier is strictly bounded: it does not generate free-form diagnoses, but translates model probabilities and retrieved guideline excerpts into structured clinician summaries.
          </p>
          <div className="p-4 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] font-mono text-xs space-y-2">
            <div className="text-emerald-400 font-semibold">Deterministic Triage Guardrails:</div>
            <p className="text-[#bcbac9]">
              • Systolic BP &gt; 180 or Diastolic &gt; 120 triggers mandatory Stage 2 Hypertensive Emergency Flag.<br />
              • SpO2 &lt; 90% triggers Immediate Hypoxemia Warning.<br />
              • Mandatory decision-support disclaimer attached to every clinical synthesis output.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 8,
      title: "Results, Limitations & Future Research",
      subtitle: "Academic Conclusions & Engineering Roadmap",
      category: "CONCLUSIONS",
      icon: ShieldCheck,
      content: (
        <div className="space-y-6 text-sm text-[#bcbac9] leading-relaxed">
          <p className="text-base text-white">
            MEDINTEL AI demonstrates that multimodal layered decision-support surpasses disconnected models in transparency, safety, and clinical interpretability.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] space-y-1">
              <span className="text-emerald-400 font-semibold block">Validated Milestones</span>
              <p className="text-[#bcbac9] text-[11px] leading-relaxed">
                • 4 datasets harmonized without target confusion.<br />
                • Zero test leakage (N=10,296 held-out test split).<br />
                • 73.15% test accuracy with ROC-AUC 0.7982.<br />
                • 43 guideline vector embeddings indexed.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] space-y-1">
              <span className="text-[#c9b4fa] font-semibold block">Future Research Directions</span>
              <p className="text-[#bcbac9] text-[11px] leading-relaxed">
                • Integration of longitudinal electronic health records.<br />
                • DICOM medical imaging multimodal encoders.<br />
                • Real-time FHIR clinical data interoperability.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentSlide = slides[currentSlideIndex] || slides[0];

  return (
    <div className="min-h-screen bg-[#0e0c1f] text-white flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <div className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#3f3a52] pb-4 gap-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xs font-mono text-[#bcbac9] hover:text-white flex items-center gap-1">
            <span>← Exit to Platform</span>
          </Link>
          <span className="text-[#5a5772]">|</span>
          <span className="text-xs font-mono uppercase tracking-wider text-[#c9b4fa]">
            MEDINTEL AI • Viva Defense Examination
          </span>
        </div>

        {/* Mode Toggle Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode("interactive")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              mode === "interactive"
                ? "bg-[#c9b4fa] text-[#1b1938]"
                : "bg-[#1b1938] text-[#bcbac9] hover:text-white border border-[#3f3a52]"
            }`}
          >
            Interactive Defense Mode
          </button>
          <button
            onClick={() => setMode("slides")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              mode === "slides"
                ? "bg-[#c9b4fa] text-[#1b1938]"
                : "bg-[#1b1938] text-[#bcbac9] hover:text-white border border-[#3f3a52]"
            }`}
          >
            Slide Deck Mode
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODE 1: INTERACTIVE VIVA DEFENSE SIMULATOR                    */}
      {/* ------------------------------------------------------------- */}
      {mode === "interactive" ? (
        <div className="max-w-6xl mx-auto w-full py-8 flex-1 flex flex-col space-y-8">
          {/* Controls Bar */}
          <div className="p-4 rounded-xl bg-[#1b1938] border border-[#3f3a52] flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#bcbac9]">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    handleFetchNextQuestion(e.target.value, selectedDifficulty);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-[#0e0c1f] border border-[#3f3a52] text-xs font-mono text-white focus:outline-none focus:border-[#c9b4fa]"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#bcbac9]">Difficulty:</span>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => {
                    const diff = e.target.value as "Easy" | "Intermediate" | "Hard";
                    setSelectedDifficulty(diff);
                    handleFetchNextQuestion(selectedCategory, diff);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-[#0e0c1f] border border-[#3f3a52] text-xs font-mono text-white focus:outline-none focus:border-[#c9b4fa]"
                >
                  <option value="Easy">Easy</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Hard">Hard (Senior Defense)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleFetchNextQuestion()}
                disabled={loadingQuestion}
                className="px-3 py-1.5 rounded-lg bg-[#0e0c1f] hover:bg-[#232047] border border-[#3f3a52] text-xs font-mono text-[#bcbac9] hover:text-white flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingQuestion ? 'animate-spin' : ''}`} />
                <span>Next Question</span>
              </button>

              <button
                onClick={handleEndSession}
                className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-xs font-mono text-rose-300 transition-all"
              >
                Conclude Defense
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Question & Answer Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Examiner Question & Candidate Input (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {currentQuestion && (
                <div className="p-6 rounded-2xl bg-[#1b1938] border border-[#3f3a52] space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-[#3f3a52] pb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#c9b4fa]">
                      Question #{currentQuestion.id} • {currentQuestion.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                      currentQuestion.difficulty === "Hard"
                        ? "bg-rose-900/40 text-rose-300 border border-rose-800"
                        : currentQuestion.difficulty === "Intermediate"
                        ? "bg-amber-900/40 text-amber-300 border border-amber-800"
                        : "bg-emerald-900/40 text-emerald-300 border border-emerald-800"
                    }`}>
                      {currentQuestion.difficulty}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-medium text-white leading-snug">
                    {currentQuestion.question}
                  </h2>

                  {/* Expected Concepts Chips */}
                  <div className="space-y-1.5 pt-2 border-t border-[#3f3a52]/60">
                    <span className="text-[10px] font-mono text-[#5a5772] uppercase block">
                      Target Technical Concepts Looked for by Examiner:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {currentQuestion.expected_concepts.map((concept, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-[#0e0c1f] border border-[#3f3a52] text-[11px] font-mono text-[#bcbac9]"
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Candidate Answer Editor */}
              <div className="p-6 rounded-2xl bg-[#1b1938] border border-[#3f3a52] space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-[#3f3a52] pb-3">
                  <h3 className="text-xs font-mono uppercase text-[#bcbac9] tracking-wider">
                    Candidate Viva Defense Response
                  </h3>
                  <span className="text-xs font-mono text-[#5a5772]">
                    {candidateAnswer.length} characters
                  </span>
                </div>

                <textarea
                  rows={6}
                  value={candidateAnswer}
                  onChange={(e) => setCandidateAnswer(e.target.value)}
                  placeholder="Formulate your detailed technical defense citing MEDINTEL architectural choices, dataset splitting protocols, mathematical formulas, or clinical guidelines..."
                  className="w-full p-4 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] text-xs font-mono text-white placeholder-[#5a5772] focus:outline-none focus:border-[#c9b4fa] leading-relaxed resize-none"
                />

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentQuestion?.expected_concepts) {
                        setCandidateAnswer(`In MEDINTEL AI, we address this through ${currentQuestion.expected_concepts.slice(0, 3).join(', ')}, ensuring that data leakage is strictly eliminated and probabilities are calibrated using cross-entropy and temperature scaling.`);
                      }
                    }}
                    className="text-xs font-mono text-[#a3cfcf] hover:underline"
                  >
                    Draft Technical Starter
                  </button>

                  <button
                    onClick={handleSubmitAnswer}
                    disabled={isEvaluating || !candidateAnswer.trim()}
                    className="px-6 py-2.5 rounded-lg bg-[#c9b4fa] hover:bg-[#d8c7fd] text-[#1b1938] text-xs font-mono font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isEvaluating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#1b1938]" />
                        <span>Evaluating Viva Answer...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit for Examiner Rubric</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Rubric Evaluation & Examiner Feedback (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {evaluationResult ? (
                <div className="p-6 rounded-2xl bg-[#1b1938] border border-[#3f3a52] space-y-5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-[#3f3a52] pb-4">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#bcbac9] tracking-wider block">
                        Viva Defense Grade
                      </span>
                      <div className="text-3xl font-mono font-bold text-white mt-0.5">
                        {evaluationResult.grade} <span className="text-lg text-[#bcbac9]">({evaluationResult.score}/100)</span>
                      </div>
                    </div>

                    <div className="w-12 h-12 rounded-full bg-[#0e0c1f] border border-[#3f3a52] flex items-center justify-center text-[#c9b4fa]">
                      <Award className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Multi-Criteria Rubric Breakdown */}
                  <div className="space-y-2.5 font-mono text-xs">
                    <span className="text-[10px] uppercase text-[#5a5772] block font-semibold">
                      Evaluation Criteria Breakdown
                    </span>
                    {Object.entries(evaluationResult.criteria).map(([criterion, val]) => (
                      <div key={criterion} className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[#bcbac9] capitalize">{criterion.replace('_', ' ')}</span>
                          <span className="text-white font-semibold">{val}/100</span>
                        </div>
                        <div className="w-full bg-[#0e0c1f] rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              val >= 75 ? "bg-emerald-400" : val >= 50 ? "bg-amber-400" : "bg-rose-400"
                            }`}
                            style={{ width: `${val}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Concept Alignment */}
                  <div className="space-y-2 border-t border-[#3f3a52]/60 pt-3">
                    <span className="text-[10px] font-mono uppercase text-[#5a5772] block">
                      Concept Alignment:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {evaluationResult.matched_concepts.map((concept, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-800 text-[10px] font-mono text-emerald-300 flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>{concept}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Examiner Critique */}
                  <div className="p-4 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] text-xs font-mono text-[#bcbac9] leading-relaxed space-y-2">
                    <span className="text-white font-semibold block">Examiner Feedback:</span>
                    <p>{evaluationResult.feedback}</p>
                  </div>

                  {/* Grounding Literature Evidence */}
                  {evaluationResult.grounding_evidence && evaluationResult.grounding_evidence.length > 0 && (
                    <div className="space-y-2 border-t border-[#3f3a52]/60 pt-3">
                      <span className="text-[10px] font-mono uppercase text-[#c9b4fa] block">
                        Grounding Evidence Literature:
                      </span>
                      <div className="space-y-2">
                        {evaluationResult.grounding_evidence.slice(0, 2).map((ev, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-[#0e0c1f] border border-[#3f3a52] text-[11px] font-mono text-[#bcbac9]">
                            <span className="text-white font-semibold block">{ev.title}</span>
                            <p className="text-[10px] text-[#5a5772] mt-0.5">{ev.snippet}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 rounded-2xl bg-[#1b1938] border border-[#3f3a52] text-center space-y-3">
                  <BookMarked className="w-8 h-8 text-[#5a5772] mx-auto" />
                  <h3 className="text-sm font-medium text-white">Awaiting Defense Submission</h3>
                  <p className="text-xs text-[#bcbac9] leading-relaxed max-w-xs mx-auto font-mono">
                    Formulate your answer on the left and click <strong>"Submit for Examiner Rubric"</strong> to receive real-time grading across 4 criteria.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* MODE 2: PRESENTATION SLIDE DECK                              */
        /* ------------------------------------------------------------- */
        <div className="max-w-4xl mx-auto w-full py-10 flex-1 flex flex-col justify-center space-y-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b1938] border border-[#3f3a52] text-xs font-mono text-[#c9b4fa]">
              <span>{currentSlide.category}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-medium tracking-tight text-white leading-tight">
              {currentSlide.title}
            </h1>
            <p className="text-base sm:text-lg text-[#bcbac9] font-normal">
              {currentSlide.subtitle}
            </p>
          </div>

          {/* Slide Body Card */}
          <div className="p-8 rounded-2xl bg-[#1b1938] border border-[#3f3a52] shadow-2xl">
            {currentSlide.content}
          </div>

          {/* Bottom Slide Controller */}
          <div className="flex items-center justify-between border-t border-[#3f3a52] pt-4">
            <div className="flex items-center gap-2">
              <button
                disabled={currentSlideIndex === 0}
                onClick={() => setCurrentSlideIndex(prev => Math.max(prev - 1, 0))}
                className="px-4 py-2 rounded-lg bg-[#1b1938] border border-[#3f3a52] text-xs font-mono text-white hover:bg-[#232047] disabled:opacity-30 transition-all flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <button
                disabled={currentSlideIndex === slides.length - 1}
                onClick={() => setCurrentSlideIndex(prev => Math.min(prev + 1, slides.length - 1))}
                className="px-4 py-2 rounded-lg bg-[#c9b4fa] text-[#1b1938] text-xs font-mono font-semibold hover:bg-[#d8c7fd] disabled:opacity-30 transition-all flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4 text-[#1b1938]" />
              </button>
            </div>

            {/* Slide Dots */}
            <div className="flex items-center gap-1.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    currentSlideIndex === idx
                      ? 'bg-[#c9b4fa] w-6'
                      : 'bg-[#3f3a52] hover:bg-[#5a5772]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VivaPresentationPage;
