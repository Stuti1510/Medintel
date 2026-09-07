/**
 * MEDINTEL AI — Motor & Cognitive Screening API Service
 * Handles persistence to backend experiment database and aggregate research statistics fetching.
 */

import { BatterySession } from '../types/motor';

const API_BASE = "http://localhost:8000/api/motor";

export interface SaveSessionResponse {
  status: string;
  session_id: number;
  session_reference: string;
  saved_trials: number;
  saved_metrics: number;
  timestamp: string;
}

/**
 * Saves a completed screening session and all its raw trials to the backend database.
 */
export async function saveMotorScreeningSession(session: BatterySession): Promise<SaveSessionResponse> {
  const trialsPayload: any[] = [];
  const metricsPayload: any[] = [];

  // 1. Format Reaction-Time Trials
  if (session.reactionTime) {
    const { summary, trials } = session.reactionTime;
    for (const t of trials) {
      trialsPayload.push({
        test_type: 'reaction-time',
        trial_number: t.trialNumber,
        is_practice: Boolean(t.isPractice),
        status: t.status,
        stimulus_timestamp: t.stimulusTimestamp,
        response_timestamp: t.responseTimestamp,
        reaction_time_ms: t.reactionTimeMs,
        input_type: t.inputType
      });
    }

    metricsPayload.push({
      test_type: 'reaction-time',
      derived_metrics: {
        medianRtMs: summary.medianRtMs,
        meanRtMs: summary.meanRtMs,
        stdDevRtMs: summary.stdDevRtMs,
        rtVariability: summary.rtVariability,
        fastestRtMs: summary.fastestRtMs,
        slowestRtMs: summary.slowestRtMs,
        validTrials: summary.validTrials,
        totalTrials: summary.totalTrials,
        falseStarts: summary.falseStarts,
        missedTrials: summary.missedTrials,
        focusLossEvents: summary.focusLossEvents
      },
      quality_status: summary.qualityStatus
    });
  }

  // 2. Format Motor Stability Trials
  if (session.motorStability) {
    const { summary, trials } = session.motorStability;
    for (const t of trials) {
      trialsPayload.push({
        test_type: 'motor-stability',
        trial_number: t.trialIndex,
        is_practice: Boolean(t.isPractice),
        status: t.status,
        path_id: t.pathId,
        path_efficiency_pct: t.pathEfficiencyPct,
        mean_deviation_px: t.meanDeviationPx,
        input_type: 'pointer',
        // Compress trajectory samples for network efficiency
        coordinates_data: t.samples.map(s => ({
          t: Number((s.timestamp - t.samples[0].timestamp).toFixed(1)),
          nx: Number(s.normalizedX.toFixed(3)),
          ny: Number(s.normalizedY.toFixed(3)),
          dev: s.deviationPx
        }))
      });
    }

    metricsPayload.push({
      test_type: 'motor-stability',
      derived_metrics: {
        overallPathEfficiencyPct: summary.overallPathEfficiencyPct,
        overallMeanDeviationPx: summary.overallMeanDeviationPx,
        overallMaxDeviationPx: summary.overallMaxDeviationPx,
        overallRmsDeviationPx: summary.overallRmsDeviationPx,
        overallMeanSpeedPxSec: summary.overallMeanSpeedPxSec,
        overallSpeedVariability: summary.overallSpeedVariability,
        totalDurationSec: summary.totalDurationSec,
        totalSamples: summary.totalSamples,
        validTrials: summary.validTrials
      },
      quality_status: summary.qualityStatus
    });
  }

  // 3. Format Finger-Tap Trials
  if (session.fingerTap) {
    const { summary, taps } = session.fingerTap;
    for (const t of taps) {
      trialsPayload.push({
        test_type: 'finger-tap',
        trial_number: t.tapNumber,
        is_practice: Boolean(t.isPractice),
        status: 'VALID',
        stimulus_timestamp: t.timestamp,
        inter_tap_interval_ms: t.interTapIntervalMs,
        input_type: t.inputType
      });
    }

    metricsPayload.push({
      test_type: 'finger-tap',
      derived_metrics: {
        tapsPerSecond: summary.tapsPerSecond,
        tapsPerMinute: summary.tapsPerMinute,
        meanIntervalMs: summary.meanIntervalMs,
        medianIntervalMs: summary.medianIntervalMs,
        stdDevIntervalMs: summary.stdDevIntervalMs,
        coefficientOfVariationPct: summary.coefficientOfVariationPct,
        cadenceDecayPct: summary.cadenceDecayPct,
        totalTaps: summary.totalTaps,
        validIntervalsCount: summary.validIntervalsCount
      },
      quality_status: summary.qualityStatus
    });
  }

  const payload = {
    session_reference: session.sessionId,
    start_time: session.startTime,
    end_time: session.endTime || new Date().toISOString(),
    device_tier: session.deviceInfo?.inferredDevice || 'Desktop',
    input_sensor: session.deviceInfo?.recommendedInput || 'Mouse',
    viewport_width: session.deviceInfo?.screenWidth,
    viewport_height: session.deviceInfo?.screenHeight,
    user_agent: session.deviceInfo?.userAgent,
    overall_quality: session.overallQuality,
    completion_status: session.completionStatus,
    trials: trialsPayload,
    metrics: metricsPayload
  };

  const res = await fetch(`${API_BASE}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Database save failed" }));
    throw new Error(err.detail || `Persistence failed (${res.status})`);
  }

  return res.json();
}

/**
 * Fetches all saved motor screening sessions with pagination.
 */
export async function getMotorScreeningSessions(limit: number = 50, offset: number = 0): Promise<any[]> {
  const res = await fetch(`${API_BASE}/sessions?limit=${limit}&offset=${offset}`);
  if (!res.ok) {
    throw new Error(`Failed to load sessions (${res.status})`);
  }
  return res.json();
}

/**
 * Fetches full session details including granular trials.
 */
export async function getMotorScreeningSessionDetails(sessionId: number): Promise<any> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`);
  if (!res.ok) {
    throw new Error(`Failed to load session details (${res.status})`);
  }
  return res.json();
}

/**
 * Fetches aggregate screening statistics across all completed database records.
 */
export async function getMotorScreeningStats(): Promise<any> {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) {
    throw new Error(`Failed to load aggregate stats (${res.status})`);
  }
  return res.json();
}

// Backward-compatible aliases
export const getMotorSessions = getMotorScreeningSessions;
export const getMotorAggregateStats = getMotorScreeningStats;

