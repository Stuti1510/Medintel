import React from 'react';
import { StatusDot } from './StatusDot';

export interface PipelineStepState {
  id: string;
  name: string;
  status: 'ready' | 'loading' | 'offline' | 'error' | 'unavailable' | 'degraded';
  detail?: string;
  durationMs?: number;
}

interface LivePipelineTrackerProps {
  steps: PipelineStepState[];
  className?: string;
}

export const LivePipelineTracker: React.FC<LivePipelineTrackerProps> = ({ steps, className = '' }) => {
  return (
    <div className={`border border-hairline rounded-[12px] p-5 bg-white ${className}`}>
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-hairline">
        <span className="font-micro text-ink-faint">PIPELINE EXECUTION TRACE</span>
        <span className="font-caption text-xs text-ink-muted">PAD-UFES-20 Single Fixed Pipeline</span>
      </div>

      <div className="space-y-2.5">
        {steps.map((step, idx) => (
          <div
            key={step.id}
            className="flex items-center justify-between py-1.5 px-2.5 rounded border border-transparent hover:border-hairline transition-colors text-xs"
          >
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[10px] text-ink-faint w-4">
                0{idx + 1}
              </span>
              <StatusDot status={step.status} label="" />
              <span className="font-body text-xs text-ink font-medium">
                {step.name}
              </span>
            </div>

            <div className="flex items-center gap-3 text-right">
              {step.detail && (
                <span className="font-caption text-[11px] text-ink-muted italic">
                  {step.detail}
                </span>
              )}
              {step.durationMs !== undefined && (
                <span className="font-mono text-[11px] text-ink-faint tabular-nums">
                  {step.durationMs}ms
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
