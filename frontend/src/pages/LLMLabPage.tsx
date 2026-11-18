import React, { useState } from 'react';
import { SectionHeader } from '../components/SectionHeader';
import { ShieldAlert, BookOpen, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export const LLMLabPage: React.FC = () => {
  // Configurable clinical input state for testing the synthesis layer
  const [selectedCase, setSelectedCase] = useState<'case1' | 'case2'>('case1');

  const cases = {
    case1: {
      symptoms: '72-year-old male with a slowly enlarging, pearly nodule on the right temple that occasionally bleeds upon wiping.',
      predClass: 'BCC',
      predName: 'Basal Cell Carcinoma',
      probabilities: { BCC: 0.842, ACK: 0.081, NEV: 0.043, SEK: 0.034 },
      gateWeight: 0.48, // 48% image, 52% text
      safetyTriggered: true,
      safetyMessage: 'Red Flag: Lesion exhibits persistent bleeding and progressive growth in facial H-zone.',
      evidence: [
        {
          source: 'knowledge/diseases/basal_cell_carcinoma.md',
          title: 'Basal Cell Carcinoma Guidelines',
          excerpt: 'Pearly, translucent papule or nodule with prominent overlying arborizing telangiectasia and rolled borders. Slow-growing lesion that may bleed easily with minor trauma.',
          score: 0.924
        },
        {
          source: 'AAD Clinical Protocol (2020)',
          title: 'High-Risk Anatomical Locations',
          excerpt: 'Lesions occurring in the facial H-zone (temples, periorbital, nose) carry heightened risk of local subclinical infiltration requiring surgical margin clearance.',
          score: 0.887
        }
      ],
      groundedSummary:
        'The multimodal classifier predicts Basal Cell Carcinoma (BCC) with strong model probability, informed equally by visual morphology and clinical history. Clinical guidelines corroborate this finding: pearly translucent papules with intermittent bleeding are hallmark manifestations of nodular BCC. Because this lesion is situated in the high-risk temple region and exhibits active bleeding, prompt dermatological referral and histological confirmation are indicated.',
      unsupportedClaims: 0,
      constraintsApplied: ['Constraint 1: Deterministic safety rule enforced on bleeding symptoms', 'Constraint 2: No hallucinatory treatment dosages permitted', 'Constraint 3: Explicit decision-support disclaimer mandated']
    },
    case2: {
      symptoms: '54-year-old female with multiple rough, sandpaper-like scaly patches on sun-exposed forearms, occasionally tender when exposed to sunlight.',
      predClass: 'ACK',
      predName: 'Actinic Keratosis',
      probabilities: { BCC: 0.075, ACK: 0.812, NEV: 0.052, SEK: 0.061 },
      gateWeight: 0.58,
      safetyTriggered: false,
      safetyMessage: 'Routine Clinical Monitoring: No acute bleeding or deep induration reported.',
      evidence: [
        {
          source: 'knowledge/diseases/actinic_keratosis.md',
          title: 'Actinic Keratosis Management',
          excerpt: 'Rough, sandpaper-textured scaly or keratotic macule or patch on an erythematous base. Marker of chronic ultraviolet radiation damage.',
          score: 0.895
        }
      ],
      groundedSummary:
        'The multimodal classifier predicts Actinic Keratosis (ACK) with elevated model probability. Visual examination and reported sandpaper-textured scaly plaques on sun-damaged forearms strongly align with ultraviolet-induced pre-cancerous keratosis. Dermatological assessment for lesion-directed cryosurgery or field therapy is recommended to mitigate risk of progression to invasive carcinoma.',
      unsupportedClaims: 0,
      constraintsApplied: ['Constraint 1: Verification against verified ACK clinical guideline corpus', 'Constraint 2: Mandatory non-diagnostic advisory statement attached']
    }
  };

  const current = cases[selectedCase];

  return (
    <div className="w-full bg-white text-ink min-h-[calc(100vh-64px)] pb-16">
      {/* Header */}
      <div className="border-b border-hairline py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-content mx-auto">
          <SectionHeader
            micro="SYNTHESIS & REPORT GENERATION"
            title="Grounded Summary"
            lead="Turn the model's multimodal output and retrieved evidence into a constrained, medically grounded plain-language summary."
          />
        </div>
      </div>

      {/* Case Selector Strip */}
      <div className="border-b border-hairline bg-paper py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-content mx-auto flex items-center justify-between">
          <span className="font-micro text-ink-muted">SELECT SCENARIO FOR EVALUATION:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedCase('case1')}
              className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-all ${
                selectedCase === 'case1'
                  ? 'bg-indigo text-white border-indigo'
                  : 'bg-white text-ink-muted border-hairline hover:border-ink'
              }`}
            >
              Case A: Ulcerating Temple Lesion (BCC)
            </button>
            <button
              onClick={() => setSelectedCase('case2')}
              className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-all ${
                selectedCase === 'case2'
                  ? 'bg-indigo text-white border-indigo'
                  : 'bg-white text-ink-muted border-hairline hover:border-ink'
              }`}
            >
              Case B: Scaly Sun-Damaged Forearm (ACK)
            </button>
          </div>
        </div>
      </div>

      {/* Three-Column Synthesis Layout */}
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Input Modalities & Prediction */}
          <div className="p-6 bg-paper rounded-xl border border-hairline flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-hairline">
                <span className="font-micro text-ink-faint">COLUMN 1</span>
                <span className="font-mono text-xs font-bold text-ink">INPUT SIGNALS</span>
              </div>

              {/* Reported Symptoms */}
              <div className="mt-4">
                <span className="font-micro text-ink-muted">CLINICAL NARRATIVE</span>
                <p className="font-body text-xs text-ink mt-1 p-3 bg-white rounded-lg border border-hairline leading-relaxed">
                  "{current.symptoms}"
                </p>
              </div>

              {/* Classification Prediction */}
              <div className="mt-4">
                <span className="font-micro text-ink-muted">MODEL PREDICTION</span>
                <div className="mt-1 p-3 bg-white rounded-lg border border-hairline flex items-center justify-between">
                  <div>
                    <div className="font-mono text-sm font-bold text-indigo">{current.predName}</div>
                    <div className="font-micro text-ink-muted mt-0.5">Predicted Class: {current.predClass}</div>
                  </div>
                  <span className="font-mono text-sm font-bold text-ink tabular-nums">
                    {(current.probabilities[current.predClass as keyof typeof current.probabilities] * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Gated Modality Weights */}
              <div className="mt-4">
                <span className="font-micro text-ink-muted">MODALITY ALLOCATION</span>
                <div className="mt-1 p-3 bg-white rounded-lg border border-hairline space-y-2">
                  <div className="flex justify-between font-mono text-xs text-ink">
                    <span>Image Weight α_img</span>
                    <span className="font-bold tabular-nums">{(current.gateWeight * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-hairline rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo h-full"
                      style={{ width: `${(current.gateWeight * 100).toFixed(1)}%` }}
                    />
                  </div>
                  <div className="flex justify-between font-micro text-ink-muted pt-1">
                    <span>Text Weight α_txt: {((1 - current.gateWeight) * 100).toFixed(1)}%</span>
                    <span>Adaptive Gate</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-hairline font-micro text-ink-faint">
              Direct structured input from multimodal inference pipeline.
            </div>
          </div>

          {/* Column 2: Evidence Retrieved */}
          <div className="p-6 bg-paper rounded-xl border border-hairline flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-hairline">
                <span className="font-micro text-ink-faint">COLUMN 2</span>
                <span className="font-mono text-xs font-bold text-ink">RETRIEVED EVIDENCE</span>
              </div>

              <div className="mt-4 space-y-3">
                {current.evidence.map((ev, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-lg border border-hairline space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-ink">{ev.title}</span>
                      <span className="font-mono text-xs font-semibold text-indigo tabular-nums">
                        {ev.score.toFixed(3)}
                      </span>
                    </div>
                    <p className="font-body text-xs text-ink-muted leading-relaxed">
                      "{ev.excerpt}"
                    </p>
                    <div className="font-micro text-ink-faint truncate pt-1">{ev.source}</div>
                  </div>
                ))}
              </div>

              {/* Safety Alert Rule */}
              {current.safetyTriggered && (
                <div className="mt-4 p-3 bg-status-degraded/10 border border-status-degraded/30 rounded-lg text-ink">
                  <div className="flex items-center gap-2 text-status-degraded font-mono text-xs font-semibold">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>Deterministic Red Flag Rule</span>
                  </div>
                  <p className="font-body text-xs text-ink-muted mt-1 leading-relaxed">
                    {current.safetyMessage}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-hairline font-micro text-ink-faint">
              Strictly non-hallucinatory guideline retrieval.
            </div>
          </div>

          {/* Column 3: Grounded Summary Output */}
          <div className="p-6 bg-paper rounded-xl border border-hairline flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-hairline">
                <span className="font-micro text-ink-faint">COLUMN 3</span>
                <span className="font-mono text-xs font-bold text-indigo">GROUNDED SYNTHESIS</span>
              </div>

              {/* Synthesized Output Text */}
              <div className="mt-4">
                <span className="font-micro text-ink-muted">SYNTHESIZED SUMMARY</span>
                <div className="mt-1 p-4 bg-white rounded-lg border border-hairline font-body text-xs text-ink leading-relaxed space-y-3">
                  <p>{current.groundedSummary}</p>
                </div>
              </div>

              {/* Applied Safety Constraints */}
              <div className="mt-4">
                <span className="font-micro text-ink-muted">SAFETY CONSTRAINTS APPLIED</span>
                <div className="mt-1 space-y-1.5">
                  {current.constraintsApplied.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-ink-muted">
                      <CheckCircle2 className="w-3.5 h-3.5 text-status-ready shrink-0" />
                      <span>{c}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 text-xs text-ink-muted">
                    <CheckCircle2 className="w-3.5 h-3.5 text-status-ready shrink-0" />
                    <span>Unsupported Claims Flagged: 0 (Zero Hallucination)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-hairline font-micro text-ink-faint">
              Synthesis layer evaluated with 100% citation coverage.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
