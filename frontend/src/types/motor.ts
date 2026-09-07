/**
 * MEDINTEL AI — Motor & Cognitive Screening Type Definitions
 * Standardized data models for Reaction-Time, Motor Stability, and Finger-Tap protocols.
 */

export type ScreeningModuleId = 'reaction-time' | 'motor-stability' | 'finger-tap';

export type TestState =
  | 'IDLE'
  | 'INTRO'
  | 'DEVICE_CHECK'
  | 'INSTRUCTIONS'
  | 'PRACTICE'
  | 'READY'
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ERROR'
  | 'INSUFFICIENT_DATA';

export type TrialStatus =
  | 'VALID'
  | 'FALSE_START'
  | 'MISSED'
  | 'INVALID'
  | 'FOCUS_LOST';

export type InputDeviceType = 'mouse' | 'touchpad' | 'touch' | 'keyboard' | 'pointer';

export type QualityGrade = 'HIGH QUALITY' | 'ACCEPTABLE' | 'LOW QUALITY' | 'INSUFFICIENT DATA';

export interface DeviceAuditInfo {
  hasFinePointer: boolean;
  hasCoarsePointer: boolean;
  hasTouch: boolean;
  hasKeyboard: boolean;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  userAgent: string;
  inferredDevice: 'Desktop / Laptop' | 'Tablet' | 'Mobile Phone' | 'Unknown';
  recommendedInput: string;
  isPointerCapable: boolean;
}

// ---------------------------------------------------------------------------
// Reaction-Time Types
// ---------------------------------------------------------------------------

export interface ReactionTimeConfig {
  practiceTrials: number; // default 5
  measuredTrials: number; // default 15
  minDelayMs: number;     // default 1500ms
  maxDelayMs: number;     // default 3800ms
  timeoutMs: number;      // default 3000ms
  minValidRtMs: number;   // default 100ms
}

export interface ReactionTimeTrial {
  trialNumber: number;
  isPractice: boolean;
  isiMs: number;
  stimulusTimestamp: number; // high-precision performance.now()
  responseTimestamp: number | null;
  reactionTimeMs: number | null;
  status: TrialStatus;
  inputType: InputDeviceType;
  clickedTarget: boolean;
  note?: string;
}

export interface ReactionTimeSummary {
  totalTrials: number;
  validTrials: number;
  practiceTrialsCount: number;
  falseStarts: number;
  missedTrials: number;
  focusLossEvents: number;
  invalidTrials: number;
  medianRtMs: number | null;
  meanRtMs: number | null;
  stdDevRtMs: number | null;
  fastestRtMs: number | null;
  slowestRtMs: number | null;
  rtVariability: number | null; // Coefficient of Variation: (SD / Mean)
  falseStartRatePct: number;
  missRatePct: number;
  qualityStatus: QualityGrade;
  insufficientReason?: string;
}

// ---------------------------------------------------------------------------
// Motor Stability / Pointer Tracking Types
// ---------------------------------------------------------------------------

export interface PointerSample {
  timestamp: number; // performance.now()
  x: number;         // container pixel coordinate
  y: number;
  normalizedX: number; // relative [0, 1] for reproducibility
  normalizedY: number; // relative [0, 1]
  deviationPx: number; // perpendicular Euclidean deviation from target path
  velocityPxPerSec: number;
}

export interface MotorPathConfig {
  id: string;
  name: string;
  description: string;
  startXNorm: number; // normalized 0.0 - 1.0
  startYNorm: number;
  endXNorm: number;
  endYNorm: number;
  corridorWidthPx: number;
}

export interface MotorTrialResult {
  trialIndex: number;
  pathId: string;
  pathName: string;
  isPractice: boolean;
  durationMs: number;
  sampleCount: number;
  actualPathLengthPx: number;
  idealPathLengthPx: number;
  pathEfficiencyPct: number; // (Ideal Length / Actual Length) * 100
  meanDeviationPx: number;
  maxDeviationPx: number;
  rmsDeviationPx: number;
  meanSpeedPxSec: number;
  speedVariability: number;
  samples: PointerSample[];
  status: 'VALID' | 'INCOMPLETE' | 'ABORTED';
}

export interface MotorStabilitySummary {
  totalTrials: number;
  validTrials: number;
  practiceTrialsCount: number;
  overallPathEfficiencyPct: number;
  overallMeanDeviationPx: number;
  overallMaxDeviationPx: number;
  overallRmsDeviationPx: number;
  overallMeanSpeedPxSec: number;
  overallSpeedVariability: number;
  totalDurationSec: number;
  totalSamples: number;
  qualityStatus: QualityGrade;
  insufficientReason?: string;
  trialResults: MotorTrialResult[];
}

// ---------------------------------------------------------------------------
// Finger-Tap Rhythm Types
// ---------------------------------------------------------------------------

export interface TapEvent {
  tapNumber: number;
  isPractice: boolean;
  timestamp: number; // performance.now()
  interTapIntervalMs: number | null; // delta from previous tap in ms
  inputType: 'keyboard' | 'touch' | 'mouse';
}

export interface FingerTapConfig {
  practiceDurationSec: number; // default 10s
  measuredDurationSec: number; // default 20s
  minValidTaps: number;        // default 5
}

export interface FingerTapSummary {
  totalTaps: number;
  practiceTapsCount: number;
  validIntervalsCount: number;
  durationSec: number;
  tapsPerSecond: number | null;
  tapsPerMinute: number | null;
  meanIntervalMs: number | null;
  medianIntervalMs: number | null;
  stdDevIntervalMs: number | null;
  coefficientOfVariationPct: number | null; // (SD / Mean) * 100
  fastestIntervalMs: number | null;
  slowestIntervalMs: number | null;
  cadenceDecayPct: number | null; // % change between first half and second half
  qualityStatus: QualityGrade;
  insufficientReason?: string;
  taps: TapEvent[];
}

export interface MotorStabilityConfig {
  practicePaths: number;       // default 1
  measuredPaths: number;       // default 3
  corridorWidthPx: number;     // default 28px
  finishTargetRadiusPx: number; // default 24px
}

export interface ResearchBatteryConfig {
  protocolPreset: 'STANDARD' | 'QUICK' | 'EXTENDED' | 'CUSTOM';
  reactionTime: ReactionTimeConfig;
  motorStability: MotorStabilityConfig;
  fingerTap: FingerTapConfig;
}

export interface QualityCheckItem {
  name: string;
  category: 'Reaction Time' | 'Motor Stability' | 'Finger Tap' | 'Environment & Focus';
  status: 'PASS' | 'WARNING' | 'FAIL' | 'NOT_TESTED';
  detail: string;
  criterion: string;
}

export interface BatterySession {
  sessionId: string;
  startTime: string;
  endTime?: string;
  deviceInfo: DeviceAuditInfo;
  configSnapshot?: ResearchBatteryConfig;
  reactionTime?: { summary: ReactionTimeSummary; trials: ReactionTimeTrial[] };
  motorStability?: { summary: MotorStabilitySummary; trials: MotorTrialResult[] };
  fingerTap?: { summary: FingerTapSummary; taps: TapEvent[] };
  overallQuality: QualityGrade;
  completionStatus: 'COMPLETE' | 'PARTIAL' | 'EMPTY';
}




