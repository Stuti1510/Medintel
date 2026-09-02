import React from 'react';
import { SafetyFlagItem } from '../types/clinical';
import { AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react';

interface Props {
  flags: SafetyFlagItem[];
  disclaimer?: string;
}

export const SafetyBanner: React.FC<Props> = ({ flags, disclaimer }) => {
  const hasCritical = flags.some(f => f.severity === 'CRITICAL');
  const hasWarning = flags.some(f => f.severity === 'WARNING');

  if (flags.length === 0 && !disclaimer) return null;

  return (
    <div className="space-y-3">
      {/* Emergency Red Flags */}
      {flags.map((flag, idx) => {
        const isCritical = flag.severity === 'CRITICAL';
        return (
          <div
            key={idx}
            className={`p-4 rounded-button border flex items-start gap-3 ${
              isCritical
                ? 'bg-semantic-critical/10 border-semantic-critical/40 text-semantic-critical'
                : 'bg-semantic-warning/10 border-semantic-warning/40 text-semantic-warning'
            }`}
          >
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider font-mono-tech">
                  {flag.severity}: {flag.flag_type.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-dark-text font-medium">{flag.message}</p>
            </div>
          </div>
        );
      })}

      {/* Mandatory Decision Support Disclaimer */}
      {disclaimer && (
        <div className="p-3.5 rounded-button bg-dark-deep border border-dark-border text-dark-muted text-[11px] leading-relaxed flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-ai shrink-0" />
          <span>{disclaimer}</span>
        </div>
      )}
    </div>
  );
};
