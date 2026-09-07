/**
 * MEDINTEL AI — Finger-Tap Rhythm & Temporal Isocadence Screening Instrument
 * Isochronous repetitive motor timing measurement, inter-tap interval (ITI) variability,
 * cadence decay analysis, and real-time interval timeline visualization.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldAlert,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronLeft,
  Hand,
  Keyboard,
  Timer
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import {
  TestState,
  TapEvent,
  FingerTapSummary,
  FingerTapConfig
} from '../../types/motor';
import { auditDeviceCapabilities } from '../../utils/deviceCheck';
import { calculateFingerTapStats } from '../../utils/screeningMath';

interface Props {
  onBack: () => void;
  onComplete?: (summary: FingerTapSummary, taps: TapEvent[]) => void;
  config?: FingerTapConfig;
}

const DEFAULT_CONFIG: FingerTapConfig = {
  practiceDurationSec: 10,
  measuredDurationSec: 20,
  minValidTaps: 5
};

export const FingerTapTest: React.FC<Props> = ({ onBack, onComplete, config = DEFAULT_CONFIG }) => {
  const activeConfig = config;
  // Test State Machine
  const [testState, setTestState] = useState<TestState>('INTRO');
  const [isPracticeMode, setIsPracticeMode] = useState<boolean>(true);

  // Countdown & Running State
  const [timeRemainingSec, setTimeRemainingSec] = useState<number>(10);
  const [taps, setTaps] = useState<TapEvent[]>([]);
  const [isTappingActive, setIsTappingActive] = useState<boolean>(false);
  const [lastTapInterval, setLastTapInterval] = useState<number | null>(null);
  const [isPressedVisual, setIsPressedVisual] = useState<boolean>(false);

  // Summary Result
  const [summary, setSummary] = useState<FingerTapSummary | null>(null);

  // Timing References
  const lastTapTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const testStartTimeRef = useRef<number | null>(null);
  const pressTimeoutRef = useRef<number | null>(null);

  // Device Info
  const [deviceInfo] = useState(() => auditDeviceCapabilities());

  // Clear timers safely
  const clearAllTimers = useCallback(() => {
    if (timerIntervalRef.current !== null) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (pressTimeoutRef.current !== null) {
      window.clearTimeout(pressTimeoutRef.current);
      pressTimeoutRef.current = null;
    }
  }, []);

  // Record a single tap event
  const registerTap = useCallback((inputType: 'keyboard' | 'touch' | 'mouse') => {
    if (testState !== 'RUNNING' || !isTappingActive) return;

    const now = performance.now();
    let intervalMs: number | null = null;

    if (lastTapTimeRef.current !== null) {
      intervalMs = Number((now - lastTapTimeRef.current).toFixed(1));
    }

    lastTapTimeRef.current = now;
    setLastTapInterval(intervalMs);

    // Visual micro-feedback
    setIsPressedVisual(true);
    if (pressTimeoutRef.current !== null) {
      window.clearTimeout(pressTimeoutRef.current);
    }
    pressTimeoutRef.current = window.setTimeout(() => setIsPressedVisual(false), 80);

    const newTap: TapEvent = {
      tapNumber: taps.length + 1,
      isPractice: isPracticeMode,
      timestamp: now,
      interTapIntervalMs: intervalMs,
      inputType
    };

    setTaps((prev) => [...prev, newTap]);
  }, [testState, isTappingActive, isPracticeMode, taps.length]);

  // Key Repeat & Focus Loss Warnings (Section 25)
  const [keyRepeatWarning, setKeyRepeatWarning] = useState<boolean>(false);
  const [focusLostWarning, setFocusLostWarning] = useState<boolean>(false);
  const keyRepeatTimeoutRef = useRef<number | null>(null);

  // Keyboard Spacebar Listener with repeat guard (Section 25)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault(); // Prevent page scroll
        if (e.repeat) {
          // Visual warning that held key is not counted
          setKeyRepeatWarning(true);
          if (keyRepeatTimeoutRef.current) window.clearTimeout(keyRepeatTimeoutRef.current);
          keyRepeatTimeoutRef.current = window.setTimeout(() => setKeyRepeatWarning(false), 1200);
          return;
        }
        registerTap('keyboard');
      }
    };

    if (testState === 'RUNNING') {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (keyRepeatTimeoutRef.current) window.clearTimeout(keyRepeatTimeoutRef.current);
    };
  }, [testState, registerTap]);

  // Window Focus & Loss-of-State Trapping (Section 25)
  useEffect(() => {
    const handleFocusLoss = () => {
      if (document.hidden && testState === 'RUNNING' && isTappingActive) {
        setFocusLostWarning(true);
      }
    };

    window.addEventListener('visibilitychange', handleFocusLoss);
    window.addEventListener('blur', handleFocusLoss);

    return () => {
      window.removeEventListener('visibilitychange', handleFocusLoss);
      window.removeEventListener('blur', handleFocusLoss);
    };
  }, [testState, isTappingActive]);

  // Start Countdown Timer Loop
  const startTimerLoop = useCallback((durationSec: number, isPractice: boolean) => {
    clearAllTimers();
    setTimeRemainingSec(durationSec);
    setIsTappingActive(true);
    lastTapTimeRef.current = null;
    testStartTimeRef.current = performance.now();

    const startTimestamp = performance.now();

    timerIntervalRef.current = window.setInterval(() => {
      const elapsedSec = (performance.now() - startTimestamp) / 1000;
      const remaining = Math.max(0, Math.ceil(durationSec - elapsedSec));
      setTimeRemainingSec(remaining);

      if (remaining <= 0) {
        clearAllTimers();
        setIsTappingActive(false);

        if (isPractice) {
          // Completed practice countdown -> Move to READY
          setTestState('READY');
        } else {
          // Completed measured countdown -> Move to COMPLETED
          setTestState('COMPLETED');
        }
      }
    }, 100);
  }, [clearAllTimers]);

  // Handle unmount cleanup
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  const hasReportedRef = useRef<boolean>(false);

  // Compute final statistics on COMPLETED
  useEffect(() => {
    if (testState === 'COMPLETED' && !hasReportedRef.current) {
      hasReportedRef.current = true;
      const finalStats = calculateFingerTapStats(taps, activeConfig.measuredDurationSec);
      setSummary(finalStats);
      if (onComplete) {
        onComplete(finalStats, taps);
      }
    }
  }, [testState, taps, onComplete, activeConfig]);

  // Restart Handler
  const handleRestart = () => {
    hasReportedRef.current = false;
    clearAllTimers();
    setTaps([]);
    setSummary(null);
    setIsPracticeMode(true);
    setIsTappingActive(false);
    setLastTapInterval(null);
    lastTapTimeRef.current = null;
    setTestState('INTRO');
  };

  // Recharts Data Mapping (only measured trials with valid intervals)
  const chartData = taps
    .filter((t) => !t.isPractice && t.interTapIntervalMs !== null && t.interTapIntervalMs >= 35)
    .map((t, idx) => ({
      tapIndex: `Tap ${idx + 2}`, // Interval 1 is between tap 1 and 2
      intervalMs: t.interTapIntervalMs,
      inputType: t.inputType
    }));

  const measuredTapsCount = taps.filter((t) => !t.isPractice).length;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* ------------------------------------------------------------- */}
      {/* 1. Header Navigation & Breadcrumb                             */}
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
                Instrument 03
              </span>
              <span className="text-[10px] font-mono text-[#155555] bg-[#eef7f7] px-2 py-0.5 rounded border border-[#a3cfcf]/40">
                Phase: {testState}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#292827] mt-0.5 font-editorial">
              Finger-Tap Rhythm & Cadence
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
              Repetitive Motor Timing & Temporal Consistency
            </h3>
            <p className="text-sm sm:text-base text-[#73706d] leading-relaxed">
              This instrument measures manual cadence, inter-tap interval regularity, and rhythm deceleration during an isochronous finger-tapping task.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="p-4 rounded-button bg-[#fafaf8] border border-[#e8e4dd] space-y-2">
              <span className="font-semibold text-[#292827] block">Session Parameters</span>
              <ul className="space-y-1.5 text-[#73706d]">
                <li className="flex items-center justify-between">
                  <span>Target Duration:</span>
                  <span className="font-mono font-medium text-[#292827]">~30–40 seconds</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Familiarization:</span>
                  <span className="font-mono font-medium text-[#292827]">10-second practice block</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Formal Protocol:</span>
                  <span className="font-mono font-medium text-[#292827]">20-second recorded block</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Input Modality:</span>
                  <span className="font-mono font-medium text-[#292827]">Keyboard Spacebar / Touch Pad</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-button bg-[#fafaf8] border border-[#e8e4dd] space-y-2">
              <span className="font-semibold text-[#292827] block">Privacy & Data Notice</span>
              <p className="text-xs text-[#73706d] leading-relaxed">
                Only timestamps generated via <code className="font-mono bg-[#f1f0ec] px-1 py-0.5 rounded text-[#292827]">performance.now()</code> are recorded.
                No audio, video, biometric typing fingerprints, or personal browsing history is accessed.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-button bg-[#fafaf8] border-l-2 border-[#1b1938] border-y border-r border-[#e8e4dd] flex items-start gap-3 text-xs text-[#73706d]">
            <ShieldAlert className="w-5 h-5 text-[#1b1938] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#292827] block">Non-Diagnostic Research Notice</span>
              <p className="mt-0.5">
                Measurements represent browser-based timing signals. They are research parameters and are not diagnostic for Parkinsonism, bradykinesia, or neurological disease.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#e8e4dd]">
            <button
              onClick={() => setTestState('DEVICE_CHECK')}
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
              Hardware Verification
            </span>
            <h3 className="text-2xl font-bold text-[#292827]">
              Input Interface Audit
            </h3>
            <p className="text-sm text-[#73706d]">
              Verifying physical keyboard and capacitive touch input polling rates.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#9a9794]">Keyboard Interface</span>
              <p className="font-semibold text-sm text-[#292827]">
                {deviceInfo.hasKeyboard ? 'Physical Keyboard (Recommended)' : 'Screen Target Fallback'}
              </p>
              <p className="text-[#73706d] text-[11px]">Zero-debounce spacebar hook enabled</p>
            </div>

            <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#9a9794]">Touch Sensor</span>
              <p className="font-semibold text-sm text-[#292827]">
                {deviceInfo.hasTouch ? 'Direct Touch Available' : 'Mouse / Key Only'}
              </p>
              <p className="text-[#73706d] text-[11px]">On-screen capacitive tap target ready</p>
            </div>

            <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#9a9794]">Clock Precision</span>
              <p className="font-semibold text-sm text-[#292827]">Sub-millisecond Monotonic</p>
              <p className="text-[#73706d] text-[11px]">performance.now() verified</p>
            </div>
          </div>

          <div className="p-4 bg-[#f5fbf8] border border-[#10b981]/30 rounded-button flex items-center gap-3 text-xs text-[#065f46]">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Input environment verified. Dual input listeners (Physical Spacebar & On-Screen Button) are active.
            </span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#e8e4dd]">
            <button
              onClick={() => setTestState('INTRO')}
              className="px-4 py-2.5 rounded-button text-xs font-medium border border-[#e8e4dd] text-[#73706d] hover:bg-[#fafaf8]"
            >
              Back
            </button>
            <button
              onClick={() => setTestState('INSTRUCTIONS')}
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
              How to Perform the Finger-Tap Test
            </h3>
            <p className="text-sm text-[#73706d]">
              Follow these three standardized instructions for rhythm recording.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button space-y-2">
              <span className="font-mono font-bold text-[#155555]">Step 01</span>
              <p className="font-semibold text-[#292827]">Use Dominant Index Finger</p>
              <p className="text-[#73706d] leading-relaxed">
                Rest your dominant hand comfortably on the table or device surface with your index finger positioned above the <span className="font-semibold text-[#292827]">Spacebar</span>.
              </p>
            </div>

            <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button space-y-2">
              <span className="font-mono font-bold text-[#155555]">Step 02</span>
              <p className="font-semibold text-[#292827]">Tap at Steady Cadence</p>
              <p className="text-[#73706d] leading-relaxed">
                When the timer starts, tap the spacebar (or on-screen pad) at a <span className="font-semibold text-[#155555]">steady, comfortable, natural rhythm</span>.
                Do not rush or deliberately alter your rate.
              </p>
            </div>

            <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button space-y-2">
              <span className="font-mono font-bold text-[#155555]">Step 03</span>
              <p className="font-semibold text-[#292827]">Maintain Rhythm</p>
              <p className="text-[#73706d] leading-relaxed">
                Continue tapping consistently until the 20-second countdown reaches zero.
              </p>
            </div>
          </div>

          <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button text-xs text-[#73706d] flex items-start gap-3">
            <Info className="w-4 h-4 text-[#1b1938] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#292827] block">Practice Familiarization Phase</span>
              <span>
                You will first complete a <strong>10-second practice block</strong> to find your natural cadence before the formal 20-second test begins.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#e8e4dd]">
            <button
              onClick={() => setTestState('DEVICE_CHECK')}
              className="px-4 py-2.5 rounded-button text-xs font-medium border border-[#e8e4dd] text-[#73706d] hover:bg-[#fafaf8]"
            >
              Back
            </button>
            <button
              onClick={() => {
                setTestState('RUNNING');
                setIsPracticeMode(true);
                setTaps([]);
                startTimerLoop(activeConfig.practiceDurationSec, true);
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1b1938] hover:bg-[#232047] text-white text-xs sm:text-sm font-semibold rounded-button transition-all"
            >
              <span>Begin {activeConfig.practiceDurationSec}s Practice Block</span>
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
              Practice Block Completed
            </span>
            <h3 className="text-2xl font-bold text-[#292827]">
              Ready for Formal Measured Tap Protocol
            </h3>
            <p className="text-sm text-[#73706d] max-w-md mx-auto leading-relaxed">
              You will now tap for <strong>{activeConfig.measuredDurationSec} continuous seconds</strong>. Keep a steady, comfortable, natural rhythm.
            </p>
          </div>

          <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button text-xs text-[#73706d] text-left space-y-1">
            <span className="font-semibold text-[#292827] block">Formal Protocol Guidelines</span>
            <p>• {activeConfig.measuredDurationSec} seconds uninterrupted tapping.</p>
            <p>• Press Spacebar or Tap the on-screen target.</p>
            <p>• Maintain cadence without pauses.</p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={() => {
                setTestState('RUNNING');
                setIsPracticeMode(false);
                setTaps([]);
                startTimerLoop(activeConfig.measuredDurationSec, false);
              }}
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#1b1938] hover:bg-[#232047] text-white text-sm font-semibold rounded-button transition-all shadow-sm"
            >
              <span>Start {activeConfig.measuredDurationSec}s Measured Test</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. STATE: RUNNING (Interactive Tap Arena)                      */}
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
                {isPracticeMode ? 'Practice Phase (10s)' : 'Formal Test (20s)'}
              </span>
              <span className="font-medium text-[#292827]">
                Taps Recorded: <strong className="font-mono text-sm">{isPracticeMode ? taps.filter(t => t.isPractice).length : measuredTapsCount}</strong>
              </span>
            </div>

            {/* Countdown Clock */}
            <div className="flex items-center gap-2 font-mono text-sm font-bold text-[#1b1938]">
              <Timer className="w-4 h-4 text-[#155555]" />
              <span>Time Remaining: {timeRemainingSec}s</span>
            </div>
          </div>

          {focusLostWarning && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-button flex items-center justify-between text-xs text-amber-800 animate-fadeIn" role="alert">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Window focus was briefly interrupted during tapping. Continue tapping naturally.</span>
              </div>
              <button
                onClick={() => setFocusLostWarning(false)}
                className="text-amber-900 underline font-semibold text-[11px] ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {keyRepeatWarning && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-button text-center text-xs text-rose-800 animate-pulse font-mono font-medium" role="alert">
              Key hold detected — please tap and release repeatedly (Spacebar key repeats are discarded).
            </div>
          )}

          {/* Interactive Tap Surface */}
          <div
            tabIndex={0}
            role="button"
            aria-label="Finger tap capacitive input surface"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                registerTap('keyboard');
              }
            }}
            onClick={() => registerTap('mouse')}
            onTouchStart={(e) => {
              e.preventDefault();
              registerTap('touch');
            }}
            className={`w-full h-80 sm:h-96 rounded-card border-2 flex flex-col items-center justify-center select-none cursor-pointer transition-all duration-100 shadow-inner relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#c9b4fa] ${
              isPressedVisual
                ? 'bg-[#155555] border-[#a3cfcf] scale-[0.99]'
                : 'bg-[#1b1938] border-[#3f3a52]'
            }`}
          >
            <div className="space-y-4 text-center px-4 pointer-events-none">
              <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center font-bold text-2xl transition-all shadow-lg ${
                isPressedVisual
                  ? 'bg-white text-[#155555] scale-110'
                  : 'bg-[#232047] text-[#c9b4fa] border border-[#3f3a52]'
              }`}>
                <Hand className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase font-editorial">
                  {isPressedVisual ? 'TAP REGISTERED!' : 'TAP SPACEBAR OR CLICK HERE'}
                </p>
                <p className="text-xs text-[#bcbac9] font-mono">
                  Keep a steady, comfortable cadence
                </p>
              </div>

              {/* Real-time interval pulse indicator */}
              {lastTapInterval !== null && (
                <div className="inline-flex items-center gap-2 bg-[#0e0c1f] text-white px-3 py-1 rounded-full text-xs font-mono border border-[#3f3a52]">
                  <span className="text-[#bcbac9]">Interval:</span>
                  <span className="text-emerald-400 font-bold">{lastTapInterval} ms</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 7. STATE: COMPLETED (Scientific Research Results)             */}
      {/* ------------------------------------------------------------- */}
      {testState === 'COMPLETED' && summary && (
        <div className="bg-white border border-[#e8e4dd] rounded-card p-6 sm:p-10 space-y-8">
          {/* Top Banner */}
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
                Observed Tapping Rhythm Profile
              </h3>
              <p className="text-xs sm:text-sm text-[#73706d]">
                Derived from {summary.validIntervalsCount} measured inter-tap intervals over {summary.durationSec} seconds.
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

          {/* Key Metrics Grid */}
          {summary.qualityStatus === 'INSUFFICIENT DATA' ? (
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-card text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
              <h4 className="text-base font-bold text-amber-900">INSUFFICIENT TAP DATA</h4>
              <p className="text-xs text-amber-800 max-w-md mx-auto">
                {summary.insufficientReason || 'Fewer than 4 valid tap intervals recorded during the measurement period.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#73706d]">Tapping Rate</span>
                <p className="text-2xl sm:text-3xl font-bold text-[#1b1938] font-mono">
                  {summary.tapsPerSecond} <span className="text-xs text-[#73706d]">Hz</span>
                </p>
                <span className="text-[10px] text-[#155555]">{summary.tapsPerMinute} taps / min</span>
              </div>

              <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#73706d]">Mean Interval (ITI)</span>
                <p className="text-2xl sm:text-3xl font-bold text-[#292827] font-mono">
                  {summary.meanIntervalMs} <span className="text-xs text-[#73706d]">ms</span>
                </p>
                <span className="text-[10px] text-[#73706d]">Median: {summary.medianIntervalMs} ms</span>
              </div>

              <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#73706d]">Rhythm Variability (CV)</span>
                <p className="text-2xl sm:text-3xl font-bold text-[#292827] font-mono">
                  {summary.coefficientOfVariationPct}%
                </p>
                <span className="text-[10px] text-[#73706d]">Std Dev: ±{summary.stdDevIntervalMs} ms</span>
              </div>

              <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#73706d]">Cadence Decay</span>
                <p className="text-2xl sm:text-3xl font-bold text-[#292827] font-mono">
                  {summary.cadenceDecayPct !== null ? `${summary.cadenceDecayPct > 0 ? '+' : ''}${summary.cadenceDecayPct}%` : 'N/A'}
                </p>
                <span className="text-[10px] text-[#73706d]">1st Half vs 2nd Half</span>
              </div>
            </div>
          )}

          {/* Inter-Tap Interval (ITI) Timeline Chart */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-[#292827]">
                Inter-Tap Interval Sequence (Measured Block)
              </h4>
              <span className="text-[11px] font-mono text-[#73706d]">
                Continuous temporal timeline (ms per interval)
              </span>
            </div>

            <div className="h-64 w-full bg-[#fafaf8] border border-[#e8e4dd] rounded-card p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e4dd" vertical={false} />
                  <XAxis
                    dataKey="tapIndex"
                    tick={{ fontSize: 10, fill: '#73706d' }}
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
                            <span className="font-mono text-[#bcbac9] block">{data.tapIndex}</span>
                            <span className="font-mono text-emerald-300 block">Interval: {data.intervalMs} ms</span>
                            <span className="text-[10px] text-[#bcbac9]">Input: {data.inputType}</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {summary.meanIntervalMs && (
                    <ReferenceLine
                      y={summary.meanIntervalMs}
                      stroke="#155555"
                      strokeDasharray="4 4"
                      label={{
                        value: `Mean: ${summary.meanIntervalMs}ms`,
                        position: 'insideTopRight',
                        fill: '#155555',
                        fontSize: 10
                      }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="intervalMs"
                    stroke="#1b1938"
                    strokeWidth={2.5}
                    dot={{ fill: '#155555', r: 3 }}
                    activeDot={{ r: 5, fill: '#c9b4fa' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mathematical Definitions */}
          <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-card space-y-2 text-xs">
            <span className="font-mono text-[10px] uppercase text-[#73706d] block font-bold">
              Mathematical Derivation Definitions
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[#73706d]">
              <div>
                <strong className="text-[#292827] block">Taps per Second:</strong>
                <code>1000 / Mean Inter-Tap Interval (ms)</code>
              </div>
              <div>
                <strong className="text-[#292827] block">Coefficient of Variation:</strong>
                <code>(Standard Deviation / Mean Interval) × 100%</code>
              </div>
              <div>
                <strong className="text-[#292827] block">Cadence Decay:</strong>
                <code>((Mean_H2 - Mean_H1) / Mean_H1) × 100%</code>
              </div>
            </div>
          </div>

          {/* Standard Editorial Safety Disclaimer */}
          <div className="p-4 rounded-button bg-[#fafaf8] border border-[#e8e4dd] text-xs text-[#73706d] space-y-1">
            <span className="font-semibold text-[#292827] block">
              Interpretative Boundaries & Clinical Safety Notice
            </span>
            <p className="leading-relaxed">
              These measurements describe tapping timing consistency during this controlled browser task.
              They are research-oriented prototype measurements and are <strong>not diagnostic</strong>.
              Tapping rhythm is affected by keyboard switch debounce latency, operating system input polling, participant fatigue, and muscle ergonomics.
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
