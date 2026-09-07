/**
 * MEDINTEL AI — Screening Mathematics & Statistical Derivations
 * Rigorous mathematical derivations computed strictly from real recorded trials.
 */

import {
  ReactionTimeTrial,
  ReactionTimeSummary,
  QualityGrade,
  PointerSample,
  MotorTrialResult,
  MotorStabilitySummary,
  TapEvent,
  FingerTapSummary,
  QualityCheckItem,
  BatterySession
} from '../types/motor';

export function calculateReactionTimeStats(trials: ReactionTimeTrial[]): ReactionTimeSummary {
  // Only evaluate measured (non-practice) trials for formal statistics
  const measured = trials.filter((t) => !t.isPractice);
  const practice = trials.filter((t) => t.isPractice);

  const totalTrials = measured.length;
  const validTrialsList = measured.filter((t) => t.status === 'VALID' && t.reactionTimeMs !== null && t.reactionTimeMs >= 100);
  const falseStarts = measured.filter((t) => t.status === 'FALSE_START').length;
  const missedTrials = measured.filter((t) => t.status === 'MISSED').length;
  const invalidTrials = measured.filter((t) => t.status === 'INVALID').length;
  const focusLossEvents = measured.filter((t) => t.status === 'FOCUS_LOST').length;

  const validCount = validTrialsList.length;

  const falseStartRatePct = totalTrials > 0 ? (falseStarts / totalTrials) * 100 : 0;
  const missRatePct = totalTrials > 0 ? (missedTrials / totalTrials) * 100 : 0;

  // If fewer than 3 valid trials, we cannot calculate reliable variance/statistics
  if (validCount < 3) {
    let quality: QualityGrade = 'INSUFFICIENT DATA';
    return {
      totalTrials,
      validTrials: validCount,
      practiceTrialsCount: practice.length,
      falseStarts,
      missedTrials,
      focusLossEvents,
      invalidTrials,
      medianRtMs: null,
      meanRtMs: null,
      stdDevRtMs: null,
      fastestRtMs: null,
      slowestRtMs: null,
      rtVariability: null,
      falseStartRatePct: Number(falseStartRatePct.toFixed(1)),
      missRatePct: Number(missRatePct.toFixed(1)),
      qualityStatus: quality,
      insufficientReason: `Only ${validCount} valid trial(s) recorded. Minimum 3 valid trials required for statistical computation.`
    };
  }

  const values = validTrialsList.map((t) => t.reactionTimeMs!).sort((a, b) => a - b);

  // Median RT
  const mid = Math.floor(values.length / 2);
  const medianRtMs = values.length % 2 !== 0
    ? values[mid]
    : (values[mid - 1] + values[mid]) / 2;

  // Mean RT
  const sum = values.reduce((acc, v) => acc + v, 0);
  const meanRtMs = sum / values.length;

  // Sample Standard Deviation
  const varianceSum = values.reduce((acc, v) => acc + Math.pow(v - meanRtMs, 2), 0);
  const stdDevRtMs = Math.sqrt(varianceSum / (values.length - 1));

  // Reaction-Time Variability (Coefficient of Variation % = (SD / Mean) * 100)
  const rtVariability = meanRtMs > 0 ? (stdDevRtMs / meanRtMs) * 100 : 0;

  const fastestRtMs = values[0];
  const slowestRtMs = values[values.length - 1];

  // Quality Assessment
  let qualityStatus: QualityGrade = 'HIGH QUALITY';
  if (validCount >= Math.floor(totalTrials * 0.8) && falseStarts <= 2 && focusLossEvents === 0) {
    qualityStatus = 'HIGH QUALITY';
  } else if (validCount >= Math.floor(totalTrials * 0.5) && focusLossEvents <= 2) {
    qualityStatus = 'ACCEPTABLE';
  } else if (validCount >= 3) {
    qualityStatus = 'LOW QUALITY';
  } else {
    qualityStatus = 'INSUFFICIENT DATA';
  }

  return {
    totalTrials,
    validTrials: validCount,
    practiceTrialsCount: practice.length,
    falseStarts,
    missedTrials,
    focusLossEvents,
    invalidTrials,
    medianRtMs: Number(medianRtMs.toFixed(1)),
    meanRtMs: Number(meanRtMs.toFixed(1)),
    stdDevRtMs: Number(stdDevRtMs.toFixed(1)),
    fastestRtMs: Number(fastestRtMs.toFixed(1)),
    slowestRtMs: Number(slowestRtMs.toFixed(1)),
    rtVariability: Number(rtVariability.toFixed(1)),
    falseStartRatePct: Number(falseStartRatePct.toFixed(1)),
    missRatePct: Number(missRatePct.toFixed(1)),
    qualityStatus
  };
}

// ---------------------------------------------------------------------------
// Motor Stability Math & Spatial Trajectory Calculations
// ---------------------------------------------------------------------------

/**
 * Calculates perpendicular Euclidean distance from point (px, py) to line segment (x1, y1)-(x2, y2).
 */
export function calculatePerpendicularDeviation(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;

  if (l2 === 0) {
    return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  }

  // Projection parameter t clamped to [0, 1]
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;

  return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
}

/**
 * Derives comprehensive spatial and kinematic metrics from recorded pointer samples.
 */
export function calculateMotorTrialMetrics(
  trialIndex: number,
  pathId: string,
  pathName: string,
  isPractice: boolean,
  samples: PointerSample[],
  startX: number,
  startY: number,
  endX: number,
  endY: number
): MotorTrialResult {
  if (samples.length < 2) {
    return {
      trialIndex,
      pathId,
      pathName,
      isPractice,
      durationMs: 0,
      sampleCount: samples.length,
      actualPathLengthPx: 0,
      idealPathLengthPx: Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2),
      pathEfficiencyPct: 0,
      meanDeviationPx: 0,
      maxDeviationPx: 0,
      rmsDeviationPx: 0,
      meanSpeedPxSec: 0,
      speedVariability: 0,
      samples,
      status: 'INCOMPLETE'
    };
  }

  // Ideal Euclidean distance between start and end
  const idealPathLengthPx = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);

  // Calculate actual path length & segment speeds
  let actualPathLengthPx = 0;
  const segmentSpeeds: number[] = [];
  const deviations: number[] = [];
  let sumSqDeviation = 0;

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    deviations.push(s.deviationPx);
    sumSqDeviation += s.deviationPx * s.deviationPx;

    if (i > 0) {
      const prev = samples[i - 1];
      const dist = Math.sqrt((s.x - prev.x) ** 2 + (s.y - prev.y) ** 2);
      const dt = (s.timestamp - prev.timestamp) / 1000; // in seconds
      actualPathLengthPx += dist;

      if (dt > 0.001) {
        segmentSpeeds.push(dist / dt);
      }
    }
  }

  const durationMs = samples[samples.length - 1].timestamp - samples[0].timestamp;
  const durationSec = durationMs / 1000;

  // Path Efficiency (%) = (Ideal Path Length / Actual Path Length) * 100
  const pathEfficiencyPct = actualPathLengthPx > 0
    ? Math.min(100, (idealPathLengthPx / actualPathLengthPx) * 100)
    : 100;

  // Mean & Max Deviation
  const meanDeviationPx = deviations.reduce((a, b) => a + b, 0) / deviations.length;
  const maxDeviationPx = Math.max(...deviations);

  // Root Mean Square (RMS) Deviation: sqrt( sum(d^2) / N )
  const rmsDeviationPx = Math.sqrt(sumSqDeviation / deviations.length);

  // Mean Velocity (px/sec)
  const meanSpeedPxSec = durationSec > 0 ? actualPathLengthPx / durationSec : 0;

  // Speed Variability (Standard deviation of segment speeds)
  let speedVariability = 0;
  if (segmentSpeeds.length > 1) {
    const avgSpeed = segmentSpeeds.reduce((a, b) => a + b, 0) / segmentSpeeds.length;
    const speedVarSum = segmentSpeeds.reduce((acc, v) => acc + (v - avgSpeed) ** 2, 0);
    speedVariability = Math.sqrt(speedVarSum / (segmentSpeeds.length - 1));
  }

  return {
    trialIndex,
    pathId,
    pathName,
    isPractice,
    durationMs: Number(durationMs.toFixed(1)),
    sampleCount: samples.length,
    actualPathLengthPx: Number(actualPathLengthPx.toFixed(1)),
    idealPathLengthPx: Number(idealPathLengthPx.toFixed(1)),
    pathEfficiencyPct: Number(pathEfficiencyPct.toFixed(1)),
    meanDeviationPx: Number(meanDeviationPx.toFixed(1)),
    maxDeviationPx: Number(maxDeviationPx.toFixed(1)),
    rmsDeviationPx: Number(rmsDeviationPx.toFixed(1)),
    meanSpeedPxSec: Number(meanSpeedPxSec.toFixed(1)),
    speedVariability: Number(speedVariability.toFixed(1)),
    samples,
    status: 'VALID'
  };
}

/**
 * Computes overall multi-trial summary metrics for Motor Stability screening.
 */
export function calculateMotorStabilityStats(trials: MotorTrialResult[]): MotorStabilitySummary {
  const measured = trials.filter((t) => !t.isPractice && t.status === 'VALID');
  const practice = trials.filter((t) => t.isPractice);

  const totalTrials = trials.length;
  const validTrials = measured.length;

  if (validTrials === 0) {
    return {
      totalTrials,
      validTrials: 0,
      practiceTrialsCount: practice.length,
      overallPathEfficiencyPct: 0,
      overallMeanDeviationPx: 0,
      overallMaxDeviationPx: 0,
      overallRmsDeviationPx: 0,
      overallMeanSpeedPxSec: 0,
      overallSpeedVariability: 0,
      totalDurationSec: 0,
      totalSamples: 0,
      qualityStatus: 'INSUFFICIENT DATA',
      insufficientReason: 'No valid measured trajectory data recorded.',
      trialResults: trials
    };
  }

  const avgEfficiency = measured.reduce((acc, t) => acc + t.pathEfficiencyPct, 0) / validTrials;
  const avgMeanDev = measured.reduce((acc, t) => acc + t.meanDeviationPx, 0) / validTrials;
  const maxDev = Math.max(...measured.map((t) => t.maxDeviationPx));
  const avgRmsDev = measured.reduce((acc, t) => acc + t.rmsDeviationPx, 0) / validTrials;
  const avgSpeed = measured.reduce((acc, t) => acc + t.meanSpeedPxSec, 0) / validTrials;
  const avgSpeedVar = measured.reduce((acc, t) => acc + t.speedVariability, 0) / validTrials;
  const totalDurationSec = measured.reduce((acc, t) => acc + (t.durationMs / 1000), 0);
  const totalSamples = measured.reduce((acc, t) => acc + t.sampleCount, 0);

  // Quality grading
  let qualityStatus: QualityGrade = 'HIGH QUALITY';
  if (validTrials >= 3 && totalSamples >= 150) {
    qualityStatus = 'HIGH QUALITY';
  } else if (validTrials >= 2) {
    qualityStatus = 'ACCEPTABLE';
  } else if (validTrials >= 1) {
    qualityStatus = 'LOW QUALITY';
  } else {
    qualityStatus = 'INSUFFICIENT DATA';
  }

  return {
    totalTrials,
    validTrials,
    practiceTrialsCount: practice.length,
    overallPathEfficiencyPct: Number(avgEfficiency.toFixed(1)),
    overallMeanDeviationPx: Number(avgMeanDev.toFixed(1)),
    overallMaxDeviationPx: Number(maxDev.toFixed(1)),
    overallRmsDeviationPx: Number(avgRmsDev.toFixed(1)),
    overallMeanSpeedPxSec: Number(avgSpeed.toFixed(1)),
    overallSpeedVariability: Number(avgSpeedVar.toFixed(1)),
    totalDurationSec: Number(totalDurationSec.toFixed(2)),
    totalSamples,
    qualityStatus,
    trialResults: trials
  };
}

// ---------------------------------------------------------------------------
// Finger-Tap Rhythm & Temporal Isocadence Derivations
// ---------------------------------------------------------------------------

/**
 * Computes rhythm regularity, taps per second, and cadence decay from recorded tap events.
 */
export function calculateFingerTapStats(taps: TapEvent[], measuredDurationSec: number = 20): FingerTapSummary {
  const measured = taps.filter((t) => !t.isPractice);
  const practice = taps.filter((t) => t.isPractice);

  const totalTaps = measured.length;
  // Valid inter-tap intervals (ignoring physics artifacts < 35ms)
  const validIntervalsList = measured
    .map((t) => t.interTapIntervalMs)
    .filter((v): v is number => v !== null && v >= 35);

  const validIntervalsCount = validIntervalsList.length;

  if (validIntervalsCount < 4) {
    return {
      totalTaps,
      practiceTapsCount: practice.length,
      validIntervalsCount,
      durationSec: measuredDurationSec,
      tapsPerSecond: null,
      tapsPerMinute: null,
      meanIntervalMs: null,
      medianIntervalMs: null,
      stdDevIntervalMs: null,
      coefficientOfVariationPct: null,
      fastestIntervalMs: null,
      slowestIntervalMs: null,
      cadenceDecayPct: null,
      qualityStatus: 'INSUFFICIENT DATA',
      insufficientReason: `Only ${validIntervalsCount} valid tap interval(s) recorded. Minimum 4 valid intervals required for rhythm derivation.`,
      taps
    };
  }

  const sortedValues = [...validIntervalsList].sort((a, b) => a - b);

  // Mean Inter-Tap Interval (ms)
  const sum = validIntervalsList.reduce((acc, v) => acc + v, 0);
  const meanIntervalMs = sum / validIntervalsCount;

  // Median Inter-Tap Interval (ms)
  const mid = Math.floor(sortedValues.length / 2);
  const medianIntervalMs = sortedValues.length % 2 !== 0
    ? sortedValues[mid]
    : (sortedValues[mid - 1] + sortedValues[mid]) / 2;

  // Standard Deviation of Inter-Tap Intervals (ms)
  const varianceSum = validIntervalsList.reduce((acc, v) => acc + (v - meanIntervalMs) ** 2, 0);
  const stdDevIntervalMs = Math.sqrt(varianceSum / (validIntervalsCount - 1));

  // Coefficient of Variation (%) = (SD / Mean) * 100
  const coefficientOfVariationPct = meanIntervalMs > 0
    ? (stdDevIntervalMs / meanIntervalMs) * 100
    : 0;

  // Taps per Second (Hz) and Taps per Minute
  const tapsPerSecond = meanIntervalMs > 0 ? 1000 / meanIntervalMs : 0;
  const tapsPerMinute = tapsPerSecond * 60;

  const fastestIntervalMs = sortedValues[0];
  const slowestIntervalMs = sortedValues[sortedValues.length - 1];

  // Cadence Decay (% change from 1st half of intervals to 2nd half of intervals)
  let cadenceDecayPct: number | null = null;
  if (validIntervalsCount >= 6) {
    const halfIdx = Math.floor(validIntervalsList.length / 2);
    const firstHalf = validIntervalsList.slice(0, halfIdx);
    const secondHalf = validIntervalsList.slice(halfIdx);

    const firstHalfMean = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondHalfMean = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    if (firstHalfMean > 0) {
      cadenceDecayPct = ((secondHalfMean - firstHalfMean) / firstHalfMean) * 100;
    }
  }

  // Quality Assessment
  let qualityStatus: QualityGrade = 'HIGH QUALITY';
  if (totalTaps >= 25 && coefficientOfVariationPct <= 25) {
    qualityStatus = 'HIGH QUALITY';
  } else if (totalTaps >= 12) {
    qualityStatus = 'ACCEPTABLE';
  } else if (totalTaps >= 5) {
    qualityStatus = 'LOW QUALITY';
  } else {
    qualityStatus = 'INSUFFICIENT DATA';
  }

  return {
    totalTaps,
    practiceTapsCount: practice.length,
    validIntervalsCount,
    durationSec: measuredDurationSec,
    tapsPerSecond: Number(tapsPerSecond.toFixed(2)),
    tapsPerMinute: Number(tapsPerMinute.toFixed(1)),
    meanIntervalMs: Number(meanIntervalMs.toFixed(1)),
    medianIntervalMs: Number(medianIntervalMs.toFixed(1)),
    stdDevIntervalMs: Number(stdDevIntervalMs.toFixed(1)),
    coefficientOfVariationPct: Number(coefficientOfVariationPct.toFixed(1)),
    fastestIntervalMs: Number(fastestIntervalMs.toFixed(1)),
    slowestIntervalMs: Number(slowestIntervalMs.toFixed(1)),
    cadenceDecayPct: cadenceDecayPct !== null ? Number(cadenceDecayPct.toFixed(1)) : null,
    qualityStatus,
    taps
  };
}

// ---------------------------------------------------------------------------
// Cross-Test Battery Quality & Integrative Data Control Audit
// ---------------------------------------------------------------------------

/**
 * Executes a multi-dimensional Quality Control Audit across all 3 screening tasks.
 */
export function calculateBatteryQuality(session: Partial<BatterySession>): {
  quality: QualityGrade;
  checks: QualityCheckItem[];
} {
  const checks: QualityCheckItem[] = [];

  // 1. Reaction-Time Quality Audit
  if (session.reactionTime) {
    const rt = session.reactionTime.summary;
    const ratio = rt.totalTrials > 0 ? (rt.validTrials / rt.totalTrials) * 100 : 0;

    checks.push({
      name: 'Reaction Time: Valid Trials Ratio',
      category: 'Reaction Time',
      status: ratio >= 80 ? 'PASS' : ratio >= 50 ? 'WARNING' : 'FAIL',
      detail: `${rt.validTrials} of ${rt.totalTrials} trials valid (${ratio.toFixed(0)}%)`,
      criterion: '≥ 80% valid presentations'
    });

    checks.push({
      name: 'Reaction Time: Premature False Starts',
      category: 'Reaction Time',
      status: rt.falseStarts <= 2 ? 'PASS' : rt.falseStarts <= 4 ? 'WARNING' : 'FAIL',
      detail: `${rt.falseStarts} false start(s) logged (${rt.falseStartRatePct}%)`,
      criterion: '≤ 2 premature responses'
    });

    checks.push({
      name: 'Reaction Time: Focus & Tab Integrity',
      category: 'Environment & Focus',
      status: rt.focusLossEvents === 0 ? 'PASS' : 'WARNING',
      detail: `${rt.focusLossEvents} focus loss / window blur event(s)`,
      criterion: '0 window focus disruptions'
    });
  } else {
    checks.push({
      name: 'Reaction-Time Protocol',
      category: 'Reaction Time',
      status: 'NOT_TESTED',
      detail: 'Instrument not yet executed in current session',
      criterion: 'Complete 15 measured presentations'
    });
  }

  // 2. Motor Stability Quality Audit
  if (session.motorStability) {
    const ms = session.motorStability.summary;
    checks.push({
      name: 'Motor Stability: Path Completion',
      category: 'Motor Stability',
      status: ms.validTrials >= 3 ? 'PASS' : ms.validTrials >= 2 ? 'WARNING' : 'FAIL',
      detail: `${ms.validTrials} of 3 measured vectors completed`,
      criterion: '3 / 3 standardized vectors'
    });

    checks.push({
      name: 'Motor Stability: Coordinate Sampling Density',
      category: 'Motor Stability',
      status: ms.totalSamples >= 150 ? 'PASS' : ms.totalSamples >= 60 ? 'WARNING' : 'FAIL',
      detail: `${ms.totalSamples} sub-pixel trajectory points recorded`,
      criterion: '≥ 150 total trajectory points'
    });

    checks.push({
      name: 'Motor Stability: Input Sensor Fidelity',
      category: 'Motor Stability',
      status: session.deviceInfo?.hasFinePointer ? 'PASS' : 'WARNING',
      detail: session.deviceInfo?.hasFinePointer ? 'Precision Mouse/Trackpad' : 'Direct Touch / Coarse Input',
      criterion: 'Hardware pointer sensor recommended'
    });
  } else {
    checks.push({
      name: 'Motor Stability Protocol',
      category: 'Motor Stability',
      status: 'NOT_TESTED',
      detail: 'Instrument not yet executed in current session',
      criterion: 'Complete 3 standardized trajectory paths'
    });
  }

  // 3. Finger-Tap Rhythm Quality Audit
  if (session.fingerTap) {
    const ft = session.fingerTap.summary;
    checks.push({
      name: 'Finger Tap: Minimum Tap Density',
      category: 'Finger Tap',
      status: ft.totalTaps >= 25 ? 'PASS' : ft.totalTaps >= 12 ? 'WARNING' : 'FAIL',
      detail: `${ft.totalTaps} taps logged across 20s test window`,
      criterion: '≥ 25 taps in 20 seconds'
    });

    checks.push({
      name: 'Finger Tap: Rhythm Consistency (CV)',
      category: 'Finger Tap',
      status: (ft.coefficientOfVariationPct || 100) <= 25 ? 'PASS' : (ft.coefficientOfVariationPct || 100) <= 45 ? 'WARNING' : 'FAIL',
      detail: ft.coefficientOfVariationPct !== null ? `CV: ${ft.coefficientOfVariationPct}%` : 'Insufficient intervals',
      criterion: 'CV ≤ 25% for high regularity'
    });
  } else {
    checks.push({
      name: 'Finger-Tap Rhythm Protocol',
      category: 'Finger Tap',
      status: 'NOT_TESTED',
      detail: 'Instrument not yet executed in current session',
      criterion: 'Complete 20s isochronous tap protocol'
    });
  }

  // Global Multi-Battery Quality Derivation
  const testedChecks = checks.filter((c) => c.status !== 'NOT_TESTED');
  if (testedChecks.length === 0) {
    return { quality: 'INSUFFICIENT DATA', checks };
  }

  const hasFail = testedChecks.some((c) => c.status === 'FAIL');
  const warningCount = testedChecks.filter((c) => c.status === 'WARNING').length;

  let quality: QualityGrade = 'HIGH QUALITY';
  if (hasFail) {
    quality = 'LOW QUALITY';
  } else if (warningCount >= 2) {
    quality = 'ACCEPTABLE';
  } else if (warningCount === 1) {
    quality = 'ACCEPTABLE';
  } else {
    quality = 'HIGH QUALITY';
  }

  return { quality, checks };
}



