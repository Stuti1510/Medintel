import React from 'react';
import { SafetyFlagItem } from '../types/clinical';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

interface Props {
  flags: SafetyFlagItem[];
  disclaimer?: string;
}

export const SafetyBanner: React.FC<Props> = ({ flags, disclaimer }) => {
  if (flags.length === 0 && !disclaimer) return null;

  return (
    <div className="space-y-2">
      {flags.map((flag, idx) => {
        const isCritical = flag.severity === 'CRITICAL';
        return (
          <div
            key={idx}
            className={`p-3.5 rounded-lg border text-xs flex items-start gap-3 ${
              isCritical
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <ShieldAlert className={`w-4 h-4 shrink-0 mt-0.5 ${isCritical ? 'text-rose-600' : 'text-amber-600'}`} />
            <div className="space-y-0.5">
              <div className="font-mono text-[11px] font-semibold uppercase tracking-wider">
                {flag.severity}: {flag.flag_type.replace(/_/g, ' ')}
              </div>
              <p className="font-normal leading-relaxed">{flag.message}</p>
            </div>
          </div>
        );
      })}

      {disclaimer && (
        <div className="p-3 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] text-[#73706d] text-xs leading-relaxed flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#1b1938] shrink-0" />
          <span>{disclaimer}</span>
        </div>
      )}
    </div>
  );
};

export default SafetyBanner;
