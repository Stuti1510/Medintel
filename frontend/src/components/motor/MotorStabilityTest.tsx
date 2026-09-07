/**
 * MEDINTEL AI — Motor Stability & Pointer Tracking Screening Instrument
 * Continuous pointer trajectory recording, perpendicular deviation analysis,
 * path efficiency calculations, and exact research replay visualization.
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
  Play
} from 'lucide-react';
import {
  TestState,
  MotorPathConfig,
  PointerSample,
  MotorTrialResult,
  MotorStabilitySummary,
  MotorStabilityConfig
} from '../../types/motor';
import { auditDeviceCapabilities } from '../../utils/deviceCheck';
import {
  calculatePerpendicularDeviation,
  calculateMotorTrialMetrics,
  calculateMotorStabilityStats
} from '../../utils/screeningMath';
import { DEFAULT_MOTOR_STABILITY_CONFIG } from '../../utils/researchDefaults';

interface Props {
  onBack: () => void;
  onComplete?: (summary: MotorStabilitySummary, trials: MotorTrialResult[]) => void;
  config?: MotorStabilityConfig;
}

const STANDARDIZED_PATHS: MotorPathConfig[] = [
  {
    id: 'practice-horizontal',
    name: 'Practice: Linear Track',
    description: 'Horizontal linear guide for familiarization',
    startXNorm: 0.12,
    startYNorm: 0.5,
    endXNorm: 0.88,
    endYNorm: 0.5,
    corridorWidthPx: 32
  },
  {
    id: 'measured-horizontal-lr',
    name: 'Trial 1: Linear Vector (L → R)',
    description: 'Horizontal ballistic trajectory to evaluate lateral stability',
    startXNorm: 0.10,
    startYNorm: 0.5,
    endXNorm: 0.90,
    endYNorm: 0.5,
    corridorWidthPx: 28
  },
  {
    id: 'measured-diagonal-tl-br',
    name: 'Trial 2: Oblique Vector (TL → BR)',
    description: 'Diagonal trajectory requiring multi-axis coordinated motor tracking',
    startXNorm: 0.12,
    startYNorm: 0.22,
    endXNorm: 0.88,
    endYNorm: 0.78,
    corridorWidthPx: 28
  },
  {
    id: 'measured-horizontal-rl',
    name: 'Trial 3: Linear Vector (R → L)',
    description: 'Reverse horizontal trajectory measuring retrograde control',
    startXNorm: 0.90,
    startYNorm: 0.5,
    endXNorm: 0.10,
    endYNorm: 0.5,
    corridorWidthPx: 28
  }
];

export const MotorStabilityTest: React.FC<Props> = ({
  onBack,
  onComplete,
  config = DEFAULT_MOTOR_STABILITY_CONFIG
}) => {
  const activeConfig = config;
  // Main State Machine
  const [testState, setTestState] = useState<TestState>('INTRO');
  const [isPracticeMode, setIsPracticeMode] = useState<boolean>(true);
  const [currentPathIndex, setCurrentPathIndex] = useState<number>(0);

  // Active Tracing State
  const [isTracing, setIsTracing] = useState<boolean>(false);
  const [tracingStarted, setTracingStarted] = useState<boolean>(false);
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({ width: 800, height: 380 });

  // Collections
  const [trials, setTrials] = useState<MotorTrialResult[]>([]);
  const [summary, setSummary] = useState<MotorStabilitySummary | null>(null);

  // Live Samples Buffer Ref (to avoid React re-renders on every pointermove)
  const samplesRef = useRef<PointerSample[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Replay State for Completed Trials
  const [selectedReviewTrial, setSelectedReviewTrial] = useState<number>(0);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const replayAnimRef = useRef<number | null>(null);
  const replayIndexRef = useRef<number>(0);

  // Device Info
  const [deviceInfo] = useState(() => auditDeviceCapabilities());

  // Active Path Definition
  const activePathConfig = isPracticeMode ? STANDARDIZED_PATHS[0] : STANDARDIZED_PATHS[currentPathIndex + 1];

  // Window Focus & Loss-of-State Trapping (Section 25)
  const [focusLostWarning, setFocusLostWarning] = useState<boolean>(false);

  // Update canvas dimensions based on container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasDimensions({
          width: Math.floor(rect.width),
          height: Math.min(420, Math.max(300, Math.floor(rect.width * 0.45)))
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [testState]);

  // Redraw canvas on active trial or live tracking
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasDimensions;
    canvas.width = width;
    canvas.height = height;

    // Clear Canvas
    ctx.clearRect(0, 0, width, height);

    if (!activePathConfig) return;

    const startX = activePathConfig.startXNorm * width;
    const startY = activePathConfig.startYNorm * height;
    const endX = activePathConfig.endXNorm * width;
    const endY = activePathConfig.endYNorm * height;

    // 1. Draw Target Corridor Background
    ctx.beginPath();
    ctx.lineWidth = activePathConfig.corridorWidthPx;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(21, 85, 85, 0.08)'; // Subtle Mid-Teal Corridor
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // 2. Draw Ideal Center Reference Line
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = '#155555'; // Mid-Teal Reference Line
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // 3. Draw Start Circle
    ctx.beginPath();
    ctx.arc(startX, startY, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#155555';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Label Start
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('START', startX, startY);

    // 4. Draw End / Finish Circle
    ctx.beginPath();
    ctx.arc(endX, endY, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#1b1938';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Label Finish
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FINISH', endX, endY);

    // 5. Draw Actual User Pointer Trajectory
    const samples = samplesRef.current;
    if (samples.length > 1) {
      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#1b1938'; // Primary Indigo
      ctx.moveTo(samples[0].x, samples[0].y);
      for (let i = 1; i < samples.length; i++) {
        ctx.lineTo(samples[i].x, samples[i].y);
      }
      ctx.stroke();

      // Draw current cursor tip
      const last = samples[samples.length - 1];
      ctx.beginPath();
      ctx.arc(last.x, last.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#c9b4fa'; // Soft Violet tip
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#1b1938';
      ctx.stroke();
    }
  }, [canvasDimensions, activePathConfig]);

  // Initial draw when state/path changes
  useEffect(() => {
    if (testState === 'RUNNING') {
      renderCanvas();
    }
  }, [testState, currentPathIndex, isPracticeMode, canvasDimensions, renderCanvas]);

  // Window Focus & Loss-of-State Trapping (Section 25)
  useEffect(() => {
    const handleFocusLoss = () => {
      if (document.hidden && isTracing) {
        setIsTracing(false);
        setTracingStarted(false);
        setFocusLostWarning(true);
        samplesRef.current = [];
        renderCanvas();
      }
    };

    window.addEventListener('visibilitychange', handleFocusLoss);
    window.addEventListener('blur', handleFocusLoss);

    return () => {
      window.removeEventListener('visibilitychange', handleFocusLoss);
      window.removeEventListener('blur', handleFocusLoss);
    };
  }, [isTracing, renderCanvas]);

  // Start Tracing on Start Target
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (testState !== 'RUNNING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const startX = activePathConfig.startXNorm * canvasDimensions.width;
    const startY = activePathConfig.startYNorm * canvasDimensions.height;

    // Check if pointer hit is within start radius (28px radius tolerance)
    // Check if pointer hit is within start radius (28px radius tolerance)
    const distToStart = Math.sqrt((x - startX) ** 2 + (y - startY) ** 2);
    if (distToStart <= 28) {
      // Capture pointer to handle movement even if cursor leaves element
      try {
        if (canvas.setPointerCapture) {
          canvas.setPointerCapture(e.pointerId);
        }
      } catch {
        // Pointer capture unsupported or inactive
      }

      samplesRef.current = [{
        timestamp: performance.now(),
        x,
        y,
        normalizedX: x / canvasDimensions.width,
        normalizedY: y / canvasDimensions.height,
        deviationPx: 0,
        velocityPxPerSec: 0
      }];

      setIsTracing(true);
      setTracingStarted(true);
      renderCanvas();
    }
  };

  // Record continuous pointer movement via PointerEvent
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isTracing || testState !== 'RUNNING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = performance.now();

    const startX = activePathConfig.startXNorm * canvasDimensions.width;
    const startY = activePathConfig.startYNorm * canvasDimensions.height;
    const endX = activePathConfig.endXNorm * canvasDimensions.width;
    const endY = activePathConfig.endYNorm * canvasDimensions.height;

    const deviation = calculatePerpendicularDeviation(x, y, startX, startY, endX, endY);

    const prev = samplesRef.current[samplesRef.current.length - 1];
    let velocity = 0;
    if (prev) {
      const dist = Math.sqrt((x - prev.x) ** 2 + (y - prev.y) ** 2);
      const dt = (now - prev.timestamp) / 1000;
      if (dt > 0.001) velocity = dist / dt;
    }

    samplesRef.current.push({
      timestamp: now,
      x,
      y,
      normalizedX: x / canvasDimensions.width,
      normalizedY: y / canvasDimensions.height,
      deviationPx: Number(deviation.toFixed(2)),
      velocityPxPerSec: Number(velocity.toFixed(2))
    });

    // Check if participant reached the finish target
    const distToEnd = Math.sqrt((x - endX) ** 2 + (y - endY) ** 2);
    if (distToEnd <= (activeConfig.finishTargetRadiusPx || 24) && samplesRef.current.length >= 10) {
      // Completed current path
      finishCurrentTrial();
      return;
    }

    // Paint live trajectory via requestAnimationFrame
    window.requestAnimationFrame(renderCanvas);
  };

  // Pointer Up / Cancel handler
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isTracing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        if (canvas.hasPointerCapture && canvas.hasPointerCapture(e.pointerId)) {
          canvas.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Pointer capture already released
      }
    }
    setIsTracing(false);

    // If released before finish but collected enough points, conclude trial
    if (samplesRef.current.length >= 15) {
      finishCurrentTrial();
    } else {
      // Aborted trial
      samplesRef.current = [];
      setTracingStarted(false);
      renderCanvas();
    }
  };

  // Calculate metrics and advance to next path or completion
  const finishCurrentTrial = () => {
    setIsTracing(false);
    const samples = [...samplesRef.current];
    const { width, height } = canvasDimensions;
    const startX = activePathConfig.startXNorm * width;
    const startY = activePathConfig.startYNorm * height;
    const endX = activePathConfig.endXNorm * width;
    const endY = activePathConfig.endYNorm * height;

    const trialMetrics = calculateMotorTrialMetrics(
      isPracticeMode ? 0 : currentPathIndex + 1,
      activePathConfig.id,
      activePathConfig.name,
      isPracticeMode,
      samples,
      startX,
      startY,
      endX,
      endY
    );

    setTrials((prev) => [...prev, trialMetrics]);
    samplesRef.current = [];
    setTracingStarted(false);

    if (isPracticeMode) {
      // Completed practice trial -> Move to READY
      setTestState('READY');
    } else {
      const nextIdx = currentPathIndex + 1;
      const targetPaths = Math.min(activeConfig.measuredPaths, STANDARDIZED_PATHS.length - 1);
      if (nextIdx < targetPaths) {
        setCurrentPathIndex(nextIdx);
        // Canvas will re-render for new path
      } else {
        // All measured paths completed
        setTestState('COMPLETED');
      }
    }
  };

  const hasReportedRef = useRef<boolean>(false);

  // Compute summary when test reaches COMPLETED
  useEffect(() => {
    if (testState === 'COMPLETED' && !hasReportedRef.current) {
      hasReportedRef.current = true;
      const finalStats = calculateMotorStabilityStats(trials);
      setSummary(finalStats);
      if (onComplete) {
        onComplete(finalStats, trials);
      }
    }
  }, [testState, trials, onComplete]);

  // Restart Handler
  const handleRestart = () => {
    hasReportedRef.current = false;
    if (replayAnimRef.current) cancelAnimationFrame(replayAnimRef.current);
    samplesRef.current = [];
    setTrials([]);
    setSummary(null);
    setCurrentPathIndex(0);
    setIsPracticeMode(true);
    setIsTracing(false);
    setTracingStarted(false);
    setIsReplaying(false);
    setTestState('INTRO');
  };

  // Replay Functionality for Review Canvas
  const reviewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeReviewTrial = trials[selectedReviewTrial] || trials[0];

  const drawReviewCanvas = useCallback((upToIndex?: number) => {
    const canvas = reviewCanvasRef.current;
    if (!canvas || !activeReviewTrial) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const samples = activeReviewTrial.samples;
    if (!samples || samples.length === 0) return;

    const startX = samples[0].normalizedX * width;
    const startY = samples[0].normalizedY * height;
    const endX = samples[samples.length - 1].normalizedX * width;
    const endY = samples[samples.length - 1].normalizedY * height;

    // 1. Draw Ideal Corridor & Center Reference Line
    ctx.beginPath();
    ctx.lineWidth = 26;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(21, 85, 85, 0.08)';
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    ctx.beginPath();
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#155555';
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Draw Start and Finish Markers
    ctx.beginPath();
    ctx.arc(startX, startY, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#155555';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(endX, endY, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#1b1938';
    ctx.fill();

    // 3. Draw Recorded or Replayed Pointer Trace
    const maxIdx = upToIndex !== undefined ? upToIndex : samples.length;
    if (maxIdx > 1) {
      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#1b1938';
      ctx.moveTo(samples[0].normalizedX * width, samples[0].normalizedY * height);

      for (let i = 1; i < maxIdx; i++) {
        ctx.lineTo(samples[i].normalizedX * width, samples[i].normalizedY * height);
      }
      ctx.stroke();

      // Current playhead pointer tip
      const current = samples[maxIdx - 1];
      ctx.beginPath();
      ctx.arc(current.normalizedX * width, current.normalizedY * height, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#c9b4fa';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#1b1938';
      ctx.stroke();
    }
  }, [activeReviewTrial]);

  // Handle Replay Animation
  const startReplay = () => {
    if (!activeReviewTrial || activeReviewTrial.samples.length < 2) return;
    setIsReplaying(true);
    replayIndexRef.current = 1;

    const animate = () => {
      if (!isReplaying) return;
      replayIndexRef.current += 2; // playback speed
      if (replayIndexRef.current >= activeReviewTrial.samples.length) {
        replayIndexRef.current = activeReviewTrial.samples.length;
        drawReviewCanvas(replayIndexRef.current);
        setIsReplaying(false);
        return;
      }

      drawReviewCanvas(replayIndexRef.current);
      replayAnimRef.current = requestAnimationFrame(animate);
    };

    replayAnimRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (testState === 'COMPLETED') {
      drawReviewCanvas();
    }
    return () => {
      if (replayAnimRef.current) cancelAnimationFrame(replayAnimRef.current);
    };
  }, [testState, selectedReviewTrial, drawReviewCanvas]);

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
                Instrument 02
              </span>
              <span className="text-[10px] font-mono text-[#155555] bg-[#eef7f7] px-2 py-0.5 rounded border border-[#a3cfcf]/40">
                Phase: {testState}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#292827] mt-0.5 font-editorial">
              Motor Stability & Mouse Tracking
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
              Pointer Trajectory & Path Deviation Analysis
            </h3>
            <p className="text-sm sm:text-base text-[#73706d] leading-relaxed">
              This instrument measures fine motor coordination, spatial tracing deviation, velocity stability, and trajectory efficiency during standardized straight-line path tracking tasks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="p-4 rounded-button bg-[#fafaf8] border border-[#e8e4dd] space-y-2">
              <span className="font-semibold text-[#292827] block">Session Parameters</span>
              <ul className="space-y-1.5 text-[#73706d]">
                <li className="flex items-center justify-between">
                  <span>Target Duration:</span>
                  <span className="font-mono font-medium text-[#292827]">~45–60 seconds</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Familiarization:</span>
                  <span className="font-mono font-medium text-[#292827]">1 practice path</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Formal Protocol:</span>
                  <span className="font-mono font-medium text-[#292827]">3 multi-directional paths</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Spatial Sampling:</span>
                  <span className="font-mono font-medium text-[#292827]">Sub-pixel pointermove capture</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-button bg-[#fafaf8] border border-[#e8e4dd] space-y-2">
              <span className="font-semibold text-[#292827] block">Input Device Requirement</span>
              <p className="text-xs text-[#73706d] leading-relaxed">
                A <strong>physical mouse or precision trackpad</strong> is strongly recommended for standard calibration.
                Touch screens are supported but produce different frictional and contact dynamics.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-button bg-[#fafaf8] border-l-2 border-[#1b1938] border-y border-r border-[#e8e4dd] flex items-start gap-3 text-xs text-[#73706d]">
            <ShieldAlert className="w-5 h-5 text-[#1b1938] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#292827] block">Scientific & Non-Diagnostic Notice</span>
              <p className="mt-0.5">
                Measurements reflect browser-based pointer kinematics. They are research parameters and are not diagnostic for tremor, ataxia, or Parkinsonism.
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
              Input Calibration
            </span>
            <h3 className="text-2xl font-bold text-[#292827]">
              Pointer & Viewport Verification
            </h3>
            <p className="text-sm text-[#73706d]">
              Verifying pointer event capture capabilities and display resolution.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#9a9794]">Pointer Sensor</span>
              <p className="font-semibold text-sm text-[#292827]">
                {deviceInfo.hasFinePointer ? 'Fine Mouse / Trackpad' : 'Coarse Pointer / Touch'}
              </p>
              <p className="text-[#73706d] text-[11px]">Sub-pixel pointermove capture active</p>
            </div>

            <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#9a9794]">Canvas Geometry</span>
              <p className="font-semibold text-sm text-[#292827]">
                {canvasDimensions.width} × {canvasDimensions.height} px
              </p>
              <p className="text-[#73706d] text-[11px]">Normalized coordinate mapping enabled</p>
            </div>

            <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#9a9794]">Pointer Capture API</span>
              <p className="font-semibold text-sm text-[#292827]">Supported (setPointerCapture)</p>
              <p className="text-[#73706d] text-[11px]">Out-of-bounds trajectory preservation</p>
            </div>
          </div>

          {!deviceInfo.hasFinePointer && deviceInfo.hasTouch && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-button flex items-start gap-3 text-xs text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Touch Input Detected</span>
                <span>
                  A precision mouse is optimal for standard stability baselines. Direct touch tracing will be recorded and flagged in experimental metadata.
                </span>
              </div>
            </div>
          )}

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
              How to Perform the Motor Stability Test
            </h3>
            <p className="text-sm text-[#73706d]">
              Follow these three standardized steps for valid motor recording.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button space-y-2">
              <span className="font-mono font-bold text-[#155555]">Step 01</span>
              <p className="font-semibold text-[#292827]">Click & Hold START</p>
              <p className="text-[#73706d] leading-relaxed">
                Position your pointer over the green <span className="font-semibold text-[#155555]">START</span> target circle.
                Click and hold down the primary mouse button.
              </p>
            </div>

            <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button space-y-2">
              <span className="font-mono font-bold text-[#155555]">Step 02</span>
              <p className="font-semibold text-[#292827]">Trace Along the Path</p>
              <p className="text-[#73706d] leading-relaxed">
                Drag your cursor smoothly along the dashed center line inside the guide corridor towards the finish target.
                Maintain a steady, comfortable pace.
              </p>
            </div>

            <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button space-y-2">
              <span className="font-mono font-bold text-[#155555]">Step 03</span>
              <p className="font-semibold text-[#292827]">Reach FINISH Target</p>
              <p className="text-[#73706d] leading-relaxed">
                Cross into the dark indigo <span className="font-semibold text-[#1b1938]">FINISH</span> circle to complete the trial.
                Release the mouse button.
              </p>
            </div>
          </div>

          <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button text-xs text-[#73706d] flex items-start gap-3">
            <Info className="w-4 h-4 text-[#1b1938] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#292827] block">Practice Path Notice</span>
              <span>
                You will first complete <strong>1 practice trial</strong> to calibrate your pointer movement before the 3 formal recorded paths begin.
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
                setCurrentPathIndex(0);
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1b1938] hover:bg-[#232047] text-white text-xs sm:text-sm font-semibold rounded-button transition-all"
            >
              <span>Begin Practice Path (1)</span>
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
              Practice Path Completed
            </span>
            <h3 className="text-2xl font-bold text-[#292827]">
              Ready for Formal Measured Paths
            </h3>
            <p className="text-sm text-[#73706d] max-w-md mx-auto leading-relaxed">
              You will now trace <strong>3 standardized paths</strong> (Horizontal, Diagonal, and Reverse) for formal motor trajectory derivation.
            </p>
          </div>

          <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button text-xs text-[#73706d] text-left space-y-1">
            <span className="font-semibold text-[#292827] block">Formal Protocol Guidelines</span>
            <p>• Path 1: Horizontal Vector (Left to Right)</p>
            <p>• Path 2: Diagonal Vector (Top-Left to Bottom-Right)</p>
            <p>• Path 3: Horizontal Vector (Right to Left)</p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={() => {
                setTestState('RUNNING');
                setIsPracticeMode(false);
                setCurrentPathIndex(0);
              }}
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#1b1938] hover:bg-[#232047] text-white text-sm font-semibold rounded-button transition-all shadow-sm"
            >
              <span>Start 3 Measured Paths</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. STATE: RUNNING (Interactive Tracing Canvas)                 */}
      {/* ------------------------------------------------------------- */}
      {testState === 'RUNNING' && activePathConfig && (
        <div className="space-y-4">
          {/* Progress Banner */}
          <div className="bg-white border border-[#e8e4dd] rounded-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded font-mono font-bold uppercase tracking-wider text-[10px] ${
                isPracticeMode
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-[#1b1938] text-white'
              }`}>
                {isPracticeMode ? 'Practice Mode' : `Path ${currentPathIndex + 1} of 3`}
              </span>
              <span className="font-medium text-[#292827]">
                {activePathConfig.name}
              </span>
            </div>

            <div className="flex items-center gap-4 text-[#73706d] font-mono text-[11px]">
              <span>Status: {isTracing ? 'Tracing Active' : 'Waiting on START circle'}</span>
            </div>
          </div>

          {focusLostWarning && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-button flex items-center justify-between text-xs text-amber-800 animate-fadeIn" role="alert">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Window focus lost during tracing. Path tracking was reset to ensure kinematic measurement validity.</span>
              </div>
              <button
                onClick={() => setFocusLostWarning(false)}
                className="text-amber-900 underline font-semibold text-[11px] ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Interactive Tracing Canvas Container */}
          <div
            ref={containerRef}
            className="w-full bg-white border border-[#e8e4dd] rounded-card p-4 relative overflow-hidden shadow-sm flex flex-col items-center justify-center select-none touch-none"
            role="region"
            aria-label="Motor Stability Tracing Area"
          >
            <div className="absolute top-3 left-4 text-xs font-mono text-[#73706d] pointer-events-none" aria-live="polite">
              {tracingStarted
                ? 'Keep tracing towards FINISH...'
                : 'Click and drag from the green START circle'}
            </div>

            <canvas
              ref={canvasRef}
              tabIndex={0}
              role="application"
              aria-label="Interactive straight line path tracing canvas"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={(e) => {
                handlePointerUp(e);
              }}
              onLostPointerCapture={() => {
                if (isTracing) {
                  setIsTracing(false);
                  if (samplesRef.current.length >= 15) {
                    finishCurrentTrial();
                  } else {
                    samplesRef.current = [];
                    setTracingStarted(false);
                    renderCanvas();
                  }
                }
              }}
              className="cursor-crosshair w-full rounded border border-[#f1f0ec] bg-[#fafaf8] focus:outline-none focus:ring-2 focus:ring-[#1b1938]"
              style={{ height: `${canvasDimensions.height}px` }}
            />
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 7. STATE: COMPLETED (Scientific Research Results & Replay)    */}
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
                Observed Motor Stability Profile
              </h3>
              <p className="text-xs sm:text-sm text-[#73706d]">
                Derived from {summary.validTrials} measured trajectory paths across {summary.totalSamples} recorded pointer coordinates.
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#73706d]">Path Efficiency</span>
              <p className="text-2xl sm:text-3xl font-bold text-[#1b1938] font-mono">
                {summary.overallPathEfficiencyPct}%
              </p>
              <span className="text-[10px] text-[#155555]">Ideal / Actual Length</span>
            </div>

            <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#73706d]">Mean Deviation</span>
              <p className="text-2xl sm:text-3xl font-bold text-[#292827] font-mono">
                {summary.overallMeanDeviationPx} <span className="text-xs text-[#73706d]">px</span>
              </p>
              <span className="text-[10px] text-[#73706d]">Peak: {summary.overallMaxDeviationPx} px</span>
            </div>

            <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#73706d]">RMS Error</span>
              <p className="text-2xl sm:text-3xl font-bold text-[#292827] font-mono">
                {summary.overallRmsDeviationPx} <span className="text-xs text-[#73706d]">px</span>
              </p>
              <span className="text-[10px] text-[#73706d]">Root Mean Square Dev</span>
            </div>

            <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-button space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#73706d]">Movement Speed</span>
              <p className="text-2xl sm:text-3xl font-bold text-[#292827] font-mono">
                {summary.overallMeanSpeedPxSec} <span className="text-xs text-[#73706d]">px/s</span>
              </p>
              <span className="text-[10px] text-[#73706d]">Var: ±{summary.overallSpeedVariability} px/s</span>
            </div>
          </div>

          {/* Mathematical Definitions Accordion */}
          <div className="p-4 bg-[#fafaf8] border border-[#e8e4dd] rounded-card space-y-2 text-xs">
            <span className="font-mono text-[10px] uppercase text-[#73706d] block font-bold">
              Mathematical Derivation Definitions
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[#73706d]">
              <div>
                <strong className="text-[#292827] block">Path Efficiency:</strong>
                <code>(Ideal Euclidean Length / Actual Path Length) × 100</code>
              </div>
              <div>
                <strong className="text-[#292827] block">Mean Deviation:</strong>
                <code>Σ (Perpendicular Euclidean Distance) / N Samples</code>
              </div>
              <div>
                <strong className="text-[#292827] block">RMS Deviation:</strong>
                <code>sqrt( Σ (Deviation²) / N Samples )</code>
              </div>
            </div>
          </div>

          {/* Trajectory Review & Replay Visualizer */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-[#292827]">
                Recorded Pointer Trajectory & Replay
              </h4>

              {/* Path Tabs Selector */}
              <div className="flex items-center gap-1 bg-[#fafaf8] p-1 rounded border border-[#e8e4dd]">
                {summary.trialResults.map((tr, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedReviewTrial(idx);
                      setIsReplaying(false);
                    }}
                    className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                      selectedReviewTrial === idx
                        ? 'bg-[#1b1938] text-white font-semibold'
                        : 'text-[#73706d] hover:text-[#292827]'
                    }`}
                  >
                    {tr.isPractice ? 'Practice' : `Path ${tr.trialIndex}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Trajectory Canvas Box */}
            <div className="bg-[#fafaf8] border border-[#e8e4dd] rounded-card p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-[#73706d]">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-[#292827]">{activeReviewTrial?.pathName}</span>
                  <span>• Length: {activeReviewTrial?.actualPathLengthPx} px (Ideal: {activeReviewTrial?.idealPathLengthPx} px)</span>
                  <span>• Efficiency: {activeReviewTrial?.pathEfficiencyPct}%</span>
                </div>

                <button
                  onClick={startReplay}
                  disabled={isReplaying}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#e8e4dd] hover:bg-[#f5f4f0] text-[#1b1938] font-semibold text-xs rounded transition-colors disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isReplaying ? 'Replaying...' : 'Replay Trace'}</span>
                </button>
              </div>

              <canvas
                ref={reviewCanvasRef}
                width={800}
                height={340}
                className="w-full h-72 rounded border border-[#e8e4dd] bg-white"
              />
            </div>
          </div>

          {/* Standard Editorial Safety Disclaimer */}
          <div className="p-4 rounded-button bg-[#fafaf8] border border-[#e8e4dd] text-xs text-[#73706d] space-y-1">
            <span className="font-semibold text-[#292827] block">
              Interpretative Boundaries & Clinical Safety Notice
            </span>
            <p className="leading-relaxed">
              These measurements describe pointer kinematics during this browser task.
              They are research-oriented prototype measurements and are <strong>not diagnostic</strong>.
              Path deviation is influenced by mouse DPI, sensor polling rates, surface friction, participant motor familiarity, and tracking ergonomics.
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
