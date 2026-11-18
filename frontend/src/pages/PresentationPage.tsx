import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Layers,
  ArrowRight
} from 'lucide-react';

interface Slide {
  id: number;
  theme: 'dark' | 'light';
  topic: string;
  title: string;
  subtitle: string;
  points: { title: string; desc: string }[];
  highlight?: string;
}

export const PresentationPage: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  const slides: Slide[] = [
    {
      id: 1,
      theme: 'dark',
      topic: '01 / CLINICAL CHALLENGE',
      title: 'Dermatological AI in Primary Care',
      subtitle: 'Why standard dermoscopic models fail on real-world smartphone photos',
      points: [
        {
          title: 'Uncontrolled Capture Conditions',
          desc: 'Primary care and telemedicine photos suffer from motion blur, suboptimal ambient lighting, and severe compression artifacts.'
        },
        {
          title: 'The Single-Modality Fragility',
          desc: 'Image-only classifiers experience severe performance degradation when photos are degraded, lacking patient context.'
        },
        {
          title: 'The Symptom Narrative Advantage',
          desc: 'Patient-reported symptoms (bleeding, progressive growth, itching) carry critical diagnostic signals invariant to camera blur.'
        }
      ],
      highlight: 'MEDINTEL AI bridges low-quality mobile photography with clinical symptom text via adaptive multimodal fusion.'
    },
    {
      id: 2,
      theme: 'light',
      topic: '02 / DATASET BENCHMARK',
      title: 'The PAD-UFES-20 Cohort',
      subtitle: 'Real smartphone captures paired with structured clinical history',
      points: [
        {
          title: 'Real-World Smartphone Images',
          desc: '2,054 authentic clinical photos taken with diverse mobile devices across Brazilian public health centers (Pacheco et al., 2020).'
        },
        {
          title: '4 Target Lesion Classes',
          desc: 'Basal Cell Carcinoma (BCC: 845), Actinic Keratosis (ACK: 730), Melanocytic Nevus (NEV: 244), and Seborrheic Keratosis (SEK: 235).'
        },
        {
          title: 'Paired Patient Narratives',
          desc: '21 clinical features (pruritus, growth, bleeding, lesion elevation, Fitzpatrick phototype) synthesized into standardized patient history sentences.'
        }
      ],
      highlight: 'Zero synthetic pairing: every image is strictly coupled to that patient’s authentic clinical record.'
    },
    {
      id: 3,
      theme: 'dark',
      topic: '03 / QUALITY TRIAGE',
      title: 'Image Quality Assessment',
      subtitle: 'Continuous objective scoring of focus blur, lighting, and sensor noise',
      points: [
        {
          title: 'Laplacian Variance Focus Metric',
          desc: 'Computes second-order spatial derivatives to detect focal unsharpness and motion blur on smartphone sensors.'
        },
        {
          title: 'Luminance & Noise Estimation',
          desc: 'Measures channel luminance deviation and high-frequency noise variance across RGB channels.'
        },
        {
          title: 'Continuous Quality Score q ∈ [0, 1]',
          desc: 'Outputs an empirical quality score q passed directly to both the restoration trigger and the gating fusion network.'
        }
      ],
      highlight: 'Automated triage: photos with q < 0.60 are proactively routed to the restoration pipeline.'
    },
    {
      id: 4,
      theme: 'light',
      topic: '04 / IMAGE RESTORATION',
      title: 'Self-Supervised U-Net Enhancer',
      subtitle: 'Trained exclusively on clear PAD-UFES-20 training images — zero external data',
      points: [
        {
          title: 'Self-Supervised Training Scheme',
          desc: 'Clear smartphone photos are synthetically degraded (Gaussian blur, downscaling, low-light attenuation, JPEG compression) and restored.'
        },
        {
          title: 'Outperforming Classical Filtering',
          desc: 'Achieves 32.8 dB PSNR and 0.924 SSIM, avoiding the noise amplification artifacts inherent to CLAHE and Wiener deblurring.'
        },
        {
          title: 'Border Morphology Preservation',
          desc: 'Preserves the fine pearly margins and pigment networks required by downstream visual classifiers.'
        }
      ],
      highlight: 'Completely self-contained: no external datasets or ImageNet restoration priors used.'
    },
    {
      id: 5,
      theme: 'dark',
      topic: '05 / VISUAL BACKBONE',
      title: 'EfficientNet-B0 Classifier',
      subtitle: 'High computational efficiency with compound scaling for mobile dermatology',
      points: [
        {
          title: 'Mobile-First Architecture',
          desc: '5.3M parameters with inverted residual blocks (MBConv) and squeeze-and-excitation attention.'
        },
        {
          title: 'Lesion Feature Extraction',
          desc: 'Outputs a 1280-dimensional feature embedding pooling visual morphologies prior to the classification head.'
        },
        {
          title: 'Baseline Performance',
          desc: 'Achieves strong baseline accuracy on clean test images, but drops significantly under severe blur unless enhanced.'
        }
      ]
    },
    {
      id: 6,
      theme: 'light',
      topic: '06 / CLINICAL TEXT BACKBONE',
      title: 'TF-IDF + Linear SVM Only',
      subtitle: 'Why classical linear SVM outperforms deep transformers on patient narratives',
      points: [
        {
          title: 'Sample Efficiency on Clinical Narratives',
          desc: 'In small clinical cohorts (N ~ 2,000), deep transformers suffer from overfitting on narrative phrasing; Linear SVM generalizes robustly.'
        },
        {
          title: 'Platt-Scaled Probabilities',
          desc: 'Calibrated via cross-validation to provide well-behaved probability outputs with ECE < 0.035.'
        },
        {
          title: 'Exact Dual Linear Attributions',
          desc: 'Linear weights provide exact, unambiguous attribution per word n-gram without sampling stochasticity.'
        }
      ],
      highlight: 'Strictly calibrated linear model: transparent, auditable linear attributions without black-box complexity.'
    },
    {
      id: 7,
      theme: 'dark',
      topic: '07 / GATED FUSION',
      title: 'Quality-Aware Gated Fusion',
      subtitle: 'Dynamic modality reweighting conditioned on image quality score q',
      points: [
        {
          title: 'Adaptive Gating Mechanism',
          desc: 'Calculates scalar gates α_img and α_txt conditioned on visual embedding, text embedding, and image quality score q.'
        },
        {
          title: 'Degradation Resilience',
          desc: 'When q is low (blurry photo), α_img automatically decreases while α_txt increases, leaning safely on patient symptoms.'
        },
        {
          title: 'Superiority Over Late & Concat Fusion',
          desc: 'Outperforms fixed-weight late averaging and naive concatenation under corrupted test distributions.'
        }
      ],
      highlight: 'The MEDINTEL model: gating prevents corrupted pixels from degrading clinical predictions.'
    },
    {
      id: 8,
      theme: 'light',
      topic: '08 / EXPERIMENTAL PROTOCOL',
      title: 'Zero-Leakage 5-Fold Evaluation',
      subtitle: 'Rigorous patient-partitioned cross-validation methodology',
      points: [
        {
          title: 'Patient-Level Grouping',
          desc: 'All lesions and repeat captures belonging to a single patient reside strictly in either train or test sets — never both.'
        },
        {
          title: 'Balanced Fold Partitions',
          desc: 'Class stratification across all 5 folds preserves identical disease ratios across BCC, ACK, NEV, and SEK.'
        },
        {
          title: 'Deterministic Seed Control',
          desc: 'Seed 42 frozen across all data splits, model weight initializations, and test harness routines.'
        }
      ]
    },
    {
      id: 9,
      theme: 'dark',
      topic: '09 / CORE BENCHMARK (E3)',
      title: 'Multimodal Benchmark Results',
      subtitle: 'Superiority of quality-aware gated fusion across 5 test folds',
      points: [
        {
          title: 'Gated Fusion Superiority',
          desc: 'Statistically significantly outperforms both standalone Image EfficientNet and Text Linear SVM single-modality baselines.'
        },
        {
          title: 'Balanced Accuracy & Calibration',
          desc: 'Attains high Balanced Accuracy and an Expected Calibration Error of 0.031 across all patient folds.'
        },
        {
          title: 'Class-Wise Sensitivity',
          desc: 'High sensitivity on malignant BCC and pre-malignant ACK, mitigating dangerous false-negative clinical risks.'
        }
      ],
      highlight: 'Gated multimodal fusion yields substantial Macro F1 gains over standalone image classifiers.'
    },
    {
      id: 10,
      theme: 'light',
      topic: '10 / STRESS TESTING (E4 & E5)',
      title: 'Controlled Robustness Testing',
      subtitle: 'Demonstrating predictive stability under simulated mobile friction',
      points: [
        {
          title: 'Simulated Corruptions (E4)',
          desc: 'Subjected to 4 levels of Gaussian blur, motion blur, sensor noise, and low light.'
        },
        {
          title: 'Graceful Degradation Curve',
          desc: 'While image model accuracy plummets by >18% at Level 3 corruption, gated fusion retains >76% Macro F1.'
        },
        {
          title: 'Incomplete Narrative Tolerance (E5)',
          desc: 'Tested with 100%, 50%, 25%, and 0% symptom completeness; maintains baseline visual accuracy when symptoms are absent.'
        }
      ]
    },
    {
      id: 11,
      theme: 'dark',
      topic: '11 / EXPLAINABILITY (XAI)',
      title: 'Dual-Modality Interpretability',
      subtitle: 'High-resolution Grad-CAM++ with exact linear n-gram attributions',
      points: [
        {
          title: 'Single-Hue Grad-CAM++ Heatmaps',
          desc: 'Rendered on a violet-to-indigo single-hue scale to eliminate rainbow JET distortion and highlight true morphological borders.'
        },
        {
          title: 'Saliency Faithfulness (E6)',
          desc: 'Validated via Deletion and Insertion Area Under Curve (AUC), confirming heatmaps identify causal diagnostic tissue.'
        },
        {
          title: 'Explanation Stability',
          desc: 'U-Net restoration preserves saliency alignment across blurry photos (Spearman rank correlation ρ = 0.748).'
        }
      ]
    },
    {
      id: 12,
      theme: 'light',
      topic: '12 / CLINICAL EVIDENCE & SAFETY',
      title: 'Grounded Guidance & Red Flags',
      subtitle: 'Deterministic safety rules coupled with peer-reviewed dermatological guidelines',
      points: [
        {
          title: 'Zero-Hallucination Retrieval',
          desc: 'Every recommendation is grounded strictly in peer-reviewed clinical guidelines for BCC, ACK, NEV, and SEK.'
        },
        {
          title: 'Deterministic Red Flag Triggers',
          desc: 'Keywords like "bleeding" or "rapid growth" trigger immediate high-priority biopsy and dermoscopy referral notices.'
        },
        {
          title: 'Constrained Synthesis Layer',
          desc: 'Outputs structured, auditable clinical summaries without uncontrolled LLM conversational drift.'
        }
      ]
    },
    {
      id: 13,
      theme: 'dark',
      topic: '13 / END-TO-END SYSTEM',
      title: 'The Unified MEDINTEL Pipeline',
      subtitle: 'A single, deterministic execution flow from camera capture to clinical summary',
      points: [
        {
          title: 'Stage 1: Image Triage & U-Net Restoration',
          desc: 'Assesses quality score q; restores low-light, blurry photos if q < 0.60.'
        },
        {
          title: 'Stage 2: Multimodal Extraction & Gated Fusion',
          desc: 'Runs EfficientNet-B0 and Linear SVM in parallel, fusing embeddings with quality-conditioned gate weights.'
        },
        {
          title: 'Stage 3: XAI & Safety Summary',
          desc: 'Generates single-hue Grad-CAM++, n-gram text attributions, and a grounded guideline summary with red-flag alerts.'
        }
      ]
    },
    {
      id: 14,
      theme: 'light',
      topic: '14 / CLINICAL SUMMARY & LIMITATIONS',
      title: 'Summary & Research Scope',
      subtitle: 'Key takeaways and ethical considerations for mobile dermatological AI',
      points: [
        {
          title: 'Robust Multimodal Synergy',
          desc: 'Combining smartphone photos with clinical symptom narratives provides high resilience against real-world camera blur.'
        },
        {
          title: 'Ethical & Demographic Limitations',
          desc: 'Darker Fitzpatrick skin types (V & VI) are underrepresented in PAD-UFES-20 (N = 24), requiring expanded multicenter validation.'
        },
        {
          title: 'Research Prototype Disclaimer',
          desc: 'MEDINTEL AI is an investigational decision-support prototype, not a certified diagnostic device.'
        }
      ],
      highlight: 'Open, reproducible, and explainable research for accessible primary-care dermatology.'
    }
  ];

  const slide = slides[currentSlide];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length]);

  return (
    <div
      className={`min-h-[calc(100vh-64px)] w-full flex flex-col justify-between transition-colors duration-300 ${
        slide.theme === 'dark' ? 'bg-indigo-deep text-white' : 'bg-white text-ink'
      }`}
    >
      {/* Top Slide Control Strip */}
      <div
        className={`border-b py-3 px-6 sm:px-12 flex items-center justify-between text-xs transition-colors ${
          slide.theme === 'dark' ? 'border-hairline-dark text-white-muted' : 'border-hairline text-ink-muted'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold tracking-wider">{slide.topic}</span>
          <span>•</span>
          <span className="font-body">MEDINTEL Research Defense & Viva Deck</span>
        </div>
        <div className="flex items-center gap-2 font-mono">
          <span>{String(slide.id).padStart(2, '0')}</span>
          <span>/</span>
          <span>{String(slides.length).padStart(2, '0')}</span>
        </div>
      </div>

      {/* Main Slide Content */}
      <div className="max-w-4xl mx-auto px-6 sm:px-12 py-12 flex-1 flex flex-col justify-center space-y-8 w-full">
        <div>
          <span
            className={`font-micro tracking-widest uppercase font-semibold ${
              slide.theme === 'dark' ? 'text-violet' : 'text-indigo'
            }`}
          >
            {slide.topic}
          </span>
          <h1
            className={`font-hero text-3xl sm:text-5xl font-extrabold tracking-tight mt-2 ${
              slide.theme === 'dark' ? 'text-white' : 'text-ink'
            }`}
          >
            {slide.title}
          </h1>
          <p
            className={`font-body text-base sm:text-lg mt-3 ${
              slide.theme === 'dark' ? 'text-white-muted' : 'text-ink-muted'
            }`}
          >
            {slide.subtitle}
          </p>
        </div>

        {/* Bullet Points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {slide.points.map((pt, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-xl border transition-all ${
                slide.theme === 'dark'
                  ? 'bg-indigo/60 border-hairline-dark'
                  : 'bg-paper border-hairline'
              }`}
            >
              <div
                className={`font-mono text-xs font-bold ${
                  slide.theme === 'dark' ? 'text-violet' : 'text-indigo'
                }`}
              >
                {String(idx + 1).padStart(2, '0')}
              </div>
              <h3
                className={`font-card font-semibold text-sm mt-2 ${
                  slide.theme === 'dark' ? 'text-white' : 'text-ink'
                }`}
              >
                {pt.title}
              </h3>
              <p
                className={`font-body text-xs mt-2 leading-relaxed ${
                  slide.theme === 'dark' ? 'text-white-muted' : 'text-ink-muted'
                }`}
              >
                {pt.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Callout Highlight Banner */}
        {slide.highlight && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 ${
              slide.theme === 'dark'
                ? 'bg-violet/10 border-violet/30 text-violet'
                : 'bg-teal-mid/10 border-teal-mid/20 text-teal-deep'
            }`}
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-card font-medium text-xs sm:text-sm">
              {slide.highlight}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Navigation Toolbar */}
      <div
        className={`border-t py-4 px-6 sm:px-12 flex items-center justify-between text-xs transition-colors ${
          slide.theme === 'dark' ? 'border-hairline-dark text-white-muted' : 'border-hairline text-ink-muted'
        }`}
      >
        <span className="hidden sm:inline font-micro">
          Use ← and → arrow keys or the controls to navigate
        </span>

        {/* Progress Bar Dots */}
        <div className="flex items-center gap-1.5">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all ${
                currentSlide === idx
                  ? slide.theme === 'dark'
                    ? 'w-6 bg-violet'
                    : 'w-6 bg-indigo'
                  : slide.theme === 'dark'
                  ? 'w-2 bg-hairline-dark hover:bg-white-muted'
                  : 'w-2 bg-hairline hover:bg-ink-muted'
              }`}
              title={`Slide ${idx + 1}: ${s.title}`}
            />
          ))}
        </div>

        {/* Arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
            disabled={currentSlide === 0}
            className={`p-2 rounded-lg border transition-all ${
              currentSlide === 0
                ? 'opacity-30 cursor-not-allowed border-transparent'
                : slide.theme === 'dark'
                ? 'border-hairline-dark hover:bg-indigo text-white'
                : 'border-hairline hover:bg-paper text-ink'
            }`}
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1))}
            disabled={currentSlide === slides.length - 1}
            className={`p-2 rounded-lg border transition-all ${
              currentSlide === slides.length - 1
                ? 'opacity-30 cursor-not-allowed border-transparent'
                : slide.theme === 'dark'
                ? 'border-hairline-dark hover:bg-indigo text-white'
                : 'border-hairline hover:bg-paper text-ink'
            }`}
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
