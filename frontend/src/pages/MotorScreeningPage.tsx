import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Timer,
  Activity,
  Hand,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  FileSpreadsheet,
  FileCheck2,
  RotateCcw,
  Sliders
} from 'lucide-react';
import {
  ScreeningModuleId,
  BatterySession,
  ReactionTimeSummary,
  ReactionTimeTrial,
  MotorStabilitySummary,
  MotorTrialResult,
  FingerTapSummary,
  TapEvent,
  ResearchBatteryConfig
} from '../types/motor';
import { auditDeviceCapabilities } from '../utils/deviceCheck';
import { DEFAULT_RESEARCH_CONFIG } from '../utils/researchDefaults';
import { ReactionTimeTest } from '../components/motor/ReactionTimeTest';
import { MotorStabilityTest } from '../components/motor/MotorStabilityTest';
import { FingerTapTest } from '../components/motor/FingerTapTest';
import { CrossTestSummary } from '../components/motor/CrossTestSummary';
import { ResearchConfigModal } from '../components/motor/ResearchConfigModal';

export const MotorScreeningPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const moduleParam = searchParams.get('module') as (ScreeningModuleId | 'battery-summary') | null;
  const [activeModule, setActiveModule] = useState<(ScreeningModuleId | 'battery-summary') | null>(moduleParam);

  // Research Configuration State (Section 28)
  const [researchConfig, setResearchConfig] = useState<ResearchBatteryConfig>(DEFAULT_RESEARCH_CONFIG);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);

  // Active Battery Session State
  const [session, setSession] = useState<BatterySession>(() => ({
    sessionId: `MS-${Date.now().toString(36).toUpperCase()}`,
    startTime: new Date().toISOString(),
    deviceInfo: auditDeviceCapabilities(),
    configSnapshot: DEFAULT_RESEARCH_CONFIG,
    overallQuality: 'INSUFFICIENT DATA',
    completionStatus: 'EMPTY'
  }));

  const completedCount = [
    Boolean(session.reactionTime),
    Boolean(session.motorStability),
    Boolean(session.fingerTap)
  ].filter(Boolean).length;

  // Refresh Protection (Section 26) - Warn user before navigating away if session in progress
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const isSessionInProgress = activeModule !== null || completedCount > 0;
      if (isSessionInProgress) {
        e.preventDefault();
        e.returnValue = 'You have an active motor screening session in progress. Unsaved measurements will be lost.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeModule, completedCount]);

  const handleSelectModule = (modId: ScreeningModuleId | 'battery-summary') => {
    setActiveModule(modId);
    setSearchParams({ module: modId });
  };

  const handleBackToLanding = () => {
    setActiveModule(null);
    setSearchParams({});
  };

  const handleResetSession = () => {
    if (completedCount > 0) {
      const confirmed = window.confirm('Resetting the session will discard all unsaved motor measurements. Continue?');
      if (!confirmed) return;
    }
    setSession({
      sessionId: `MS-${Date.now().toString(36).toUpperCase()}`,
      startTime: new Date().toISOString(),
      deviceInfo: auditDeviceCapabilities(),
      overallQuality: 'INSUFFICIENT DATA',
      completionStatus: 'EMPTY'
    });
    handleBackToLanding();
  };

  // Instrument Completion Handlers
  const handleReactionTimeComplete = (summary: ReactionTimeSummary, trials: ReactionTimeTrial[]) => {
    setSession((prev) => ({
      ...prev,
      reactionTime: { summary, trials },
      completionStatus: prev.motorStability && prev.fingerTap ? 'COMPLETE' : 'PARTIAL'
    }));
  };

  const handleMotorStabilityComplete = (summary: MotorStabilitySummary, trials: MotorTrialResult[]) => {
    setSession((prev) => ({
      ...prev,
      motorStability: { summary, trials },
      completionStatus: prev.reactionTime && prev.fingerTap ? 'COMPLETE' : 'PARTIAL'
    }));
  };

  const handleFingerTapComplete = (summary: FingerTapSummary, taps: TapEvent[]) => {
    setSession((prev) => ({
      ...prev,
      fingerTap: { summary, taps },
      completionStatus: prev.reactionTime && prev.motorStability ? 'COMPLETE' : 'PARTIAL'
    }));
  };

  const testModules = [
    {
      id: "reaction-time",
      number: "01",
      title: "REACTION TIME",
      subtitle: "Measure response latency and response-time variability.",
      description: "Visual target presentation across randomized inter-stimulus intervals to evaluate processing speed, median latency, and attentional variance.",
      metrics: ["Median Latency (ms)", "RT Variability (SD)", "False Start Rate", "Valid Trials"],
      inputRequirement: "Mouse / Pointer / Touch",
      duration: "~60–90 seconds",
      trials: `${researchConfig.reactionTime.practiceTrials} practice + ${researchConfig.reactionTime.measuredTrials} measured`,
      icon: Timer,
      actionText: session.reactionTime ? "Retest Module →" : "Start Test →",
      completed: Boolean(session.reactionTime)
    },
    {
      id: "motor-stability",
      number: "02",
      title: "MOTOR STABILITY",
      subtitle: "Measure mouse-tracking deviation and movement stability.",
      description: "Continuous pointer trajectory recording during controlled path tracking to quantify motor control, spatial deviation, and path efficiency.",
      metrics: ["Mean Deviation", "Path Efficiency (%)", "RMS Error", "Velocity Stability"],
      inputRequirement: "Mouse / Precision Pointer",
      duration: "~60 seconds",
      trials: `${researchConfig.motorStability.practicePaths} practice + ${researchConfig.motorStability.measuredPaths} paths`,
      icon: Activity,
      actionText: session.motorStability ? "Retest Module →" : "Start Test →",
      completed: Boolean(session.motorStability)
    },
    {
      id: "finger-tap",
      number: "03",
      title: "FINGER-TAP RHYTHM",
      subtitle: "Measure tapping rate and timing consistency.",
      description: "Isochronous repetitive motor timing task to measure motor execution cadence, inter-tap interval regularity, and cadence decay.",
      metrics: ["Taps / Second", "Mean Interval (ms)", "Coefficient of Var (CV)", "Rhythm Deceleration"],
      inputRequirement: "Keyboard (Spacebar) / Touch",
      duration: `~${researchConfig.fingerTap.practiceDurationSec + researchConfig.fingerTap.measuredDurationSec} seconds`,
      trials: `${researchConfig.fingerTap.practiceDurationSec}s practice + ${researchConfig.fingerTap.measuredDurationSec}s test`,
      icon: Hand,
      actionText: session.fingerTap ? "Retest Module →" : "Start Test →",
      completed: Boolean(session.fingerTap)
    }
  ];

  return (
    <div className="min-h-screen bg-[#fafaf8] text-[#292827] flex flex-col font-sans">
      {/* If an active test module is selected */}
      {activeModule === 'reaction-time' ? (
        <section className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 flex-1 w-full">
          <ReactionTimeTest
            onBack={handleBackToLanding}
            onComplete={handleReactionTimeComplete}
            config={researchConfig.reactionTime}
          />
        </section>
      ) : activeModule === 'motor-stability' ? (
        <section className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 flex-1 w-full">
          <MotorStabilityTest
            onBack={handleBackToLanding}
            onComplete={handleMotorStabilityComplete}
            config={researchConfig.motorStability}
          />
        </section>
      ) : activeModule === 'finger-tap' ? (
        <section className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 flex-1 w-full">
          <FingerTapTest
            onBack={handleBackToLanding}
            onComplete={handleFingerTapComplete}
            config={researchConfig.fingerTap}
          />
        </section>
      ) : activeModule === 'battery-summary' ? (
        <section className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 flex-1 w-full">
          <CrossTestSummary
            session={session}
            onBack={handleBackToLanding}
            onSelectModule={handleSelectModule}
            onResetSession={handleResetSession}
          />
        </section>
      ) : (
        <>
          {/* ------------------------------------------------------------- */}
          {/* 1. Page Header                                                */}
          {/* ------------------------------------------------------------- */}
          <section className="w-full bg-white border-b border-[#e8e4dd] py-10 md:py-14">
            <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-[#73706d] bg-[#f5f4f0] px-2.5 py-1 rounded border border-[#e8e4dd]">
                    Behavioral Measurement Suite
                  </span>
                  <span className="text-[11px] font-mono text-[#155555] bg-[#eef7f7] px-2 py-0.5 rounded border border-[#a3cfcf]/40">
                    Research Protocol v1.0
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#292827] font-editorial">
                  Motor & Cognitive Screening
                </h1>
                <p className="text-base sm:text-lg text-[#73706d] max-w-3xl leading-relaxed">
                  Browser-based behavioral measurements for research-oriented motor and reaction-time analysis.
                </p>
              </div>

              {/* Research Disclaimer Banner */}
              <div className="bg-[#fafaf8] border-l-2 border-[#1b1938] border-y border-r border-[#e8e4dd] p-4 sm:p-5 rounded-r-lg flex items-start gap-3.5 text-xs sm:text-sm text-[#73706d]">
                <ShieldAlert className="w-5 h-5 text-[#1b1938] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold text-[#292827] block">
                    Research & Experimental Notice
                  </span>
                  <p className="leading-relaxed">
                    These tests measure behavioral performance under controlled browser conditions. They are research/prototype measurements and are not diagnostic.
                    Measurements are subject to hardware scheduling latency, display refresh rates, and input sampling constraints.
                  </p>
                </div>
              </div>
            </div>
          </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. Main Test Modules Grid                                     */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 flex-1 w-full space-y-8">
        {/* Active Session Callout Banner */}
        {completedCount > 0 && (
          <div className="bg-[#1b1938] text-white p-5 rounded-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#3f3a52] shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#c9b4fa]" />
                <span className="text-xs font-mono uppercase tracking-wider text-[#bcbac9]">
                  Active Battery Session ({session.sessionId}): {completedCount} of 3 Instruments Completed
                </span>
              </div>
              <p className="text-sm font-semibold text-white">
                Multi-instrument dataset recorded. Quality control derivation and cross-test battery report available.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleSelectModule('battery-summary')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#fafaf8] text-[#1b1938] text-xs font-semibold rounded-button transition-colors"
              >
                <span>View Battery Summary</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e8e4dd] pb-4">
          <div>
            <h2 className="text-xl font-semibold text-[#292827] tracking-tight">
              Standardized Screening Modules
            </h2>
            <p className="text-xs sm:text-sm text-[#73706d] mt-0.5">
              Select an instrument to initialize device calibration and begin the guided protocol.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium border border-[#e8e4dd] bg-white text-[#292827] hover:bg-[#fafaf8] hover:border-[#bcbac9] transition-colors shadow-sm"
              title="Customize trial counts, ISI distribution, and tolerances"
            >
              <Sliders className="w-3.5 h-3.5 text-[#155555]" />
              <span>Protocol Config ({researchConfig.protocolPreset})</span>
            </button>

            {completedCount > 0 && (
              <button
                onClick={() => handleSelectModule('battery-summary')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium border border-[#1b1938] bg-[#1b1938] text-white hover:bg-[#232047] transition-colors"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Battery Summary ({completedCount}/3)</span>
              </button>
            )}
            <Link
              to="/transformer-lab"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium border border-[#e8e4dd] bg-white text-[#73706d] hover:text-[#292827] hover:bg-[#fafaf8] transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Research Lab Overview</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testModules.map((test) => {
            const Icon = test.icon;
            return (
              <div
                key={test.id}
                className="bg-white border border-[#e8e4dd] rounded-card p-6 flex flex-col justify-between hover:border-[#bcbac9] transition-all duration-200 shadow-sm hover:shadow-md group"
              >
                <div className="space-y-4">
                  {/* Top Row: Module # and Icon */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold tracking-widest text-[#73706d] bg-[#fafaf8] px-2 py-0.5 rounded border border-[#e8e4dd]">
                      {test.number}
                    </span>
                    <div className="w-9 h-9 rounded-button bg-[#f5f4f0] group-hover:bg-[#1b1938] group-hover:text-white transition-colors flex items-center justify-center text-[#1b1938]">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-[#292827]">
                      {test.title}
                    </h3>
                    <p className="text-xs text-[#155555] font-medium mt-1">
                      {test.subtitle}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[#73706d] leading-relaxed">
                    {test.description}
                  </p>

                  {/* Key Metrics Tracked */}
                  <div className="pt-2 border-t border-[#f1f0ec] space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#9a9794] block">
                      Derivable Parameters:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {test.metrics.map((m, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-mono bg-[#fafaf8] text-[#292827] px-1.5 py-0.5 rounded border border-[#e8e4dd]"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Metadata Specs */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-[#73706d] bg-[#fafaf8] p-2.5 rounded border border-[#e8e4dd]/70">
                    <div>
                      <span className="block text-[9px] font-mono uppercase text-[#9a9794]">Input Device</span>
                      <span className="font-medium text-[#292827]">{test.inputRequirement}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-mono uppercase text-[#9a9794]">Target Duration</span>
                      <span className="font-medium text-[#292827]">{test.duration}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom CTA Action */}
                <div className="pt-6 mt-4 border-t border-[#e8e4dd]">
                  <button
                    onClick={() => handleSelectModule(test.id as ScreeningModuleId)}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#1b1938] hover:bg-[#232047] text-white text-xs font-semibold rounded-button transition-all shadow-sm group-hover:gap-3 cursor-pointer"
                  >
                    <span>{test.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ----------------------------------------------------------- */}
        {/* 3. Standard Protocol Flow & Rigor Architecture              */}
        {/* ----------------------------------------------------------- */}
        <div className="bg-white border border-[#e8e4dd] rounded-card p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#73706d]">
              Instrumentation Pipeline
            </span>
            <h3 className="text-xl font-semibold text-[#292827]">
              Six-Stage Experimental Protocol
            </h3>
            <p className="text-xs sm:text-sm text-[#73706d]">
              All tests follow an identical scientific state machine to eliminate practice effects, calibrate input hardware, and preserve timing integrity.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            {[
              { step: "01", name: "Introduction", detail: "Study aims & privacy" },
              { step: "02", name: "Device Check", detail: "Input & viewport audit" },
              { step: "03", name: "Instructions", detail: "Task requirements" },
              { step: "04", name: "Practice Trial", detail: "Familiarization phase" },
              { step: "05", name: "Data Collection", detail: "High-precision timing" },
              { step: "06", name: "Quality & Metrics", detail: "Statistical derivation" }
            ].map((st, i) => (
              <div key={i} className="bg-[#fafaf8] border border-[#e8e4dd] p-3 rounded-button space-y-1">
                <span className="text-[10px] font-mono text-[#155555] font-bold">Stage {st.step}</span>
                <p className="text-xs font-semibold text-[#292827]">{st.name}</p>
                <p className="text-[10px] text-[#73706d]">{st.detail}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#e8e4dd] text-xs text-[#73706d]">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#292827] block">Microsecond Monotonic Timing</span>
                <span>Uses <code className="text-[11px] font-mono bg-[#f5f4f0] px-1 py-0.5 rounded">performance.now()</code> to avoid system clock adjustments.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#292827] block">Focus & Loss-of-State Trapping</span>
                <span>Monitors window focus and visibility changes to flag compromised measurement trials.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#292827] block">Separation from Clinical Model</span>
                <span>Motor screening metrics remain an independent research stream and are not injected into diagnostic models.</span>
              </div>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* 4. Privacy, Data Retention & Anonymization (Section 23)     */}
        {/* ----------------------------------------------------------- */}
        <div className="bg-[#fafaf8] border border-[#e8e4dd] rounded-card p-6 sm:p-8 space-y-4" role="region" aria-label="Privacy and Data Governance">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e8e4dd] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#73706d] bg-white px-2 py-0.5 rounded border border-[#e8e4dd]">
                  Section 23 Protocol
                </span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Zero PHI Collected
                </span>
              </div>
              <h3 className="text-lg font-semibold text-[#292827]">
                Participant Privacy & Data Retention Policy
              </h3>
            </div>

            {completedCount > 0 && (
              <button
                onClick={handleResetSession}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-button transition-colors self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Purge Local Session Buffer</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#73706d]">
            <div className="space-y-1">
              <span className="font-semibold text-[#292827] block">Anonymous Identifier</span>
              <p>
                Session token <code className="font-mono text-[#1b1938] bg-white px-1 py-0.5 rounded border border-[#e8e4dd]">{session.sessionId}</code> is pseudo-randomly generated in-browser. No IP addresses, names, or patient identifiers are collected.
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-[#292827] block">Voluntary Persistence</span>
              <p>
                Measurements remain strictly in client browser memory until explicitly saved to the Experiment Registry via the battery summary view.
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-[#292827] block">Client-Side Erasure</span>
              <p>
                Closing the browser tab, refreshing the window, or clicking "Purge Local Session" immediately clears all millisecond coordinate buffers from RAM.
              </p>
            </div>
          </div>
        </div>
      </section>
      </>
      )}

      {/* Research Protocol Configuration Modal (Section 28) */}
      <ResearchConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={researchConfig}
        onSaveConfig={(newCfg) => {
          setResearchConfig(newCfg);
          setSession((prev) => ({ ...prev, configSnapshot: newCfg }));
        }}
        deviceInfo={session.deviceInfo}
      />
    </div>
  );
};

export default MotorScreeningPage;
