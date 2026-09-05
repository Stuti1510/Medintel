import React, { useState } from 'react';
import { TokenDetail } from '../types/clinical';
import { Cpu, Info } from 'lucide-react';

interface Props {
  tokens: string[];
  tokenDetails?: TokenDetail[];
  matrix: number[][];
}

export const AttentionHeatmap: React.FC<Props> = ({ tokens, tokenDetails, matrix }) => {
  const [selectedTokenIdx, setSelectedTokenIdx] = useState<number | null>(null);

  if (!tokens || tokens.length === 0 || !matrix || matrix.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-white border border-[#e8e4dd] text-center text-[#73706d] text-xs font-mono">
        Tokenize and analyze text to visualize self-attention weights.
      </div>
    );
  }

  const displayTokens = tokens.slice(0, 12);
  const displayMatrix = matrix.slice(0, 12).map(row => row.slice(0, 12));

  return (
    <div className="p-6 rounded-xl bg-white border border-[#e8e4dd] space-y-4">
      <div className="flex items-center justify-between border-b border-[#e8e4dd] pb-3">
        <div>
          <h3 className="text-sm font-medium text-[#292827] flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#1b1938]" />
            <span>BioBERT Self-Attention Weight Matrix (Q × Kᵀ / √d)</span>
          </h3>
          <p className="text-xs text-[#73706d] mt-0.5">
            Inter-token contextual dependencies across multi-head self-attention layers.
          </p>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#fafaf8] text-[#1b1938] border border-[#e8e4dd]">
          4 Attention Heads
        </span>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-block min-w-full">
          {/* Top Token Labels (Keys) */}
          <div className="flex items-center ml-24 mb-2">
            {displayTokens.map((tok, j) => (
              <div
                key={j}
                className="w-12 text-[10px] font-mono text-[#73706d] truncate text-center -rotate-45 origin-bottom-left"
                title={tok}
              >
                {tok}
              </div>
            ))}
          </div>

          {/* Matrix Rows (Queries) */}
          <div className="space-y-1">
            {displayTokens.map((qTok, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {/* Left Query Label */}
                <div className="w-24 text-[10px] font-mono text-[#292827] truncate text-right pr-2 font-medium" title={qTok}>
                  {qTok}
                </div>

                {/* Cells */}
                <div className="flex items-center gap-1">
                  {displayMatrix[i]?.map((weight, j) => {
                    const isSelected = selectedTokenIdx === i || selectedTokenIdx === j;
                    const intensity = Math.min(Math.max(weight * 3.2, 0.04), 1);
                    return (
                      <div
                        key={j}
                        onMouseEnter={() => setSelectedTokenIdx(i)}
                        onMouseLeave={() => setSelectedTokenIdx(null)}
                        className={`w-12 h-9 rounded text-[10px] font-mono flex items-center justify-center cursor-pointer transition-all ${
                          isSelected ? 'ring-1 ring-[#1b1938]' : ''
                        }`}
                        style={{
                          backgroundColor: `rgba(27, 25, 56, ${intensity})`,
                          color: intensity > 0.4 ? '#FFFFFF' : '#292827'
                        }}
                        title={`Attention(${qTok} -> ${displayTokens[j]}): ${(weight * 100).toFixed(1)}%`}
                      >
                        {(weight * 100).toFixed(0)}%
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-[#e8e4dd] flex items-center justify-between text-[11px] text-[#73706d]">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#9a9794]" />
          <span>Higher attention scores signify stronger contextual token dependency during BioBERT encoding.</span>
        </div>
        <div className="flex items-center gap-2 font-mono">
          <span>0%</span>
          <div className="w-16 h-2 rounded bg-gradient-to-r from-[#1b1938]/10 to-[#1b1938]" />
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};

export default AttentionHeatmap;
