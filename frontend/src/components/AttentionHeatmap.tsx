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
      <div className="p-6 rounded-card bg-dark-surface border border-dark-border text-center text-dark-muted text-xs">
        Tokenize and analyze text to visualize self-attention weights.
      </div>
    );
  }

  const displayTokens = tokens.slice(0, 14);
  const displayMatrix = matrix.slice(0, 14).map(row => row.slice(0, 14));

  return (
    <div className="p-5 rounded-card bg-dark-surface border border-dark-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-dark-text flex items-center gap-2">
            <Cpu className="w-4 h-4 text-ai" />
            Transformer Self-Attention Matrix (Q × Kᵀ / √d)
          </h3>
          <p className="text-xs text-dark-secondary mt-0.5">
            Real multi-token self-attention weights computed across Transformer contextual representations.
          </p>
        </div>
        <span className="text-[11px] font-mono-tech px-2 py-0.5 rounded bg-ai/10 text-ai border border-ai/20">
          WordPiece Attention
        </span>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-block min-w-full">
          {/* Top Token Labels (Keys) */}
          <div className="flex items-center ml-20 mb-1">
            {displayTokens.map((tok, j) => (
              <div
                key={j}
                className="w-10 text-[10px] font-mono-tech text-dark-muted truncate text-center -rotate-45 origin-bottom-left"
                title={tok}
              >
                {tok}
              </div>
            ))}
          </div>

          {/* Matrix Rows (Queries) */}
          <div className="space-y-1">
            {displayTokens.map((qTok, i) => (
              <div key={i} className="flex items-center gap-1">
                {/* Left Query Label */}
                <div className="w-20 text-[10px] font-mono-tech text-dark-secondary truncate text-right pr-2" title={qTok}>
                  {qTok}
                </div>

                {/* Cells */}
                <div className="flex items-center gap-1">
                  {displayMatrix[i]?.map((weight, j) => {
                    const isSelected = selectedTokenIdx === i || selectedTokenIdx === j;
                    // Color calculation based on attention intensity
                    const intensity = Math.min(Math.max(weight * 3.5, 0.05), 1);
                    return (
                      <div
                        key={j}
                        onMouseEnter={() => setSelectedTokenIdx(i)}
                        onMouseLeave={() => setSelectedTokenIdx(null)}
                        className={`w-10 h-8 rounded text-[9px] font-mono-tech flex items-center justify-center cursor-pointer transition-all ${
                          isSelected ? 'ring-1 ring-white' : ''
                        }`}
                        style={{
                          backgroundColor: `rgba(108, 99, 255, ${intensity})`,
                          color: intensity > 0.4 ? '#FFFFFF' : '#A7AFBA'
                        }}
                        title={`Attn(${qTok} -> ${displayTokens[j]}): ${(weight * 100).toFixed(1)}%`}
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

      <div className="mt-4 pt-3 border-t border-dark-border flex items-center justify-between text-[11px] text-dark-muted">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-ai" />
          <span>Higher percentage signifies stronger contextual token dependency during encoding.</span>
        </div>
        <div className="flex items-center gap-1">
          <span>Low</span>
          <div className="w-16 h-2 rounded bg-gradient-to-r from-ai/10 to-ai" />
          <span>High</span>
        </div>
      </div>
    </div>
  );
};
