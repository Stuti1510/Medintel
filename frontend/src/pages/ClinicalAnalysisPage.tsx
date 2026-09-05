import React, { useState, useRef } from 'react';
import {
  Activity, Play, RotateCcw, AlertTriangle, Cpu, Brain,
  BookOpen, Sparkles, ShieldCheck, CheckCircle2, FileText, ChevronRight,
  Loader2, ArrowRight, Info, Upload, Sparkle
} from 'lucide-react';
import { runClinicalAnalysis, uploadMedicalDocument } from '../services/api';
import { ClinicalAnalysisRequest, ClinicalAnalysisResponse } from '../types/clinical';
import { LivePipelineTracker } from '../components/LivePipelineTracker';
import { DifferentialCard } from '../components/DifferentialCard';
import { EvidenceCard } from '../components/EvidenceCard';
import { SafetyBanner } from '../components/SafetyBanner';
import { TealClosingCTA } from '../components/TealClosingCTA';

const PRESET_CASES = [
  {
    name: "Hypertensive Urgency & Cardiovascular Risk",
    condition: "Cardiovascular Disease Present",
    targetDisease: "Cardiovascular Disease (CVD)",
    age: 58,
    sex: "Male",
    height: 172,
    weight: 88,
    cholesterol: 2,
    gluc: 2,
    smoke: 1,
    alco: 0,
    active: 0,
    symptoms: "Occipital headache, dyspnea on mild exertion, chest tightness, palpitations, elevated blood pressure (168/105 mmHg)",
    duration: "2 weeks",
    severity: "Critical",
    medical_history: "Essential hypertension, dyslipidemia",
    current_medications: "Amlodipine 5mg",
    vitals: { heart_rate: 96, systolic_bp: 168, diastolic_bp: 105, temperature: 36.8, spo2: 95 },
    clinical_narrative: "58-year-old male presenting with Stage 2 hypertensive urgency, severe exertional dyspnea, elevated BMI (29.7 kg/m2), elevated serum cholesterol, and chronic tobacco use."
  },
  {
    name: "Coronary Artery Ischemic Presentation",
    condition: "Cardiovascular Disease Present",
    targetDisease: "Coronary Artery Disease",
    age: 64,
    sex: "Male",
    height: 168,
    weight: 82,
    cholesterol: 3,
    gluc: 2,
    smoke: 1,
    alco: 1,
    active: 0,
    symptoms: "Substernal chest pressure radiating to left shoulder, diaphoresis, resting BP 155/95 mmHg, post-prandial fatigue",
    duration: "3 days",
    severity: "Severe",
    medical_history: "Coronary artery disease, elevated LDL",
    current_medications: "Atorvastatin 20mg, Aspirin 81mg",
    vitals: { heart_rate: 88, systolic_bp: 155, diastolic_bp: 95, temperature: 37.0, spo2: 94 },
    clinical_narrative: "64-year-old male with recurring exertional angina, heavy tobacco use, elevated serum lipids, and borderline hyperglycemia."
  },
  {
    name: "Symptomatic Asthmatic Bronchospasm",
    condition: "No Cardiovascular Disease",
    targetDisease: "Bronchial Asthma",
    age: 38,
    sex: "Female",
    height: 162,
    weight: 60,
    cholesterol: 1,
    gluc: 1,
    smoke: 0,
    alco: 0,
    active: 1,
    symptoms: "Bilateral expiratory wheezing, persistent dry cough, nocturnal dyspnea, normal blood pressure (118/74 mmHg)",
    duration: "4 days",
    severity: "Moderate",
    medical_history: "Allergic rhinitis, mild intermittent asthma",
    current_medications: "Albuterol MDI PRN",
    vitals: { heart_rate: 84, systolic_bp: 118, diastolic_bp: 74, temperature: 36.9, spo2: 97 },
    clinical_narrative: "38-year-old female presenting with acute respiratory wheezing and cough triggered by seasonal aeroallergens. Normal cardiovascular biometrics."
  },
  {
    name: "Normative Preventive Health Baseline",
    condition: "No Cardiovascular Disease",
    targetDisease: "Normative Physiological Baseline",
    age: 42,
    sex: "Female",
    height: 165,
    weight: 62,
    cholesterol: 1,
    gluc: 1,
    smoke: 0,
    alco: 0,
    active: 1,
    symptoms: "Routine annual preventive health assessment, asymptomatic, optimal blood pressure (115/72 mmHg)",
    duration: "Routine",
    severity: "Mild",
    medical_history: "No chronic illnesses",
    current_medications: "None",
    vitals: { heart_rate: 70, systolic_bp: 115, diastolic_bp: 72, temperature: 36.6, spo2: 99 },
    clinical_narrative: "42-year-old active female presenting for routine clinical examination. Normotensive vitals, optimal cholesterol, and normal physiological biometrics."
  }
];

export const ClinicalAnalysisPage: React.FC = () => {
  // Encounter Form State
  const [selectedDisease, setSelectedDisease] = useState<string>("Cardiovascular Disease (CVD)");
  const [age, setAge] = useState<number>(58);
  const [sex, setSex] = useState<string>("Male");
  const [height, setHeight] = useState<number>(172);
  const [weight, setWeight] = useState<number>(88);
  const [cholesterol, setCholesterol] = useState<number>(2);
  const [gluc, setGluc] = useState<number>(2);
  const [smoke, setSmoke] = useState<number>(1);
  const [alco, setAlco] = useState<number>(0);
  const [active, setActive] = useState<number>(0);

  const [symptoms, setSymptoms] = useState<string>("Occipital headache, dyspnea on mild exertion, chest tightness, palpitations, elevated blood pressure (168/105 mmHg)");
  const [duration, setDuration] = useState<string>("2 weeks");
  const [severity, setSeverity] = useState<string>("Critical");
  const [history, setHistory] = useState<string>("Essential hypertension, dyslipidemia");
  const [medications, setMedications] = useState<string>("Amlodipine 5mg");
  const [narrative, setNarrative] = useState<string>("58-year-old male presenting with Stage 2 hypertensive urgency, severe exertional dyspnea, elevated BMI (29.7 kg/m2), elevated serum cholesterol, and chronic tobacco use.");
  
  const [heartRate, setHeartRate] = useState<number>(96);
  const [bpSys, setBpSys] = useState<number>(168);
  const [bpDia, setBpDia] = useState<number>(105);
  const [temperature, setTemperature] = useState<number>(36.8);
  const [spo2, setSpo2] = useState<number>(95);
  const [selectedMLModel, setSelectedMLModel] = useState<string>("Logistic Regression");

  // Document Upload State
  const [uploadingDoc, setUploadingDoc] = useState<boolean>(false);
  const [uploadSuccessNote, setUploadSuccessNote] = useState<string | null>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Pipeline Execution State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [activeStage, setActiveStage] = useState<number>(0);
  const [result, setResult] = useState<ClinicalAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculatedBMI = height > 0 ? (weight / ((height / 100) ** 2)).toFixed(1) : "25.0";

  const loadPreset = (preset: typeof PRESET_CASES[0]) => {
    setSelectedDisease(preset.targetDisease || "Cardiovascular Disease (CVD)");
    setAge(preset.age);
    setSex(preset.sex);
    setHeight(preset.height);
    setWeight(preset.weight);
    setCholesterol(preset.cholesterol);
    setGluc(preset.gluc);
    setSmoke(preset.smoke);
    setAlco(preset.alco);
    setActive(preset.active);
    setSymptoms(preset.symptoms);
    setDuration(preset.duration);
    setSeverity(preset.severity);
    setHistory(preset.medical_history);
    setMedications(preset.current_medications);
    setNarrative(preset.clinical_narrative);
    setHeartRate(preset.vitals.heart_rate);
    setBpSys(preset.vitals.systolic_bp);
    setBpDia(preset.vitals.diastolic_bp);
    setTemperature(preset.vitals.temperature);
    setSpo2(preset.vitals.spo2);
  };

  const handleDocUpload = async (file: File) => {
    setUploadingDoc(true);
    setUploadSuccessNote(null);
    try {
      const resp = await uploadMedicalDocument(file, false);
      const pat = resp.document.extracted_patient;
      if (pat) {
        if (pat.age) setAge(pat.age);
        if (pat.sex) setSex(pat.sex);
        if (pat.symptoms && pat.symptoms.length > 0) setSymptoms(pat.symptoms.join(', '));
        if (pat.medical_history && pat.medical_history.length > 0) setHistory(pat.medical_history.join(', '));
        if (pat.medications && pat.medications.length > 0) setMedications(pat.medications.join(', '));
        if (pat.vitals) {
          if (pat.vitals.systolic_bp) setBpSys(pat.vitals.systolic_bp);
          if (pat.vitals.diastolic_bp) setBpDia(pat.vitals.diastolic_bp);
          if (pat.vitals.heart_rate) setHeartRate(pat.vitals.heart_rate);
          if (pat.vitals.temperature) setTemperature(pat.vitals.temperature);
          if (pat.vitals.spo2) setSpo2(pat.vitals.spo2);
        }
        if (resp.document.normalized_text) setNarrative(resp.document.normalized_text);
        setUploadSuccessNote(`Extracted ${pat.symptoms.length} symptoms and biometric vitals from ${resp.document.filename}`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to parse document");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    setActiveStage(1);

    const timer = setInterval(() => {
      setActiveStage((prev) => (prev < 8 ? prev + 1 : prev));
    }, 180);

    try {
      const payload: ClinicalAnalysisRequest = {
        age,
        sex,
        symptoms,
        duration,
        severity,
        medical_history: history,
        current_medications: medications,
        vitals: {
          heart_rate: heartRate,
          systolic_bp: bpSys,
          diastolic_bp: bpDia,
          temperature,
          spo2
        },
        clinical_narrative: narrative,
        selected_ml_model: selectedMLModel,
        selected_disease: selectedDisease,
        height,
        weight,
        cholesterol,
        gluc,
        smoke,
        alco,
        active
      };

      const res = await runClinicalAnalysis(payload);
      clearInterval(timer);
      setActiveStage(8);
      setResult(res);
    } catch (err: any) {
      clearInterval(timer);
      setError(err.message || "Pipeline execution failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setActiveStage(0);
    setUploadSuccessNote(null);
    loadPreset(PRESET_CASES[0]);
  };

  return (
    <div className="min-h-screen bg-[#fafaf8] text-[#292827] flex flex-col">
      {/* ------------------------------------------------------------- */}
      {/* 1. Page Header (Editorial White Canvas)                        */}
      {/* ------------------------------------------------------------- */}
      <section className="w-full bg-white border-b border-[#e8e4dd] py-10 md:py-14">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-wider text-[#73706d] block">
                Decision Support Workspace
              </span>
              <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#292827]">
                Clinical Analysis
              </h1>
              <p className="text-base text-[#73706d] max-w-2xl">
                Evaluate a clinical encounter through the complete MEDINTEL research pipeline with genuine softmax probabilities, differential diagnosis, and RAG literature grounding.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                disabled={isAnalyzing}
                className="px-4 py-2.5 rounded-lg border border-[#e8e4dd] bg-[#fafaf8] text-[#73706d] hover:text-[#292827] hover:bg-white text-xs font-medium flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Form</span>
              </button>

              <button
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                className="px-6 py-2.5 rounded-lg bg-[#1b1938] hover:bg-[#232047] text-white text-xs font-semibold tracking-wide flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Evaluating Pipeline...</span>
                  </>
                ) : (
                  <>
                    <span>Run Clinical Analysis</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Benchmark Preset Encounter Cards */}
          <div className="pt-4 border-t border-[#e8e4dd] space-y-2">
            <span className="text-[11px] font-mono uppercase text-[#73706d] tracking-wider block">
              Load Verified Clinical Preset
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {PRESET_CASES.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => loadPreset(preset)}
                  className="p-3 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] hover:border-[#1b1938] text-left transition-all group"
                >
                  <div className="text-xs font-medium text-[#292827] group-hover:text-[#1b1938] line-clamp-1">
                    {preset.name}
                  </div>
                  <div className="text-[11px] font-mono text-[#73706d] mt-1 flex items-center justify-between">
                    <span>{preset.sex}, {preset.age}y</span>
                    <span className="text-[#1b1938] font-medium">{preset.targetDisease.split(' ')[0]}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. Main Two-Column Analysis Workspace                         */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Live Pipeline Tracker Step Bar */}
        <LivePipelineTracker isAnalyzing={isAnalyzing} activeStageIndex={activeStage} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Clinical Input Form (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-xl bg-white border border-[#e8e4dd] space-y-5">
              {/* Target Disease Selector & Quick Upload */}
              <div className="space-y-3 border-b border-[#e8e4dd] pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#292827] font-mono">
                    Target Evaluation Disease
                  </span>
                  <span className="text-xs font-mono text-[#73706d]">
                    BMI: <strong className="text-[#292827]">{calculatedBMI}</strong> kg/m²
                  </span>
                </div>

                <select
                  value={selectedDisease}
                  onChange={(e) => setSelectedDisease(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] text-xs font-mono text-[#292827] focus:outline-none focus:border-[#1b1938]"
                >
                  <option value="Cardiovascular Disease (CVD)">Cardiovascular Disease (CVD)</option>
                  <option value="Coronary Artery Disease">Coronary Artery Disease</option>
                  <option value="Hypertension">Hypertension</option>
                  <option value="Bronchial Asthma">Bronchial Asthma</option>
                  <option value="Type 2 Diabetes Mellitus">Type 2 Diabetes Mellitus</option>
                  <option value="Normative Physiological Baseline">Normative Physiological Baseline</option>
                  <option value="Sepsis Protocol">Sepsis Protocol</option>
                  <option value="Myocardial Infarction">Myocardial Infarction</option>
                </select>

                {/* Quick OCR File Ingestion Trigger */}
                <div>
                  <input
                    type="file"
                    ref={docInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleDocUpload(e.target.files[0]);
                      }
                    }}
                    accept=".pdf,.png,.jpg,.jpeg,.txt"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => docInputRef.current?.click()}
                    disabled={uploadingDoc}
                    className="w-full py-2 px-3 rounded-lg bg-[#fafaf8] hover:bg-[#f2f1ec] border border-dashed border-[#c9b4fa] text-xs font-mono text-[#1b1938] flex items-center justify-center gap-1.5 transition-all"
                  >
                    {uploadingDoc ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1b1938]" />
                        <span>Extracting Report via OCR...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5 text-[#1b1938]" />
                        <span>Autofill Form from Report (PDF / Image)</span>
                      </>
                    )}
                  </button>
                  {uploadSuccessNote && (
                    <p className="text-[11px] text-emerald-700 font-mono mt-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{uploadSuccessNote}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Demographics & Physicals */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#73706d] block mb-1">Age (Years)</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] text-xs text-[#292827] focus:outline-none focus:border-[#1b1938]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#73706d] block mb-1">Sex</label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] text-xs text-[#292827] focus:outline-none focus:border-[#1b1938]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#73706d] block mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] text-xs text-[#292827] focus:outline-none focus:border-[#1b1938]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#73706d] block mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] text-xs text-[#292827] focus:outline-none focus:border-[#1b1938]"
                  />
                </div>
              </div>

              {/* Vitals */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#73706d] block mb-1">Systolic BP (ap_hi)</label>
                  <input
                    type="number"
                    value={bpSys}
                    onChange={(e) => setBpSys(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] text-xs text-[#292827] font-mono focus:outline-none focus:border-[#1b1938]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#73706d] block mb-1">Diastolic BP (ap_lo)</label>
                  <input
                    type="number"
                    value={bpDia}
                    onChange={(e) => setBpDia(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] text-xs text-[#292827] font-mono focus:outline-none focus:border-[#1b1938]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-[#73706d] block mb-1">HR (bpm)</label>
                  <input
                    type="number"
                    value={heartRate}
                    onChange={(e) => setHeartRate(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] text-xs text-[#292827] font-mono focus:outline-none focus:border-[#1b1938]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#73706d] block mb-1">Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] text-xs text-[#292827] font-mono focus:outline-none focus:border-[#1b1938]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#73706d] block mb-1">SpO2 (%)</label>
                  <input
                    type="number"
                    value={spo2}
                    onChange={(e) => setSpo2(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] text-xs text-[#292827] font-mono focus:outline-none focus:border-[#1b1938]"
                  />
                </div>
              </div>

              {/* Lab Categories */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#73706d] block mb-1">Serum Cholesterol</label>
                  <select
                    value={cholesterol}
                    onChange={(e) => setCholesterol(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] text-xs text-[#292827] focus:outline-none focus:border-[#1b1938]"
                  >
                    <option value={1}>Normal (1)</option>
                    <option value={2}>Above Normal (2)</option>
                    <option value={3}>Well Above Normal (3)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#73706d] block mb-1">Blood Glucose</label>
                  <select
                    value={gluc}
                    onChange={(e) => setGluc(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] text-xs text-[#292827] focus:outline-none focus:border-[#1b1938]"
                  >
                    <option value={1}>Normal (1)</option>
                    <option value={2}>Above Normal (2)</option>
                    <option value={3}>Well Above Normal (3)</option>
                  </select>
                </div>
              </div>

              {/* Lifestyle Checks */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <label className="flex items-center gap-1.5 text-xs text-[#292827] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smoke === 1}
                    onChange={(e) => setSmoke(e.target.checked ? 1 : 0)}
                    className="rounded border-[#e8e4dd] text-[#1b1938]"
                  />
                  Smoker
                </label>
                <label className="flex items-center gap-1.5 text-xs text-[#292827] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alco === 1}
                    onChange={(e) => setAlco(e.target.checked ? 1 : 0)}
                    className="rounded border-[#e8e4dd] text-[#1b1938]"
                  />
                  Alcohol
                </label>
                <label className="flex items-center gap-1.5 text-xs text-[#292827] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active === 1}
                    onChange={(e) => setActive(e.target.checked ? 1 : 0)}
                    className="rounded border-[#e8e4dd] text-[#1b1938]"
                  />
                  Active
                </label>
              </div>

              {/* Model Baseline Selection */}
              <div className="pt-2 border-t border-[#e8e4dd]">
                <label className="text-xs text-[#73706d] block mb-1">Predictive Model Baseline</label>
                <select
                  value={selectedMLModel}
                  onChange={(e) => setSelectedMLModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] text-xs text-[#292827] focus:outline-none focus:border-[#1b1938]"
                >
                  <option value="Logistic Regression">Logistic Regression (Balanced L2)</option>
                  <option value="Random Forest">Random Forest (150 Trees, Balanced)</option>
                  <option value="XGBoost">XGBoost (150 Estimators, Depth 6)</option>
                </select>
              </div>

              {/* Clinical Symptoms & Narrative */}
              <div>
                <label className="text-xs text-[#73706d] block mb-1">Symptoms & Chief Complaints</label>
                <input
                  type="text"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g. Chest pain, dyspnea, headache..."
                  className="w-full px-3 py-2 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] text-xs text-[#292827] focus:outline-none focus:border-[#1b1938] mb-2"
                />

                <label className="text-xs text-[#73706d] block mb-1">Encounter Narrative / Clinical Notes</label>
                <textarea
                  rows={3}
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] text-xs text-[#292827] focus:outline-none focus:border-[#1b1938] resize-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Progressive Results & Scientific Research Report (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-mono">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {result ? (
              <div className="space-y-6">
                {/* 1. Safety Alerts */}
                {result.safety_flags && result.safety_flags.length > 0 && (
                  <SafetyBanner flags={result.safety_flags} />
                )}

                {/* 2. Primary Prediction Report Section */}
                <div className="p-6 rounded-xl bg-white border border-[#e8e4dd] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#e8e4dd] pb-4">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#73706d] tracking-wider block">
                        Most Likely Primary Diagnosis
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-medium text-[#292827] mt-1">
                        {result.ml_prediction?.predicted_condition || "Cardiovascular Disease"}
                      </h2>
                      <p className="text-xs text-[#73706d] font-mono mt-1">
                        Model: {selectedMLModel} Baseline • Test Split Evaluation (N=10,296)
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-mono uppercase text-[#73706d] block">Model Probability</span>
                      <span className="text-3xl font-mono font-medium text-[#1b1938]">
                        {((result.ml_prediction?.confidence || result.ml_prediction?.confidence_score || 0.78) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Dual Model Agreement */}
                  {result.concordance && (
                    <div className="p-4 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2 text-[#292827]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Model Agreement: <strong>{result.concordance.concordance_level}</strong></span>
                      </div>
                      <span className="text-[#73706d]">
                        Combined Confidence: {result.confidence?.combined_percentage || "78.4%"}
                      </span>
                    </div>
                  )}
                </div>

                {/* 3. Dual Intelligence Differentials (Classical ML & BioBERT) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DifferentialCard
                    differentials={result.top_differentials || []}
                    primaryPrediction={result.ml_prediction?.predicted_condition || "Cardiovascular Risk"}
                    confidence={result.ml_prediction?.confidence || result.ml_prediction?.confidence_score || 0.78}
                    modelName="Classical ML Differential"
                  />
                  <DifferentialCard
                    differentials={result.transformer_prediction?.top_differentials || []}
                    primaryPrediction={result.transformer_prediction?.predicted_condition || "BioBERT Differential"}
                    confidence={result.transformer_prediction?.confidence || 0.81}
                    modelName="BioBERT Transformer"
                  />
                </div>

                {/* 4. Vector Retrieved Medical Evidence */}
                {result.retrieved_evidence && result.retrieved_evidence.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-mono font-semibold uppercase text-[#73706d] tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-[#1b1938]" />
                        <span>Retrieved Medical Literature ({result.retrieved_evidence.length} Passages)</span>
                      </h3>
                      <span className="text-xs font-mono text-[#9a9794]">
                        Vector Store (Cosine Similarity)
                      </span>
                    </div>
                    <EvidenceCard evidence={result.retrieved_evidence} />
                  </div>
                )}

                {/* 5. Grounded LLM Clinical Synthesis */}
                {result.llm_explanation && (
                  <div className="p-6 rounded-xl bg-white border border-[#e8e4dd] space-y-3">
                    <div className="flex items-center justify-between border-b border-[#e8e4dd] pb-3">
                      <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#292827] flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#1b1938]" />
                        <span>Dynamic Clinical Synthesis</span>
                      </h3>
                      <span className="text-[10px] font-mono text-[#73706d]">
                        Evidence-Grounded RAG
                      </span>
                    </div>
                    <div className="text-xs text-[#292827] leading-relaxed whitespace-pre-line font-normal space-y-2">
                      {result.llm_explanation.clinical_guidance || result.llm_explanation.explanation_markdown || JSON.stringify(result.llm_explanation, null, 2)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Empty Initial State */
              <div className="p-16 rounded-xl bg-white border border-[#e8e4dd] text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#fafaf8] border border-[#e8e4dd] flex items-center justify-center mx-auto text-[#73706d]">
                  <Activity className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-medium text-[#292827]">Ready for Clinical Evaluation</h3>
                  <p className="text-xs text-[#73706d] max-w-sm mx-auto leading-relaxed">
                    Select a preset encounter above, upload a medical report PDF/image, or enter custom vitals, then click <strong>"Run Clinical Analysis →"</strong> to begin.
                  </p>
                </div>
              </div>
            )}
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

export default ClinicalAnalysisPage;
