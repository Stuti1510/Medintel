import React from 'react';

export type StatusType = 'ready' | 'degraded' | 'loading' | 'offline' | 'unavailable' | 'error';

interface StatusDotProps {
  status: StatusType | string;
  label?: string;
  className?: string;
}

export const StatusDot: React.FC<StatusDotProps> = ({ status, label, className = '' }) => {
  const norm = (status || 'offline').toLowerCase() as StatusType;

  const colorMap: Record<StatusType, { dot: string; text: string }> = {
    ready: { dot: 'bg-status-ready', text: 'text-status-ready' },
    degraded: { dot: 'bg-status-degraded', text: 'text-status-degraded' },
    loading: { dot: 'bg-status-loading animate-pulse', text: 'text-status-loading' },
    offline: { dot: 'bg-status-offline', text: 'text-status-offline' },
    unavailable: { dot: 'bg-status-offline', text: 'text-status-offline' },
    error: { dot: 'bg-status-error', text: 'text-status-error' },
  };

  const current = colorMap[norm] || colorMap.offline;
  const displayLabel = label || norm.toUpperCase();

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dot}`} aria-hidden="true" />
      <span className="font-micro tracking-wider text-[11px] text-ink-muted">
        {displayLabel}
      </span>
    </span>
  );
};
