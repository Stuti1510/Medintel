import React, { useState } from 'react';
import { EvidenceItem } from '../types/clinical';
import { BookOpen, ExternalLink, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

interface Props {
  evidence: EvidenceItem[];
}

export const EvidenceCard: React.FC<Props> = ({ evidence }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="p-5 rounded-card bg-dark-surface border border-dark-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-ai" />
          <h3 className="text-base font-semibold text-dark-text">Retrieved Clinical Evidence (RAG)</h3>
        </div>
        <span className="text-xs font-mono-tech px-2 py-0.5 rounded bg-ai/10 text-ai border border-ai/20">
          {evidence.length} Grounded Citations
        </span>
      </div>
      <p className="text-xs text-dark-secondary mb-4">
        Evidence chunks retrieved from peer-reviewed clinical guidelines and literature via normalized cosine vector search.
      </p>

      <div className="space-y-3">
        {evidence.map((item, idx) => {
          const isExpanded = expandedId === (item.id || String(idx));
          const scorePct = (item.similarity_score * 100).toFixed(1);

          return (
            <div
              key={item.id || idx}
              className="p-3.5 rounded-button bg-dark-elevated border border-dark-strongBorder hover:border-ai/40 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-dark-text">{item.title}</span>
                    <span className="text-[10px] font-mono-tech px-1.5 py-0.5 rounded bg-dark-deep text-dark-secondary border border-dark-border uppercase">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-dark-muted flex items-center gap-2">
                    <span>Source: {item.source}</span>
                    {item.last_updated && <span>• Updated: {item.last_updated}</span>}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono-tech font-semibold px-2 py-0.5 rounded bg-semantic-info/10 text-semantic-info border border-semantic-info/20">
                    {scorePct}% match
                  </span>
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded hover:bg-dark-surface text-dark-muted hover:text-ai transition-colors"
                    title="Open Primary Source"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Snippet */}
              <div className="mt-2 text-xs text-dark-secondary leading-relaxed bg-dark-surface/60 p-2.5 rounded border border-dark-border/50">
                {isExpanded && item.full_content ? item.full_content : item.snippet}
              </div>

              {item.full_content && item.full_content.length > item.snippet.length && (
                <button
                  onClick={() => setExpandedId(isExpanded ? null : (item.id || String(idx)))}
                  className="mt-2 text-[11px] text-ai hover:text-ai-hover font-medium flex items-center gap-1 transition-colors"
                >
                  {isExpanded ? <>Show Less <ChevronUp className="w-3 h-3" /></> : <>Read Full Passage <ChevronDown className="w-3 h-3" /></>}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
