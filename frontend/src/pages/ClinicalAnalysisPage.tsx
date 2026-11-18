import React, { useState, useRef } from 'react';
import { SectionHeader } from '../components/SectionHeader';
import { LivePipelineTracker, PipelineStepState } from '../components/LivePipelineTracker';
import { StatusDot } from '../components/StatusDot';
import { analyzeMultimodal } from '../services/api';
import { MultimodalAnalysisResponse } from '../types';
import { Upload, X, Sliders, ShieldAlert, Sparkles, Check } from 'lucide-react';

type TriState = 'yes' | 'no' | 'not_sure';

export const ClinicalAnalysisPage: React.FC = () => {
  // Input states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string } | null>(null);

  // Six symptom segmented controls: yes / no / not_sure
  const [symptoms, setSymptoms] = useState<Record<string, TriState>>({
    itch: 'not_sure',
    grew: 'not_sure',
    hurt: 'not_sure',
    changed: 'not_sure',
    bleed: 'not_sure',
    elevation: 'not_sure',
  });

  // Patient profile
  const [age, setAge] = useState<string>('58');
  const [region, setRegion] = useState<string>('FACE');
  const [diameter1, setDiameter1] = useState<string>('12.0');
  const [diameter2, setDiameter2] = useState<string>('10.0');
  const [narrativeText, setNarrativeText] = useState<string>('');

  // UI & Response states
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MultimodalAnalysisResponse | null>(null);

  // Visual Inspection Controls
  const [gradCamOpacity, setGradCamOpacity] = useState<number>(75);
  const [viewMode, setViewMode] = useState<'overlay' | 'original'>('overlay');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const symptomLabels: Record<string, string> = {
    itch: 'Itches (itch)',
    grew: 'Has grown (grew)',
    hurt: 'Hurts (hurt)',
    changed: 'Has changed (changed)',
    bleed: 'Bleeds easily (bleed)',
    elevation: 'Raised (elevation)',
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFileDetails({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      });
      const reader = new FileReader();
      reader.onload = (evt) => setImagePreview(evt.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setFileDetails(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSymptomChange = (key: string, val: TriState) => {
    setSymptoms((prev) => ({ ...prev, [key]: val }));
  };

  const hasAnyInput = selectedFile !== null || Object.values(symptoms).some((v) => v !== 'not_sure') || narrativeText.trim().length > 0;

  // Pipeline execution tracking
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStepState[]>([
    { id: 'input', name: 'Input Acquisition', status: 'ready', detail: 'Waiting for inputs' },
    { id: 'quality', name: 'Quality Assessment', status: 'offline' },
    { id: 'restore', name: 'U-Net Restoration', status: 'offline' },
    { id: 'img_model', name: 'EfficientNet-B0', status: 'offline' },
    { id: 'txt_model', name: 'TF-IDF Linear SVM', status: 'offline' },
    { id: 'fusion', name: 'Quality-Aware Gated Fusion', status: 'offline' },
    { id: 'xai', name: 'Grad-CAM++ & Text Attributions', status: 'offline' },
    { id: 'evidence', name: 'Evidence Retrieval', status: 'offline' },
    { id: 'safety', name: 'Safety Rule Audit', status: 'offline' },
    { id: 'summary', name: 'Grounded Clinical Summary', status: 'offline' },
  ]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  };

  const runAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAnyInput) return;

    setError(null);
    setLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Update pipeline trace to loading
    setPipelineSteps((prev) =>
      prev.map((s, idx) => (idx === 0 ? { ...s, status: 'ready', detail: 'Submitted' } : { ...s, status: 'loading' }))
    );

    const formData = new FormData();
    if (selectedFile) formData.append('image', selectedFile);
    if (narrativeText.trim()) formData.append('narrative', narrativeText.trim());

    // Append symptom values: yes -> true, no -> false, not_sure -> omitted
    Object.entries(symptoms).forEach(([k, v]) => {
      if (v === 'yes') formData.append(k, 'true');
      else if (v === 'no') formData.append(k, 'false');
    });

    if (age.trim()) formData.append('age', age.trim());
    if (region.trim()) formData.append('region', region.trim());
    if (diameter1.trim()) formData.append('diameter_1', diameter1.trim());
    if (diameter2.trim()) formData.append('diameter_2', diameter2.trim());

    try {
      const resp = await analyzeMultimodal(formData, controller.signal);
      setResult(resp);

      // Update pipeline trace with actual execution outcomes and timings
      setPipelineSteps([
        { id: 'input', name: 'Input Acquisition', status: 'ready', detail: selectedFile ? 'Image + Symptoms' : 'Text-only', durationMs: 0 },
        { id: 'quality', name: 'Quality Assessment', status: 'ready', detail: `q = ${resp.quality.q.toFixed(2)}`, durationMs: resp.timings_ms?.quality },
        {
          id: 'restore',
          name: 'U-Net Restoration',
          status: 'ready',
          detail: resp.enhancement_applied ? 'U-Net restored' : 'skipped — quality sufficient',
          durationMs: resp.timings_ms?.restoration
        },
        { id: 'img_model', name: 'EfficientNet-B0', status: 'ready', detail: '1280-d features', durationMs: resp.timings_ms?.image },
        { id: 'txt_model', name: 'TF-IDF Linear SVM', status: 'ready', detail: '4-d logits', durationMs: resp.timings_ms?.text },
        { id: 'fusion', name: 'Quality-Aware Gated Fusion', status: 'ready', detail: `Image weight: ${(resp.modality_weights.image * 100).toFixed(0)}%`, durationMs: resp.timings_ms?.fusion },
        { id: 'xai', name: 'Grad-CAM++ & Text Attributions', status: 'ready', detail: 'Generated', durationMs: resp.timings_ms?.xai },
        { id: 'evidence', name: 'Evidence Retrieval', status: 'ready', detail: `${resp.prediction} Guideline`, durationMs: resp.timings_ms?.evidence },
        { id: 'safety', name: 'Safety Rule Audit', status: resp.safety_alert ? 'degraded' : 'ready', detail: resp.safety_alert ? 'Alert flagged' : 'Clean', durationMs: resp.timings_ms?.safety },
        { id: 'summary', name: 'Grounded Clinical Summary', status: resp.summary_status === 'unavailable' ? 'degraded' : 'ready', detail: resp.summary_status === 'unavailable' ? 'Unavailable' : 'Synthesized', durationMs: resp.timings_ms?.summary },
      ]);
    } catch (err: any) {
      setError(err?.message || 'Multimodal analysis failed.');
      setPipelineSteps((prev) =>
        prev.map((s) => (s.status === 'loading' ? { ...s, status: 'error', detail: 'Failed' } : s))
      );
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
    }
  };

  const classFullNameMap: Record<string, string> = {
    BCC: 'Basal cell carcinoma',
    ACK: 'Actinic keratosis',
    NEV: 'Melanocytic nevus',
    SEK: 'Seborrheic keratosis',
  };

  return (
    <div className="w-full bg-white pb-24">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12">
        {/* Header */}
        <SectionHeader
          label="CLINICAL INFERENCE ENGINE"
          title="Clinical Analysis"
          subtitle="Evaluate a skin lesion photo and the patient's symptoms through the complete MEDINTEL pipeline."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Clinical Input */}
          <div className="lg:col-span-7 space-y-8">
            <form onSubmit={runAnalysis} className="space-y-8">
              {/* 1. Lesion Photo */}
              <div className="space-y-3 pb-6 border-b border-hairline">
                <div className="flex items-center justify-between">
                  <span className="font-micro text-ink-faint">01 · LESION PHOTOGRAPH</span>
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="text-xs text-status-error hover:underline flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Remove photo
                    </button>
                  )}
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed rounded-[8px] p-6 text-center cursor-pointer transition-colors ${
                    imagePreview ? 'border-hairline bg-paper' : 'border-hairline hover:border-ink-muted bg-paper'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                  />
                  {imagePreview ? (
                    <div className="space-y-2">
                      <img
                        src={imagePreview}
                        alt="Uploaded lesion photo"
                        className="max-h-48 mx-auto rounded object-contain border border-hairline"
                      />
                      <div className="font-caption text-xs text-ink-muted">
                        {fileDetails?.name} ({fileDetails?.size})
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 space-y-2">
                      <Upload className="w-6 h-6 mx-auto text-ink-muted" />
                      <p className="font-body text-sm text-ink font-medium">
                        Upload or take a photo
                      </p>
                      <p className="font-caption text-xs text-ink-muted">
                        JPEG or PNG, up to 10 MB. Taken with a standard smartphone camera.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Symptoms Segmented Controls */}
              <div className="space-y-3 pb-6 border-b border-hairline">
                <span className="font-micro text-ink-faint block">02 · REPORTED SYMPTOMS</span>
                <p className="font-caption text-xs text-ink-muted">
                  Select symptom dynamics observed by the patient over recent weeks or months.
                </p>

                <div className="space-y-2 pt-2">
                  {Object.entries(symptomLabels).map(([key, label]) => {
                    const currentVal = symptoms[key];
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between py-2 border-b border-hairline last:border-b-0 text-xs"
                      >
                        <span className="font-body text-xs text-ink">{label}</span>
                        <div className="inline-flex rounded border border-hairline p-0.5 bg-paper text-[11px]">
                          {(['yes', 'no', 'not_sure'] as TriState[]).map((opt) => (
                            <button
                              type="button"
                              key={opt}
                              onClick={() => handleSymptomChange(key, opt)}
                              className={`px-3 py-1 rounded transition-colors ${
                                currentVal === opt
                                  ? 'bg-indigo text-white font-medium shadow-xs'
                                  : 'text-ink-muted hover:text-ink'
                              }`}
                            >
                              {opt === 'yes' ? 'Yes' : opt === 'no' ? 'No' : 'Not sure'}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Patient Profile */}
              <div className="space-y-3 pb-6 border-b border-hairline">
                <span className="font-micro text-ink-faint block">03 · PATIENT & LESION PROFILE</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
                  <div>
                    <label className="font-caption text-[11px] text-ink-muted block mb-1">Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full bg-white border border-hairline rounded px-3 py-2 text-ink focus:outline-none focus:border-indigo"
                    />
                  </div>

                  <div>
                    <label className="font-caption text-[11px] text-ink-muted block mb-1">Body Region</label>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full bg-white border border-hairline rounded px-2.5 py-2 text-ink focus:outline-none focus:border-indigo"
                    >
                      <option value="FACE">Face</option>
                      <option value="ARM">Arm</option>
                      <option value="FOREARM">Forearm</option>
                      <option value="HAND">Hand</option>
                      <option value="NECK">Neck</option>
                      <option value="CHEST">Chest</option>
                      <option value="BACK">Back</option>
                      <option value="ABDOMEN">Abdomen</option>
                      <option value="THIGH">Thigh</option>
                      <option value="SCALP">Scalp</option>
                      <option value="EAR">Ear</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-caption text-[11px] text-ink-muted block mb-1">Diameter 1 (mm)</label>
                    <input
                      type="text"
                      value={diameter1}
                      onChange={(e) => setDiameter1(e.target.value)}
                      className="w-full bg-white border border-hairline rounded px-3 py-2 text-ink font-mono focus:outline-none focus:border-indigo"
                    />
                  </div>

                  <div>
                    <label className="font-caption text-[11px] text-ink-muted block mb-1">Diameter 2 (mm)</label>
                    <input
                      type="text"
                      value={diameter2}
                      onChange={(e) => setDiameter2(e.target.value)}
                      className="w-full bg-white border border-hairline rounded px-3 py-2 text-ink font-mono focus:outline-none focus:border-indigo"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Free text (optional) */}
              <div className="space-y-2 pb-6 border-b border-hairline">
                <span className="font-micro text-ink-faint block">04 · NARRATIVE NOTE (OPTIONAL)</span>
                <label className="font-caption text-xs text-ink-muted block">
                  Describe the lesion in your own words (or leave blank to auto-generate from clinical fields):
                </label>
                <textarea
                  value={narrativeText}
                  onChange={(e) => setNarrativeText(e.target.value)}
                  rows={2}
                  placeholder="e.g. Patient presents with an elevated bleeding nodule on the face that has enlarged..."
                  className="w-full bg-paper border border-hairline rounded-[8px] p-3 text-xs text-ink focus:outline-none focus:border-indigo"
                />
              </div>

              {/* Error display */}
              {error && (
                <div className="p-4 bg-paper border border-status-error/40 rounded text-xs text-status-error">
                  {error}
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    type="submit"
                    disabled={loading || !hasAnyInput}
                    className="inline-flex items-center gap-2 bg-indigo text-white font-button px-6 py-3.5 rounded-[8px] hover:opacity-90 disabled:opacity-40 transition-opacity focus:outline-none focus:ring-2 focus:ring-violet focus:ring-offset-2"
                  >
                    {loading ? 'Evaluating Multimodal Inputs...' : 'Run Clinical Analysis →'}
                  </button>
                  {loading && (
                    <button
                      type="button"
                      onClick={cancelAnalysis}
                      className="font-button text-xs text-status-error hover:underline px-2 py-1"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {!selectedFile && hasAnyInput && (
                  <span className="font-caption text-xs text-ink-muted italic">
                    No photo — text-only prediction
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Right Column: Live Pipeline Trace (Sticky on desktop) */}
          <div className="lg:col-span-5 lg:sticky lg:top-8">
            <LivePipelineTracker steps={pipelineSteps} />
          </div>
        </div>

        {/* Clinical Result (Report Style, Revealed on result) */}
        {result && (
          <div className="pt-16 border-t border-hairline space-y-12 animate-fadeIn">
            <div>
              <span className="font-micro text-ink-faint block mb-1">CLINICAL ASSESSMENT REPORT</span>
              <h2 className="font-section text-ink">Multimodal Decision Trace</h2>
            </div>

            {/* 1. Model Prediction & Read-Only Architecture Callout */}
            <div className="p-8 bg-paper border border-hairline rounded-[12px] space-y-4">
              <span className="font-micro text-ink-faint block">PREDICTED CLASS</span>
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
                <div>
                  <h3 className="font-section text-ink text-4xl sm:text-5xl">
                    {classFullNameMap[result.prediction] || result.prediction}
                  </h3>
                  <p className="font-caption text-ink-muted mt-1">
                    Diagnostic Abbreviation: <span className="font-mono font-bold text-ink">{result.prediction}</span>
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="font-micro text-ink-faint block">MODEL PROBABILITY</span>
                  <span className="font-hero text-indigo tabular-nums text-4xl sm:text-5xl font-mono">
                    {(result.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-ink-muted">
                <span>Model: quality-aware gated fusion (EfficientNet-B0 image encoder + TF-IDF Linear SVM)</span>
                <span className="font-semibold text-ink">Research decision-support prototype. Not a diagnostic device.</span>
              </div>
            </div>

            {/* 2. Class Probabilities (Horizontal bar chart) */}
            <div className="bg-white border border-hairline rounded-[12px] p-6 space-y-4">
              <span className="font-micro text-ink-faint block">CLASS PROBABILITIES</span>
              <div className="space-y-3">
                {['BCC', 'ACK', 'NEV', 'SEK'].map((cls) => {
                  const prob = result.probabilities[cls] || 0.0;
                  const isPredicted = cls === result.prediction;
                  return (
                    <div key={cls} className="space-y-1 text-xs">
                      <div className="flex justify-between items-baseline">
                        <span className={`font-mono ${isPredicted ? 'font-bold text-indigo' : 'text-ink-muted'}`}>
                          {cls} — {classFullNameMap[cls]}
                        </span>
                        <span className={`font-mono tabular-nums ${isPredicted ? 'font-bold text-indigo' : 'text-ink-muted'}`}>
                          {(prob * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-paper rounded-full overflow-hidden border border-hairline">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isPredicted ? 'bg-indigo' : 'bg-ink-muted/30'
                          }`}
                          style={{ width: `${Math.max(prob * 100, 1.5)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3 & 4. Image Quality & Original vs Restored */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Quality Metrics */}
              <div className="bg-white border border-hairline rounded-[12px] p-6 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-hairline">
                  <span className="font-micro text-ink-faint">IMAGE QUALITY SCORE (q)</span>
                  <span className="font-mono text-sm font-bold text-indigo tabular-nums">
                    q = {result.quality.q.toFixed(3)}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-ink-muted mb-1">
                      <span>Sharpness (Laplacian variance)</span>
                      <span className="font-mono text-ink tabular-nums">{result.quality.blur.toFixed(1)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-paper rounded-full overflow-hidden border border-hairline">
                      <div
                        className="h-full bg-indigo"
                        style={{ width: `${Math.min(result.quality.blur / 3, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-ink-muted mb-1">
                      <span>Lightness (LAB L Channel)</span>
                      <span className="font-mono text-ink tabular-nums">{result.quality.brightness.toFixed(1)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-paper rounded-full overflow-hidden border border-hairline">
                      <div
                        className="h-full bg-indigo"
                        style={{ width: `${Math.min((result.quality.brightness / 255) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-ink-muted mb-1">
                      <span>Estimated Noise (Sigma)</span>
                      <span className="font-mono text-ink tabular-nums">{result.quality.noise.toFixed(2)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-paper rounded-full overflow-hidden border border-hairline">
                      <div
                        className="h-full bg-indigo"
                        style={{ width: `${Math.min((result.quality.noise / 25) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-hairline flex items-center justify-between text-xs text-ink-muted">
                  <span>Restoration Decision:</span>
                  <span className="font-medium text-ink">
                    {result.enhancement_applied
                      ? `Applied (${result.enhancement_method.toUpperCase()})`
                      : 'Skipped — quality sufficient (q ≥ 0.55)'}
                  </span>
                </div>
              </div>

              {/* Side-by-Side Original vs Restored */}
              <div className="bg-white border border-hairline rounded-[12px] p-6 space-y-4">
                <span className="font-micro text-ink-faint block">MORPHOLOGICAL INSPECTION</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 text-center">
                    <span className="font-caption text-[11px] text-ink-muted block">Uploaded</span>
                    <div className="aspect-square bg-paper border border-hairline rounded overflow-hidden flex items-center justify-center">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Uploaded lesion photo" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-ink-muted">No photo</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 text-center">
                    <span className="font-caption text-[11px] text-ink-muted block">Restored (U-Net)</span>
                    <div className="aspect-square bg-paper border border-hairline rounded overflow-hidden flex items-center justify-center">
                      {result.enhanced_image_base64 ? (
                        <img
                          src={`data:image/png;base64,${result.enhanced_image_base64}`}
                          alt="Restored lesion photo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-ink-muted px-2">
                          {result.enhancement_applied ? 'Rendering...' : 'Quality clear — original retained'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Image Explanation: Grad-CAM++ with opacity slider & toggle */}
            {result.gradcam_base64 && (
              <div className="bg-white border border-hairline rounded-[12px] p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-hairline">
                  <div>
                    <span className="font-micro text-ink-faint block">VISUAL EXPLANATION</span>
                    <h4 className="font-card text-ink">Grad-CAM++ Morphological Attributions</h4>
                    <p className="font-caption text-xs text-ink-muted mt-0.5">
                      Legend: Violet to indigo highlights indicate higher influence on the prediction.
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* View Toggle */}
                    <div className="inline-flex rounded border border-hairline p-0.5 bg-paper text-xs">
                      <button
                        onClick={() => setViewMode('overlay')}
                        className={`px-3 py-1 rounded transition-colors ${
                          viewMode === 'overlay' ? 'bg-indigo text-white font-medium' : 'text-ink-muted hover:text-ink'
                        }`}
                      >
                        Overlay
                      </button>
                      <button
                        onClick={() => setViewMode('original')}
                        className={`px-3 py-1 rounded transition-colors ${
                          viewMode === 'original' ? 'bg-indigo text-white font-medium' : 'text-ink-muted hover:text-ink'
                        }`}
                      >
                        Original
                      </button>
                    </div>

                    {/* Opacity Slider */}
                    {viewMode === 'overlay' && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-micro text-[10px] text-ink-faint">OPACITY</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={gradCamOpacity}
                          onChange={(e) => setGradCamOpacity(Number(e.target.value))}
                          className="w-24 accent-indigo cursor-pointer"
                        />
                        <span className="font-mono text-[11px] text-ink-muted w-8 tabular-nums">
                          {gradCamOpacity}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="max-w-md mx-auto aspect-square bg-paper border border-hairline rounded overflow-hidden relative">
                  {/* Base Image */}
                  <img
                    src={
                      result.enhanced_image_base64
                        ? `data:image/png;base64,${result.enhanced_image_base64}`
                        : imagePreview || ''
                    }
                    alt="Uploaded lesion photo"
                    className="w-full h-full object-cover absolute inset-0"
                  />
                  {/* Grad-CAM++ layer */}
                  {viewMode === 'overlay' && (
                    <img
                      src={`data:image/png;base64,${result.gradcam_base64}`}
                      alt="Grad-CAM++ overlay"
                      style={{ opacity: gradCamOpacity / 100 }}
                      className="w-full h-full object-cover absolute inset-0 mix-blend-multiply"
                    />
                  )}
                </div>
              </div>
            )}

            {/* 6. Text Explanation (Narrative + Top 5 N-grams) */}
            <div className="bg-white border border-hairline rounded-[12px] p-6 space-y-4">
              <span className="font-micro text-ink-faint block">TEXT EXPLANATION</span>
              <h4 className="font-card text-ink">Exact Linear Attributions (Linear SVM)</h4>
              <p className="font-caption text-xs text-ink-muted">
                Highlighted n-grams contributed directly to predicted log-odds (<span className="font-mono">TF-IDF × w</span>). Violet background indicates positive support; underlined text indicates negative weight.
              </p>

              {/* Patient Narrative Display */}
              <div className="p-4 bg-paper border border-hairline rounded-[8px] font-body text-sm leading-relaxed text-ink">
                {result.narrative_used}
              </div>

              {/* Top 5 list with signed weights */}
              {result.text_attributions && result.text_attributions.length > 0 && (
                <div className="pt-2">
                  <span className="font-micro text-ink-faint block mb-2">TOP SALIENT FEATURES (EXACT WEIGHTS)</span>
                  <div className="flex flex-wrap gap-2">
                    {result.text_attributions.slice(0, 5).map((attr, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-paper border border-hairline text-xs"
                      >
                        <span className="font-medium text-ink font-mono">"{attr.ngram}"</span>
                        <span className={`font-mono text-[11px] tabular-nums ${attr.weight >= 0 ? 'text-indigo' : 'text-ink-muted underline'}`}>
                          {attr.weight >= 0 ? `+${attr.weight.toFixed(3)}` : attr.weight.toFixed(3)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 7. Modality Contribution Bar */}
            <div className="bg-white border border-hairline rounded-[12px] p-6 space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="font-micro text-ink-faint">MODALITY CONTRIBUTION</span>
                <span className="font-mono text-xs text-ink-muted tabular-nums">
                  Image: {(result.modality_weights.image * 100).toFixed(1)}% · Clinical Text: {(result.modality_weights.text * 100).toFixed(1)}%
                </span>
              </div>

              {/* Split Bar */}
              <div className="w-full h-3 rounded-full bg-paper overflow-hidden flex border border-hairline">
                <div
                  className="h-full bg-indigo transition-all duration-300"
                  style={{ width: `${result.modality_weights.image * 100}%` }}
                />
                <div
                  className="h-full bg-ink-muted/40 transition-all duration-300"
                  style={{ width: `${result.modality_weights.text * 100}%` }}
                />
              </div>

              <p className="font-caption text-xs text-ink-muted">
                The model relied more on the {result.modality_weights.image >= 0.5 ? 'image' : 'symptoms'} for this case.
              </p>
            </div>

            {/* 8. Evidence Retrieval Rows */}
            <div className="bg-white border border-hairline rounded-[12px] p-6 space-y-4">
              <span className="font-micro text-ink-faint block">EVIDENCE RETRIEVAL</span>
              <h4 className="font-card text-ink">Clinical Guideline Concordance</h4>

              <div className="divide-y divide-hairline border-y border-hairline">
                <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-mono text-ink font-semibold">knowledge/diseases/{result.prediction.toLowerCase()}.md</span>
                    <p className="font-caption text-ink-muted mt-0.5">
                      {result.clinical_summary || 'Diagnostic criteria, morphology, and recommended clinical management pathway.'}
                    </p>
                  </div>
                  <span className="font-micro text-ink-faint shrink-0">SOURCE GUIDELINE</span>
                </div>
              </div>
            </div>

            {/* 9. Safety Red-Flags */}
            <div className="bg-white border border-hairline rounded-[12px] p-6 space-y-3">
              <span className="font-micro text-ink-faint block">SAFETY AUDIT</span>
              {result.safety_alert && (
                <div className="p-3 bg-paper border border-hairline rounded flex items-start gap-2.5 text-xs text-ink">
                  <StatusDot status="error" label="" />
                  <div>
                    <span className="font-medium text-status-error block">Red Flag Alert</span>
                    <p className="text-ink-muted mt-0.5">{result.safety_alert}</p>
                  </div>
                </div>
              )}
              <p className="font-caption text-xs text-ink-muted pt-1">
                See a dermatologist if the lesion bleeds, grows quickly or changes.
              </p>
            </div>

            {/* 10. Grounded Summary */}
            <div className="bg-white border border-hairline rounded-[12px] p-6 space-y-3">
              <span className="font-micro text-ink-faint block">GROUNDED SUMMARY</span>
              <p className="font-body text-sm text-ink leading-relaxed">
                Patient presenting with {result.narrative_used.toLowerCase()} evaluated through the quality-gated multimodal classifier.
                Primary prediction indicates <span className="font-semibold text-indigo">{classFullNameMap[result.prediction]}</span> ({result.prediction}) with a posterior probability of {(result.confidence * 100).toFixed(1)}%.
                Image quality score was calculated as q = {result.quality.q.toFixed(2)} ({result.enhancement_applied ? 'restored via PAD-UFES U-Net' : 'original quality retained'}).
              </p>
              <div className="pt-2 text-[11px] text-ink-faint border-t border-hairline flex justify-between">
                <span>Sources: PAD-UFES-20 Clinical Records & Knowledge Guidelines</span>
                <span>Verification: 5-Fold Grouped Stratification</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
