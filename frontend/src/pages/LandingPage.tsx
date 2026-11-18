import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { StatusDot } from '../components/StatusDot';
import { TealClosingCTA } from '../components/TealClosingCTA';
import { getSystemStatus, SystemStatusResponse } from '../services/api';
import { ArrowRight } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [statusData, setStatusData] = useState<SystemStatusResponse | null>(null);

  useEffect(() => {
    getSystemStatus()
      .then((data) => setStatusData(data))
      .catch(() => setStatusData(null));
  }, []);

  const capabilities = [
    {
      num: '01',
      title: 'Clinical Analysis',
      desc: 'Evaluate a patient lesion photo alongside symptoms with multimodal consensus.',
      link: '/clinical-analysis',
    },
    {
      num: '02',
      title: 'Image Quality & Restoration',
      desc: 'Measure blur, brightness and noise; automatically restore poor photos using U-Net.',
      link: '/research-lab?tab=restoration',
    },
    {
      num: '03',
      title: 'Model Performance',
      desc: 'Multimodal gated fusion architecture combining EfficientNet-B0 image embeddings with symptom-level clinical feature vectors.',
      link: '/model-performance',
    },
    {
      num: '04',
      title: 'Robustness',
      desc: 'Evaluate model resilience under controlled blur, low-light, and noise degradations.',
      link: '/research-lab?tab=robustness',
    },
    {
      num: '05',
      title: 'Explainability',
      desc: 'Inspect Grad-CAM++ morphological saliency and exact linear n-gram attributions.',
      link: '/explainability',
    },
    {
      num: '06',
      title: 'Evidence Retrieval',
      desc: 'Trace predictions to clinical knowledge bases, diagnostic criteria and clinical guidelines.',
      link: '/knowledge',
    },
    {
      num: '07',
      title: 'Grounded Summary',
      desc: 'Synthesize predictions and retrieved knowledge into safe clinical summaries.',
      link: '/llm-lab',
    },
    {
      num: '08',
      title: 'Research Evaluation',
      desc: 'Review ablation studies, reliability calibration curves, and subgroup fairness metrics.',
      link: '/research-lab?tab=overview',
    },
  ];

  return (
    <div className="w-full flex flex-col">
      {/* 1. Hero Section (Indigo background) */}
      <section className="w-full bg-indigo text-white pt-20 pb-16 px-4 sm:px-6 lg:px-8 border-b border-hairline-dark">
        <div className="max-w-content mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Text */}
          <div className="lg:col-span-7 space-y-6">
            <span className="font-micro text-white-muted tracking-widest block">
              CLINICAL AI RESEARCH PLATFORM
            </span>
            <h1 className="font-hero text-white">
              Clinical intelligence, made interpretable.
            </h1>
            <p className="font-lead text-white-muted max-w-xl">
              A research platform that reads a smartphone photo of a skin lesion together with the
              patient's own symptoms, repairs poor images, and explains every prediction.
            </p>
            <div className="pt-2">
              <Link
                to="/clinical-analysis"
                className="inline-flex items-center gap-2 bg-violet text-indigo font-button px-6 py-3.5 rounded-full hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-violet focus:ring-offset-2"
              >
                Run Clinical Analysis →
              </Link>
            </div>
          </div>

          {/* Right Hero Abstract SVG Visual */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-[380px] aspect-square relative flex items-center justify-center p-4">
              <svg
                viewBox="0 0 320 320"
                className="w-full h-full"
                aria-label="Abstract diagram of multimodal lesion scanning and gated fusion"
              >
                {/* Soft ambient violet glow */}
                <circle cx="160" cy="160" r="110" fill="var(--color-violet)" fillOpacity="0.04" />
                {/* Concentric contour rings representing morphological boundary */}
                <ellipse cx="160" cy="160" rx="120" ry="110" fill="none" stroke="var(--color-hairline-dark)" strokeWidth="1" strokeDasharray="4 4" />
                <ellipse cx="160" cy="160" rx="95" ry="85" fill="none" stroke="var(--color-hairline-dark)" strokeWidth="1" />
                <ellipse cx="160" cy="160" rx="65" ry="60" fill="none" stroke="var(--color-violet)" strokeWidth="1.5" strokeOpacity="0.6" />
                <ellipse cx="160" cy="160" rx="35" ry="32" fill="none" stroke="var(--color-violet)" strokeWidth="1" />

                {/* Thin scan line */}
                <line x1="40" y1="160" x2="280" y2="160" stroke="var(--color-violet)" strokeWidth="1" strokeOpacity="0.5" />

                {/* Two flow streams merging into one at the core */}
                <path d="M 50 60 Q 110 110 160 160" fill="none" stroke="var(--color-white-muted)" strokeWidth="1.5" />
                <path d="M 50 260 Q 110 210 160 160" fill="none" stroke="var(--color-violet)" strokeWidth="1.5" />
                <line x1="160" y1="160" x2="280" y2="160" stroke="var(--color-white)" strokeWidth="2" />

                {/* Merged node */}
                <circle cx="160" cy="160" r="4" fill="var(--color-violet)" />
                <circle cx="280" cy="160" r="3" fill="var(--color-white)" />

                {/* Text descriptors */}
                <text x="35" y="50" fill="var(--color-white-muted)" fontSize="9" fontFamily="monospace">IMAGE MODALITY</text>
                <text x="35" y="275" fill="var(--color-violet)" fontSize="9" fontFamily="monospace">CLINICAL TEXT</text>
                <text x="220" y="150" fill="var(--color-white)" fontSize="9" fontFamily="monospace">GATED FUSION</text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Status Strip */}
      <section className="w-full bg-indigo-deep border-b border-hairline-dark py-3 px-4 sm:px-6 lg:px-8 text-white-muted">
        <div className="max-w-content mx-auto flex flex-wrap items-center justify-between gap-4 font-micro text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-white">STATUS</span>
            <span>·</span>
            <span>CLINICAL AI RESEARCH PLATFORM</span>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <span className="flex items-center gap-1.5">
              Image: <StatusDot status={statusData ? 'ready' : 'unavailable'} label={statusData?.models?.image || 'EfficientNet-B0'} />
            </span>
            <span className="flex items-center gap-1.5">
              Text: <StatusDot status={statusData ? 'ready' : 'unavailable'} label={statusData?.models?.text || 'TF-IDF Linear SVM'} />
            </span>
            <span className="flex items-center gap-1.5">
              Fusion: <StatusDot status={statusData ? 'ready' : 'unavailable'} label={statusData?.models?.fusion || 'Quality-Aware Gate'} />
            </span>
            <span className="flex items-center gap-1.5">
              Restoration: <StatusDot status={statusData ? 'ready' : 'unavailable'} label={statusData?.models?.restoration || 'PAD-UFES U-Net'} />
            </span>
            <span className="flex items-center gap-1.5">
              Dataset: <span className="text-white-muted font-mono">{statusData?.dataset || 'PAD-UFES-20'}</span>
            </span>
          </div>
        </div>
      </section>

      {/* 3. Research Introduction (White surface) */}
      <section className="w-full bg-white py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-content mx-auto space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6">
              <span className="font-micro text-ink-faint block mb-2">RESEARCH METHODOLOGY</span>
              <h2 className="font-section text-ink">
                From a photo and a few symptoms to an explained prediction.
              </h2>
            </div>
            <div className="lg:col-span-6 space-y-4 pt-2">
              <p className="font-body text-ink-muted">
                Low-resource dermatology faces a dual barrier: smartphone cameras introduce severe
                optical blur, sensor noise and variable exposure, while black-box neural networks
                fail to provide auditable clinical justifications.
              </p>
              <p className="font-body text-ink-muted">
                MEDINTEL AI combines a self-supervised U-Net trained solely on clean PAD-UFES-20
                training folds with a mathematically exact calibrated Linear SVM. Its dynamic quality
                gate automatically discounts degraded visual features, shifting weight to reliable patient
                symptoms when optical quality drops.
              </p>
            </div>
          </div>

          {/* Thin-line Horizontal Pipeline */}
          <div className="pt-8 border-t border-hairline">
            <span className="font-micro text-ink-faint block mb-4">END-TO-END PIPELINE</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
              {[
                { step: '01', title: 'Photo + Symptoms', desc: 'Paired Input' },
                { step: '02', title: 'Quality Check', desc: 'Blur, Light, Noise' },
                { step: '03', title: 'Restoration', desc: 'PAD-UFES U-Net' },
                { step: '04', title: 'Image & Text Models', desc: 'Dual Encoding' },
                { step: '05', title: 'Gated Fusion', desc: 'Dynamic Weights' },
                { step: '06', title: 'Explanation', desc: 'Grad-CAM++ & SVM' },
                { step: '07', title: 'Evidence & Safety', desc: 'RAG Knowledge' },
                { step: '08', title: 'Grounded Summary', desc: 'Validated Report' },
              ].map((item, idx) => (
                <div key={item.step} className="p-3 border border-hairline rounded-[8px] bg-paper relative flex flex-col justify-between">
                  <span className="font-mono text-[10px] text-ink-faint">{item.step}</span>
                  <div className="my-1.5 font-medium text-ink">{item.title}</div>
                  <span className="text-[11px] text-ink-muted">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Capabilities (Paper background) */}
      <section className="w-full bg-paper py-24 px-4 sm:px-6 lg:px-8 border-t border-hairline">
        <div className="max-w-content mx-auto space-y-10">
          <div>
            <span className="font-micro text-ink-faint block mb-1">CAPABILITIES</span>
            <h2 className="font-section text-ink">Core Research Modules</h2>
          </div>

          <div className="divide-y divide-hairline border-y border-hairline bg-white">
            {capabilities.map((cap) => (
              <Link
                key={cap.num}
                to={cap.link}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-paper transition-all duration-200"
              >
                <div className="flex items-baseline gap-4 sm:gap-6">
                  <span className="font-mono text-sm text-ink-faint font-medium">{cap.num}</span>
                  <div>
                    <h3 className="font-card text-ink group-hover:underline underline-offset-4 decoration-1 decoration-ink">
                      {cap.title}
                    </h3>
                    <p className="font-caption text-ink-muted mt-1">{cap.desc}</p>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center text-ink-muted group-hover:text-ink transition-transform duration-200 group-hover:translate-x-1">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Closing Section */}
      <TealClosingCTA />
    </div>
  );
};
