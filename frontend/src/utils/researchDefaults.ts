/**
 * MEDINTEL AI — Research Protocol Defaults & Standard Presets
 * Reproducible configuration baselines for behavioral motor screening instruments.
 */

import {
  ReactionTimeConfig,
  MotorStabilityConfig,
  FingerTapConfig,
  ResearchBatteryConfig
} from '../types/motor';

export const DEFAULT_REACTION_TIME_CONFIG: ReactionTimeConfig = {
  practiceTrials: 5,
  measuredTrials: 15,
  minDelayMs: 1600,
  maxDelayMs: 3800,
  timeoutMs: 3000,
  minValidRtMs: 100
};

export const DEFAULT_MOTOR_STABILITY_CONFIG: MotorStabilityConfig = {
  practicePaths: 1,
  measuredPaths: 3,
  corridorWidthPx: 28,
  finishTargetRadiusPx: 24
};

export const DEFAULT_FINGER_TAP_CONFIG: FingerTapConfig = {
  practiceDurationSec: 10,
  measuredDurationSec: 20,
  minValidTaps: 5
};

export const DEFAULT_RESEARCH_CONFIG: ResearchBatteryConfig = {
  protocolPreset: 'STANDARD',
  reactionTime: DEFAULT_REACTION_TIME_CONFIG,
  motorStability: DEFAULT_MOTOR_STABILITY_CONFIG,
  fingerTap: DEFAULT_FINGER_TAP_CONFIG
};

export const RESEARCH_PRESETS: Record<'STANDARD' | 'QUICK' | 'EXTENDED', ResearchBatteryConfig> = {
  STANDARD: {
    protocolPreset: 'STANDARD',
    reactionTime: {
      practiceTrials: 5,
      measuredTrials: 15,
      minDelayMs: 1600,
      maxDelayMs: 3800,
      timeoutMs: 3000,
      minValidRtMs: 100
    },
    motorStability: {
      practicePaths: 1,
      measuredPaths: 3,
      corridorWidthPx: 28,
      finishTargetRadiusPx: 24
    },
    fingerTap: {
      practiceDurationSec: 10,
      measuredDurationSec: 20,
      minValidTaps: 5
    }
  },
  QUICK: {
    protocolPreset: 'QUICK',
    reactionTime: {
      practiceTrials: 2,
      measuredTrials: 8,
      minDelayMs: 1200,
      maxDelayMs: 2600,
      timeoutMs: 2500,
      minValidRtMs: 100
    },
    motorStability: {
      practicePaths: 1,
      measuredPaths: 2,
      corridorWidthPx: 32,
      finishTargetRadiusPx: 28
    },
    fingerTap: {
      practiceDurationSec: 5,
      measuredDurationSec: 10,
      minValidTaps: 3
    }
  },
  EXTENDED: {
    protocolPreset: 'EXTENDED',
    reactionTime: {
      practiceTrials: 5,
      measuredTrials: 25,
      minDelayMs: 1800,
      maxDelayMs: 4200,
      timeoutMs: 3500,
      minValidRtMs: 100
    },
    motorStability: {
      practicePaths: 1,
      measuredPaths: 5,
      corridorWidthPx: 24,
      finishTargetRadiusPx: 20
    },
    fingerTap: {
      practiceDurationSec: 10,
      measuredDurationSec: 30,
      minValidTaps: 8
    }
  }
};
