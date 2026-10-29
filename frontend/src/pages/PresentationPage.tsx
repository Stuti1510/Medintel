import React, { useState, useEffect } from 'react';
import {
  Presentation, ChevronLeft, ChevronRight, Activity, Cpu,
  Brain, BookOpen, Sparkles, ShieldCheck, Database, Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const PresentationPage: React.FC = () => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);

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
            Clinical conditions and emergent patient presentations require rapid, interpretable triage under high uncertainty. Healthcare providers must evaluate unstructured symptom narratives alongside biometric indicators without relying on opaque, ungrounded black-box models.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-5 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] space-y-2">
              <span className="text-xs font-mono uppercase text-[#c9b4fa] block">The Limitation of Standalone LLMs</span>
              <p className="text-xs text-[#bcbac9] leading-relaxed">Uncalibrated probability vectors, lack of empirical statistical baselines, zero test-set grounding, and risk of severe hallucinations.</p>
            </div>
            <div className="p-5 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] space-y-2">
              <span className="text-xs font-mono uppercase text-[#a3cfcf] block">The MEDINTEL Symptom Intelligence Architecture</span>
              <p className="text-xs text-[#bcbac9] leading-relaxed">A 9-stage research workflow: Validated Symptom2Disease NLP Pipeline + Group-Stratified Training + Classical ML Baselines (SVM/LogReg 96%) + BioBERT Attention + Vector RAG (43 Guidelines) + Relational Persistence.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "Symptom-to-Disease Clinical Benchmark Architecture",
      subtitle: "1,200 Verified Patient Narrative Records Across 24 Diagnostic Classes",
      category: "DATASET",
      icon: Database,
      content: (
        <div className="space-y-6 text-sm text-[#bcbac9] leading-relaxed">
          <p className="text-base text-white">
            We integrated the clinical Symptom2Disease benchmark into a natural-language symptom intelligence framework with zero synthetic fabrication:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-4 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] text-center space-y-1">
              <span className="text-[#bcbac9] text-[10px] block">Total Dataset</span>
              <span className="text-base font-semibold text-white">1,200 Records</span>
              <span className="text-[10px] text-[#5a5772] block">Natural Language</span>
            </div>
            <div className="p-4 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] text-center space-y-1">
              <span className="text-[#bcbac9] text-[10px] block">Disease Categories</span>
              <span className="text-base font-semibold text-[#c9b4fa]">24 Classes</span>
              <span className="text-[10px] text-[#5a5772] block">50 Cases / Class</span>
            </div>
            <div className="p-4 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] text-center space-y-1">
              <span className="text-[#bcbac9] text-[10px] block">Unique Symptom Texts</span>
              <span className="text-base font-semibold text-[#a3cfcf]">1,153 Unique</span>
              <span className="text-[10px] text-[#5a5772] block">47 Grouped Dupes</span>
            </div>
            <div className="p-4 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] text-center space-y-1">
              <span className="text-[#bcbac9] text-[10px] block">Label Consistency</span>
              <span className="text-base font-semibold text-emerald-400">100% Agreement</span>
              <span className="text-[10px] text-[#5a5772] block">0 Label Conflicts</span>
            </div>
          </div>
          <p className="font-mono text-xs text-[#bcbac9] bg-[#0e0c1f] p-3 rounded-lg border border-[#3f3a52]">
            Data Quality Protocol: Validated text and label integrity. Audited all 47 duplicate symptom descriptions across 43 distinct groups; confirmed 100% label concordance. Group-stratified to prevent train-test contamination.
          </p>
        </div>
      )
    },
    {
      id: 3,
      title: "Leakage-Safe Splitting & Group Partitioning",
      subtitle: "840 Training Records vs 180 Validation and 180 Untouched Test Records",
      category: "METHODOLOGY",
      icon: Layers,
      content: (
        <div className="space-y-6 text-sm text-[#bcbac9] leading-relaxed">
          <p className="text-base text-white">
            To uphold clinical research integrity, all feature extraction (sublinear TF-IDF n-grams) and label encoders were fitted strictly on the training partition. Group-aware splitting prevents identical symptom narratives from bridging splits.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] space-y-1">
              <span className="text-white block font-medium">Training Split (70%)</span>
              <div className="text-emerald-400 text-lg font-semibold">840 Records</div>
              <p className="text-[11px] text-[#bcbac9]">35 cases/class across all 24 disease classes.</p>
            </div>
            <div className="p-4 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] space-y-1">
              <span className="text-white block font-medium">Validation Split (15%)</span>
              <div className="text-[#a3cfcf] text-lg font-semibold">180 Records</div>
              <p className="text-[11px] text-[#bcbac9]">Independent split for hyperparameter tuning & threshold calibration.</p>
            </div>
            <div className="p-4 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] space-y-1">
              <span className="text-white block font-medium">Held-Out Test Split (15%)</span>
              <div className="text-[#c9b4fa] text-lg font-semibold">180 Records</div>
              <p className="text-[11px] text-[#bcbac9]">100% untouched held-out data for unbiased final evaluation.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "Classical Machine Learning Benchmarks",
      subtitle: "Linear SVM (96.11%), Logistic Regression (95.56%), Random Forest (92.78%)",
      category: "BENCHMARKS",
      icon: Cpu,
      content: (
        <div className="space-y-6 text-sm text-[#bcbac9] leading-relaxed">
          <p className="text-base text-white">
            Empirical evaluation across 180 untouched test instances confirms superior convergence of n-gram TF-IDF representations:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] space-y-1">
              <span className="text-white block font-medium">Calibrated Linear SVM</span>
              <div className="text-emerald-400 text-xl font-semibold">96.11% Acc</div>
              <div className="text-[11px] text-[#bcbac9]">Macro F1: 0.9582 • Latency: 0.14 ms</div>
            </div>
            <div className="p-4 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] space-y-1">
              <span className="text-white block font-medium">Logistic Regression (L2)</span>
              <div className="text-[#c9b4fa] text-xl font-semibold">95.56% Acc</div>
              <div className="text-[11px] text-[#bcbac9]">Macro F1: 0.9540 • Latency: 0.02 ms</div>
            </div>
            <div className="p-4 rounded-xl bg-[#0e0c1f] border border-[#3f3a52] space-y-1">
              <span className="text-white block font-medium">Random Forest (150 Trees)</span>
              <div className="text-[#a3cfcf] text-xl font-semibold">92.78% Acc</div>
              <div className="text-[11px] text-[#bcbac9]">Macro F1: 0.9251 • Latency: 0.21 ms</div>
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
                • Symptom2Disease benchmark (1,200 records, 24 classes).<br />
                • Zero test leakage via group-stratified partitioning.<br />
                • 96.11% test accuracy with Calibrated Linear SVM.<br />
                • 43 guideline vector embeddings indexed for RAG.
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

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentSlideIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'ArrowRight') {
        setCurrentSlideIndex(prev => Math.min(prev + 1, slides.length - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length]);

  const currentSlide = slides[currentSlideIndex] || slides[0];

  return (
    <div className="min-h-screen bg-[#0e0c1f] text-white flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between border-b border-[#3f3a52] pb-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xs font-mono text-[#bcbac9] hover:text-white flex items-center gap-1 transition-colors">
            <span>← Exit to Platform</span>
          </Link>
          <span className="text-[#5a5772]">|</span>
          <span className="text-xs font-mono uppercase tracking-wider text-[#c9b4fa]">
            MEDINTEL AI • Research Presentation
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#bcbac9]">
          <span>Slide {currentSlideIndex + 1} of {slides.length}</span>
        </div>
      </div>

      {/* Slide Deck Main Body */}
      <div className="max-w-4xl mx-auto w-full py-10 flex-1 flex flex-col justify-center space-y-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b1938] border border-[#3f3a52] text-xs font-mono text-[#c9b4fa]">
            <span>{currentSlide.category}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-medium tracking-tight text-white leading-tight font-editorial">
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
                aria-label={`Jump to slide ${idx + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  currentSlideIndex === idx
                    ? 'bg-[#c9b4fa] w-6'
                    : 'bg-[#3f3a52] hover:bg-[#5a5772] w-2.5'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresentationPage;
