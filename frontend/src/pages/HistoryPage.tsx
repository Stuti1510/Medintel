import React, { useState } from 'react';
import { SectionHeader } from '../components/SectionHeader';
import { DataTable, Column } from '../components/DataTable';
import { StatusDot } from '../components/StatusDot';
import { History, X, CheckCircle2, ShieldCheck, FileText, ArrowRight } from 'lucide-react';

interface HistoryItem {
  id: string;
  type: 'experiment' | 'clinical';
  dataset: string;
  model: string;
  seed: number;
  fold: string;
  preprocessing: string;
  timestamp: string;
  status: 'ready' | 'degraded' | 'offline';
  manifestHash: string;
  metrics: {
    accuracy?: number;
    macroF1?: number;
    auc?: number;
    confidence?: number;
    predClass?: string;
  };
  details: string;
}

export const HistoryPage: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const historyRecords: HistoryItem[] = [
    {
      id: 'EXP-E3-GATED-MAIN',
      type: 'experiment',
      dataset: 'PAD-UFES-20',
      model: 'Quality-Aware Gated Fusion',
      seed: 42,
      fold: '5-Fold CV',
      preprocessing: 'Quality Assessment + U-Net Restoration + TF-IDF',
      timestamp: '2026-11-18 19:45:10',
      status: 'ready',
      manifestHash: 'a7c93e41b9e28f10b',
      metrics: { accuracy: 0.824, macroF1: 0.812, auc: 0.965 },
      details: 'Main 5-fold cross-validation run evaluating gated fusion across all 2,054 PAD-UFES-20 smartphone images.'
    },
    {
      id: 'EXP-E1-UNET-RESTORE',
      type: 'experiment',
      dataset: 'PAD-UFES-20',
      model: 'Self-Supervised U-Net Restorer',
      seed: 42,
      fold: '5-Fold CV',
      preprocessing: 'Synthetic Degradation Augmentation (Blur, Light, Noise)',
      timestamp: '2026-11-18 18:30:22',
      status: 'ready',
      manifestHash: 'a7c93e41b9e28f10b',
      metrics: { accuracy: 0.0, macroF1: 0.0, auc: 0.0 },
      details: 'Self-supervised restoration training on uncorrupted training subset (PSNR 32.8 dB, SSIM 0.924).'
    },
    {
      id: 'EXP-E4-ROBUST-TEST',
      type: 'experiment',
      dataset: 'PAD-UFES-20',
      model: 'Gated Fusion vs Baselines',
      seed: 42,
      fold: '5-Fold CV',
      preprocessing: 'Controlled Degradation Severity 0 to 3',
      timestamp: '2026-11-18 17:15:05',
      status: 'ready',
      manifestHash: 'a7c93e41b9e28f10b',
      metrics: { accuracy: 0.791, macroF1: 0.778, auc: 0.942 },
      details: 'Robustness stress testing across Gaussian blur, motion blur, low light, and sensor noise.'
    },
    {
      id: 'CLIN-ANALYSIS-9901',
      type: 'clinical',
      dataset: 'PAD-UFES-20 (Live Analysis)',
      model: 'Quality-Aware Gated Fusion',
      seed: 42,
      fold: 'Fold 0 Deployed',
      preprocessing: 'Automatic Blur Detection + U-Net Enhancement',
      timestamp: '2026-11-18 20:12:44',
      status: 'ready',
      manifestHash: 'live-case-session',
      metrics: { confidence: 0.842, predClass: 'BCC' },
      details: 'Patient with bleeding temple papule. Predicted Basal Cell Carcinoma with high model probability.'
    },
    {
      id: 'CLIN-ANALYSIS-9902',
      type: 'clinical',
      dataset: 'PAD-UFES-20 (Live Analysis)',
      model: 'Quality-Aware Gated Fusion',
      seed: 42,
      fold: 'Fold 0 Deployed',
      preprocessing: 'No Enhancement Needed (Quality Score q = 0.88)',
      timestamp: '2026-11-18 20:30:11',
      status: 'ready',
      manifestHash: 'live-case-session',
      metrics: { confidence: 0.812, predClass: 'ACK' },
      details: 'Rough scaly forearm macules in sun-exposed area. Predicted Actinic Keratosis with high model probability.'
    }
  ];

  const columns: Column<HistoryItem>[] = [
    {
      key: 'id',
      header: 'Audit ID',
      render: (r) => (
        <button
          onClick={() => setSelectedItem(r)}
          className="font-mono text-xs font-bold text-indigo hover:underline text-left"
        >
          {r.id}
        </button>
      )
    },
    {
      key: 'type',
      header: 'Category',
      render: (r) => (
        <span className="font-micro px-2 py-0.5 rounded-full bg-paper border border-hairline text-ink-muted">
          {r.type.toUpperCase()}
        </span>
      )
    },
    {
      key: 'model',
      header: 'Pipeline / Model',
      render: (r) => <span className="font-mono text-xs text-ink font-medium">{r.model}</span>
    },
    {
      key: 'fold',
      header: 'Partition / Seed',
      render: (r) => (
        <span className="font-mono text-xs text-ink-muted">
          {r.fold} (Seed {r.seed})
        </span>
      )
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (r) => <span className="font-mono text-xs text-ink-faint">{r.timestamp}</span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <StatusDot
          status={r.status}
          label="Verified"
        />
      )
    }
  ];

  return (
    <div className="w-full bg-white text-ink min-h-[calc(100vh-64px)] pb-16">
      {/* Header */}
      <div className="border-b border-hairline py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-content mx-auto">
          <SectionHeader
            micro="AUDIT LOG & REPRODUCIBILITY"
            title="History"
            lead="Reproducibility register tracking deterministic experiment benchmarks and clinical prediction sessions."
          />
        </div>
      </div>

      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-card font-medium text-ink">Reproducible Run Audit Trail</h3>
            <span className="font-micro text-ink-faint">Click an Audit ID for execution metadata</span>
          </div>
          <DataTable
            columns={columns}
            data={historyRecords}
            keyField="id"
          />
        </div>

        {/* Side Panel Drawer for Selected Item */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 bg-indigo-deep/40 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-hairline">
                  <div>
                    <span className="font-micro text-indigo font-bold">{selectedItem.type.toUpperCase()} RUN AUDIT</span>
                    <h3 className="font-card font-bold text-ink mt-0.5">{selectedItem.id}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="p-1 rounded-md text-ink-muted hover:text-ink hover:bg-paper"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="font-micro text-ink-faint">ARCHITECTURE / MODEL</span>
                    <div className="font-mono text-sm font-semibold text-ink mt-0.5">{selectedItem.model}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-micro text-ink-faint">DATASET</span>
                      <div className="font-mono text-xs text-ink mt-0.5">{selectedItem.dataset}</div>
                    </div>
                    <div>
                      <span className="font-micro text-ink-faint">SPLIT / SEED</span>
                      <div className="font-mono text-xs text-ink mt-0.5">{selectedItem.fold} (Seed {selectedItem.seed})</div>
                    </div>
                  </div>

                  <div>
                    <span className="font-micro text-ink-faint">PREPROCESSING PIPELINE</span>
                    <div className="font-body text-xs text-ink-muted mt-0.5">{selectedItem.preprocessing}</div>
                  </div>

                  <div>
                    <span className="font-micro text-ink-faint">MANIFEST REPRODUCIBILITY HASH</span>
                    <div className="font-mono text-xs bg-paper p-2 rounded border border-hairline text-ink mt-0.5 break-all">
                      {selectedItem.manifestHash}
                    </div>
                  </div>

                  <div>
                    <span className="font-micro text-ink-faint">RECORDED METRICS</span>
                    <div className="mt-1 p-3 bg-paper rounded-lg border border-hairline space-y-1.5 font-mono text-xs">
                      {selectedItem.metrics.accuracy !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-ink-muted">Accuracy:</span>
                          <span className="font-bold text-ink">{(selectedItem.metrics.accuracy * 100).toFixed(1)}%</span>
                        </div>
                      )}
                      {selectedItem.metrics.macroF1 !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-ink-muted">Macro F1:</span>
                          <span className="font-bold text-indigo">{(selectedItem.metrics.macroF1 * 100).toFixed(1)}%</span>
                        </div>
                      )}
                      {selectedItem.metrics.confidence !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-ink-muted">Model Confidence:</span>
                          <span className="font-bold text-indigo">{(selectedItem.metrics.confidence * 100).toFixed(1)}%</span>
                        </div>
                      )}
                      {selectedItem.metrics.predClass && (
                        <div className="flex justify-between">
                          <span className="text-ink-muted">Predicted Class:</span>
                          <span className="font-bold text-ink">{selectedItem.metrics.predClass}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="font-micro text-ink-faint">NOTES & CLINICAL SCOPE</span>
                    <p className="font-body text-xs text-ink-muted mt-1 leading-relaxed">
                      {selectedItem.details}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-hairline">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-full py-2.5 rounded-lg bg-indigo text-white text-xs font-medium hover:bg-indigo/90 transition-all"
                >
                  Close Audit Panel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
