import React, { useState, useEffect } from 'react';
import { ChartCard } from '../components/charts/ChartCard';
import { getExperimentResults, API_BASE_URL } from '../services/api';
import { Sparkles, FileText, CheckCircle2, ShieldCheck, Eye, Layers } from 'lucide-react';

export const ExplainabilityPage: React.FC = () => {
  const [e6Rows, setE6Rows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorUrl, setErrorUrl] = useState<string | null>(null);
  const [isNotRun, setIsNotRun] = useState(false);

  useEffect(() => {
    const fetchE6 = async () => {
      try {
        const res = await getExperimentResults('e6');
        if (res.status === 'not_run') {
          setIsNotRun(true);
        } else if (res.status === 'success') {
          setE6Rows(res.rows);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch E6 XAI benchmark data');
        setErrorUrl(err?.url || `${API_BASE_URL}/results/e6`);
      } finally {
        setLoading(false);
      }
    };
    fetchE6();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            Explainable AI (XAI) Quantitative Lab
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Grad-CAM/Grad-CAM++ visual heatmaps, exact linear text attributions, and stability metrics before/after U-Net restoration.
          </p>
        </div>
        <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300">
          Faithfulness: <span className="font-semibold text-emerald-400">Deletion / Insertion AUC Evaluated</span>
        </div>
      </div>

      {/* Quantitative E6 Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div>
          <h3 className="text-base font-semibold text-white">E6 Quantitative XAI Evaluation</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluates visual saliency faithfulness (deletion AUC, insertion AUC) and saliency stability across degradations.
          </p>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-xs">Loading XAI benchmark metrics...</div>
          ) : isNotRun ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs">
              <Eye className="w-8 h-8 text-slate-500 mb-2" />
              No results yet — run the experiments
            </div>
          ) : error ? (
            <div className="h-48 flex flex-col items-center justify-center text-rose-400 text-xs p-4 text-center">
              <span>{error}</span>
              {errorUrl && <span className="font-mono text-[10px] mt-1 text-slate-400">{errorUrl}</span>}
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 font-medium">XAI Method / Condition</th>
                  <th className="py-2.5 font-medium">Degradation</th>
                  <th className="py-2.5 font-medium">Deletion AUC ↓</th>
                  <th className="py-2.5 font-medium">Insertion AUC ↑</th>
                  <th className="py-2.5 font-medium">SSIM Stability ↑</th>
                  <th className="py-2.5 font-medium">Spearman Rank Corr ↑</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {e6Rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-950/40">
                    <td className="py-2.5 font-sans font-medium text-slate-200">
                      {row.method || row.xai_method || 'Grad-CAM++'}
                    </td>
                    <td className="py-2.5 text-slate-400 font-sans">{row.degradation || 'None (Clean)'}</td>
                    <td className="py-2.5 text-sky-400">{row.deletion_auc?.toFixed(4) || '—'}</td>
                    <td className="py-2.5 text-emerald-400">{row.insertion_auc?.toFixed(4) || '—'}</td>
                    <td className="py-2.5">{row.ssim_stability?.toFixed(4) || '—'}</td>
                    <td className="py-2.5">{row.spearman_rank_corr?.toFixed(4) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Multi-Level Explanation Methodology Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-3">
          <div className="p-2.5 bg-sky-500/10 rounded-lg text-sky-400 w-fit">
            <Eye className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-white">Visual Modality: Grad-CAM++</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Targets the final convolutional head (<code className="text-slate-300 font-mono">conv_head</code>) of EfficientNet-B0. Weighted by second and third positive partial derivatives to pinpoint minute morphological lesion borders.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400 w-fit">
            <FileText className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-white">Clinical Modality: Exact Linear Attributions</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Direct analytical product of TF-IDF feature weights and calibrated <code className="text-slate-300 font-mono">LinearSVC.coef_</code>. Unlike sampling approximations (SHAP/LIME), attributions are 100% faithful and deterministic.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-3">
          <div className="p-2.5 bg-purple-500/10 rounded-lg text-purple-400 w-fit">
            <Layers className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-white">Fusion Modality: Dynamic Quality Gate</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Scalar weight <code className="text-slate-300 font-mono">g = σ(W_g [h_img; h_txt; q] + b_g)</code> indicates how much weight the classifier placed on visual features versus clinical narrative conditioned on image quality score <code className="text-slate-300 font-mono">q</code>.
          </p>
        </div>
      </div>
    </div>
  );
};
