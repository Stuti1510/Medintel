import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Activity, ShieldCheck, Database, Cpu, BookOpen, Sparkles, Layers, ArrowUpRight } from 'lucide-react';
import { TealClosingCTA } from '../components/TealClosingCTA';
import { Footer } from '../components/Footer';
import { MedintelLogo } from '../components/MedintelLogo';

export const LandingPage: React.FC = () => {
  const capabilities = [
    {
      num: "01",
      title: "Clinical Analysis",
      description: "Evaluate complex multimodal clinical inputs with patient vitals, structured physical biometrics, and unstructured symptom narratives.",
      link: "/clinical-analysis"
    },
    {
      num: "02",
      title: "Model Benchmarking",
      description: "Examine balanced classical ML baselines (Linear SVM, Logistic Regression, Random Forest, XGBoost) on held-out test splits (N=180) across 24 classes with zero test leakage.",
      link: "/model-comparison"
    },
    {
      num: "03",
      title: "Transformer Analysis",
      description: "Analyze clinical narratives using medical BioBERT with 4-layer multi-head self-attention and contextualized biomedical embeddings.",
      link: "/transformer-lab"
    },
    {
      num: "04",
      title: "Explainability & Feature Attribution",
      description: "Inspect SHAP and LIME tabular feature contributions, token-level salience, and attention distributions with scientific clarity.",
      link: "/explainability"
    },
    {
      num: "05",
      title: "Evidence Retrieval (RAG)",
      description: "Trace predictions to dense vector-retrieved citations from 43 peer-reviewed clinical guidelines (ACC/AHA, IDSA, GINA, KDIGO).",
      link: "/knowledge"
    },
    {
      num: "06",
      title: "Grounded LLM Synthesis",
      description: "Transform empirical model predictions, probabilities, and retrieved evidence into bounded, non-hallucinatory clinical summaries.",
      link: "/llm-lab"
    },
    {
      num: "07",
      title: "Dataset Discovery & Topology",
      description: "Audit verified Symptom2Disease benchmark spanning 1,200 patient narratives, 24 distinct clinical entities, and strict train/validation/test partitions.",
      link: "/datasets"
    },
    {
      num: "08",
      title: "Motor & Cognitive Screening",
      description: "Perform controlled browser-based behavioral tests for reaction-time latency, mouse-tracking stability, and finger-tap rhythm consistency.",
      link: "/motor-screening"
    }
  ];

  const pipelineSteps = [
    { name: "Clinical Input", detail: "Vitals & Narrative" },
    { name: "Preprocessing", detail: "Leakage-Safe Scaling" },
    { name: "ML Prediction", detail: "Balanced Baselines" },
    { name: "BioBERT", detail: "Self-Attention" },
    { name: "Explainability", detail: "SHAP & Salience" },
    { name: "Evidence Retrieval", detail: "Vector Search" },
    { name: "Safety Bounds", detail: "Rule Checks" },
    { name: "Grounded LLM", detail: "Constrained Synthesis" },
    { name: "Clinical Summary", detail: "Interpretable Report" },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf8] text-[#292827] flex flex-col">
      {/* ------------------------------------------------------------- */}
      {/* 1. HERO SECTION (Deep Indigo #1b1938)                         */}
      {/* ------------------------------------------------------------- */}
      <section className="w-full bg-[#1b1938] text-white pt-12 pb-20 md:pt-16 md:pb-28 border-b border-[#3f3a52] relative overflow-hidden">
        {/* Subtle Ambient Background */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#c9b4fa] rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-[#0e3030] rounded-full blur-3xl" />
        </div>

        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">
          {/* Top Hero Brand Anchor with 3D Motion */}
          <div className="pt-2">
            <MedintelLogo variant="hero" isDark={true} enable3D={true} animated={true} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left: Editorial Headline & Single Primary CTA */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#232047] border border-[#3f3a52] text-xs font-mono text-[#c9b4fa]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c9b4fa] animate-pulse" />
                <span>Clinical AI Research Platform</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-medium tracking-tight text-white leading-[0.98] font-editorial">
                Clinical intelligence,<br />
                made interpretable.
              </h1>

              <p className="text-lg sm:text-xl text-[#bcbac9] font-normal leading-relaxed max-w-xl">
                An evidence-aware clinical AI research platform combining machine learning, biomedical transformers, explainability, retrieval, and responsible LLM synthesis.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  to="/clinical-analysis"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#c9b4fa] hover:bg-[#d8c7fd] text-[#1b1938] font-semibold text-base transition-all shadow-md hover:shadow-lg"
                >
                  <span>Run Clinical Analysis</span>
                  <ArrowRight className="w-4 h-4 text-[#1b1938]" />
                </Link>

                <Link
                  to="/motor-screening"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#232047] hover:bg-[#2e2a5c] text-white border border-[#3f3a52] font-medium text-sm transition-all"
                >
                  <span>Motor Screening</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#c9b4fa]" />
                </Link>
              </div>
            </div>

            {/* Right: Abstract Clinical Intelligence Visualization */}
            <div className="lg:col-span-5">
              <div className="p-6 rounded-2xl bg-[#0e0c1f]/80 border border-[#3f3a52] space-y-5 backdrop-blur-sm shadow-xl">
                <div className="flex items-center justify-between border-b border-[#3f3a52] pb-3 text-xs font-mono text-[#bcbac9]">
                  <span className="uppercase tracking-wider">Multimodal Pipeline Telemetry</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    LIVE
                  </span>
                </div>

                {/* Structured Waveform & Layer Stream */}
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 rounded-lg bg-[#1b1938] border border-[#3f3a52]/60 flex items-center justify-between">
                    <span className="text-[#bcbac9]">Tabular Predictors</span>
                    <span className="text-white font-medium">12 Biometric Features</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#1b1938] border border-[#3f3a52]/60 flex items-center justify-between">
                    <span className="text-[#bcbac9]">Narrative Representation</span>
                    <span className="text-[#c9b4fa] font-medium">BioBERT Self-Attention</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#1b1938] border border-[#3f3a52]/60 flex items-center justify-between">
                    <span className="text-[#bcbac9]">Evidence Grounding</span>
                    <span className="text-[#a3cfcf] font-medium">43 Guidelines Indexed</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#1b1938] border border-[#3f3a52]/60 flex items-center justify-between">
                    <span className="text-[#bcbac9]">Held-Out Test Parity</span>
                    <span className="text-white font-medium">ROC-AUC: 0.7982</span>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-[#5a5772]">
                  <span>Deterministic Safety Filter: Active</span>
                  <span>Zero Test Contamination</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. RESTRAINED HERO STATUS STRIP                               */}
      {/* ------------------------------------------------------------- */}
      <section className="w-full bg-[#0e0c1f] text-[#bcbac9] border-b border-[#3f3a52] py-4 text-xs font-mono">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-x-0 md:divide-x divide-[#3f3a52]">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase text-[#5a5772] block">Classical ML Baseline</span>
              <span className="text-white font-medium">Logistic Reg • 95.56% Acc</span>
            </div>
            <div className="space-y-0.5 md:pl-4">
              <span className="text-[10px] uppercase text-[#5a5772] block">Biomedical Transformer</span>
              <span className="text-white font-medium">BioBERT • 10.1M Parameters</span>
            </div>
            <div className="space-y-0.5 md:pl-4">
              <span className="text-[10px] uppercase text-[#5a5772] block">Vector RAG Knowledge</span>
              <span className="text-white font-medium">43 Verified Guidelines</span>
            </div>
            <div className="space-y-0.5 md:pl-4">
              <span className="text-[10px] uppercase text-[#5a5772] block">Dataset Topology</span>
              <span className="text-white font-medium">Symptom2Disease • 24 Entities</span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. HOMEPAGE RESEARCH INTRODUCTION (White Canvas #ffffff)      */}
      {/* ------------------------------------------------------------- */}
      <section className="w-full bg-white text-[#292827] py-20 md:py-28 border-b border-[#e8e4dd]">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Two-Column Editorial Composition */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#73706d] block">
                Research Methodology
              </span>
              <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-[#292827] leading-[1.02] font-editorial">
                From clinical input<br />
                to evidence-grounded insight.
              </h2>
            </div>
            <div className="lg:col-span-6 space-y-4 pt-2">
              <p className="text-lg text-[#292827] font-medium leading-relaxed">
                Conventional clinical prediction models act as opaque black boxes. MEDINTEL AI replaces disconnected predictions with a unified, transparent research workflow.
              </p>
              <p className="text-base text-[#73706d] leading-relaxed">
                Every clinical prediction is contextualized by dual machine learning representations, validated through attention and attribution heatmaps, referenced against authoritative medical literature, and bounded by deterministic clinical safety constraints.
              </p>
            </div>
          </div>

          {/* Publication Pipeline Diagram */}
          <div className="border border-[#e8e4dd] rounded-xl p-6 sm:p-8 bg-[#fafaf8] space-y-6">
            <div className="flex items-center justify-between border-b border-[#e8e4dd] pb-4">
              <span className="text-xs font-mono uppercase tracking-wider text-[#73706d] font-semibold">
                Sequential Research Architecture
              </span>
              <span className="text-xs font-mono text-[#9a9794]">
                9 Verifiable Stages
              </span>
            </div>

            {/* Horizontal Research Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-9 gap-3">
              {pipelineSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg bg-white border border-[#e8e4dd] flex flex-col justify-between space-y-2 text-left"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#9a9794]">
                    <span>0{idx + 1}</span>
                    {idx < pipelineSteps.length - 1 && <span className="hidden lg:inline text-[#73706d]">→</span>}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#292827] leading-snug">{step.name}</div>
                    <div className="text-[11px] text-[#73706d] font-mono mt-0.5">{step.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. CORE CAPABILITIES (Off-White Canvas #fafaf8)               */}
      {/* ------------------------------------------------------------- */}
      <section className="w-full bg-[#fafaf8] text-[#292827] py-20 md:py-28 border-b border-[#e8e4dd]">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-[#73706d] block">
              Platform Modules
            </span>
            <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#292827] mt-1 font-editorial">
              One platform.<br />
              A complete clinical AI workflow.
            </h2>
          </div>

          {/* Interactive Feature Rows */}
          <div className="divide-y divide-[#e8e4dd] border-t border-b border-[#e8e4dd]">
            {capabilities.map((cap, idx) => (
              <Link
                key={idx}
                to={cap.link}
                className="group py-6 sm:py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-150 hover:bg-white hover:px-4 rounded-lg"
              >
                <div className="flex items-start sm:items-center gap-6 max-w-3xl">
                  <span className="text-xs font-mono text-[#9a9794] group-hover:text-[#1b1938] font-medium pt-1 sm:pt-0">
                    {cap.num}
                  </span>
                  <div>
                    <h3 className="text-lg sm:text-xl font-medium text-[#292827] group-hover:text-[#1b1938] transition-colors">
                      {cap.title}
                    </h3>
                    <p className="text-sm text-[#73706d] mt-1 leading-relaxed">
                      {cap.description}
                    </p>
                  </div>
                </div>

                <div className="self-end sm:self-center shrink-0 flex items-center gap-1 text-sm font-medium text-[#73706d] group-hover:text-[#1b1938] group-hover:translate-x-1 transition-all">
                  <span>Explore</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. DEEP TEAL CLOSING CTA SECTION (#0e3030)                    */}
      {/* ------------------------------------------------------------- */}
      <TealClosingCTA />

      {/* ------------------------------------------------------------- */}
      {/* 6. OFFICIAL MINIMAL FOOTER                                    */}
      {/* ------------------------------------------------------------- */}
      <Footer />
    </div>
  );
};

export default LandingPage;
