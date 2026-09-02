import React from 'react';
import { TokenDetail } from '../types/clinical';
import { Hash } from 'lucide-react';

interface Props {
  tokenDetails: TokenDetail[];
}

export const TokenVisualizer: React.FC<Props> = ({ tokenDetails }) => {
  if (!tokenDetails || tokenDetails.length === 0) {
    return null;
  }

  return (
    <div className="p-5 rounded-card bg-dark-surface border border-dark-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-dark-text flex items-center gap-2">
          <Hash className="w-4 h-4 text-ai" />
          WordPiece Token Mapping & Attention Masks
        </h3>
        <span className="text-xs font-mono-tech text-dark-muted">
          Active Tokens: {tokenDetails.filter(t => t.attention_mask === 1).length}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 bg-dark-deep rounded border border-dark-border">
        {tokenDetails.map((tok) => (
          <div
            key={tok.position}
            className={`px-2 py-1 rounded text-xs font-mono-tech border flex items-center gap-1.5 ${
              tok.is_special
                ? 'bg-ai/15 border-ai/40 text-ai'
                : 'bg-dark-elevated border-dark-strongBorder text-dark-text'
            }`}
          >
            <span className="font-semibold">{tok.token}</span>
            <span className="text-[10px] text-dark-muted">#{tok.token_id}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
