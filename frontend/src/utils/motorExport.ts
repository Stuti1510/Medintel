/**
 * MEDINTEL AI — Motor & Cognitive Screening Data Exporter
 * Formats behavioral kinematics, trial intervals, and multi-modal session summaries
 * for JSON and CSV research ingestion (Python Pandas, R tidyverse, SPSS, MATLAB).
 */

import { BatterySession } from '../types/motor';

/**
 * Trigger a browser download for a Blob content
 */
function downloadBlob(content: string, fileName: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export a complete hierarchal BatterySession as formatted JSON
 */
export function exportSessionAsJson(session: BatterySession) {
  const jsonString = JSON.stringify(session, null, 2);
  const fileName = `medintel_motor_session_${session.sessionId}_${Date.now()}.json`;
  downloadBlob(jsonString, fileName, 'application/json');
}

/**
 * Export granular trial-by-trial coordinate and latency measurements as CSV
 */
export function exportTrialsAsCsv(session: BatterySession) {
  const rows: string[] = [];

  // CSV Header
  rows.push([
    'session_id',
    'timestamp',
    'device_tier',
    'instrument',
    'trial_number',
    'is_practice',
    'trial_status',
    'input_type',
    'isi_delay_ms',
    'response_latency_ms',
    'path_id',
    'mean_deviation_px',
    'path_efficiency_pct',
    'sample_count',
    'inter_tap_interval_ms'
  ].join(','));

  const sId = session.sessionId;
  const sTime = session.startTime;
  const dev = session.deviceInfo?.inferredDevice || 'Desktop';

  // 1. Reaction-Time Trials
  if (session.reactionTime?.trials) {
    session.reactionTime.trials.forEach((t) => {
      rows.push([
        `"${sId}"`,
        `"${sTime}"`,
        `"${dev}"`,
        '"REACTION_TIME"',
        t.trialNumber,
        t.isPractice ? 1 : 0,
        `"${t.status}"`,
        `"${t.inputType}"`,
        t.isiMs || '',
        t.reactionTimeMs ?? '',
        '""',
        '""',
        '""',
        '""',
        '""'
      ].join(','));
    });
  }

  // 2. Motor Stability Trials
  if (session.motorStability?.trials) {
    session.motorStability.trials.forEach((t) => {
      rows.push([
        `"${sId}"`,
        `"${sTime}"`,
        `"${dev}"`,
        '"MOTOR_STABILITY"',
        t.trialIndex,
        t.isPractice ? 1 : 0,
        `"${t.status}"`,
        '"pointer"',
        '""',
        '""',
        `"${t.pathId}"`,
        t.meanDeviationPx ?? '',
        t.pathEfficiencyPct ?? '',
        t.sampleCount || 0,
        '""'
      ].join(','));
    });
  }

  // 3. Finger-Tap Events
  if (session.fingerTap?.taps) {
    session.fingerTap.taps.forEach((tap) => {
      rows.push([
        `"${sId}"`,
        `"${sTime}"`,
        `"${dev}"`,
        '"FINGER_TAP"',
        tap.tapNumber,
        tap.isPractice ? 1 : 0,
        '"VALID"',
        `"${tap.inputType}"`,
        '""',
        '""',
        '""',
        '""',
        '""',
        '""',
        tap.interTapIntervalMs ?? ''
      ].join(','));
    });
  }

  const csvContent = rows.join('\n');
  const fileName = `medintel_motor_trials_${session.sessionId}_${Date.now()}.csv`;
  downloadBlob(csvContent, fileName, 'text/csv;charset=utf-8;');
}

/**
 * Export summary table of multiple sessions as CSV for statistical modeling
 */
export function exportSessionsSummaryAsCsv(sessions: any[]) {
  const rows: string[] = [];

  rows.push([
    'session_id',
    'created_at',
    'device_tier',
    'has_fine_pointer',
    'quality_grade',
    'rt_median_ms',
    'rt_mean_ms',
    'rt_variability_pct',
    'rt_false_start_rate',
    'ms_mean_deviation_px',
    'ms_path_efficiency_pct',
    'ms_rms_error_px',
    'ft_tapping_rate_hz',
    'ft_cv_variability_pct',
    'ft_mean_iti_ms',
    'ft_cadence_decay_pct'
  ].join(','));

  sessions.forEach((s) => {
    const metrics = s.metrics || {};
    rows.push([
      `"${s.session_token || s.session_id || s.id}"`,
      `"${s.created_at || s.startTime || ''}"`,
      `"${s.device_tier || s.deviceInfo?.inferredDevice || 'Desktop'}"`,
      s.has_fine_pointer ? 1 : 0,
      `"${s.quality_grade || s.overallQuality || 'N/A'}"`,
      metrics.rt_median_ms ?? s.reactionTime?.summary?.medianRtMs ?? '',
      metrics.rt_mean_ms ?? s.reactionTime?.summary?.meanRtMs ?? '',
      metrics.rt_variability ?? s.reactionTime?.summary?.rtVariability ?? '',
      metrics.rt_false_start_rate ?? s.reactionTime?.summary?.falseStartRatePct ?? '',
      metrics.ms_mean_deviation_px ?? s.motorStability?.summary?.overallMeanDeviationPx ?? '',
      metrics.ms_path_efficiency_pct ?? s.motorStability?.summary?.overallPathEfficiencyPct ?? '',
      metrics.ms_rms_error_px ?? s.motorStability?.summary?.overallRmsDeviationPx ?? '',
      metrics.ft_taps_per_second ?? s.fingerTap?.summary?.tapsPerSecond ?? '',
      metrics.ft_cv_pct ?? s.fingerTap?.summary?.coefficientOfVariationPct ?? '',
      metrics.ft_mean_iti_ms ?? s.fingerTap?.summary?.meanIntervalMs ?? '',
      metrics.ft_cadence_decay_pct ?? s.fingerTap?.summary?.cadenceDecayPct ?? ''
    ].join(','));
  });

  const csvContent = rows.join('\n');
  const fileName = `medintel_motor_screening_registry_${Date.now()}.csv`;
  downloadBlob(csvContent, fileName, 'text/csv;charset=utf-8;');
}
