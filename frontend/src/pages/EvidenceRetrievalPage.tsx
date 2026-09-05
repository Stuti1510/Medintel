import React, { useState } from 'react';
import { BookOpen, Search, ExternalLink, Loader2, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import { searchRAGEvidence } from '../services/api';
import { EvidenceItem } from '../types/clinical';
import { TealClosingCTA } from '../components/TealClosingCTA';

export const EvidenceRetrievalPage: React.FC = () => {
  const [query, setQuery] = useState<string>("Sepsis diagnostic criteria, serum lactate monitoring, and empiric antimicrobial therapy");
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

  const suggestedQueries = [
    "Sepsis SOFA criteria & empiric antibiotics",
    "Pneumonia IDSA/ATS CURB-65 score",
    "Heart Failure ACC/AHA diuretic protocol",
    "Adult vital signs reference ranges"
  ];

  return (
    <div className="min-h-screen bg-[#fafaf8] text-[#292827] flex flex-col">
      {/* ------------------------------------------------------------- */}
      {/* 1. Page Header                                                */}
      {/* ------------------------------------------------------------- */}
      <section className="w-full bg-white border-b border-[#e8e4dd] py-10 md:py-14">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[#73706d] block">
              Vector Retrieval-Augmented Generation
            </span>
            <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#292827]">
              Evidence
            </h1>
            <p className="text-base text-[#73706d] max-w-2xl">
              Trace model reasoning to retrieved clinical knowledge across 43 peer-reviewed medical guidelines using dense cosine vector similarity.
            </p>
          </div>

          {/* RAG Sequential Pipeline Flow */}
          <div className="pt-4 border-t border-[#e8e4dd] hidden sm:flex items-center gap-2 text-[11px] font-mono text-[#73706d] overflow-x-auto">
            <span>Query</span>
            <span>→</span>
            <span>Embedding</span>
            <span>→</span>
            <span>Retrieval</span>
            <span>→</span>
            <span>Ranking</span>
            <span>→</span>
            <span className="text-[#1b1938] font-semibold">Evidence</span>
            <span>→</span>
            <span>Validation</span>
            <span>→</span>
            <span>Grounded Synthesis</span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. Main Search & Document Explorer                            */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8 flex-1">
        {/* Query Input Card */}
        <div className="p-6 rounded-xl bg-white border border-[#e8e4dd] space-y-4">
          <label className="text-xs font-mono uppercase text-[#73706d] tracking-wider block font-semibold">
            Clinical Search Query or Diagnostic Keywords:
          </label>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] text-xs text-[#292827] focus:outline-none focus:border-[#1b1938] font-mono"
              placeholder="Search clinical guidelines, criteria, treatment protocols..."
            />
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-6 py-2.5 rounded-lg bg-[#1b1938] hover:bg-[#232047] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Retrieving...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5 text-white" />
                  <span>Retrieve Evidence</span>
                </>
              )}
            </button>
          </div>

          {/* Suggested Queries */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-[#73706d] font-mono">Suggested:</span>
            {suggestedQueries.map((q) => (
              <button
                key={q}
                onClick={() => { setQuery(q); }}
                className="text-[11px] px-3 py-1 rounded-md bg-[#fafaf8] hover:bg-[#f5f4f0] text-[#73706d] hover:text-[#292827] border border-[#e8e4dd] font-mono transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Results Metadata */}
        {retrievalTime !== null && (
          <div className="flex justify-between items-center text-xs font-mono text-[#73706d]">
            <span>Retrieved {evidenceList.length} Grounded Evidence Passages</span>
            <span className="text-[#1b1938] font-medium">Search Latency: {retrievalTime} ms</span>
          </div>
        )}

        {/* Evidence Document List */}
        {evidenceList.length > 0 ? (
          <div className="space-y-4">
            {evidenceList.map((item, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl bg-white border border-[#e8e4dd] hover:border-[#1b1938]/30 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e8e4dd] pb-3">
                  <div>
                    <h3 className="text-base font-medium text-[#292827]">{item.title}</h3>
                    <p className="text-xs text-[#73706d] font-mono mt-0.5">Source: {item.source}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#fafaf8] text-[#1b1938] border border-[#e8e4dd]">
                      {(item.similarity_score * 100).toFixed(1)}% similarity
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2 py-1 rounded bg-[#f5f4f0] text-[#73706d]">
                      {item.category}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-[#292827] leading-relaxed bg-[#fafaf8] p-4 rounded-lg border border-[#e8e4dd]">
                  {item.full_content || item.snippet}
                </div>

                {item.source_url && (
                  <div className="flex justify-end pt-1">
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#1b1938] hover:underline flex items-center gap-1 font-mono font-medium"
                    >
                      <span>Open Guideline Publication</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-16 rounded-xl bg-white border border-[#e8e4dd] text-center space-y-3">
            <BookOpen className="w-8 h-8 text-[#9a9794] mx-auto" />
            <h3 className="text-base font-medium text-[#292827]">NO EVIDENCE RETRIEVED</h3>
            <p className="text-xs text-[#73706d] max-w-md mx-auto leading-relaxed">
              Search clinical guidelines, management protocols, or select a suggested query above to retrieve vector-indexed medical literature.
            </p>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. Deep Teal Closing Resolution Section                       */}
      {/* ------------------------------------------------------------- */}
      <TealClosingCTA />
    </div>
  );
};

export default EvidenceRetrievalPage;
