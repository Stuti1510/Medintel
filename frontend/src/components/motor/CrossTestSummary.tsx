/**
 * MEDINTEL AI — Cross-Test Motor Screening Battery Summary & Quality Audit
 * Comprehensive behavioral triad metrics, multi-dimensional quality control checks,
 * transparent mathematical definitions, and strict non-diagnostic clinical boundaries.
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Timer,
  Activity,
  Hand,
  RotateCcw,
  ChevronLeft,
  Download,
  Info,
  Laptop,
  Check,
  Minus,
  Database,
  Loader2,
  UploadCloud,
  FileJson,
  FileSpreadsheet
} from 'lucide-react';
import { BatterySession, QualityGrade } from '../../types/motor';
import { calculateBatteryQuality } from '../../utils/screeningMath';
import { saveMotorScreeningSession } from '../../services/motorApi';
import { exportSessionAsJson, exportTrialsAsCsv } from '../../utils/motorExport';

interface Props {
  session: BatterySession;
  onBack: () => void;
  onSelectModule: (moduleId: 'reaction-time' | 'motor-stability' | 'finger-tap') => void;
  onResetSession?: () => void;
}

export const CrossTestSummary: React.FC<Props> = ({
  session,
  onBack,
  onSelectModule,
  onResetSession
}) => {
  const { quality: globalQuality, checks } = calculateBatteryQuality(session);

  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SAVED' | 'ERROR'>('IDLE');
  const [backendSessionId, setBackendSessionId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const rt = session.reactionTime?.summary;
  const ms = session.motorStability?.summary;
  const ft = session.fingerTap?.summary;

  const completedCount = [Boolean(rt), Boolean(ms), Boolean(ft)].filter(Boolean).length;

  const handleSaveToRegistry = async () => {
    setSaveStatus('SAVING');
    setSaveError(null);
    try {
      const response = await saveMotorScreeningSession(session);
      setSaveStatus('SAVED');
      setBackendSessionId(response.session_id);
    } catch (err: any) {
      setSaveStatus('ERROR');
      setSaveError(err.message || 'Database synchronization failed');
    }
  };


  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Print-Only Header (Section 32) */}
      <div className="print-only border-b-2 border-[#1b1938] pb-4 mb-6">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-[9pt] font-mono uppercase text-[#73706d] block">MEDINTEL AI Biomedical Research Platform</span>
            <h1 className="text-xl font-bold font-editorial text-[#1b1938]">Multi-Modal Motor Screening Report</h1>
          </div>
          <div className="text-right text-[8pt] font-mono text-[#73706d]">
            <div>Session Token: {session.sessionId}</div>
            <div>Generated: {new Date().toLocaleString()}</div>
            <div>Quality Status: {globalQuality}</div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. Header Navigation & Battery Session Metadata               */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e8e4dd] pb-4 no-print">
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
                Screening Battery Report
              </span>
              <span className="text-[10px] font-mono text-[#155555] bg-[#eef7f7] px-2 py-0.5 rounded border border-[#a3cfcf]/40">
                Session: {session.sessionId}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#292827] mt-0.5 font-editorial">
              Motor Screening Battery Summary
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onResetSession && (
            <button
              onClick={onResetSession}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium border border-[#e8e4dd] bg-white text-[#73706d] hover:text-[#292827] hover:bg-[#fafaf8] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Battery Session</span>
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. Top Session Status & Quality Header Banner                 */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-[#e8e4dd] rounded-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e8e4dd] pb-4">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[#73706d]">
              Protocol Completion: {completedCount} of 3 Instruments Executed
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-[#292827]">
              Multi-Modal Behavioral Profile
            </h3>
            <p className="text-xs sm:text-sm text-[#73706d]">
              Collected under controlled browser environment at {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Persistence Status Badge (Section 24) */}
            {saveStatus === 'SAVED' && (
              <span className="px-3 py-1 rounded-pill text-xs font-mono font-bold tracking-wide uppercase bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>SAVED TO REGISTRY (ID #{backendSessionId})</span>
              </span>
            )}
            {saveStatus === 'SAVING' && (
              <span className="px-3 py-1 rounded-pill text-xs font-mono font-bold tracking-wide uppercase bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>SAVING TO EXPERIMENT REGISTRY...</span>
              </span>
            )}
            {saveStatus === 'IDLE' && (
              <span className="px-3 py-1 rounded-pill text-xs font-mono font-medium tracking-wide uppercase bg-gray-100 text-[#73706d] border border-[#e8e4dd]">
                LOCAL SESSION (Not Persisted)
              </span>
            )}
            {saveStatus === 'ERROR' && (
              <span className="px-3 py-1 rounded-pill text-xs font-mono font-medium tracking-wide uppercase bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>LOCAL SESSION ({saveError})</span>
              </span>
            )}

            <span className={`px-3 py-1 rounded-pill text-xs font-mono font-bold tracking-wider uppercase border ${
              globalQuality === 'HIGH QUALITY'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : globalQuality === 'ACCEPTABLE'
                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}>
              Battery Quality: {globalQuality}
            </span>
          </div>
        </div>

        {/* Device & Environment Specs Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#fafaf8] p-3 rounded-button border border-[#e8e4dd]/70">
          <div>
            <span className="text-[10px] font-mono text-[#9a9794] uppercase block">Device Tier</span>
            <span className="font-semibold text-[#292827]">{session.deviceInfo?.inferredDevice || 'Desktop'}</span>
          </div>
          <div>
            <span className="text-[10px] font-mono text-[#9a9794] uppercase block">Pointer Sensor</span>
            <span className="font-semibold text-[#292827]">{session.deviceInfo?.hasFinePointer ? 'Precision Fine Pointer' : 'Touch / Coarse'}</span>
          </div>
          <div>
            <span className="text-[10px] font-mono text-[#9a9794] uppercase block">Viewport Res</span>
            <span className="font-mono text-[#292827]">{session.deviceInfo?.screenWidth} × {session.deviceInfo?.screenHeight} px</span>
          </div>
          <div>
            <span className="text-[10px] font-mono text-[#9a9794] uppercase block">Timer Clock</span>
            <span className="font-mono text-emerald-700 font-semibold">performance.now()</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. Three Standardized Behavioral Test Triads                  */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Module 1: REACTION TIME */}
        <div className="bg-white border border-[#e8e4dd] rounded-card p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#f1f0ec] pb-3">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-[#155555]" />
                <span className="font-bold text-sm text-[#292827]">01 — REACTION TIME</span>
              </div>
              <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                rt
                  ? rt.qualityStatus === 'HIGH QUALITY'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-blue-50 text-blue-700'
                  : 'bg-[#f5f4f0] text-[#73706d]'
              }`}>
                {rt ? rt.qualityStatus : 'PENDING'}
              </span>
            </div>

            {rt ? (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-[#fafaf8] rounded border border-[#e8e4dd]">
                    <span className="text-[10px] font-mono text-[#73706d] block">Median Latency</span>
                    <span className="text-xl font-bold font-mono text-[#1b1938]">{rt.medianRtMs} ms</span>
                  </div>
                  <div className="p-2.5 bg-[#fafaf8] rounded border border-[#e8e4dd]">
                    <span className="text-[10px] font-mono text-[#73706d] block">RT Variability (CV)</span>
                    <span className="text-xl font-bold font-mono text-[#292827]">{rt.rtVariability}%</span>
                  </div>
                </div>

                <div className="space-y-1 text-[#73706d] text-[11px] pt-1">
                  <div className="flex justify-between">
                    <span>Valid Presentations:</span>
                    <span className="font-mono text-[#292827]">{rt.validTrials} / {rt.totalTrials} ({((rt.validTrials / (rt.totalTrials || 1)) * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mean RT:</span>
                    <span className="font-mono text-[#292827]">{rt.meanRtMs} ms (±{rt.stdDevRtMs} ms)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fastest / Slowest:</span>
                    <span className="font-mono text-[#292827]">{rt.fastestRtMs} / {rt.slowestRtMs} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>False Starts / Missed:</span>
                    <span className="font-mono text-[#292827]">{rt.falseStarts} / {rt.missedTrials}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-[#fafaf8] rounded-button text-center space-y-2 text-xs text-[#73706d]">
                <p>Reaction-Time instrument not yet completed in this session.</p>
                <button
                  onClick={() => onSelectModule('reaction-time')}
                  className="px-3 py-1.5 bg-[#1b1938] text-white text-[11px] font-semibold rounded-button"
                >
                  Start Reaction Test →
                </button>
              </div>
            )}
          </div>

          {rt && (
            <button
              onClick={() => onSelectModule('reaction-time')}
              className="w-full py-2 bg-[#fafaf8] hover:bg-[#f5f4f0] border border-[#e8e4dd] text-xs font-semibold text-[#1b1938] rounded-button transition-colors"
            >
              Re-run Instrument 01
            </button>
          )}
        </div>

        {/* Module 2: MOTOR STABILITY */}
        <div className="bg-white border border-[#e8e4dd] rounded-card p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#f1f0ec] pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#155555]" />
                <span className="font-bold text-sm text-[#292827]">02 — MOTOR STABILITY</span>
              </div>
              <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                ms
                  ? ms.qualityStatus === 'HIGH QUALITY'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-blue-50 text-blue-700'
                  : 'bg-[#f5f4f0] text-[#73706d]'
              }`}>
                {ms ? ms.qualityStatus : 'PENDING'}
              </span>
            </div>

            {ms ? (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-[#fafaf8] rounded border border-[#e8e4dd]">
                    <span className="text-[10px] font-mono text-[#73706d] block">Mean Deviation</span>
                    <span className="text-xl font-bold font-mono text-[#1b1938]">{ms.overallMeanDeviationPx} px</span>
                  </div>
                  <div className="p-2.5 bg-[#fafaf8] rounded border border-[#e8e4dd]">
                    <span className="text-[10px] font-mono text-[#73706d] block">Path Efficiency</span>
                    <span className="text-xl font-bold font-mono text-[#292827]">{ms.overallPathEfficiencyPct}%</span>
                  </div>
                </div>

                <div className="space-y-1 text-[#73706d] text-[11px] pt-1">
                  <div className="flex justify-between">
                    <span>Paths Completed:</span>
                    <span className="font-mono text-[#292827]">{ms.validTrials} / 3 vectors</span>
                  </div>
                  <div className="flex justify-between">
                    <span>RMS Error:</span>
                    <span className="font-mono text-[#292827]">{ms.overallRmsDeviationPx} px</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mean Speed:</span>
                    <span className="font-mono text-[#292827]">{ms.overallMeanSpeedPxSec} px/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Duration:</span>
                    <span className="font-mono text-[#292827]">{ms.totalDurationSec}s ({ms.totalSamples} pts)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-[#fafaf8] rounded-button text-center space-y-2 text-xs text-[#73706d]">
                <p>Motor Stability instrument not yet completed in this session.</p>
                <button
                  onClick={() => onSelectModule('motor-stability')}
                  className="px-3 py-1.5 bg-[#1b1938] text-white text-[11px] font-semibold rounded-button"
                >
                  Start Tracing Test →
                </button>
              </div>
            )}
          </div>

          {ms && (
            <button
              onClick={() => onSelectModule('motor-stability')}
              className="w-full py-2 bg-[#fafaf8] hover:bg-[#f5f4f0] border border-[#e8e4dd] text-xs font-semibold text-[#1b1938] rounded-button transition-colors"
            >
              Re-run Instrument 02
            </button>
          )}
        </div>

        {/* Module 3: FINGER TAP */}
        <div className="bg-white border border-[#e8e4dd] rounded-card p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#f1f0ec] pb-3">
              <div className="flex items-center gap-2">
                <Hand className="w-4 h-4 text-[#155555]" />
                <span className="font-bold text-sm text-[#292827]">03 — FINGER TAP</span>
              </div>
              <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                ft
                  ? ft.qualityStatus === 'HIGH QUALITY'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-blue-50 text-blue-700'
                  : 'bg-[#f5f4f0] text-[#73706d]'
              }`}>
                {ft ? ft.qualityStatus : 'PENDING'}
              </span>
            </div>

            {ft ? (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-[#fafaf8] rounded border border-[#e8e4dd]">
                    <span className="text-[10px] font-mono text-[#73706d] block">Tapping Rate</span>
                    <span className="text-xl font-bold font-mono text-[#1b1938]">{ft.tapsPerSecond} Hz</span>
                  </div>
                  <div className="p-2.5 bg-[#fafaf8] rounded border border-[#e8e4dd]">
                    <span className="text-[10px] font-mono text-[#73706d] block">Rhythm Regularity (CV)</span>
                    <span className="text-xl font-bold font-mono text-[#292827]">{ft.coefficientOfVariationPct}%</span>
                  </div>
                </div>

                <div className="space-y-1 text-[#73706d] text-[11px] pt-1">
                  <div className="flex justify-between">
                    <span>Mean Interval (ITI):</span>
                    <span className="font-mono text-[#292827]">{ft.meanIntervalMs} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Median Interval:</span>
                    <span className="font-mono text-[#292827]">{ft.medianIntervalMs} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cadence Decay:</span>
                    <span className="font-mono text-[#292827]">{ft.cadenceDecayPct !== null ? `${ft.cadenceDecayPct > 0 ? '+' : ''}${ft.cadenceDecayPct}%` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Taps:</span>
                    <span className="font-mono text-[#292827]">{ft.totalTaps} taps ({ft.durationSec}s)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-[#fafaf8] rounded-button text-center space-y-2 text-xs text-[#73706d]">
                <p>Finger-Tap Rhythm instrument not yet completed in this session.</p>
                <button
                  onClick={() => onSelectModule('finger-tap')}
                  className="px-3 py-1.5 bg-[#1b1938] text-white text-[11px] font-semibold rounded-button"
                >
                  Start Tapping Test →
                </button>
              </div>
            )}
          </div>

          {ft && (
            <button
              onClick={() => onSelectModule('finger-tap')}
              className="w-full py-2 bg-[#fafaf8] hover:bg-[#f5f4f0] border border-[#e8e4dd] text-xs font-semibold text-[#1b1938] rounded-button transition-colors"
            >
              Re-run Instrument 03
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. Measurement Quality Control Audit (Section 20)             */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-[#e8e4dd] rounded-card p-6 sm:p-8 space-y-6">
        <div className="space-y-1 border-b border-[#e8e4dd] pb-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#73706d]">
            Quality Assurance Protocol
          </span>
          <h3 className="text-xl font-semibold text-[#292827]">
            Measurement Quality & Experimental Rigor Audit
          </h3>
          <p className="text-xs sm:text-sm text-[#73706d]">
            Every session evaluates valid presentation ratios, input polling frequency, and window focus continuity.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#e8e4dd] text-[10px] font-mono uppercase text-[#73706d]">
                <th className="py-2.5 px-3">Quality Parameter</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Observed Value / Detail</th>
                <th className="py-2.5 px-3">Rigor Criterion</th>
                <th className="py-2.5 px-3 text-right">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f0ec]">
              {checks.map((c, idx) => (
                <tr key={idx} className="hover:bg-[#fafaf8]">
                  <td className="py-3 px-3 font-medium text-[#292827]">{c.name}</td>
                  <td className="py-3 px-3 text-[#73706d] font-mono text-[11px]">{c.category}</td>
                  <td className="py-3 px-3 text-[#292827] font-mono text-[11px]">{c.detail}</td>
                  <td className="py-3 px-3 text-[#73706d]">{c.criterion}</td>
                  <td className="py-3 px-3 text-right">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-semibold ${
                      c.status === 'PASS'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : c.status === 'WARNING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : c.status === 'FAIL'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                    }`}>
                      {c.status === 'PASS' && <Check className="w-3 h-3 text-emerald-600" />}
                      {c.status === 'WARNING' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                      {c.status === 'FAIL' && <XCircle className="w-3 h-3 text-rose-600" />}
                      {c.status === 'NOT_TESTED' && <Minus className="w-3 h-3 text-gray-400" />}
                      <span>{c.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. Hardware & Environmental Limitations (Section 33)          */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-[#e8e4dd] rounded-card p-6 sm:p-8 space-y-4 text-xs text-[#73706d] break-inside-avoid">
        <div className="flex items-center gap-2 border-b border-[#e8e4dd] pb-3">
          <Laptop className="w-4 h-4 text-[#155555] shrink-0" />
          <span className="font-bold text-sm text-[#292827]">
            Hardware Limitations, Polling Rates & Experimental Latency Caveats
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 leading-relaxed">
          <div className="p-3 bg-[#fafaf8] rounded border border-[#e8e4dd] space-y-1">
            <span className="font-semibold text-[#292827] block">Display Refresh Quantization</span>
            <p>
              Visual stimuli presentation is bounded by the display refresh interval (~16.6ms at 60Hz, ~8.3ms at 120Hz). Actual photon emission occurs on VSYNC frames.
            </p>
          </div>

          <div className="p-3 bg-[#fafaf8] rounded border border-[#e8e4dd] space-y-1">
            <span className="font-semibold text-[#292827] block">Input Sensor Polling Jitter</span>
            <p>
              Standard USB pointers poll at 125Hz (8ms sampling delta). High-speed gaming sensors poll at 500–1000Hz (1–2ms), while capacitive touchscreens incur 15–40ms digitization queuing.
            </p>
          </div>

          <div className="p-3 bg-[#fafaf8] rounded border border-[#e8e4dd] space-y-1">
            <span className="font-semibold text-[#292827] block">Browser Scheduling & Clock</span>
            <p>
              Timestamps utilize the microsecond-precision monotonic clock (<code className="font-mono text-[#1b1938]">performance.now()</code>), independent of OS clock adjustments.
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 6. Non-Diagnostic Separation Language (Section 19 & 34)        */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-[#fafaf8] border border-[#e8e4dd] rounded-card p-6 space-y-3 text-xs text-[#73706d] break-inside-avoid">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-[#1b1938] shrink-0" />
          <span className="font-semibold text-sm text-[#292827]">
            Non-Diagnostic Architecture & Measurement Separation Policy
          </span>
        </div>
        <p className="leading-relaxed">
          MEDINTEL AI Motor Screening is a research and educational prototype.
          These measurements report individual kinematic and latency parameters under controlled browser tasks.
          They are <strong>NOT aggregated into a composite "Neurological Risk Score", "Parkinson's Probability", or "ADHD Index"</strong>, and are not wired into the clinical diagnostic AI models.
          Professional clinical neurological examination and calibrated diagnostic instruments are required for medical assessment.
        </p>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 6. Footer Navigation Actions                                  */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center justify-between pt-4 border-t border-[#e8e4dd]">
        <button
          onClick={onBack}
          className="px-4 py-2.5 rounded-button text-xs font-medium border border-[#e8e4dd] text-[#73706d] hover:bg-[#fafaf8]"
        >
          Return to Screening Suite
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => exportSessionAsJson(session)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#e8e4dd] hover:bg-[#fafaf8] text-[#292827] text-xs font-semibold rounded-button transition-colors shadow-sm"
            title="Download full hierarchal session as JSON"
          >
            <FileJson className="w-3.5 h-3.5 text-[#155555]" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={() => exportTrialsAsCsv(session)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#e8e4dd] hover:bg-[#fafaf8] text-[#292827] text-xs font-semibold rounded-button transition-colors shadow-sm"
            title="Download granular trial stream as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#155555]" />
            <span>Export Trials CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#e8e4dd] hover:bg-[#fafaf8] text-[#292827] text-xs font-semibold rounded-button transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Print PDF</span>
          </button>

          <button
            onClick={handleSaveToRegistry}
            disabled={saveStatus === 'SAVING' || saveStatus === 'SAVED'}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-button transition-colors shadow-sm ${
              saveStatus === 'SAVED'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 cursor-default'
                : saveStatus === 'SAVING'
                  ? 'bg-blue-50 text-blue-800 border border-blue-200 cursor-wait'
                  : 'bg-[#1b1938] hover:bg-[#0e0c1f] text-white'
            }`}
          >
            {saveStatus === 'SAVING' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving to Registry...</span>
              </>
            ) : saveStatus === 'SAVED' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Saved (ID #{backendSessionId})</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Save to Registry</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
