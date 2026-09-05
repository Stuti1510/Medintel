import React, { useState } from 'react';
import { EvidenceItem } from '../types/clinical';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  evidence: EvidenceItem[];
}

export const EvidenceCard: React.FC<Props> = ({ evidence }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {evidence.map((item, idx) => {
        const isExpanded = expandedId === (item.id || String(idx));
        const scorePct = (item.similarity_score * 100).toFixed(1);

        return (
          <div
            key={item.id || idx}
            className="p-4 rounded-xl bg-white border border-[#e8e4dd] hover:border-[#1b1938]/30 transition-all space-y-2"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-[#292827]">{item.title}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#fafaf8] text-[#73706d] border border-[#e8e4dd] uppercase">
                    {item.category}
                  </span>
                </div>
                <p className="text-[11px] text-[#73706d] font-mono">
                  Source: {item.source} {item.last_updated && `• Updated: ${item.last_updated}`}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-[#f5f4f0] text-[#1b1938] border border-[#e8e4dd]">
                  {scorePct}% similarity
                </span>
                {item.source_url && (
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded text-[#73706d] hover:text-[#1b1938]"
                    title="Open Primary Source"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Evidence Snippet */}
            <div className="text-xs text-[#292827] leading-relaxed bg-[#fafaf8] p-3 rounded-lg border border-[#e8e4dd]">
              {isExpanded && item.full_content ? item.full_content : item.snippet}
            </div>

            {item.full_content && item.full_content.length > item.snippet.length && (
              <button
                onClick={() => setExpandedId(isExpanded ? null : (item.id || String(idx)))}
                className="text-[11px] text-[#1b1938] hover:underline font-medium flex items-center gap-1"
              >
                {isExpanded ? <>Show less <ChevronUp className="w-3 h-3" /></> : <>Read complete guideline passage <ChevronDown className="w-3 h-3" /></>}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default EvidenceCard;
