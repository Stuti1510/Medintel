import React from 'react';
import { DifferentialItem } from '../types/clinical';
import { Info } from 'lucide-react';

interface Props {
  differentials: DifferentialItem[];
  primaryPrediction: string;
  confidence: number;
  modelName?: string;
  isCalibrated?: boolean;
  calibrationStatus?: string;
}

export const DifferentialCard: React.FC<Props> = ({
  differentials,
  primaryPrediction,
  confidence,
  modelName = "Model Prediction",
  isCalibrated = false,
  calibrationStatus
}) => {
  return (
    <div className="p-5 rounded-xl bg-white border border-[#e8e4dd] space-y-4">
      <div className="flex items-start justify-between border-b border-[#e8e4dd] pb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase text-[#73706d] tracking-wider block">
              {modelName}
            </span>
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
              isCalibrated 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {isCalibrated ? 'Calibrated Platt' : 'Uncalibrated'}
            </span>
          </div>
          <h3 className="text-lg font-medium text-[#292827] mt-0.5">
            {primaryPrediction}
          </h3>
          {calibrationStatus && (
            <p className="text-[10px] text-[#73706d] font-mono mt-0.5">{calibrationStatus}</p>
          )}
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono uppercase text-[#73706d]">Model Score</span>
          <p className="text-lg font-mono font-semibold text-[#1b1938]">
            {(confidence * 100).toFixed(1)}%
          </p>
          <span className="text-[9px] font-mono text-[#9a9794] block">Statistical Likelihood</span>
        </div>
      </div>

      {/* Score Bars for Top Differentials */}
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
        <span>Statistical heuristic score under test distribution (N=180 held-out test cases across 24 classes). Not a verified clinical diagnostic probability.</span>
      </div>
    </div>
  );
};

export default DifferentialCard;
