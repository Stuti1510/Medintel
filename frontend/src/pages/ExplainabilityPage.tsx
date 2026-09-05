import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Brain, Cpu, BarChart2, ShieldCheck, ArrowRight, Info,
  Layers, CheckCircle2, AlertTriangle, BookOpen, ThumbsUp, ThumbsDown,
  Upload, FileText, Loader2, Check
} from 'lucide-react';
import { getExplainability, uploadMedicalDocument } from '../services/api';
import { ExplainabilityResult, DocumentUploadResult } from '../types/clinical';
import { AttentionHeatmap } from '../components/AttentionHeatmap';
import { TokenVisualizer } from '../components/TokenVisualizer';
import { EvidenceCard } from '../components/EvidenceCard';
import { TealClosingCTA } from '../components/TealClosingCTA';

export const ExplainabilityPage: React.FC = () => {
  const [inputText, setInputText] = useState<string>(
    "58-year-old male with acute hypertensive crisis, severe occipital headache, blood pressure 168/105 mmHg, elevated serum cholesterol, chronic tobacco use, and exertional dyspnea."
  );
  const [targetDisease, setTargetDisease] = useState<string>("Cardiovascular Disease (CVD)");
  const [structuredData, setStructuredData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [explainResult, setExplainResult] = useState<ExplainabilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Document Upload State
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<DocumentUploadResult | null>(null);
  const [uploadSuccessNote, setUploadSuccessNote] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExplain = async (textOverride?: string, dataOverride?: Record<string, any>, diseaseOverride?: string) => {
    setLoading(true);
    setError(null);
    try {
      const textToUse = textOverride !== undefined ? textOverride : inputText;
      const dataToUse = dataOverride !== undefined ? dataOverride : structuredData;
      const diseaseToUse = diseaseOverride !== undefined ? diseaseOverride : targetDisease;

      const data = await getExplainability(textToUse, dataToUse, diseaseToUse);
      setExplainResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to compute explainability breakdown");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    setUploadSuccessNote(null);
    try {
      const resp = await uploadMedicalDocument(file, false);
      setUploadResult(resp.document);
      const pat = resp.document.extracted_patient;
      const text = resp.document.normalized_text || resp.document.raw_text || "";
      
      if (text) {
        setInputText(text);
      }

      const structPayload: Record<string, any> = {};
      if (pat) {
        if (pat.age) structPayload.age = pat.age;
        if (pat.sex) structPayload.sex = pat.sex;
        if (pat.vitals) {
          if (pat.vitals.systolic_bp) structPayload.systolic_bp = pat.vitals.systolic_bp;
          if (pat.vitals.diastolic_bp) structPayload.diastolic_bp = pat.vitals.diastolic_bp;
          if (pat.vitals.heart_rate) structPayload.heart_rate = pat.vitals.heart_rate;
          if (pat.vitals.spo2) structPayload.spo2 = pat.vitals.spo2;
        }
        if (pat.lab_results) {
          if (pat.lab_results.cholesterol) structPayload.cholesterol = pat.lab_results.cholesterol.value > 200 ? 2 : 1;
          if (pat.lab_results.glucose) structPayload.gluc = pat.lab_results.glucose.value > 140 ? 2 : 1;
        }
      }
      setStructuredData(structPayload);
      setUploadSuccessNote(`Extracted encounter biometrics from ${resp.document.filename}`);

      // Automatically re-run explainability with the new extracted parameters
      await handleExplain(text, structPayload, targetDisease);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to parse uploaded document");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  useEffect(() => {
    // Run initial explainability on load
    handleExplain();
  }, []);

  return (
    <div className="min-h-screen bg-[#fafaf8] text-[#292827] flex flex-col">
      {/* ------------------------------------------------------------- */}
      {/* 1. Page Header                                                */}
      {/* ------------------------------------------------------------- */}
      <section className="w-full bg-white border-b border-[#e8e4dd] py-10 md:py-14">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[#73706d] block">
              Interpretability & Attribution
            </span>
            <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#292827]">
              Explainability & Feature Attribution
            </h1>
            <p className="text-base text-[#73706d] max-w-2xl">
              Dynamically analyze what contributed to the prediction: upload medical reports or input clinical text to examine positive vs negative evidence, TF-IDF lexical tokens, and BioBERT attention.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. Main Content                                               */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-10">
        {/* Input Presentation & File Upload Dropzone */}
        <div className="p-6 rounded-xl bg-white border border-[#e8e4dd] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e8e4dd] pb-3">
            <h2 className="text-sm font-medium text-[#292827]">
              Clinical Presentation for Dynamic Attribution Analysis
            </h2>
            <div className="flex items-center gap-2">
              <label className="text-xs font-mono text-[#73706d]">Target Evaluation:</label>
              <select
                value={targetDisease}
                onChange={(e) => {
                  setTargetDisease(e.target.value);
                  handleExplain(inputText, structuredData, e.target.value);
                }}
                className="px-2.5 py-1 rounded bg-[#fafaf8] border border-[#e8e4dd] text-xs font-mono text-[#292827] focus:outline-none focus:border-[#1b1938]"
              >
                <option value="Cardiovascular Disease (CVD)">Cardiovascular Disease (CVD)</option>
                <option value="Coronary Artery Disease">Coronary Artery Disease</option>
                <option value="Hypertension">Hypertension</option>
                <option value="Bronchial Asthma">Bronchial Asthma</option>
                <option value="Type 2 Diabetes Mellitus">Type 2 Diabetes Mellitus</option>
              </select>
            </div>
          </div>

          {/* Upload Medical Document Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`p-4 rounded-xl border-2 border-dashed transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isDragOver
                ? "border-[#1b1938] bg-[#ebe4fd]/30"
                : "border-[#e8e4dd] hover:border-[#1b1938] bg-[#fafaf8]"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              accept=".pdf,.png,.jpg,.jpeg,.txt"
              className="hidden"
            />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-[#e8e4dd] flex items-center justify-center text-[#1b1938] shrink-0">
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#1b1938]" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
              </div>
              <div>
                <span className="text-xs font-semibold text-[#292827] font-mono block">
                  {uploading ? "Extracting Entities from Report via OCR..." : "Upload Clinical Document (PDF / Image / TXT)"}
                </span>
                <span className="text-[11px] text-[#73706d]">
                  Autofills encounter text, detects lab biomarkers & runs dynamic attribution
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 rounded-lg bg-white hover:bg-[#f5f4f0] text-[#1b1938] text-xs font-mono font-medium border border-[#e8e4dd] shadow-sm transition-all shrink-0"
            >
              Browse Files...
            </button>
          </div>

          {uploadSuccessNote && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{uploadSuccessNote}</span>
            </div>
          )}

          <textarea
            rows={3}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full p-3.5 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] text-xs text-[#292827] focus:outline-none focus:border-[#1b1938] leading-relaxed font-mono"
            placeholder="Type or paste medical encounter narrative or upload document above..."
          />

          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const text = "58-year-old male with acute hypertensive crisis, severe occipital headache, blood pressure 168/105 mmHg, elevated serum cholesterol, chronic tobacco use, and exertional dyspnea.";
                  setInputText(text);
                  setTargetDisease("Cardiovascular Disease (CVD)");
                  handleExplain(text, {}, "Cardiovascular Disease (CVD)");
                }}
                className="px-2.5 py-1 text-xs rounded bg-[#fafaf8] hover:bg-[#f5f4f0] text-[#73706d] border border-[#e8e4dd] font-mono"
              >
                Hypertension Case
              </button>
              <button
                type="button"
                onClick={() => {
                  const text = "64-year-old male presenting with severe substernal chest pressure radiating to left arm, diaphoresis, resting BP 155/95 mmHg, and elevated LDL.";
                  setInputText(text);
                  setTargetDisease("Coronary Artery Disease");
                  handleExplain(text, {}, "Coronary Artery Disease");
                }}
                className="px-2.5 py-1 text-xs rounded bg-[#fafaf8] hover:bg-[#f5f4f0] text-[#73706d] border border-[#e8e4dd] font-mono"
              >
                Ischemia Case
              </button>
              <button
                type="button"
                onClick={() => {
                  const text = "38-year-old female presenting with acute respiratory wheezing, nocturnal dry cough, and normal blood pressure (118/74 mmHg).";
                  setInputText(text);
                  setTargetDisease("Bronchial Asthma");
                  handleExplain(text, {}, "Bronchial Asthma");
                }}
                className="px-2.5 py-1 text-xs rounded bg-[#fafaf8] hover:bg-[#f5f4f0] text-[#73706d] border border-[#e8e4dd] font-mono"
              >
                Asthma Case
              </button>
            </div>

            <button
              onClick={() => handleExplain()}
              disabled={loading || !inputText.trim()}
              className="px-6 py-2.5 rounded-lg bg-[#1b1938] hover:bg-[#232047] text-white text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <span>{loading ? "Computing Attributions..." : "Compute Dynamic Attributions"}</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono">
            {error}
          </div>
        )}

        {explainResult && (
          <div className="space-y-8">
            {/* Attribution Summary Banner */}
            <div className="p-6 rounded-xl bg-white border border-[#e8e4dd] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e8e4dd] pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#73706d] tracking-wider block">
                    Prediction Under Analysis
                  </span>
                  <h3 className="text-2xl font-medium text-[#292827] mt-1">
                    {explainResult.predicted_condition}
                  </h3>
                  <p className="text-xs text-[#73706d] font-mono mt-0.5">
                    Model: {explainResult.model_name}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-mono uppercase text-[#73706d] block">Calibrated Probability</span>
                  <span className="text-2xl font-mono font-medium text-[#1b1938]">
                    {explainResult.confidence_percentage}
                  </span>
                </div>
              </div>

              {/* Model Reasoning Description */}
              <div className="p-4 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] text-xs font-mono text-[#292827] leading-relaxed">
                <span className="font-semibold text-[#1b1938] block mb-1">Clinical Attribution Rationale:</span>
                {explainResult.model_reasoning}
              </div>
            </div>

            {/* 2-Column Attribution Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left: Positive vs Negative Evidence (6 cols) */}
              <div className="lg:col-span-6 space-y-6">
                {/* Supporting Positive Evidence */}
                <div className="p-6 rounded-xl bg-white border border-[#e8e4dd] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#e8e4dd] pb-3">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-sm font-medium text-[#292827]">
                        Positive Supporting Evidence ({explainResult.positive_evidence.length})
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-emerald-700 font-semibold">Toward Risk</span>
                  </div>

                  <div className="space-y-2.5 font-mono text-xs">
                    {explainResult.positive_evidence.length > 0 ? (
                      explainResult.positive_evidence.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-[#fafaf8] border border-emerald-100 flex items-center justify-between">
                          <div>
                            <span className="text-[#292827] font-semibold block">{item.feature}</span>
                            <span className="text-[10px] text-[#73706d]">{item.value} • {item.support_level}</span>
                          </div>
                          <span className="text-xs font-mono text-emerald-700 font-bold">
                            +{(item.salience * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#73706d]">No major positive risk factors detected.</p>
                    )}
                  </div>
                </div>

                {/* Opposing / Protective Evidence */}
                <div className="p-6 rounded-xl bg-white border border-[#e8e4dd] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#e8e4dd] pb-3">
                    <div className="flex items-center gap-2">
                      <ThumbsDown className="w-4 h-4 text-sky-600" />
                      <h3 className="text-sm font-medium text-[#292827]">
                        Opposing / Protective Evidence ({explainResult.negative_evidence.length})
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-sky-700 font-semibold">Protective</span>
                  </div>

                  <div className="space-y-2.5 font-mono text-xs">
                    {explainResult.negative_evidence.length > 0 ? (
                      explainResult.negative_evidence.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-[#fafaf8] border border-sky-100 flex items-center justify-between">
                          <div>
                            <span className="text-[#292827] font-semibold block">{item.feature}</span>
                            <span className="text-[10px] text-[#73706d]">{item.value} • {item.effect}</span>
                          </div>
                          <span className="text-xs font-mono text-sky-700 font-bold">
                            -{(item.salience * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#73706d]">No opposing protective factors in this presentation.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Dynamic Lexical Token Salience (6 cols) */}
              <div className="lg:col-span-6 space-y-6">
                <div className="p-6 rounded-xl bg-white border border-[#e8e4dd] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#e8e4dd] pb-3">
                    <div>
                      <h3 className="text-sm font-medium text-[#292827]">
                        Dynamic Lexical Token Salience
                      </h3>
                      <p className="text-xs text-[#73706d] mt-0.5">
                        Instance-specific TF-IDF terms extracted from clinical text
                      </p>
                    </div>
                    <span className="text-xs font-mono text-[#73706d]">TF-IDF</span>
                  </div>

                  <div className="space-y-2.5 font-mono text-xs">
                    {explainResult.lexical_token_salience && explainResult.lexical_token_salience.length > 0 ? (
                      explainResult.lexical_token_salience.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] flex items-center justify-between">
                          <div>
                            <span className="text-[#292827] font-semibold block">{item.term}</span>
                            <span className="text-[10px] text-[#73706d] uppercase">{item.category}</span>
                          </div>
                          <span className="text-sm font-mono text-[#1b1938] font-medium">
                            +{item.weight.toFixed(3)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#73706d]">Enter clinical text to compute dynamic token weights.</p>
                    )}
                  </div>
                </div>

                {/* Instance Feature Weights Waterfall */}
                <div className="p-6 rounded-xl bg-white border border-[#e8e4dd] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#e8e4dd] pb-3">
                    <div>
                      <h3 className="text-sm font-medium text-[#292827]">
                        Tabular Feature Contributions
                      </h3>
                      <p className="text-xs text-[#73706d] mt-0.5">
                        Log-odds shift per clinical biomarker
                      </p>
                    </div>
                    <span className="text-xs font-mono text-[#73706d]">Instance</span>
                  </div>

                  <div className="space-y-3 pt-1">
                    {explainResult.feature_contributions && explainResult.feature_contributions.map((f, idx) => {
                      const weightVal = f.weight ?? f.salience ?? 0;
                      const isPositive = (f.direction === "SUPPORTING") || weightVal >= 0;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-[#292827] font-medium">{f.feature}</span>
                            <span className={isPositive ? "text-emerald-700 font-semibold" : "text-sky-700 font-semibold"}>
                              {isPositive ? "+" : ""}{(weightVal * 100).toFixed(1)}% ({f.category})
                            </span>
                          </div>
                          <div className="w-full bg-[#f1f0ec] rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${isPositive ? "bg-[#1b1938]" : "bg-sky-600"}`}
                              style={{ width: `${Math.min(Math.abs(weightVal) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Retrieved Evidence Citations */}
            {explainResult.retrieved_evidence && explainResult.retrieved_evidence.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-semibold uppercase text-[#73706d] tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#1b1938]" />
                    <span>Literature Grounding Citations</span>
                  </h3>
                  <span className="text-xs font-mono text-[#9a9794]">
                    {explainResult.retrieved_evidence.length} Passages
                  </span>
                </div>
                <EvidenceCard evidence={explainResult.retrieved_evidence} />
              </div>
            )}

            {/* BioBERT Attention Matrix & Tokens if present */}
            {explainResult.tokens && explainResult.attention_matrix && (
              <div className="space-y-6">
                <TokenVisualizer tokenDetails={explainResult.token_details || []} />
                <AttentionHeatmap
                  tokens={explainResult.tokens}
                  tokenDetails={explainResult.token_details}
                  matrix={explainResult.attention_matrix}
                />
              </div>
            )}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. Deep Teal Closing Resolution Section                       */}
      {/* ------------------------------------------------------------- */}
      <TealClosingCTA />
    </div>
  );
};

export default ExplainabilityPage;
