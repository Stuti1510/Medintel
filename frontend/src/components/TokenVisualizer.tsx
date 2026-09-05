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
    <div className="p-6 rounded-xl bg-white border border-[#e8e4dd] space-y-4">
      <div className="flex items-center justify-between border-b border-[#e8e4dd] pb-3">
        <h3 className="text-sm font-medium text-[#292827] flex items-center gap-2">
          <Hash className="w-4 h-4 text-[#1b1938]" />
          <span>WordPiece Token Mapping & Vocabulary IDs</span>
        </h3>
        <span className="text-xs font-mono text-[#73706d]">
          Active Tokens: {tokenDetails.filter(t => t.attention_mask === 1).length}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-4 bg-[#fafaf8] rounded-lg border border-[#e8e4dd]">
        {tokenDetails.map((tok) => (
          <div
            key={tok.position}
            className={`px-2.5 py-1 rounded text-xs font-mono border flex items-center gap-2 ${
              tok.is_special
                ? 'bg-[#ebe4fd] border-[#c9b4fa] text-[#1b1938] font-medium'
                : 'bg-white border-[#e8e4dd] text-[#292827]'
            }`}
          >
            <span>{tok.token}</span>
            <span className="text-[10px] text-[#9a9794]">#{tok.token_id}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TokenVisualizer;
