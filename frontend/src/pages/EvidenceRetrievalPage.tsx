import React, { useState } from 'react';
import { BookOpen, Search, ExternalLink, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import { searchRAGEvidence } from '../services/api';
import { EvidenceItem } from '../types/clinical';

export const EvidenceRetrievalPage: React.FC = () => {
  const [query, setQuery] = useState<string>("Myocardial Infarction crushing chest pain troponin ECG management");
  const [loading, setLoading] = useState<boolean>(false);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [retrievalTime, setRetrievalTime] = useState<number | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await searchRAGEvidence(query, 6);
      setEvidenceList(res.evidence);
      setRetrievalTime(res.retrieval_time_ms);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-ai" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Evidence Retrieval (RAG Explorer)</h1>
            <span className="text-[11px] font-mono-tech px-2 py-0.5 rounded bg-ai/10 text-ai border border-ai/20">
              VECTOR SEARCH
            </span>
          </div>
          <p className="text-xs text-dark-secondary mt-1">
            Query the clinical knowledge base via high-dimensional dense embeddings and cosine similarity search.
          </p>
        </div>
      </div>

      {/* Query Bar */}
      <div className="p-5 rounded-card bg-dark-surface border border-dark-border space-y-3">
        <label className="text-xs font-semibold text-dark-secondary font-mono-tech uppercase block">
          Enter Clinical Keyword or Symptom Query:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-3 py-2 rounded-button bg-dark-deep border border-dark-border text-xs text-dark-text focus:border-ai focus:outline-none font-mono-tech"
            placeholder="Search symptoms, guidelines, red flags..."
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-5 py-2 rounded-button bg-ai hover:bg-ai-hover text-white text-xs font-semibold shadow-md shadow-ai/25 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Retrieve Top-K</span>
          </button>
        </div>

        {/* Quick query chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="text-xs font-mono-tech text-dark-muted">Suggested Queries:</span>
          {["Pneumonia CURB-65", "Ischemic Stroke FAST", "Appendicitis Alvarado", "Asthma GINA stepwise"].map((q) => (
            <button
              key={q}
              onClick={() => { setQuery(q); }}
              className="text-[11px] px-2.5 py-0.5 rounded bg-dark-deep hover:bg-dark-elevated text-dark-secondary hover:text-dark-text border border-dark-border transition-colors font-mono-tech"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      {retrievalTime !== null && (
        <div className="flex justify-between items-center text-xs font-mono-tech text-dark-muted">
          <span>Found {evidenceList.length} relevant evidence passages</span>
          <span>Vector Search Latency: {retrievalTime} ms</span>
        </div>
      )}

      {/* Evidence Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {evidenceList.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-card bg-dark-surface border border-dark-border hover:border-ai/40 transition-all space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-dark-text">{item.title}</h4>
                <p className="text-[11px] text-dark-muted mt-0.5">Source: {item.source}</p>
              </div>
              <span className="text-xs font-mono-tech font-semibold px-2 py-0.5 rounded bg-semantic-info/10 text-semantic-info border border-semantic-info/20 shrink-0">
                {(item.similarity_score * 100).toFixed(1)}% match
              </span>
            </div>

            <div className="text-xs text-dark-secondary leading-relaxed bg-dark-deep p-3 rounded border border-dark-border/60">
              {item.full_content || item.snippet}
            </div>

            <div className="flex justify-between items-center pt-1 border-t border-dark-border/50 text-[11px] text-dark-muted">
              <span className="font-mono-tech uppercase text-[10px]">{item.category}</span>
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ai hover:underline flex items-center gap-1"
              >
                <span>Read Official Guideline</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
