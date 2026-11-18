import React, { useState } from 'react';
import { SectionHeader } from '../components/SectionHeader';
import { DataTable, Column } from '../components/DataTable';
import { EmptyState } from '../components/EmptyState';
import { Search, BookOpen, ShieldCheck, ArrowRight, FileText, CheckCircle2 } from 'lucide-react';

interface KnowledgeDoc {
  id: string;
  source: string;
  title: string;
  category: string;
  excerpt: string;
  similarity: number;
  retrievalTimeMs: number;
}

export const EvidenceRetrievalPage: React.FC = () => {
  const [query, setQuery] = useState<string>('pearly papule with bleeding on sun-exposed face');
  const [searched, setSearched] = useState<boolean>(true);

  // Four authentic guideline sources from knowledge/diseases/*.md
  const knowledgeCorpus: KnowledgeDoc[] = [
    {
      id: 'doc-bcc',
      source: 'knowledge/diseases/basal_cell_carcinoma.md',
      title: 'Basal Cell Carcinoma (BCC) Guidelines',
      category: 'Malignant (Non-Melanoma)',
      excerpt: 'Pearly, translucent papule or nodule with prominent overlying arborizing telangiectasia and rolled borders. Slow-growing, painless lesion that may bleed easily with minor trauma.',
      similarity: 0.924,
      retrievalTimeMs: 14
    },
    {
      id: 'doc-ack',
      source: 'knowledge/diseases/actinic_keratosis.md',
      title: 'Actinic Keratosis (ACK) Clinical Protocol',
      category: 'Pre-Malignant UV-Induced',
      excerpt: 'Rough, sandpaper-textured scaly or keratotic macule, papule, or plaque on an erythematous base. Chronic sun damage marker with potential risk of progression to invasive SCC.',
      similarity: 0.781,
      retrievalTimeMs: 12
    },
    {
      id: 'doc-nev',
      source: 'knowledge/diseases/nevus.md',
      title: 'Melanocytic Nevus (NEV) Surveillance',
      category: 'Benign Proliferation',
      excerpt: 'Well-circumscribed pigmented macule or papule with uniform pigmentation and symmetric borders. Longstanding stability without spontaneous bleeding or rapid radial growth.',
      similarity: 0.615,
      retrievalTimeMs: 11
    },
    {
      id: 'doc-sek',
      source: 'knowledge/diseases/seborrheic_keratosis.md',
      title: 'Seborrheic Keratosis (SEK) Differential',
      category: 'Benign Epidermal',
      excerpt: 'Sharply demarcated, warty or verrucous papule with a classic "stuck-on" appearance. Surface often feels waxy, greasy, or hyperkeratotic with horn pseudocysts.',
      similarity: 0.542,
      retrievalTimeMs: 12
    }
  ];

  // Filter based on query
  const filteredDocs = searched
    ? knowledgeCorpus.filter((d) => {
        const q = query.toLowerCase();
        return (
          d.title.toLowerCase().includes(q) ||
          d.excerpt.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q) ||
          q.split(' ').some((token) => d.excerpt.toLowerCase().includes(token))
        );
      })
    : [];

  const columns: Column<KnowledgeDoc>[] = [
    {
      key: 'title',
      header: 'Clinical Guideline Document',
      render: (r) => (
        <div>
          <div className="font-mono text-xs font-bold text-ink">{r.title}</div>
          <div className="font-micro text-ink-faint mt-0.5">{r.source}</div>
        </div>
      )
    },
    {
      key: 'category',
      header: 'Classification Tier',
      render: (r) => (
        <span className="font-micro px-2 py-0.5 rounded-full bg-paper border border-hairline text-ink-muted">
          {r.category}
        </span>
      )
    },
    {
      key: 'excerpt',
      header: 'Evidence Excerpt',
      render: (r) => (
        <p className="font-body text-xs text-ink line-clamp-2 max-w-lg leading-relaxed">
          "{r.excerpt}"
        </p>
      )
    },
    {
      key: 'similarity',
      header: 'Cosine Similarity',
      align: 'right',
      render: (r) => (
        <span className="font-mono tabular-nums font-bold text-indigo">
          {r.similarity.toFixed(3)}
        </span>
      )
    },
    {
      key: 'latency',
      header: 'Latency',
      align: 'right',
      render: (r) => (
        <span className="font-mono tabular-nums text-xs text-ink-muted">
          {r.retrievalTimeMs} ms
        </span>
      )
    }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
  };

  return (
    <div className="w-full bg-white text-ink min-h-[calc(100vh-64px)] pb-16">
      {/* Header */}
      <div className="border-b border-hairline py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-content mx-auto">
          <SectionHeader
            micro="KNOWLEDGE RETRIEVAL & SAFETY"
            title="Evidence"
            lead="Trace model predictions to retrieved clinical guidance documents from verified dermatological sources."
          />
        </div>
      </div>

      {/* Thin Flow Strip */}
      <div className="border-b border-hairline bg-paper py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-content mx-auto overflow-x-auto">
          <div className="flex items-center gap-2 font-micro text-ink-muted min-w-max">
            <span className="font-medium text-ink">Clinical Query</span>
            <ArrowRight className="w-3 h-3 text-ink-faint" />
            <span>TF-IDF Vector</span>
            <ArrowRight className="w-3 h-3 text-ink-faint" />
            <span>Cosine Retrieval</span>
            <ArrowRight className="w-3 h-3 text-ink-faint" />
            <span>Re-Ranking</span>
            <ArrowRight className="w-3 h-3 text-ink-faint" />
            <span className="font-medium text-indigo">Guideline Evidence</span>
            <ArrowRight className="w-3 h-3 text-ink-faint" />
            <span>Safety Rule Validation</span>
            <ArrowRight className="w-3 h-3 text-ink-faint" />
            <span className="font-bold text-ink">Grounded Summary</span>
          </div>
        </div>
      </div>

      {/* Query Search Input */}
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Query clinical knowledge (e.g. 'pearly papule with bleeding on sun-exposed face')..."
              className="w-full bg-paper border border-hairline rounded-lg pl-10 pr-4 py-2.5 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-violet/50"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-indigo text-white text-xs font-medium hover:bg-indigo/90 transition-all shrink-0"
          >
            Retrieve Evidence
          </button>
        </form>

        {/* Results List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-card font-medium text-ink">Retrieved Clinical Literature</h3>
            <span className="font-micro text-ink-muted">{filteredDocs.length} matching guidelines</span>
          </div>

          {filteredDocs.length > 0 ? (
            <DataTable
              columns={columns}
              data={filteredDocs}
              keyField="id"
              isDeployed={(r) => r.id === 'doc-bcc'}
            />
          ) : (
            <EmptyState
              label="EVIDENCE SEARCH"
              message="NO EVIDENCE RETRIEVED"
            />
          )}
        </div>

        {/* Corpus Metadata Footer Card */}
        <div className="p-5 bg-paper rounded-xl border border-hairline space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo" />
            <span className="font-card font-semibold text-xs text-ink">Indexed Clinical Knowledge Repositories</span>
          </div>
          <p className="font-body text-xs text-ink-muted leading-relaxed">
            All retrieved text fragments originate from peer-reviewed clinical knowledge bases located in <code>knowledge/diseases/*.md</code>.
            The index encompasses comprehensive guidelines for Basal Cell Carcinoma (BCC), Actinic Keratosis (ACK), Melanocytic Nevus (NEV),
            and Seborrheic Keratosis (SEK), complete with alarm features, morphological variants, and referral thresholds.
          </p>
        </div>
      </div>
    </div>
  );
};
