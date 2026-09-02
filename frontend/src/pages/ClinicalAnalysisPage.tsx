import React, { useState } from 'react';
import {
  Activity, Play, RotateCcw, AlertTriangle, Cpu, Brain,
  BookOpen, Sparkles, ShieldCheck, CheckCircle2, FileText, ChevronRight, Loader2
} from 'lucide-react';
import { runClinicalAnalysis } from '../services/api';
import { ClinicalAnalysisRequest, ClinicalAnalysisResponse } from '../types/clinical';
import { LivePipelineTracker } from '../components/LivePipelineTracker';
import { DifferentialCard } from '../components/DifferentialCard';
import { EvidenceCard } from '../components/EvidenceCard';
import { SafetyBanner } from '../components/SafetyBanner';

const PRESET_CASES = [
  {
    name: "Acute Coronary Syndrome (STEMI/NSTEMI)",
    age: 58,
    sex: "Male",
    symptoms: "crushing substernal chest pain, radiation to left arm and jaw, diaphoresis, shortness of breath, clammy skin",
    duration: "3 hours",
    severity: "Critical",
    medical_history: "Hypertension, 20 pack-year smoking history, CAD",
    current_medications: "Aspirin 81mg, Atorvastatin 40mg",
    vitals: { heart_rate: 110, systolic_bp: 165, diastolic_bp: 100, temperature: 36.8, spo2: 93 },
    clinical_narrative: "58-year-old male presents to the ED with severe crushing substernal chest pain that began suddenly 3 hours ago while resting. Pain radiates to the left jaw and left arm. Associated with profuse diaphoresis and acute shortness of breath. No relief with sublingual nitroglycerin."
  },
  {
    name: "Community-Acquired Pneumonia",
    age: 67,
    sex: "Female",
    symptoms: "productive cough with rust-colored sputum, high spiking fever, pleuritic chest pain on inspiration, dyspnea, chills",
    duration: "4 days",
    severity: "Severe",
    medical_history: "COPD, prior upper respiratory infection",
    current_medications: "Albuterol inhaler PRN",
    vitals: { heart_rate: 105, systolic_bp: 125, diastolic_bp: 75, temperature: 39.2, spo2: 91 },
    clinical_narrative: "67-year-old female presents with 4 days of progressive fever, rigors, and productive cough with purulent rust-colored sputum. Endorses sharp right-sided chest pain exacerbated by deep inspiration and coughing. Physical exam reveals bronchial breath sounds and crackles over right lower lung base."
  },
  {
    name: "Acute Appendicitis",
    age: 22,
    sex: "Male",
    symptoms: "periumbilical pain migrating to right lower quadrant, McBurney point tenderness, anorexia, nausea and vomiting, low grade fever",
    duration: "18 hours",
    severity: "Severe",
    medical_history: "No significant past medical history",
    current_medications: "None",
    vitals: { heart_rate: 98, systolic_bp: 118, diastolic_bp: 76, temperature: 38.1, spo2: 99 },
    clinical_narrative: "22-year-old male presents with acute abdominal pain starting periumbilically 18 hours ago and localizing intensely to the right lower quadrant. Accompanied by anorexia, nausea, and two episodes of non-bilious vomiting. Marked tenderness at McBurney's point with rebound and guarding."
  },
  {
    name: "Acute Ischemic Stroke",
    age: 71,
    sex: "Female",
    symptoms: "sudden right-sided hemiparesis, right facial droop, expressive aphasia, slurred speech, confusion",
    duration: "1.5 hours",
    severity: "Critical",
    medical_history: "Atrial fibrillation (non-adherent to anticoagulants), Hypertension",
    current_medications: "Amlodipine 5mg",
    vitals: { heart_rate: 88, systolic_bp: 195, diastolic_bp: 110, temperature: 36.9, spo2: 96 },
    clinical_narrative: "71-year-old female brought by EMS with acute onset right arm and leg weakness and severe difficulty speaking, noted by family 90 minutes ago. Exam demonstrates right facial droop, dense right hemiplegia, and expressive aphasia. Last known well time was 2 hours prior."
  }
];

export const ClinicalAnalysisPage: React.FC = () => {
  // Form state
  const [age, setAge] = useState<number>(58);
  const [sex, setSex] = useState<string>("Male");
  const [symptoms, setSymptoms] = useState<string>("crushing substernal chest pain, radiation to left arm and jaw, diaphoresis, shortness of breath");
  const [duration, setDuration] = useState<string>("3 hours");
  const [severity, setSeverity] = useState<string>("Critical");
  const [history, setHistory] = useState<string>("Hypertension, 20 pack-year smoking");
  const [medications, setMedications] = useState<string>("Aspirin 81mg, Atorvastatin 40mg");
  const [narrative, setNarrative] = useState<string>("Patient is a 58-year-old male presenting with severe substernal crushing chest pain radiating to left arm and jaw for 3 hours. Vital signs: HR 110, BP 165/100, Temp 36.8 C, SpO2 93%.");
  const [heartRate, setHeartRate] = useState<number>(110);
  const [bpSys, setBpSys] = useState<number>(165);
  const [bpDia, setBpDia] = useState<number>(100);
  const [temperature, setTemperature] = useState<number>(36.8);
  const [spo2, setSpo2] = useState<number>(93);
  const [selectedMLModel, setSelectedMLModel] = useState<string>("Logistic Regression");

  // Analysis result & pipeline state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [activeStage, setActiveStage] = useState<number>(0);
  const [result, setResult] = useState<ClinicalAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPreset = (preset: typeof PRESET_CASES[0]) => {
    setAge(preset.age);
    setSex(preset.sex);
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

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    setActiveStage(1);

    const payload: ClinicalAnalysisRequest = {
      age: Number(age),
      sex,
      symptoms,
      duration,
      severity,
      medical_history: history,
      current_medications: medications,
      clinical_narrative: narrative,
      selected_ml_model: selectedMLModel,
      vitals: {
        heart_rate: Number(heartRate),
        systolic_bp: Number(bpSys),
        diastolic_bp: Number(bpDia),
        temperature: Number(temperature),
        spo2: Number(spo2)
      }
    };

    try {
      // Simulate live stage stepper for visual animation
      const interval = setInterval(() => {
        setActiveStage(prev => Math.min(prev + 1, 7));
      }, 150);

      const response = await runClinicalAnalysis(payload);
      clearInterval(interval);
      setActiveStage(8);
      setResult(response);
    } catch (err: any) {
      setError(err.message || "Clinical analysis execution failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Clinical AI Research Console</h1>
            <span className="text-[11px] font-mono-tech px-2 py-0.5 rounded bg-ai/10 text-ai border border-ai/20">
              ORCHESTRATOR v1.0
            </span>
          </div>
          <p className="text-xs text-dark-secondary mt-1">
            Multimodal clinical case evaluation: Classical ML Baseline + Medical BioBERT + Vector RAG + LLM Grounding.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono-tech text-dark-muted">Load Preset:</span>
          {PRESET_CASES.map((p, idx) => (
            <button
              key={idx}
              onClick={() => loadPreset(p)}
              className="px-2.5 py-1 text-xs rounded-button bg-dark-surface hover:bg-dark-elevated text-dark-text border border-dark-strongBorder transition-all"
            >
              {p.name.split(' ')[0]} {p.name.split(' ')[1] || ''}
            </button>
          ))}
        </div>
      </div>

      {/* Main Console Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Patient Case Input */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 rounded-card bg-dark-surface border border-dark-border space-y-4">
            <div className="flex items-center justify-between border-b border-dark-border pb-3">
              <span className="text-xs font-semibold text-dark-secondary font-mono-tech uppercase">
                Patient Clinical Profile
              </span>
              <span className="text-[11px] font-mono-tech text-ai">CASE DATA ENTRY</span>
            </div>

            {/* Demographics & Severity */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-medium text-dark-secondary block mb-1">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-button bg-dark-deep border border-dark-border text-xs text-dark-text focus:border-ai focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-dark-secondary block mb-1">Sex</label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-button bg-dark-deep border border-dark-border text-xs text-dark-text focus:border-ai focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-dark-secondary block mb-1">Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-button bg-dark-deep border border-dark-border text-xs text-dark-text focus:border-ai focus:outline-none"
                >
                  <option value="Mild">Mild</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Symptoms */}
            <div>
              <label className="text-[11px] font-medium text-dark-secondary block mb-1">Chief Symptoms</label>
              <input
                type="text"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="e.g. chest pain, shortness of breath, diaphoresis"
                className="w-full px-3 py-2 rounded-button bg-dark-deep border border-dark-border text-xs text-dark-text focus:border-ai focus:outline-none font-mono-tech"
              />
            </div>

            {/* Vitals Signs Grid */}
            <div>
              <label className="text-[11px] font-semibold text-dark-secondary block mb-1.5 font-mono-tech uppercase">
                Objective Vital Signs
              </label>
              <div className="grid grid-cols-5 gap-2">
                <div className="p-2 rounded bg-dark-deep border border-dark-border text-center">
                  <span className="text-[9px] font-mono-tech text-dark-muted block">HR (bpm)</span>
                  <input
                    type="number"
                    value={heartRate}
                    onChange={(e) => setHeartRate(Number(e.target.value))}
                    className="w-full text-center bg-transparent text-xs font-mono-tech font-bold text-dark-text focus:outline-none"
                  />
                </div>
                <div className="p-2 rounded bg-dark-deep border border-dark-border text-center">
                  <span className="text-[9px] font-mono-tech text-dark-muted block">SBP (mmHg)</span>
                  <input
                    type="number"
                    value={bpSys}
                    onChange={(e) => setBpSys(Number(e.target.value))}
                    className="w-full text-center bg-transparent text-xs font-mono-tech font-bold text-dark-text focus:outline-none"
                  />
                </div>
                <div className="p-2 rounded bg-dark-deep border border-dark-border text-center">
                  <span className="text-[9px] font-mono-tech text-dark-muted block">DBP (mmHg)</span>
                  <input
                    type="number"
                    value={bpDia}
                    onChange={(e) => setBpDia(Number(e.target.value))}
                    className="w-full text-center bg-transparent text-xs font-mono-tech font-bold text-dark-text focus:outline-none"
                  />
                </div>
                <div className="p-2 rounded bg-dark-deep border border-dark-border text-center">
                  <span className="text-[9px] font-mono-tech text-dark-muted block">Temp (°C)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="w-full text-center bg-transparent text-xs font-mono-tech font-bold text-dark-text focus:outline-none"
                  />
                </div>
                <div className="p-2 rounded bg-dark-deep border border-dark-border text-center">
                  <span className="text-[9px] font-mono-tech text-dark-muted block">SpO2 (%)</span>
                  <input
                    type="number"
                    value={spo2}
                    onChange={(e) => setSpo2(Number(e.target.value))}
                    className="w-full text-center bg-transparent text-xs font-mono-tech font-bold text-dark-text focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Narrative & History */}
            <div>
              <label className="text-[11px] font-medium text-dark-secondary block mb-1">
                Clinical Narrative / Encounter Notes
              </label>
              <textarea
                rows={3}
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                className="w-full p-2.5 rounded-button bg-dark-deep border border-dark-border text-xs text-dark-text focus:border-ai focus:outline-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-dark-secondary block mb-1">Past History</label>
                <input
                  type="text"
                  value={history}
                  onChange={(e) => setHistory(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-button bg-dark-deep border border-dark-border text-xs text-dark-text focus:border-ai focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-dark-secondary block mb-1">Current Meds</label>
                <input
                  type="text"
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-button bg-dark-deep border border-dark-border text-xs text-dark-text focus:border-ai focus:outline-none"
                />
              </div>
            </div>

            {/* Classical Model Selection */}
            <div>
              <label className="text-[11px] font-mono-tech text-dark-secondary block mb-1">
                Baseline Classical ML Engine:
              </label>
              <select
                value={selectedMLModel}
                onChange={(e) => setSelectedMLModel(e.target.value)}
                className="w-full px-3 py-1.5 rounded-button bg-dark-deep border border-dark-strongBorder text-xs text-dark-text font-mono-tech focus:border-ai focus:outline-none"
              >
                <option value="Logistic Regression">Logistic Regression (L2 Regularized)</option>
                <option value="Random Forest">Random Forest (150 Trees)</option>
                <option value="XGBoost">XGBoost (Gradient Boosted Trees)</option>
              </select>
            </div>

            {/* Submit Action */}
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full py-3.5 rounded-button bg-ai hover:bg-ai-hover text-white text-xs font-semibold shadow-lg shadow-ai/25 hover:shadow-ai/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Executing 10-Stage AI Pipeline...</span>
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  <span>RUN CLINICAL ANALYSIS</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: AI Pipeline & Results */}
        <div className="lg:col-span-7 space-y-5">
          {/* Live Pipeline Tracker */}
          <LivePipelineTracker
            isAnalyzing={isAnalyzing}
            activeStageIndex={activeStage}
            timings={result?.processing_time}
          />

          {error && (
            <div className="p-4 rounded-button bg-semantic-critical/15 border border-semantic-critical/40 text-semantic-critical text-xs">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-5">
              {/* Primary Differential & Confidence */}
              <DifferentialCard
                differentials={result.top_differentials}
                primaryPrediction={result.transformer_prediction.predicted_condition}
                confidence={result.confidence.combined_score}
              />

              {/* Dual Intelligence Comparison Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-card bg-dark-surface border border-dark-border space-y-1">
                  <div className="flex justify-between items-center text-xs font-mono-tech">
                    <span className="text-dark-muted">CLASSICAL ML ({result.ml_prediction.model_name})</span>
                    <span className="text-semantic-success">{result.ml_prediction.confidence_percentage}</span>
                  </div>
                  <h4 className="text-base font-bold text-dark-text">{result.ml_prediction.predicted_condition}</h4>
                  <p className="text-[10px] font-mono-tech text-dark-muted">
                    Inference: {result.ml_prediction.inference_time_ms}ms
                  </p>
                </div>

                <div className="p-4 rounded-card bg-dark-surface border border-dark-border space-y-1">
                  <div className="flex justify-between items-center text-xs font-mono-tech">
                    <span className="text-ai">BIOBERT TRANSFORMER</span>
                    <span className="text-ai">{result.transformer_prediction.confidence_percentage}</span>
                  </div>
                  <h4 className="text-base font-bold text-dark-text">{result.transformer_prediction.predicted_condition}</h4>
                  <p className="text-[10px] font-mono-tech text-dark-muted">
                    Concordance: {result.concordance.concordance_level}
                  </p>
                </div>
              </div>

              {/* Safety Alerts & Red Flags */}
              <SafetyBanner flags={result.safety_flags} disclaimer={result.disclaimer} />

              {/* RAG Evidence Cards */}
              <EvidenceCard evidence={result.retrieved_evidence} />

              {/* LLM Clinical Synthesis */}
              <div className="p-5 rounded-card bg-dark-surface border border-dark-border space-y-3">
                <div className="flex items-center justify-between border-b border-dark-border pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-ai" />
                    <h3 className="text-base font-semibold text-dark-text">AI Clinical Guidance & Synthesis</h3>
                  </div>
                  <span className="text-xs font-mono-tech text-dark-muted">
                    Provider: {result.llm_explanation.provider}
                  </span>
                </div>

                <div className="text-xs text-dark-text leading-relaxed whitespace-pre-line bg-dark-deep p-4 rounded border border-dark-border font-sans space-y-2">
                  {result.llm_explanation.explanation_markdown}
                </div>

                <div className="pt-2 text-[10px] font-mono-tech text-dark-muted flex justify-between">
                  <span>Case Reference: {result.case_id}</span>
                  <span>Database Status: {result.database_persisted ? "✓ Stored in PostgreSQL" : "Local"}</span>
                </div>
              </div>
            </div>
          )}

          {!result && !isAnalyzing && (
            <div className="p-12 rounded-card bg-dark-surface/50 border border-dashed border-dark-border text-center space-y-3">
              <Activity className="w-8 h-8 text-dark-muted mx-auto" />
              <p className="text-xs text-dark-secondary">
                Select a preset patient case or enter clinical symptoms and click <strong className="text-dark-text">RUN CLINICAL ANALYSIS</strong> to initiate the full machine learning, Transformer, RAG, and LLM pipeline.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
