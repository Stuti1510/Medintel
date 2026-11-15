import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Info,
  Layers,
  Activity,
  ShieldCheck,
  RefreshCw,
  Eye,
  FileText
} from 'lucide-react';
import { analyzeMultimodal } from '../services/api';
import { MultimodalAnalysisResponse } from '../types';

export const ClinicalAnalysisPage: React.FC = () => {
  // Input states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [narrative, setNarrative] = useState('');
  
  // Structured checkboxes
  const [itch, setItch] = useState(false);
  const [grew, setGrew] = useState(false);
  const [hurt, setHurt] = useState(false);
  const [changed, setChanged] = useState(false);
  const [bleed, setBleed] = useState(false);
  const [elevation, setElevation] = useState(false);
  
  // Demographic & metadata
  const [age, setAge] = useState<string>('58');
  const [gender, setGender] = useState<string>('MALE');
  const [region, setRegion] = useState<string>('FACE');
  const [diameter, setDiameter] = useState<string>('12.0');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MultimodalAnalysisResponse | null>(null);
  const [showGradCam, setShowGradCam] = useState(true);
  const [showEnhanced, setShowEnhanced] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (event) => setImagePreview(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (event) => setImagePreview(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      if (selectedImage) {
        formData.append('image', selectedImage);
      }
      if (narrative.trim()) {
        formData.append('narrative', narrative.trim());
      }
      formData.append('itch', itch ? 'true' : 'false');
      formData.append('grew', grew ? 'true' : 'false');
      formData.append('hurt', hurt ? 'true' : 'false');
      formData.append('changed', changed ? 'true' : 'false');
      formData.append('bleed', bleed ? 'true' : 'false');
      formData.append('elevation', elevation ? 'true' : 'false');
      formData.append('age', age);
      formData.append('gender', gender);
      formData.append('region', region);
      formData.append('diameter_1', diameter);

      const response = await analyzeMultimodal(formData);
      setResult(response);
    } catch (err: any) {
      setError(err?.message || 'Multimodal analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const classDescriptions: Record<string, string> = {
    BCC: 'Basal Cell Carcinoma (Malignant skin cancer)',
    ACK: 'Actinic Keratosis (Pre-cancerous UV lesion)',
    NEV: 'Melanocytic Nevus (Benign mole)',
    SEK: 'Seborrheic Keratosis (Benign epidermal growth)',
  };

  return (
    <div className="space-y-8">
      {/* Read-Only Architecture Callout */}
      <div className="bg-slate-900/80 border border-sky-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">Deployed Model</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">Fixed Pipeline</span>
            </div>
            <p className="text-sm font-medium text-slate-200 mt-0.5">
              EfficientNet-B0 + TF-IDF Linear SVM, quality-aware gated fusion
            </p>
          </div>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-1.5 self-end sm:self-auto">
          <Info className="w-4 h-4 text-slate-500" />
          <span>Patient-grouped 5-fold cross-validated on PAD-UFES-20</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleAnalyze} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-sky-400" />
              Lesion Clinical Examination
            </h2>

            {/* Image Dropzone */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Smartphone Lesion Image</label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                  imagePreview
                    ? 'border-sky-500/50 bg-sky-950/10'
                    : 'border-slate-700 hover:border-slate-500 bg-slate-950/40'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                {imagePreview ? (
                  <div className="relative group">
                    <img
                      src={imagePreview}
                      alt="Selected lesion preview"
                      className="max-h-48 mx-auto rounded-lg object-contain shadow-md"
                    />
                    <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-xs text-slate-200">
                      Click or drag to change image
                    </div>
                  </div>
                ) : (
                  <div className="py-6 flex flex-col items-center justify-center text-slate-400">
                    <Upload className="w-8 h-8 mb-2 text-slate-500" />
                    <p className="text-sm font-medium text-slate-300">Click or drag smartphone photo here</p>
                    <p className="text-xs text-slate-500 mt-1">JPEG or PNG, up to 10MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Clinical Symptoms Checkboxes */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-slate-300">Patient Symptoms & Lesion Dynamics</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: 'Itching (itch)', state: itch, setter: setItch },
                  { label: 'Enlarging (grew)', state: grew, setter: setGrew },
                  { label: 'Painful (hurt)', state: hurt, setter: setHurt },
                  { label: 'Changed color/shape', state: changed, setter: setChanged },
                  { label: 'Bleeds easily (bleed)', state: bleed, setter: setBleed },
                  { label: 'Elevated / raised', state: elevation, setter: setElevation },
                ].map(({ label, state, setter }) => (
                  <label
                    key={label}
                    className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors ${
                      state
                        ? 'bg-sky-500/10 border-sky-500/40 text-sky-200'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={state}
                      onChange={(e) => setter(e.target.checked)}
                      className="rounded border-slate-700 text-sky-500 focus:ring-sky-400 focus:ring-offset-slate-900 bg-slate-900"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Patient Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Patient Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-sky-500 focus:outline-none"
                  placeholder="Age"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-sky-500 focus:outline-none"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Anatomical Region</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-sky-500 focus:outline-none"
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
                <label className="block text-slate-400 mb-1">Diameter (mm)</label>
                <input
                  type="text"
                  value={diameter}
                  onChange={(e) => setDiameter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-sky-500 focus:outline-none"
                  placeholder="e.g. 10.0"
                />
              </div>
            </div>

            {/* Narrative Override (Optional) */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Custom Narrative Note <span className="text-slate-500 font-normal">(Optional free text)</span>
              </label>
              <textarea
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                placeholder="Leave blank to auto-generate patient symptom narrative from clinical fields above..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:border-sky-500 focus:outline-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-rose-950/40 border border-rose-800/60 rounded-lg p-3 text-xs text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-medium py-2.5 rounded-xl shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing Multimodal Data...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze Lesion
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Multimodal Results & Explainability */}
        <div className="lg:col-span-7 space-y-6">
          {!result ? (
            <div className="bg-slate-900 border border-dashed border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[500px] text-slate-500">
              <Layers className="w-12 h-12 mb-3 text-slate-600 stroke-1" />
              <p className="text-base font-medium text-slate-300">Ready for Multimodal Assessment</p>
              <p className="text-xs max-w-sm text-slate-500 mt-1">
                Upload a smartphone lesion photograph and specify symptoms. The quality gate, U-Net restorer, and calibrated multimodal classifier will produce predictions and XAI attributions.
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">
              {/* Safety Alert (Red Flag) */}
              {result.safety_alert && (
                <div className="bg-rose-950/30 border border-rose-700/60 rounded-xl p-4 flex items-start gap-3 shadow-md">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-rose-300">Clinical Attention Notice</h4>
                    <p className="text-xs text-rose-200/90 mt-0.5">{result.safety_alert}</p>
                  </div>
                </div>
              )}

              {/* Main Prediction & Probability Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">Multimodal Consensus</span>
                    <h3 className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
                      {result.prediction}
                      <span className="text-xs font-normal text-slate-400">({classDescriptions[result.prediction]})</span>
                    </h3>
                  </div>
                  <div className="text-right bg-slate-950/60 border border-slate-800 px-4 py-2 rounded-xl">
                    <span className="text-[11px] text-slate-400 block">Posterior Confidence</span>
                    <span className="text-xl font-bold text-sky-400">{(result.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>

                {/* Class Probabilities Bar Chart */}
                <div className="mt-4 space-y-2">
                  <div className="text-xs font-medium text-slate-400 mb-2">Class Probability Distribution</div>
                  {['BCC', 'ACK', 'NEV', 'SEK'].map((cls) => {
                    const prob = result.probabilities[cls] || 0.0;
                    const isPred = cls === result.prediction;
                    return (
                      <div key={cls} className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className={isPred ? 'font-bold text-sky-400' : 'text-slate-300'}>{cls}</span>
                          <span className={isPred ? 'font-bold text-sky-400' : 'text-slate-400'}>
                            {(prob * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isPred ? 'bg-gradient-to-r from-sky-400 to-blue-500' : 'bg-slate-700'
                            }`}
                            style={{ width: `${Math.max(prob * 100, 1)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Clinical Guidance Text */}
                {result.clinical_summary && (
                  <div className="mt-4 p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
                    <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <span>{result.clinical_summary}</span>
                  </div>
                )}
              </div>

              {/* Dynamic Modality Contribution Bar */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-sky-400" />
                    Quality-Gated Modality Weights
                  </span>
                  <span className="text-slate-400 font-mono">
                    Image: {(result.modality_weights.image * 100).toFixed(0)}% | Clinical: {(result.modality_weights.text * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden flex border border-slate-800">
                  <div
                    className="h-full bg-sky-500 transition-all duration-500"
                    style={{ width: `${result.modality_weights.image * 100}%` }}
                    title={`Vision Weight: ${(result.modality_weights.image * 100).toFixed(1)}%`}
                  />
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${result.modality_weights.text * 100}%` }}
                    title={`Text Weight: ${(result.modality_weights.text * 100).toFixed(1)}%`}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 mt-1.5">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" /> Vision Modality (EfficientNet)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Clinical Text Modality (Linear SVM)
                  </span>
                </div>
              </div>

              {/* Image Inspection & Quality Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-sky-400" />
                    Visual Inspection & Explainability
                  </h4>
                  <div className="flex items-center gap-2">
                    {result.gradcam_base64 && (
                      <button
                        type="button"
                        onClick={() => setShowGradCam(!showGradCam)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                          showGradCam
                            ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Grad-CAM Overlay
                      </button>
                    )}
                    {result.enhanced_image_base64 && (
                      <button
                        type="button"
                        onClick={() => setShowEnhanced(!showEnhanced)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                          showEnhanced
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        Show Enhanced
                      </button>
                    )}
                  </div>
                </div>

                {/* Image Display Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left: Input / Enhanced View */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block mb-2">
                      {result.enhancement_applied && showEnhanced
                        ? `Restored Lesion (${result.enhancement_method.toUpperCase()})`
                        : 'Input Image'}
                    </span>
                    <div className="aspect-square bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
                      {showEnhanced && result.enhanced_image_base64 ? (
                        <img
                          src={`data:image/png;base64,${result.enhanced_image_base64}`}
                          alt="Enhanced lesion"
                          className="w-full h-full object-cover"
                        />
                      ) : imagePreview ? (
                        <img src={imagePreview} alt="Original" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-slate-600">No Image Provided</span>
                      )}
                    </div>
                  </div>

                  {/* Right: Grad-CAM Saliency */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block mb-2">
                      {showGradCam ? 'Grad-CAM++ Attentive Regions' : 'Base Active Lesion'}
                    </span>
                    <div className="aspect-square bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
                      {showGradCam && result.gradcam_base64 ? (
                        <img
                          src={`data:image/png;base64,${result.gradcam_base64}`}
                          alt="Grad-CAM overlay"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={
                            result.enhanced_image_base64
                              ? `data:image/png;base64,${result.enhanced_image_base64}`
                              : imagePreview || ''
                          }
                          alt="Base"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Quality Metrics Breakdown */}
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">Image Quality Assessment</span>
                    <span className="font-mono text-sky-400 font-bold">
                      q = {result.quality.q.toFixed(3)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Sharpness (Laplacian)</span>
                      <span className="font-mono text-slate-200">{result.quality.blur.toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Brightness (LAB L)</span>
                      <span className="font-mono text-slate-200">{result.quality.brightness.toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Noise Sigma</span>
                      <span className="font-mono text-slate-200">{result.quality.noise.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Enhancement Decision:</span>
                    {result.enhancement_applied ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Restored by PAD-UFES U-Net
                      </span>
                    ) : (
                      <span className="text-slate-400">Clear quality (q ≥ 0.55) — restoration bypassed</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Text Attributions Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
                <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Clinical Narrative & Linear Attributions (Linear SVM)
                </h4>
                <p className="text-xs text-slate-400">
                  Exact linear contributions (<code className="text-slate-300 font-mono">TF-IDF × w</code>) for positive evidence towards{' '}
                  <span className="text-sky-400 font-semibold">{result.prediction}</span>:
                </p>

                {/* Narrative Display with Highlighted Tokens */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs leading-relaxed text-slate-300">
                  {result.narrative_used}
                </div>

                {/* Top N-Gram Pills */}
                {result.text_attributions && result.text_attributions.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] text-slate-400 block">Salient Clinical Features:</span>
                    <div className="flex flex-wrap gap-2">
                      {result.text_attributions.map((attr, idx) => (
                        <div
                          key={idx}
                          className="bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 px-2.5 py-1 rounded-lg text-xs flex items-center gap-2"
                        >
                          <span className="font-medium">"{attr.ngram}"</span>
                          <span className="font-mono text-[10px] text-emerald-400/80 bg-emerald-900/40 px-1.5 py-0.5 rounded">
                            +{attr.weight.toFixed(3)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
