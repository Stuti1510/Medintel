import React from 'react';
import { DifferentialItem } from '../types/clinical';
import { Info } from 'lucide-react';

interface Props {
  differentials: DifferentialItem[];
  primaryPrediction: string;
  confidence: number;
  modelName?: string;
}

export const DifferentialCard: React.FC<Props> = ({ differentials, primaryPrediction, confidence, modelName = "Model Prediction" }) => {
  return (
    <div className="p-5 rounded-xl bg-white border border-[#e8e4dd] space-y-4">
      <div className="flex items-start justify-between border-b border-[#e8e4dd] pb-3">
        <div>
          <span className="text-[10px] font-mono uppercase text-[#73706d] tracking-wider block">
            {modelName}
          </span>
          <h3 className="text-lg font-medium text-[#292827] mt-0.5">
            {primaryPrediction}
          </h3>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono uppercase text-[#73706d]">Probability</span>
          <p className="text-lg font-mono font-semibold text-[#1b1938]">
            {(confidence * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Probability Bars for Top Differentials */}
      <div className="space-y-2.5">
        <span className="text-xs font-mono uppercase tracking-wider text-[#73706d] block">
          Candidate Class Distribution
        </span>
        {differentials.map((item) => {
          const isTop = item.rank === 1;
          const pct = item.probability * 100;
          return (
            <div key={item.condition} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className={`flex items-center gap-1.5 ${isTop ? 'text-[#292827] font-semibold' : 'text-[#73706d]'}`}>
                  <span className={`w-4 h-4 rounded text-[10px] font-mono flex items-center justify-center ${isTop ? 'bg-[#1b1938] text-white' : 'bg-[#fafaf8] border border-[#e8e4dd] text-[#73706d]'}`}>
                    {item.rank}
                  </span>
                  {item.condition}
                </span>
                <span className="font-mono text-[#292827] font-medium">{pct.toFixed(1)}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#f1f0ec] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isTop ? 'bg-[#1b1938]' : 'bg-[#9a9794]'
                  }`}
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 border-t border-[#e8e4dd] text-[11px] text-[#73706d] leading-relaxed flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 text-[#9a9794] shrink-0" />
        <span>Statistical conditional probability under trained test distribution (N=10,296).</span>
      </div>
    </div>
  );
};

export default DifferentialCard;
