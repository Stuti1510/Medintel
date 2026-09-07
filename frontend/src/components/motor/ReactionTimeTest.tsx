/**
 * MEDINTEL AI — Reaction-Time Screening Instrument
 * High-precision browser latency measurement with randomized ISI, false start detection,
 * input arming isolation, window focus safety trapping, and editorial research visualization.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldAlert,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ChevronLeft
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
  CartesianGrid
} from 'recharts';
import {
  TestState,
  ReactionTimeTrial,
  ReactionTimeSummary,
  ReactionTimeConfig,
  InputDeviceType
} from '../../types/motor';
import { auditDeviceCapabilities } from '../../utils/deviceCheck';
import { calculateReactionTimeStats } from '../../utils/screeningMath';

interface Props {
  onBack: () => void;
  onComplete?: (summary: ReactionTimeSummary, trials: ReactionTimeTrial[]) => void;
  config?: ReactionTimeConfig;
}

const DEFAULT_CONFIG: ReactionTimeConfig = {
  practiceTrials: 5,
  measuredTrials: 15,
  minDelayMs: 1600,
  maxDelayMs: 3800,
  timeoutMs: 3000,
  minValidRtMs: 100
};

export const ReactionTimeTest: React.FC<Props> = ({ onBack, onComplete, config = DEFAULT_CONFIG }) => {
  const activeConfig = config;

  // Primary Test State Machine
  const [testState, setTestState] = useState<TestState>('INTRO');
  
  // Trial Micro-Phase: 'IDLE' | 'WAITING' | 'STIMULUS' | 'FEEDBACK'
  const [trialPhase, setTrialPhase] = useState<'IDLE' | 'WAITING' | 'STIMULUS' | 'FEEDBACK'>('IDLE');
  
  // Trial Collections & Progress
  const [trials, setTrials] = useState<ReactionTimeTrial[]>([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState<number>(0);
  const [isPracticeMode, setIsPracticeMode] = useState<boolean>(true);
  
  // High-Precision Refs for Timing & Execution Isolation
  const stimulusStartRef = useRef<number | null>(null);
  const armedAtRef = useRef<number>(0); // Guard window to prevent button clicks from bleeding into canvas
  const timerRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const isTrialActiveRef = useRef<boolean>(false);
  const activeTrialIdxRef = useRef<number>(0);
  const isPracticeModeRef = useRef<boolean>(true);
  const trialPhaseRef = useRef<'IDLE' | 'WAITING' | 'STIMULUS' | 'FEEDBACK'>('IDLE');

  // Synchronize ref mirrors to prevent stale closure bugs
  useEffect(() => {
    trialPhaseRef.current = trialPhase;
  }, [trialPhase]);

  useEffect(() => {
    activeTrialIdxRef.current = currentTrialIndex;
  }, [currentTrialIndex]);

  useEffect(() => {
    isPracticeModeRef.current = isPracticeMode;
  }, [isPracticeMode]);
  
  // Feedback Display State
  const [lastFeedback, setLastFeedback] = useState<{
    text: string;
    type: 'valid' | 'false_start' | 'missed' | 'invalid' | 'neutral';
    rt?: number;
  }>({ text: '', type: 'neutral' });

  // Summary Result
  const [summary, setSummary] = useState<ReactionTimeSummary | null>(null);

  // Device Environment
  const [deviceInfo] = useState(() => auditDeviceCapabilities());

  // Helper to safely clear all pending timers
  const clearAllTimers = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Window Focus & Visibility Safety Trapping
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && testState === 'RUNNING' && trialPhaseRef.current !== 'IDLE' && trialPhaseRef.current !== 'FEEDBACK') {
        clearAllTimers();
        isTrialActiveRef.current = false;
        setTrialPhase('FEEDBACK');
        setLastFeedback({
          text: 'Window focus lost during trial — trial marked as compromised.',
          type: 'invalid'
        });

        const focusTrial: ReactionTimeTrial = {
          trialNumber: activeTrialIdxRef.current + 1,
          isPractice: isPracticeModeRef.current,
          isiMs: 0,
          stimulusTimestamp: performance.now(),
          responseTimestamp: null,
          reactionTimeMs: null,
          status: 'FOCUS_LOST',
          inputType: 'pointer',
          clickedTarget: false,
          note: 'Participant switched window or tab'
        };

        setTrials((prev) => [...prev, focusTrial]);

        timerRef.current = window.setTimeout(() => {
          advanceAfterTrial(activeTrialIdxRef.current, isPracticeModeRef.current);
        }, 1500);
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleVisibilityChange);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleVisibilityChange);
      clearAllTimers();
    };
  }, [testState, clearAllTimers]);

  // Forward declarations for cyclic recursion
  const advanceRef = useRef<(completedIdx: number, isPractice: boolean) => void>(() => {});
  const launchRef = useRef<(trialIdx: number, isPractice: boolean) => void>(() => {});

  // Launch a Single Reaction-Time Trial
  const launchTrial = useCallback((trialIdx: number, isPractice: boolean) => {
    clearAllTimers();
    isTrialActiveRef.current = true;
    stimulusStartRef.current = null;
    
    // Arming guard: Discard any click/pointer event in the first 400ms to avoid UI transition click-bleed
    armedAtRef.current = performance.now() + 400;

    setTrialPhase('WAITING');
    setLastFeedback({ text: 'Wait for stimulus cue...', type: 'neutral' });

    // Generate random Inter-Stimulus Interval (ISI)
    const isi = Math.floor(
      activeConfig.minDelayMs +
      Math.random() * (activeConfig.maxDelayMs - activeConfig.minDelayMs)
    );

    // Schedule Stimulus Presentation
    timerRef.current = window.setTimeout(() => {
      if (!isTrialActiveRef.current) return;

      stimulusStartRef.current = performance.now();
      setTrialPhase('STIMULUS');
      setLastFeedback({ text: 'CLICK OR TAP NOW!', type: 'neutral' });

      // Schedule Missed Stimulus Timeout
      timeoutRef.current = window.setTimeout(() => {
        if (!isTrialActiveRef.current || trialPhaseRef.current !== 'STIMULUS') return;

        isTrialActiveRef.current = false;
        const missedTrial: ReactionTimeTrial = {
          trialNumber: trialIdx + 1,
          isPractice,
          isiMs: isi,
          stimulusTimestamp: stimulusStartRef.current || performance.now(),
          responseTimestamp: null,
          reactionTimeMs: null,
          status: 'MISSED',
          inputType: 'pointer',
          clickedTarget: false,
          note: `No response before ${activeConfig.timeoutMs}ms timeout`
        };

        setTrials((prev) => [...prev, missedTrial]);
        setTrialPhase('FEEDBACK');
        setLastFeedback({
          text: `No response detected (Timeout ${(activeConfig.timeoutMs / 1000).toFixed(1)}s)`,
          type: 'missed'
        });

        // Advance to next trial after feedback
        timerRef.current = window.setTimeout(() => {
          advanceRef.current(trialIdx, isPractice);
        }, 1200);
      }, activeConfig.timeoutMs);
    }, isi);
  }, [clearAllTimers, activeConfig]);

  useEffect(() => {
    launchRef.current = launchTrial;
  }, [launchTrial]);

  // Advance to Next Trial or Transition Phase
  const advanceAfterTrial = useCallback((completedIdx: number, isPractice: boolean) => {
    clearAllTimers();
    isTrialActiveRef.current = false;
    const nextIdx = completedIdx + 1;
    const maxTrials = isPractice ? activeConfig.practiceTrials : activeConfig.measuredTrials;

    if (nextIdx < maxTrials) {
      setCurrentTrialIndex(nextIdx);
      launchRef.current(nextIdx, isPractice);
    } else {
      // Completed current block
      if (isPractice) {
        setTrialPhase('IDLE');
        setTestState('READY');
      } else {
        // Measured block finished
        setTrialPhase('IDLE');
        setTestState('COMPLETED');
      }
    }
  }, [clearAllTimers, activeConfig]);

  useEffect(() => {
    advanceRef.current = advanceAfterTrial;
  }, [advanceAfterTrial]);

  const hasReportedRef = useRef<boolean>(false);

  // When state transitions to COMPLETED, compute research statistics
  useEffect(() => {
    if (testState === 'COMPLETED' && !hasReportedRef.current) {
      hasReportedRef.current = true;
      const stats = calculateReactionTimeStats(trials);
      setSummary(stats);
      if (onComplete) {
        onComplete(stats, trials);
      }
    }
  }, [testState, trials, onComplete]);

  // Handler for Controlled Test Canvas Interaction
  const handleCanvasInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (testState !== 'RUNNING' || !isTrialActiveRef.current) return;

    const now = performance.now();

    // 1. Arming Guard: Ignore clicks within the first 400ms of entering WAITING (prevents button bleed)
    if (now < armedAtRef.current) {
      return;
    }

    const inputType: InputDeviceType = 'touches' in e ? 'touch' : 'mouse';

    if (trialPhase === 'WAITING') {
      // -------------------------------------------------------------
      // Premature Click / Genuine False Start
      // -------------------------------------------------------------
      isTrialActiveRef.current = false;
      clearAllTimers();

      const falseStartTrial: ReactionTimeTrial = {
        trialNumber: currentTrialIndex + 1,
        isPractice: isPracticeMode,
        isiMs: 0,
        stimulusTimestamp: 0,
        responseTimestamp: now,
        reactionTimeMs: null,
        status: 'FALSE_START',
        inputType,
        clickedTarget: true,
        note: 'Responded before visual cue appeared'
      };

      setTrials((prev) => [...prev, falseStartTrial]);
      setTrialPhase('FEEDBACK');
      setLastFeedback({
        text: 'False Start: You clicked before the target appeared!',
        type: 'false_start'
      });

      timerRef.current = window.setTimeout(() => {
        advanceRef.current(currentTrialIndex, isPracticeMode);
      }, 1400);

    } else if (trialPhase === 'STIMULUS') {
      // -------------------------------------------------------------
      // Valid or Anticipatory Stimulus Response
      // -------------------------------------------------------------
      isTrialActiveRef.current = false;
      clearAllTimers();

      const stimulusTime = stimulusStartRef.current || now;
      const rtMs = now - stimulusTime;

      let status: 'VALID' | 'INVALID' = 'VALID';
      let note: string | undefined = undefined;

      if (rtMs < activeConfig.minValidRtMs) {
        status = 'INVALID';
        note = 'Anticipatory response below physiological threshold (< 100ms)';
      }

      const trialResult: ReactionTimeTrial = {
        trialNumber: currentTrialIndex + 1,
        isPractice: isPracticeMode,
        isiMs: 0,
        stimulusTimestamp: stimulusTime,
        responseTimestamp: now,
        reactionTimeMs: Number(rtMs.toFixed(1)),
        status,
        inputType,
        clickedTarget: true,
        note
      };

      setTrials((prev) => [...prev, trialResult]);
      setTrialPhase('FEEDBACK');

      if (status === 'VALID') {
        setLastFeedback({
          text: `Latency: ${rtMs.toFixed(0)} ms`,
          type: 'valid',
          rt: rtMs
        });
      } else {
        setLastFeedback({
          text: `Anticipation (${rtMs.toFixed(0)} ms < 100ms threshold)`,
          type: 'invalid',
          rt: rtMs
        });
      }

      timerRef.current = window.setTimeout(() => {
        advanceRef.current(currentTrialIndex, isPracticeMode);
      }, 900);
    }
  };

  // Handler for full test restart
  const handleRestart = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    clearAllTimers();
    isTrialActiveRef.current = false;
    hasReportedRef.current = false;
    stimulusStartRef.current = null;
    setTrials([]);
    setCurrentTrialIndex(0);
    setIsPracticeMode(true);
    setSummary(null);
    setTrialPhase('IDLE');
    setTestState('INTRO');
    setLastFeedback({ text: '', type: 'neutral' });
  };

  // Format data for recharts
  const chartData = trials
    .filter((t) => !t.isPractice)
    .map((t, idx) => ({
      trialNumber: `T${idx + 1}`,
      rt: t.reactionTimeMs || 0,
      status: t.status,
      displayLabel: t.status === 'VALID' ? `${t.reactionTimeMs}ms` : t.status
    }));

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* ------------------------------------------------------------- */}
      {/* 1. Header Navigation & Protocol Breadcrumb                    */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e8e4dd] pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-md hover:bg-[#f5f4f0] text-[#73706d] hover:text-[#292827] transition-colors"
            title="Return to screening landing"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#73706d] bg-[#fafaf8] px-2 py-0.5 rounded border border-[#e8e4dd]">
                Instrument 01
              </span>
              <span className="text-[10px] font-mono text-[#155555] bg-[#eef7f7] px-2 py-0.5 rounded border border-[#a3cfcf]/40">
                Phase: {testState}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#292827] mt-0.5 font-editorial">
              Reaction-Time & Processing Latency
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {testState !== 'INTRO' && testState !== 'COMPLETED' && (
            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium border border-[#e8e4dd] bg-white text-[#73706d] hover:text-[#292827] hover:bg-[#fafaf8] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart Protocol</span>
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. STATE: INTRO                                               */}
      {/* ------------------------------------------------------------- */}
      {testState === 'INTRO' && (
        <div className="bg-white border border-[#e8e4dd] rounded-card p-6 sm:p-10 space-y-8">
          <div className="space-y-3 max-w-3xl">
            <span className="text-xs font-mono uppercase tracking-wider text-[#73706d]">
              Protocol Specification
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#292827] tracking-tight">
              Visual Latency & Response Variability
            </h3>
            <p className="text-sm sm:text-base text-[#73706d] leading-relaxed">
              This instrument records the microsecond interval between an unpredictable visual stimulus presentation and the participant's manual response.
              Trials measure processing speed, attentional vigilance, and response-time variability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="p-4 rounded-button bg-[#fafaf8] border border-[#e8e4dd] space-y-2">
              <span className="font-semibold text-[#292827] block">Session Parameters</span>
              <ul className="space-y-1.5 text-[#73706d]">
                <li className="flex items-center justify-between">
                  <span>Target Duration:</span>
                  <span className="font-mono font-medium text-[#292827]">~60–90 seconds</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Practice Familiarization:</span>
                  <span className="font-mono font-medium text-[#292827]">5 practice trials</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Measured Block:</span>
                  <span className="font-mono font-medium text-[#292827]">15 formal trials</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Inter-Stimulus Interval:</span>
                  <span className="font-mono font-medium text-[#292827]">Randomized (1.6s–3.8s)</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-button bg-[#fafaf8] border border-[#e8e4dd] space-y-2">
              <span className="font-semibold text-[#292827] block">Privacy & Data Notice</span>
              <p className="text-xs text-[#73706d] leading-relaxed">
                Only browser interaction timestamps generated via <code className="font-mono bg-[#f1f0ec] px-1 py-0.5 rounded text-[#292827]">performance.now()</code> are recorded.
                No camera, microphone, keystroke text, or personal browsing history is accessed or stored.
              </p>
            </div>
          </div>

          {/* Research Disclaimer */}
          <div className="p-4 rounded-button bg-[#fafaf8] border-l-2 border-[#1b1938] border-y border-r border-[#e8e4dd] flex items-start gap-3 text-xs text-[#73706d]">
            <ShieldAlert className="w-5 h-5 text-[#1b1938] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#292827] block">Non-Diagnostic Research Notice</span>
              <p className="mt-0.5">
                These tests evaluate performance under controlled browser conditions and are not medical or diagnostic tests.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#e8e4dd]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTestState('DEVICE_CHECK');
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1b1938] hover:bg-[#232047] text-white text-xs sm:text-sm font-semibold rounded-button transition-all shadow-sm"
            >
              <span>Proceed to Device Audit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. STATE: DEVICE_CHECK                                        */}
      {/* ------------------------------------------------------------- */}
      {testState === 'DEVICE_CHECK' && (
        <div className="bg-white border border-[#e8e4dd] rounded-card p-6 sm:p-10 space-y-8">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#73706d]">
              Hardware & Viewport Calibration
            </span>
            <h3 className="text-2xl font-bold text-[#292827]">
              Device Environment Audit
            </h3>
            <p className="text-sm text-[#73706d]">
              Checking input hardware capabilities and screen geometry to ensure timing consistency.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#9a9794]">Device Category</span>
              <p className="font-semibold text-sm text-[#292827]">{deviceInfo.inferredDevice}</p>
              <p className="text-[#73706d] text-[11px]">{deviceInfo.recommendedInput}</p>
            </div>

            <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#9a9794]">Pointer Precision</span>
              <p className="font-semibold text-sm text-[#292827]">
                {deviceInfo.hasFinePointer ? 'Fine Mouse / Trackpad (Optimal)' : deviceInfo.hasTouch ? 'Direct Touch Sensor' : 'Coarse Pointer'}
              </p>
              <p className="text-[#73706d] text-[11px]">Sub-millisecond monotonic timer active</p>
            </div>

            <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#9a9794]">Viewport & DPR</span>
              <p className="font-semibold text-sm text-[#292827]">
                {deviceInfo.screenWidth} × {deviceInfo.screenHeight} px
              </p>
              <p className="text-[#73706d] text-[11px]">DPR: {deviceInfo.devicePixelRatio.toFixed(1)}x</p>
            </div>
          </div>

          <div className="p-4 bg-[#f5fbf8] border border-[#10b981]/30 rounded-button flex items-center gap-3 text-xs text-[#065f46]">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Device environment verified. Monotonic timer <code className="font-mono bg-white px-1 py-0.5 rounded">performance.now()</code> is supported and calibrated.
            </span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#e8e4dd]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTestState('INTRO');
              }}
              className="px-4 py-2.5 rounded-button text-xs font-medium border border-[#e8e4dd] text-[#73706d] hover:bg-[#fafaf8]"
            >
              Back
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTestState('INSTRUCTIONS');
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1b1938] hover:bg-[#232047] text-white text-xs sm:text-sm font-semibold rounded-button transition-all"
            >
              <span>View Instructions</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. STATE: INSTRUCTIONS                                        */}
      {/* ------------------------------------------------------------- */}
      {testState === 'INSTRUCTIONS' && (
        <div className="bg-white border border-[#e8e4dd] rounded-card p-6 sm:p-10 space-y-8">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#73706d]">
              Participant Guidance
            </span>
            <h3 className="text-2xl font-bold text-[#292827]">
              How to Perform the Reaction Test
            </h3>
            <p className="text-sm text-[#73706d]">
              Please read carefully to ensure your recorded measurements are scientifically valid.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button space-y-2">
              <span className="font-mono font-bold text-[#155555]">Step 01</span>
              <p className="font-semibold text-[#292827]">Wait in Neutral State</p>
              <p className="text-[#73706d] leading-relaxed">
                When the test starts, the canvas will show <span className="font-semibold text-[#292827]">"Wait for stimulus cue..."</span>.
                Do NOT click prematurely; clicking early triggers a <em>False Start</em>.
              </p>
            </div>

            <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button space-y-2">
              <span className="font-mono font-bold text-[#155555]">Step 02</span>
              <p className="font-semibold text-[#292827]">Respond Instantly to Cue</p>
              <p className="text-[#73706d] leading-relaxed">
                At an unpredictable moment (1.6s–3.8s), the target will flash with <span className="font-semibold text-[#155555]">"CLICK OR TAP NOW!"</span>.
                Click anywhere inside the test area as fast as possible.
              </p>
            </div>

            <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button space-y-2">
              <span className="font-mono font-bold text-[#155555]">Step 03</span>
              <p className="font-semibold text-[#292827]">Maintain Window Focus</p>
              <p className="text-[#73706d] leading-relaxed">
                Do not switch browser tabs or minimize the window. Focus shifts invalidate the active trial.
              </p>
            </div>
          </div>

          <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button text-xs text-[#73706d] flex items-start gap-3">
            <Info className="w-4 h-4 text-[#1b1938] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#292827] block">Practice Phase Notice</span>
              <span>
                You will first complete <strong>5 practice trials</strong> to familiarize yourself with the task timing before the formal 15 trials begin.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#e8e4dd]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTestState('DEVICE_CHECK');
              }}
              className="px-4 py-2.5 rounded-button text-xs font-medium border border-[#e8e4dd] text-[#73706d] hover:bg-[#fafaf8]"
            >
              Back
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTestState('RUNNING');
                setIsPracticeMode(true);
                setCurrentTrialIndex(0);
                launchTrial(0, true);
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1b1938] hover:bg-[#232047] text-white text-xs sm:text-sm font-semibold rounded-button transition-all shadow-sm"
            >
              <span>Begin Practice Trials (5)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. STATE: READY (Intermission between Practice and Formal)     */}
      {/* ------------------------------------------------------------- */}
      {testState === 'READY' && (
        <div className="bg-white border border-[#e8e4dd] rounded-card p-6 sm:p-10 space-y-8 text-center max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-full bg-[#f5fbf8] text-emerald-600 mx-auto flex items-center justify-center border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#155555]">
              Practice Phase Completed
            </span>
            <h3 className="text-2xl font-bold text-[#292827]">
              Ready for Formal Measured Screening
            </h3>
            <p className="text-sm text-[#73706d] max-w-md mx-auto leading-relaxed">
              You have completed the 5 practice trials. The next 15 trials will be permanently recorded for research analysis.
            </p>
          </div>

          <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button text-xs text-[#73706d] text-left space-y-1">
            <span className="font-semibold text-[#292827] block">Measured Protocol Rules</span>
            <p>• 15 consecutive trials with randomized delays (1.6–3.8 seconds).</p>
            <p>• React as rapidly and accurately as possible.</p>
            <p>• Avoid premature clicks to prevent false starts.</p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTestState('RUNNING');
                setIsPracticeMode(false);
                setCurrentTrialIndex(0);
                launchTrial(0, false);
              }}
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#1b1938] hover:bg-[#232047] text-white text-sm font-semibold rounded-button transition-all shadow-sm"
            >
              <span>Start 15 Measured Trials</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. STATE: RUNNING (Interactive Isolated Canvas Area)          */}
      {/* ------------------------------------------------------------- */}
      {testState === 'RUNNING' && (
        <div className="space-y-4">
          {/* Progress Header */}
          <div className="bg-white border border-[#e8e4dd] rounded-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded font-mono font-bold uppercase tracking-wider text-[10px] ${
                isPracticeMode
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-[#1b1938] text-white'
              }`}>
                {isPracticeMode ? 'Practice Mode' : 'Formal Measured Block'}
              </span>
              <span className="font-medium text-[#292827]">
                Trial {currentTrialIndex + 1} of {isPracticeMode ? DEFAULT_CONFIG.practiceTrials : DEFAULT_CONFIG.measuredTrials}
              </span>
            </div>

            {/* Trial Counter & Status */}
            <div className="flex items-center gap-4 text-[#73706d] font-mono text-[11px]">
              <span>Recorded: {trials.length}</span>
              <span>Phase: {trialPhase}</span>
            </div>
          </div>

          {/* Interactive Stimulus Target Canvas (Isolated Pointer Capture) */}
          <div
            onPointerDown={handleCanvasInteraction}
            className={`w-full h-80 sm:h-96 rounded-card border-2 flex flex-col items-center justify-center select-none cursor-pointer transition-all duration-150 relative overflow-hidden shadow-inner ${
              trialPhase === 'WAITING'
                ? 'bg-[#1b1938] border-[#3f3a52] text-white'
                : trialPhase === 'STIMULUS'
                  ? 'bg-[#155555] border-[#a3cfcf] text-white scale-[1.01]'
                  : trialPhase === 'FEEDBACK'
                    ? lastFeedback.type === 'valid'
                      ? 'bg-emerald-900/90 border-emerald-500 text-white'
                      : lastFeedback.type === 'false_start'
                        ? 'bg-amber-950 border-amber-500 text-amber-200'
                        : 'bg-rose-950 border-rose-500 text-rose-200'
                    : 'bg-[#fafaf8] border-[#e8e4dd] text-[#292827]'
            }`}
          >
            {/* Visual Indicator Cue */}
            {trialPhase === 'WAITING' && (
              <div className="space-y-3 text-center px-4 pointer-events-none">
                <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white animate-spin mx-auto" />
                <p className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Wait for stimulus cue...
                </p>
                <p className="text-xs text-[#bcbac9] font-mono">
                  DO NOT CLICK YET
                </p>
              </div>
            )}

            {trialPhase === 'STIMULUS' && (
              <div className="space-y-3 text-center px-4 animate-pulse pointer-events-none">
                <div className="w-20 h-20 rounded-full bg-white text-[#155555] mx-auto flex items-center justify-center font-bold text-lg shadow-lg">
                  TAP!
                </div>
                <p className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white uppercase">
                  CLICK OR TAP NOW!
                </p>
              </div>
            )}

            {trialPhase === 'FEEDBACK' && (
              <div className="space-y-2 text-center px-4 pointer-events-none">
                {lastFeedback.type === 'valid' && (
                  <>
                    <p className="text-4xl sm:text-5xl font-mono font-bold tracking-tight text-emerald-300">
                      {lastFeedback.rt?.toFixed(0)} ms
                    </p>
                    <p className="text-xs font-mono uppercase tracking-wider text-emerald-200">
                      Valid Response Recorded
                    </p>
                  </>
                )}
                {lastFeedback.type === 'false_start' && (
                  <>
                    <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
                    <p className="text-xl sm:text-2xl font-bold text-amber-200">
                      False Start!
                    </p>
                    <p className="text-xs text-amber-300">
                      Clicked before target appeared.
                    </p>
                  </>
                )}
                {lastFeedback.type === 'missed' && (
                  <>
                    <XCircle className="w-10 h-10 text-rose-400 mx-auto" />
                    <p className="text-xl sm:text-2xl font-bold text-rose-200">
                      Response Timed Out
                    </p>
                    <p className="text-xs text-rose-300">
                      No response detected within 3.0 seconds.
                    </p>
                  </>
                )}
                {lastFeedback.type === 'invalid' && (
                  <>
                    <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
                    <p className="text-xl sm:text-2xl font-bold text-rose-200">
                      {lastFeedback.text}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 7. STATE: COMPLETED (Scientific Research Results)             */}
      {/* ------------------------------------------------------------- */}
      {testState === 'COMPLETED' && summary && (
        <div className="bg-white border border-[#e8e4dd] rounded-card p-6 sm:p-10 space-y-8">
          {/* Results Top Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e8e4dd] pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#73706d] bg-[#fafaf8] px-2 py-0.5 rounded border border-[#e8e4dd]">
                  Experiment Complete
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  summary.qualityStatus === 'HIGH QUALITY'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : summary.qualityStatus === 'ACCEPTABLE'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {summary.qualityStatus}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#292827] font-editorial">
                Observed Reaction-Time Profile
              </h3>
              <p className="text-xs sm:text-sm text-[#73706d]">
                Derived from {summary.validTrials} valid trials across 15 formal presentations.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRestart}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1b1938] hover:bg-[#232047] text-white text-xs font-semibold rounded-button transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Repeat Test</span>
              </button>
            </div>
          </div>

          {/* Key Metrics Cards */}
          {summary.qualityStatus === 'INSUFFICIENT DATA' ? (
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-card text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
              <h4 className="text-base font-bold text-amber-900">INSUFFICIENT VALID TRIALS</h4>
              <p className="text-xs text-amber-800 max-w-md mx-auto">
                {summary.insufficientReason || 'Insufficient valid trials recorded to derive statistically rigorous latency parameters.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#73706d]">Median Latency</span>
                <p className="text-2xl sm:text-3xl font-bold text-[#1b1938] font-mono">
                  {summary.medianRtMs} <span className="text-xs text-[#73706d]">ms</span>
                </p>
                <span className="text-[10px] text-[#155555]">Primary robust estimator</span>
              </div>

              <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#73706d]">Mean Latency</span>
                <p className="text-2xl sm:text-3xl font-bold text-[#292827] font-mono">
                  {summary.meanRtMs} <span className="text-xs text-[#73706d]">ms</span>
                </p>
                <span className="text-[10px] text-[#73706d]">Std Dev: ±{summary.stdDevRtMs} ms</span>
              </div>

              <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#73706d]">RT Variability (CV)</span>
                <p className="text-2xl sm:text-3xl font-bold text-[#292827] font-mono">
                  {summary.rtVariability}%
                </p>
                <span className="text-[10px] text-[#73706d]">Attentional consistency</span>
              </div>

              <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#73706d]">Fastest / Slowest</span>
                <p className="text-xl sm:text-2xl font-bold text-[#292827] font-mono">
                  {summary.fastestRtMs} / {summary.slowestRtMs}
                </p>
                <span className="text-[10px] text-[#73706d]">Range: {summary.slowestRtMs! - summary.fastestRtMs!} ms</span>
              </div>
            </div>
          )}

          {/* Trial-by-Trial Latency Visualization */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-[#292827]">
                Trial-by-Trial Response Latency (Measured Block)
              </h4>
              <div className="flex items-center gap-3 text-[11px] font-mono text-[#73706d]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#1b1938]" /> Valid Response
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#f59e0b]" /> False Start
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#ef4444]" /> Missed / Focus Lost
                </span>
              </div>
            </div>

            <div className="h-64 w-full bg-[#fafaf8] border border-[#e8e4dd] rounded-card p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e4dd" vertical={false} />
                  <XAxis
                    dataKey="trialNumber"
                    tick={{ fontSize: 11, fill: '#73706d' }}
                    stroke="#e8e4dd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#73706d' }}
                    stroke="#e8e4dd"
                    unit="ms"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#1b1938] text-white p-2.5 rounded text-xs space-y-1 shadow-lg border border-[#3f3a52]">
                            <span className="font-mono text-[#bcbac9] block">{data.trialNumber}</span>
                            <span className="font-semibold block text-white">Status: {data.status}</span>
                            {data.status === 'VALID' && (
                              <span className="font-mono text-emerald-300">Latency: {data.rt} ms</span>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {summary.medianRtMs && (
                    <ReferenceLine
                      y={summary.medianRtMs}
                      stroke="#155555"
                      strokeDasharray="4 4"
                      label={{
                        value: `Median: ${summary.medianRtMs}ms`,
                        position: 'insideTopRight',
                        fill: '#155555',
                        fontSize: 10
                      }}
                    />
                  )}
                  <Bar dataKey="rt" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => {
                      let color = '#1b1938';
                      if (entry.status === 'FALSE_START') color = '#f59e0b';
                      else if (entry.status === 'MISSED' || entry.status === 'FOCUS_LOST') color = '#ef4444';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quality & Data Integrity Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#e8e4dd] text-xs">
            <div className="p-3 bg-[#fafaf8] border border-[#e8e4dd] rounded-button">
              <span className="text-[10px] font-mono text-[#73706d] uppercase block">Valid Trials Ratio</span>
              <span className="font-semibold text-[#292827]">{summary.validTrials} / {summary.totalTrials} ({((summary.validTrials / (summary.totalTrials || 1)) * 100).toFixed(0)}%)</span>
            </div>

            <div className="p-3 bg-[#fafaf8] border border-[#e8e4dd] rounded-button">
              <span className="text-[10px] font-mono text-[#73706d] uppercase block">False Start Rate</span>
              <span className="font-semibold text-[#292827]">{summary.falseStarts} ({summary.falseStartRatePct}%)</span>
            </div>

            <div className="p-3 bg-[#fafaf8] border border-[#e8e4dd] rounded-button">
              <span className="text-[10px] font-mono text-[#73706d] uppercase block">Focus Loss Events</span>
              <span className="font-semibold text-[#292827]">{summary.focusLossEvents} event(s)</span>
            </div>
          </div>

          {/* Safety Disclaimer */}
          <div className="p-4 rounded-button bg-[#fafaf8] border border-[#e8e4dd] text-xs text-[#73706d] space-y-1">
            <span className="font-semibold text-[#292827] block">
              Interpretative Boundaries & Clinical Safety Notice
            </span>
            <p className="leading-relaxed">
              These measurements describe behavioral performance during this controlled browser task.
              They are research-oriented prototype measurements and are <strong>not diagnostic</strong>.
              Reaction time is influenced by hardware polling latency, operating system thread scheduling, display refresh rates, and fatigue.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#e8e4dd]">
            <button
              onClick={onBack}
              className="px-4 py-2.5 rounded-button text-xs font-medium border border-[#e8e4dd] text-[#73706d] hover:bg-[#fafaf8]"
            >
              Return to Screening Suite
            </button>
            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1b1938] hover:bg-[#232047] text-white text-xs font-semibold rounded-button transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Perform Another Session</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReactionTimeTest;
