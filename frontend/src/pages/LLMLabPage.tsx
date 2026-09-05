import React, { useState, useRef } from 'react';
import {
  Sparkles, ArrowRight, ShieldCheck, Cpu, BookOpen, AlertTriangle,
  Play, Loader2, Info, Upload, FileText, CheckCircle2, Check
} from 'lucide-react';
import { runClinicalAnalysis, uploadMedicalDocument } from '../services/api';
import { DocumentUploadResult, ClinicalAnalysisResponse } from '../types/clinical';
import { TealClosingCTA } from '../components/TealClosingCTA';

export const LLMLabPage: React.FC = () => {
  const [symptoms, setSymptoms] = useState<string>(
    "63yo male presenting with high fever (39.4°C), tachypnea, low blood pressure (90/60 mmHg), confusion, and acute physiological deterioration."
  );
  const [age, setAge] = useState<number>(63);
  const [sex, setSex] = useState<string>("Male");
  const [vitals, setVitals] = useState({
    heart_rate: 115,
    systolic_bp: 90,
    diastolic_bp: 60,
    temperature: 39.4,
    spo2: 92
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<ClinicalAnalysisResponse | null>(null);

  // Document Upload State
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<DocumentUploadResult | null>(null);
  const [uploadNote, setUploadNote] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSynthesize = async (
    symptomsOverride?: string,
    vitalsOverride?: typeof vitals,
    ageOverride?: number,
    sexOverride?: string
  ) => {
    setLoading(true);
    try {
      const sym = symptomsOverride !== undefined ? symptomsOverride : symptoms;
      const vit = vitalsOverride !== undefined ? vitalsOverride : vitals;
      const a = ageOverride !== undefined ? ageOverride : age;
      const s = sexOverride !== undefined ? sexOverride : sex;

      const res = await runClinicalAnalysis({
        age: a,
        sex: s,
        symptoms: sym,
        clinical_narrative: sym,
        vitals: vit
      });
      setResponse(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadNote(null);
    try {
      const resp = await uploadMedicalDocument(file, true);
      setUploadResult(resp.document);
      const pat = resp.document.extracted_patient;
      const narrativeText = resp.document.normalized_text || resp.document.raw_text || "";

      if (narrativeText) {
        setSymptoms(narrativeText);
      }

      let newAge = age;
      let newSex = sex;
      let newVitals = { ...vitals };

      if (pat) {
        if (pat.age) {
          setAge(pat.age);
          newAge = pat.age;
        }
        if (pat.sex) {
          setSex(pat.sex);
          newSex = pat.sex;
        }
        if (pat.vitals) {
          newVitals = {
            heart_rate: pat.vitals.heart_rate || vitals.heart_rate,
            systolic_bp: pat.vitals.systolic_bp || vitals.systolic_bp,
            diastolic_bp: pat.vitals.diastolic_bp || vitals.diastolic_bp,
            temperature: pat.vitals.temperature || vitals.temperature,
            spo2: pat.vitals.spo2 || vitals.spo2
          };
          setVitals(newVitals);
        }
      }

      setUploadNote(`Loaded ${resp.document.filename} (${resp.document.file_type})`);

      if (resp.analysis) {
        setResponse(resp.analysis);
      } else {
        await handleSynthesize(narrativeText, newVitals, newAge, newSex);
      }
    } catch (err: any) {
      console.error(err);
      setUploadNote(`Upload error: ${err.message || "Failed to process document"}`);
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

  return (
    <div className="min-h-screen bg-[#fafaf8] text-[#292827] flex flex-col">
      {/* ------------------------------------------------------------- */}
      {/* 1. Page Header                                                */}
      {/* ------------------------------------------------------------- */}
      <section className="w-full bg-white border-b border-[#e8e4dd] py-10 md:py-14">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-wider text-[#73706d] block">
                Constrained Synthesis Architecture
              </span>
              <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#292827]">
                Grounded LLM Lab
              </h1>
              <p className="text-base text-[#73706d] max-w-2xl">
                Transform patient encounter reports, model logits, and retrieved evidence into a constrained clinical synthesis with zero-hallucination guardrails.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2.5 rounded-lg border border-[#e8e4dd] bg-[#fafaf8] text-[#1b1938] hover:bg-white text-xs font-mono font-medium flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Report (PDF/Img)</span>
              </button>

              <button
                onClick={() => handleSynthesize()}
                disabled={loading}
                className="px-6 py-2.5 rounded-lg bg-[#1b1938] hover:bg-[#232047] text-white text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Synthesizing Context...</span>
                  </>
                ) : (
                  <>
                    <span>Execute Synthesis Pipeline</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. 3-Column Grounding Architecture Grid                       */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Column 1: INPUT & UPLOAD */}
          <div className="p-6 rounded-xl bg-white border border-[#e8e4dd] space-y-4">
            <div className="border-b border-[#e8e4dd] pb-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono uppercase text-[#73706d] tracking-wider block font-semibold">
                  01 • Input Presentation
                </span>
                <h3 className="text-base font-medium text-[#292827] mt-0.5">
                  Patient Context & Biometrics
                </h3>
              </div>
            </div>

            {/* Quick Upload Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-3 rounded-lg border border-dashed text-center cursor-pointer transition-all ${
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
              <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#1b1938]">
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>{uploading ? "Extracting..." : "Drop PDF / Image Report or Click to Upload"}</span>
              </div>
            </div>

            {uploadNote && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-mono flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{uploadNote}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-mono text-[#73706d] block mb-1">Clinical Narrative / Symptoms</label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={5}
                className="w-full p-3 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] text-xs text-[#292827] font-mono focus:outline-none focus:border-[#1b1938] leading-relaxed"
              />
            </div>

            {/* Live Vitals Stream Card */}
            <div className="p-3.5 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] font-mono text-[11px] text-[#73706d] space-y-1.5">
              <div className="text-[#292827] font-semibold flex items-center justify-between">
                <span>Observed Vitals Stream:</span>
                <span className="text-[10px] text-[#73706d]">{sex}, {age}y</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <div>HR: <strong className="text-[#292827]">{vitals.heart_rate} bpm</strong></div>
                <div>BP: <strong className="text-[#292827]">{vitals.systolic_bp}/{vitals.diastolic_bp} mmHg</strong></div>
                <div>Temp: <strong className="text-[#292827]">{vitals.temperature}°C</strong></div>
                <div>SpO2: <strong className="text-[#292827]">{vitals.spo2}%</strong></div>
              </div>
            </div>
          </div>

          {/* Column 2: EVIDENCE */}
          <div className="p-6 rounded-xl bg-white border border-[#e8e4dd] space-y-4">
            <div className="border-b border-[#e8e4dd] pb-3">
              <span className="text-xs font-mono uppercase text-[#73706d] tracking-wider block font-semibold">
                02 • Retrieved Evidence
              </span>
              <h3 className="text-base font-medium text-[#292827] mt-0.5">
                Grounding Knowledge Sources
              </h3>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] space-y-1">
                <div className="flex items-center gap-1.5 text-[#1b1938] font-semibold">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>BioBERT Contextual Signal</span>
                </div>
                <p className="text-[#73706d]">
                  {response ? `${response.transformer_prediction?.predicted_condition} (${response.transformer_prediction?.confidence_percentage})` : "Awaiting Pipeline Trigger"}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] space-y-1">
                <div className="flex items-center gap-1.5 text-[#1b1938] font-semibold">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Retrieved Guidelines</span>
                </div>
                <p className="text-[#73706d]">
                  {response?.retrieved_evidence ? `${response.retrieved_evidence.length} Guideline passages injected` : "ACC/AHA, Surviving Sepsis Campaign, IDSA guidelines"}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] space-y-1">
                <div className="flex items-center gap-1.5 text-[#1b1938] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Deterministic Guardrails</span>
                </div>
                <p className="text-[#73706d] leading-relaxed">
                  • Bounded to retrieved evidence<br />
                  • No unverified pharmacology<br />
                  • Emergency red-flags audited
                </p>
              </div>
            </div>
          </div>

          {/* Column 3: OUTPUT */}
          <div className="p-6 rounded-xl bg-white border border-[#e8e4dd] space-y-4">
            <div className="border-b border-[#e8e4dd] pb-3">
              <span className="text-xs font-mono uppercase text-[#73706d] tracking-wider block font-semibold">
                03 • Grounded Synthesis
              </span>
              <h3 className="text-base font-medium text-[#292827] mt-0.5">
                Constrained Clinical Guidance
              </h3>
            </div>

            <div className="text-xs text-[#292827] leading-relaxed bg-[#fafaf8] p-4 rounded-lg border border-[#e8e4dd] min-h-64 whitespace-pre-line font-normal space-y-2">
              {response?.llm_explanation?.clinical_guidance || response?.llm_explanation?.explanation_markdown || (
                "Upload a clinical document or click 'Execute Synthesis Pipeline' to run end-to-end model inference, vector evidence retrieval, and safety-audited clinical synthesis."
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. Deep Teal Closing Resolution Section                       */}
      {/* ------------------------------------------------------------- */}
      <TealClosingCTA />
    </div>
  );
};

export default LLMLabPage;
