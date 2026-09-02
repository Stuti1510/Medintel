import React from 'react';
import { DifferentialItem } from '../types/clinical';
import { ShieldCheck, AlertCircle } from 'lucide-react';

interface Props {
  differentials: DifferentialItem[];
  primaryPrediction: string;
  confidence: number;
}

export const DifferentialCard: React.FC<Props> = ({ differentials, primaryPrediction, confidence }) => {
  return (
    <div className="p-5 rounded-card bg-dark-surface border border-dark-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[11px] font-mono-tech uppercase text-dark-muted tracking-wider">
            Primary Differential Analysis
          </span>
          <h3 className="text-xl font-bold text-dark-text mt-0.5 flex items-center gap-2">
            {primaryPrediction}
          </h3>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-mono-tech uppercase text-dark-muted">Model Confidence</span>
          <p className="text-xl font-bold font-mono-tech text-ai">
            {(confidence * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Probability Bars for Top Differentials */}
      <div className="space-y-3 mt-4">
        <span className="text-xs font-semibold text-dark-secondary uppercase tracking-wider font-mono-tech">
          Differential Distribution (Top {differentials.length})
        </span>
        {differentials.map((item) => {
          const isTop = item.rank === 1;
          const pct = item.probability * 100;
          return (
            <div key={item.condition} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className={`font-medium flex items-center gap-1.5 ${isTop ? 'text-dark-text font-semibold' : 'text-dark-secondary'}`}>
                  <span className={`w-4 h-4 rounded text-[10px] font-mono-tech flex items-center justify-center ${isTop ? 'bg-ai text-white' : 'bg-dark-elevated text-dark-muted'}`}>
                    {item.rank}
                  </span>
                  {item.condition}
                </span>
                <span className="font-mono-tech text-dark-text font-medium">{pct.toFixed(1)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-dark-deep overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isTop ? 'bg-gradient-to-r from-ai to-ai-soft' : 'bg-dark-strongBorder'
                  }`}
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-dark-border text-[11px] text-dark-muted leading-relaxed flex items-center gap-2">
        <AlertCircle className="w-3.5 h-3.5 text-ai shrink-0" />
        <span>Model confidence reflects statistical conditional likelihood under the trained distribution and is not a clinical certainty.</span>
      </div>
    </div>
  );
};
