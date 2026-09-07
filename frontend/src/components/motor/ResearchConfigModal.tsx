/**
 * MEDINTEL AI — Research Protocol Configuration & Reproducibility Modal
 * Allows researchers to customize trial counts, inter-stimulus interval distributions,
 * corridor tolerances, and inspect experimental hardware reproducibility metadata.
 */

import React, { useState } from 'react';
import {
  Sliders,
  RotateCcw,
  Check,
  X,
  Laptop,
  Timer,
  Activity,
  Hand,
  Info,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { ResearchBatteryConfig, DeviceAuditInfo } from '../../types/motor';
import { DEFAULT_RESEARCH_CONFIG, RESEARCH_PRESETS } from '../../utils/researchDefaults';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: ResearchBatteryConfig;
  onSaveConfig: (newConfig: ResearchBatteryConfig) => void;
  deviceInfo: DeviceAuditInfo;
}

export const ResearchConfigModal: React.FC<Props> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  deviceInfo
}) => {
  const [draftConfig, setDraftConfig] = useState<ResearchBatteryConfig>(config);
  const [activeTab, setActiveTab] = useState<'presets' | 'reaction-time' | 'motor-stability' | 'finger-tap' | 'reproducibility'>('presets');

  if (!isOpen) return null;

  const handleApplyPreset = (presetKey: 'STANDARD' | 'QUICK' | 'EXTENDED') => {
    setDraftConfig(RESEARCH_PRESETS[presetKey]);
  };

  const handleResetDefaults = () => {
    setDraftConfig(DEFAULT_RESEARCH_CONFIG);
  };

  const handleSave = () => {
    onSaveConfig(draftConfig);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="research-config-title"
    >
      <div className="bg-white border border-[#e8e4dd] rounded-card shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-[#292827]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[#e8e4dd] bg-[#fafaf8]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-button bg-[#1b1938] text-white flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#73706d]">
                Experimental Parameters
              </span>
              <h2 id="research-config-title" className="text-lg sm:text-xl font-bold font-editorial text-[#292827]">
                Research Protocol Configuration
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-[#e8e4dd]/50 text-[#73706d] hover:text-[#292827] transition-colors"
            aria-label="Close configuration dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#e8e4dd] bg-white overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-4 py-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'presets'
                ? 'border-[#1b1938] text-[#1b1938] font-bold bg-[#fafaf8]'
                : 'border-transparent text-[#73706d] hover:text-[#292827]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#155555]" />
            <span>Protocol Presets</span>
          </button>

          <button
            onClick={() => setActiveTab('reaction-time')}
            className={`px-4 py-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'reaction-time'
                ? 'border-[#1b1938] text-[#1b1938] font-bold bg-[#fafaf8]'
                : 'border-transparent text-[#73706d] hover:text-[#292827]'
            }`}
          >
            <Timer className="w-3.5 h-3.5 text-[#155555]" />
            <span>01 — Reaction Time</span>
          </button>

          <button
            onClick={() => setActiveTab('motor-stability')}
            className={`px-4 py-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'motor-stability'
                ? 'border-[#1b1938] text-[#1b1938] font-bold bg-[#fafaf8]'
                : 'border-transparent text-[#73706d] hover:text-[#292827]'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-[#155555]" />
            <span>02 — Motor Stability</span>
          </button>

          <button
            onClick={() => setActiveTab('finger-tap')}
            className={`px-4 py-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'finger-tap'
                ? 'border-[#1b1938] text-[#1b1938] font-bold bg-[#fafaf8]'
                : 'border-transparent text-[#73706d] hover:text-[#292827]'
            }`}
          >
            <Hand className="w-3.5 h-3.5 text-[#155555]" />
            <span>03 — Finger Tap</span>
          </button>

          <button
            onClick={() => setActiveTab('reproducibility')}
            className={`px-4 py-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'reproducibility'
                ? 'border-[#1b1938] text-[#1b1938] font-bold bg-[#fafaf8]'
                : 'border-transparent text-[#73706d] hover:text-[#292827]'
            }`}
          >
            <Laptop className="w-3.5 h-3.5 text-[#155555]" />
            <span>Reproducibility Specs</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* TAB: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#292827]">Standardized Experimental Presets</h3>
                <p className="text-[#73706d]">
                  Select a validated testing baseline or customize parameters individually across instrument tabs.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Standard Preset */}
                <div
                  onClick={() => handleApplyPreset('STANDARD')}
                  className={`p-4 rounded-card border cursor-pointer transition-all ${
                    draftConfig.protocolPreset === 'STANDARD'
                      ? 'border-[#1b1938] bg-[#fafaf8] ring-1 ring-[#1b1938]'
                      : 'border-[#e8e4dd] bg-white hover:border-[#bcbac9]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[#292827]">Standard Protocol</span>
                    {draftConfig.protocolPreset === 'STANDARD' && (
                      <span className="p-1 bg-[#1b1938] text-white rounded-full">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#73706d] mb-3">
                    Recommended research balance between statistical sample depth and participant fatigue.
                  </p>
                  <div className="space-y-1 font-mono text-[10px] text-[#292827] bg-white p-2 rounded border border-[#e8e4dd]">
                    <div>• RT: 5 practice / 15 trials</div>
                    <div>• MS: 1 practice / 3 paths</div>
                    <div>• FT: 10s practice / 20s test</div>
                  </div>
                </div>

                {/* Quick Screening Preset */}
                <div
                  onClick={() => handleApplyPreset('QUICK')}
                  className={`p-4 rounded-card border cursor-pointer transition-all ${
                    draftConfig.protocolPreset === 'QUICK'
                      ? 'border-[#1b1938] bg-[#fafaf8] ring-1 ring-[#1b1938]'
                      : 'border-[#e8e4dd] bg-white hover:border-[#bcbac9]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[#292827]">Quick Screening</span>
                    {draftConfig.protocolPreset === 'QUICK' && (
                      <span className="p-1 bg-[#1b1938] text-white rounded-full">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#73706d] mb-3">
                    Abbreviated protocol for fast demonstration and low-friction exploratory screening.
                  </p>
                  <div className="space-y-1 font-mono text-[10px] text-[#292827] bg-white p-2 rounded border border-[#e8e4dd]">
                    <div>• RT: 2 practice / 8 trials</div>
                    <div>• MS: 1 practice / 2 paths</div>
                    <div>• FT: 5s practice / 10s test</div>
                  </div>
                </div>

                {/* Extended Precision Preset */}
                <div
                  onClick={() => handleApplyPreset('EXTENDED')}
                  className={`p-4 rounded-card border cursor-pointer transition-all ${
                    draftConfig.protocolPreset === 'EXTENDED'
                      ? 'border-[#1b1938] bg-[#fafaf8] ring-1 ring-[#1b1938]'
                      : 'border-[#e8e4dd] bg-white hover:border-[#bcbac9]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[#292827]">Extended Precision</span>
                    {draftConfig.protocolPreset === 'EXTENDED' && (
                      <span className="p-1 bg-[#1b1938] text-white rounded-full">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#73706d] mb-3">
                    Maximum trial density for publication-grade variance modeling and micro-isocadence.
                  </p>
                  <div className="space-y-1 font-mono text-[10px] text-[#292827] bg-white p-2 rounded border border-[#e8e4dd]">
                    <div>• RT: 5 practice / 25 trials</div>
                    <div>• MS: 1 practice / 5 paths</div>
                    <div>• FT: 10s practice / 30s test</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: REACTION TIME */}
          {activeTab === 'reaction-time' && (
            <div className="space-y-5">
              <div className="space-y-1 border-b border-[#e8e4dd] pb-3">
                <h3 className="text-sm font-bold text-[#292827]">Instrument 01 — Reaction Time Settings</h3>
                <p className="text-[#73706d]">Configure trial block sizing, randomized ISI uniform delays, and timeout boundaries.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-[#fafaf8] rounded border border-[#e8e4dd] space-y-2">
                  <label className="font-semibold text-[#292827] block">Practice Trials Count</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={draftConfig.reactionTime.practiceTrials}
                      onChange={(e) => {
                        setDraftConfig((prev) => ({
                          ...prev,
                          protocolPreset: 'CUSTOM',
                          reactionTime: { ...prev.reactionTime, practiceTrials: Number(e.target.value) }
                        }));
                      }}
                      className="flex-1 accent-[#1b1938]"
                    />
                    <span className="font-mono font-bold text-xs w-8 text-right text-[#1b1938]">
                      {draftConfig.reactionTime.practiceTrials}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#73706d] block">Familiarization trials before formal block.</span>
                </div>

                <div className="p-3 bg-[#fafaf8] rounded border border-[#e8e4dd] space-y-2">
                  <label className="font-semibold text-[#292827] block">Measured Trials Count</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="5"
                      max="40"
                      value={draftConfig.reactionTime.measuredTrials}
                      onChange={(e) => {
                        setDraftConfig((prev) => ({
                          ...prev,
                          protocolPreset: 'CUSTOM',
                          reactionTime: { ...prev.reactionTime, measuredTrials: Number(e.target.value) }
                        }));
                      }}
                      className="flex-1 accent-[#1b1938]"
                    />
                    <span className="font-mono font-bold text-xs w-8 text-right text-[#1b1938]">
                      {draftConfig.reactionTime.measuredTrials}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#73706d] block">Number of presentations for statistical derivation.</span>
                </div>

                <div className="p-3 bg-[#fafaf8] rounded border border-[#e8e4dd] space-y-2">
                  <label className="font-semibold text-[#292827] block">Minimum ISI Delay (ms)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="800"
                      max="2500"
                      step="100"
                      value={draftConfig.reactionTime.minDelayMs}
                      onChange={(e) => {
                        setDraftConfig((prev) => ({
                          ...prev,
                          protocolPreset: 'CUSTOM',
                          reactionTime: { ...prev.reactionTime, minDelayMs: Number(e.target.value) }
                        }));
                      }}
                      className="flex-1 accent-[#1b1938]"
                    />
                    <span className="font-mono font-bold text-xs w-12 text-right text-[#1b1938]">
                      {draftConfig.reactionTime.minDelayMs}ms
                    </span>
                  </div>
                  <span className="text-[10px] text-[#73706d] block">Lower bound of randomized inter-stimulus delay.</span>
                </div>

                <div className="p-3 bg-[#fafaf8] rounded border border-[#e8e4dd] space-y-2">
                  <label className="font-semibold text-[#292827] block">Maximum ISI Delay (ms)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="2500"
                      max="6000"
                      step="100"
                      value={draftConfig.reactionTime.maxDelayMs}
                      onChange={(e) => {
                        setDraftConfig((prev) => ({
                          ...prev,
                          protocolPreset: 'CUSTOM',
                          reactionTime: { ...prev.reactionTime, maxDelayMs: Number(e.target.value) }
                        }));
                      }}
                      className="flex-1 accent-[#1b1938]"
                    />
                    <span className="font-mono font-bold text-xs w-12 text-right text-[#1b1938]">
                      {draftConfig.reactionTime.maxDelayMs}ms
                    </span>
                  </div>
                  <span className="text-[10px] text-[#73706d] block">Upper bound of randomized inter-stimulus delay.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: MOTOR STABILITY */}
          {activeTab === 'motor-stability' && (
            <div className="space-y-5">
              <div className="space-y-1 border-b border-[#e8e4dd] pb-3">
                <h3 className="text-sm font-bold text-[#292827]">Instrument 02 — Motor Stability Settings</h3>
                <p className="text-[#73706d]">Configure guide corridor tolerances and target hit radius.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-[#fafaf8] rounded border border-[#e8e4dd] space-y-2">
                  <label className="font-semibold text-[#292827] block">Corridor Guide Width (px)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="16"
                      max="48"
                      step="2"
                      value={draftConfig.motorStability.corridorWidthPx}
                      onChange={(e) => {
                        setDraftConfig((prev) => ({
                          ...prev,
                          protocolPreset: 'CUSTOM',
                          motorStability: { ...prev.motorStability, corridorWidthPx: Number(e.target.value) }
                        }));
                      }}
                      className="flex-1 accent-[#1b1938]"
                    />
                    <span className="font-mono font-bold text-xs w-10 text-right text-[#1b1938]">
                      {draftConfig.motorStability.corridorWidthPx}px
                    </span>
                  </div>
                  <span className="text-[10px] text-[#73706d] block">Visual corridor width guiding the linear trace.</span>
                </div>

                <div className="p-3 bg-[#fafaf8] rounded border border-[#e8e4dd] space-y-2">
                  <label className="font-semibold text-[#292827] block">Finish Target Radius (px)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="16"
                      max="36"
                      step="2"
                      value={draftConfig.motorStability.finishTargetRadiusPx}
                      onChange={(e) => {
                        setDraftConfig((prev) => ({
                          ...prev,
                          protocolPreset: 'CUSTOM',
                          motorStability: { ...prev.motorStability, finishTargetRadiusPx: Number(e.target.value) }
                        }));
                      }}
                      className="flex-1 accent-[#1b1938]"
                    />
                    <span className="font-mono font-bold text-xs w-10 text-right text-[#1b1938]">
                      {draftConfig.motorStability.finishTargetRadiusPx}px
                    </span>
                  </div>
                  <span className="text-[10px] text-[#73706d] block">Hit radius tolerance required to complete trial.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: FINGER TAP */}
          {activeTab === 'finger-tap' && (
            <div className="space-y-5">
              <div className="space-y-1 border-b border-[#e8e4dd] pb-3">
                <h3 className="text-sm font-bold text-[#292827]">Instrument 03 — Finger-Tap Rhythm Settings</h3>
                <p className="text-[#73706d]">Configure practice duration and continuous tapping countdown windows.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-[#fafaf8] rounded border border-[#e8e4dd] space-y-2">
                  <label className="font-semibold text-[#292827] block">Practice Duration (seconds)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="5"
                      max="20"
                      step="1"
                      value={draftConfig.fingerTap.practiceDurationSec}
                      onChange={(e) => {
                        setDraftConfig((prev) => ({
                          ...prev,
                          protocolPreset: 'CUSTOM',
                          fingerTap: { ...prev.fingerTap, practiceDurationSec: Number(e.target.value) }
                        }));
                      }}
                      className="flex-1 accent-[#1b1938]"
                    />
                    <span className="font-mono font-bold text-xs w-8 text-right text-[#1b1938]">
                      {draftConfig.fingerTap.practiceDurationSec}s
                    </span>
                  </div>
                  <span className="text-[10px] text-[#73706d] block">Familiarization countdown before measured test.</span>
                </div>

                <div className="p-3 bg-[#fafaf8] rounded border border-[#e8e4dd] space-y-2">
                  <label className="font-semibold text-[#292827] block">Measured Duration (seconds)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="10"
                      max="60"
                      step="5"
                      value={draftConfig.fingerTap.measuredDurationSec}
                      onChange={(e) => {
                        setDraftConfig((prev) => ({
                          ...prev,
                          protocolPreset: 'CUSTOM',
                          fingerTap: { ...prev.fingerTap, measuredDurationSec: Number(e.target.value) }
                        }));
                      }}
                      className="flex-1 accent-[#1b1938]"
                    />
                    <span className="font-mono font-bold text-xs w-8 text-right text-[#1b1938]">
                      {draftConfig.fingerTap.measuredDurationSec}s
                    </span>
                  </div>
                  <span className="text-[10px] text-[#73706d] block">Formal interval collection window.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: REPRODUCIBILITY SPECS */}
          {activeTab === 'reproducibility' && (
            <div className="space-y-4">
              <div className="space-y-1 border-b border-[#e8e4dd] pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-[#292827]">Hardware & Environment Reproducibility Audit</h3>
                </div>
                <p className="text-[#73706d]">
                  Every screening session attaches these environmental parameters to enable cross-device normalization.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-[#fafaf8] rounded border border-[#e8e4dd]">
                  <span className="text-[10px] font-mono text-[#9a9794] uppercase block">Inferred Device</span>
                  <span className="font-semibold text-[#292827]">{deviceInfo.inferredDevice}</span>
                </div>
                <div className="p-3 bg-[#fafaf8] rounded border border-[#e8e4dd]">
                  <span className="text-[10px] font-mono text-[#9a9794] uppercase block">Screen Resolution</span>
                  <span className="font-mono text-[#292827]">{deviceInfo.screenWidth} × {deviceInfo.screenHeight} px</span>
                </div>
                <div className="p-3 bg-[#fafaf8] rounded border border-[#e8e4dd]">
                  <span className="text-[10px] font-mono text-[#9a9794] uppercase block">Device Pixel Ratio</span>
                  <span className="font-mono text-[#292827]">{deviceInfo.devicePixelRatio}x DPR</span>
                </div>
                <div className="p-3 bg-[#fafaf8] rounded border border-[#e8e4dd]">
                  <span className="text-[10px] font-mono text-[#9a9794] uppercase block">Fine Pointer Sensor</span>
                  <span className="font-semibold text-emerald-700">{deviceInfo.hasFinePointer ? 'Supported (Mouse/Stylus)' : 'No (Touch only)'}</span>
                </div>
                <div className="p-3 bg-[#fafaf8] rounded border border-[#e8e4dd]">
                  <span className="text-[10px] font-mono text-[#9a9794] uppercase block">Keyboard Interface</span>
                  <span className="font-semibold text-emerald-700">{deviceInfo.hasKeyboard ? 'Detected (Spacebar)' : 'Touch Fallback'}</span>
                </div>
                <div className="p-3 bg-[#fafaf8] rounded border border-[#e8e4dd]">
                  <span className="text-[10px] font-mono text-[#9a9794] uppercase block">Clock Monotonicity</span>
                  <span className="font-mono font-semibold text-emerald-700">performance.now()</span>
                </div>
              </div>

              <div className="p-3 bg-[#fafaf8] rounded border border-[#e8e4dd] text-[11px] text-[#73706d] font-mono break-all">
                <span className="text-[9px] uppercase tracking-wider text-[#9a9794] block mb-1">User Agent Header</span>
                {deviceInfo.userAgent}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-t border-[#e8e4dd] bg-[#fafaf8]">
          <button
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-button text-xs font-medium border border-[#e8e4dd] bg-white text-[#73706d] hover:text-[#292827] hover:bg-[#fafaf8] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Standard Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-button text-xs font-medium border border-[#e8e4dd] text-[#73706d] hover:bg-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#1b1938] hover:bg-[#0e0c1f] text-white text-xs font-semibold rounded-button transition-colors shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Research Parameters</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
