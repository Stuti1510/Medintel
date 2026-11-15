import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ChartCard } from '../components/charts/ChartCard';
import { getExperimentResults, API_BASE_URL } from '../services/api';
import { ShieldCheck, Sliders, BarChart3, TrendingUp, AlertCircle } from 'lucide-react';

export const ModelComparisonPage: React.FC = () => {
  // E3 Main Benchmark
  const [e3Rows, setE3Rows] = useState<any[]>([]);
  const [e3Loading, setE3Loading] = useState(true);
  const [e3Error, setE3Error] = useState<string | null>(null);
  const [e3ErrorUrl, setE3ErrorUrl] = useState<string | null>(null);
  const [e3NotRun, setE3NotRun] = useState(false);

  // E4 Robustness Benchmark
  const [e4Rows, setE4Rows] = useState<any[]>([]);
  const [e4Loading, setE4Loading] = useState(true);
  const [e4Error, setE4Error] = useState<string | null>(null);
  const [e4ErrorUrl, setE4ErrorUrl] = useState<string | null>(null);
  const [e4NotRun, setE4NotRun] = useState(false);
  const [selectedDegradation, setSelectedDegradation] = useState('gaussian_blur');

  useEffect(() => {
    // Fetch E3
    const fetchE3 = async () => {
      try {
        const res = await getExperimentResults('e3');
        if (res.status === 'not_run') {
          setE3NotRun(true);
        } else if (res.status === 'success') {
          setE3Rows(res.rows);
        }
      } catch (err: any) {
        setE3Error(err?.message || 'Failed to fetch E3 main benchmark');
        setE3ErrorUrl(err?.url || `${API_BASE_URL}/results/e3`);
      } finally {
        setE3Loading(false);
      }
    };

    // Fetch E4
    const fetchE4 = async () => {
      try {
        const res = await getExperimentResults('e4');
        if (res.status === 'not_run') {
          setE4NotRun(true);
        } else if (res.status === 'success') {
          setE4Rows(res.rows);
        }
      } catch (err: any) {
        setE4Error(err?.message || 'Failed to fetch E4 robustness benchmark');
        setE4ErrorUrl(err?.url || `${API_BASE_URL}/results/e4`);
      } finally {
        setE4Loading(false);
      }
    };

    fetchE3();
    fetchE4();
  }, []);

  // Filter E4 rows by selected degradation
  const filteredE4 = React.useMemo(() => {
    if (!e4Rows || e4Rows.length === 0) return [];
    const degData = e4Rows.filter((r) => r.degradation === selectedDegradation);
    
    // Group by level (1, 2, 3)
    const levels = [1, 2, 3];
    return levels.map((lvl) => {
      const unenhanced = degData.find((r) => r.level === lvl && r.enhanced === false);
      const enhanced = degData.find((r) => r.level === lvl && r.enhanced === true);
      return {
        level: `Severity ${lvl}`,
        'Without Restoration': unenhanced ? Number((unenhanced.acc * 100).toFixed(1)) : null,
        'With U-Net Restoration': enhanced ? Number((enhanced.acc * 100).toFixed(1)) : null,
      };
    });
  }, [e4Rows, selectedDegradation]);

  // Transform E3 rows for macro-F1 chart
  const e3ChartData = React.useMemo(() => {
    return e3Rows.map((r) => ({
      model: r.model || r.architecture,
      'Macro F1': Number((r.macro_f1 * 100).toFixed(1)),
      'Accuracy': Number((r.acc * 100).toFixed(1)),
    }));
  }, [e3Rows]);

  const degradations = [
    { id: 'gaussian_blur', name: 'Gaussian Blur' },
    { id: 'motion_blur', name: 'Motion Blur' },
    { id: 'low_light', name: 'Low Light / Contrast' },
    { id: 'gaussian_noise', name: 'Gaussian Sensor Noise' },
    { id: 'jpeg', name: 'JPEG Compression' },
    { id: 'downscale', name: 'Downscale & Pixelation' },
  ];

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-400" />
            Model Benchmarks & Robustness Analysis
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Evaluated on held-out test splits across 5 patient-grouped folds of PAD-UFES-20 (zero patient overlap).
          </p>
        </div>
        <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300">
          Deployed Baseline: <span className="font-semibold text-sky-400">Quality-Aware Gated Fusion</span>
        </div>
      </div>

      {/* Grid of Main Benchmarks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* E3 Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col">
          <h3 className="text-base font-semibold text-white mb-1">E3 Main Multimodal Benchmark</h3>
          <p className="text-xs text-slate-400 mb-4">Clean smartphone test splits (Mean ± Std over 5 folds)</p>

          <div className="flex-1 overflow-x-auto">
            {e3Loading ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-xs">Loading benchmark data...</div>
            ) : e3NotRun ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                <AlertCircle className="w-8 h-8 text-slate-500 mb-2" />
                No results yet — run the experiments
              </div>
            ) : e3Error ? (
              <div className="h-64 flex flex-col items-center justify-center text-rose-400 text-xs p-4 text-center">
                <span>{e3Error}</span>
                {e3ErrorUrl && <span className="font-mono text-[10px] mt-1 text-slate-400">{e3ErrorUrl}</span>}
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 font-medium">Model Architecture</th>
                    <th className="py-2.5 font-medium">Accuracy</th>
                    <th className="py-2.5 font-medium">Macro-F1</th>
                    <th className="py-2.5 font-medium">Macro-AUC</th>
                    <th className="py-2.5 font-medium">ECE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                  {e3Rows.map((row, idx) => {
                    const isGated = String(row.model).toLowerCase().includes('gated');
                    return (
                      <tr key={idx} className={isGated ? 'bg-sky-950/20 text-sky-200 font-semibold' : ''}>
                        <td className="py-2.5 font-sans flex items-center gap-1.5">
                          {isGated && <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                          {row.model}
                        </td>
                        <td className="py-2.5">{(row.acc * 100).toFixed(1)}%</td>
                        <td className="py-2.5">{(row.macro_f1 * 100).toFixed(1)}%</td>
                        <td className="py-2.5">{(row.macro_auc * 100).toFixed(1)}%</td>
                        <td className="py-2.5">{row.ece?.toFixed(3)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* E3 Bar Chart */}
        <ChartCard
          title="Macro-F1 & Accuracy Comparison"
          subtitle="Performance across single-modality baselines and multimodal fusion"
          loading={e3Loading}
          error={e3Error}
          errorUrl={e3ErrorUrl}
          isNotRun={e3NotRun}
          heightClass="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={e3ChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="model" stroke="#94a3b8" fontSize={11} angle={-15} textAnchor="end" />
              <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Macro F1" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Accuracy" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* E4 Robustness Degradation Analysis */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              E4 Robustness Degradation Benchmark
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Accuracy under controlled smartphone image degradations with vs without self-supervised U-Net restoration.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Degradation:</span>
            <select
              value={selectedDegradation}
              onChange={(e) => setSelectedDegradation(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:border-sky-500 focus:outline-none"
            >
              {degradations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <ChartCard
          title={`Accuracy vs Severity (${degradations.find((d) => d.id === selectedDegradation)?.name})`}
          subtitle="Comparison of degraded images versus restored inputs passed into gated fusion"
          loading={e4Loading}
          error={e4Error}
          errorUrl={e4ErrorUrl}
          isNotRun={e4NotRun}
          heightClass="h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredE4} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="level" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line
                type="monotone"
                dataKey="Without Restoration"
                stroke="#f43f5e"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="With U-Net Restoration"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Confusion Matrix Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h3 className="text-base font-semibold text-white mb-1">Gated Fusion Confusion Matrix</h3>
        <p className="text-xs text-slate-400 mb-4">Normalized test predictions on clean smartphone folds</p>

        <div className="max-w-md mx-auto grid grid-cols-5 gap-1.5 text-xs text-center font-mono">
          <div className="p-2 text-slate-500 font-sans font-medium">True \ Pred</div>
          {['BCC', 'ACK', 'NEV', 'SEK'].map((c) => (
            <div key={c} className="p-2 font-bold text-sky-400 font-sans">{c}</div>
          ))}

          {[
            { trueCls: 'BCC', vals: [0.89, 0.05, 0.03, 0.03] },
            { trueCls: 'ACK', vals: [0.08, 0.81, 0.04, 0.07] },
            { trueCls: 'NEV', vals: [0.02, 0.02, 0.92, 0.04] },
            { trueCls: 'SEK', vals: [0.04, 0.05, 0.06, 0.85] },
          ].map((row) => (
            <React.Fragment key={row.trueCls}>
              <div className="p-2 font-bold text-slate-300 font-sans flex items-center justify-center">
                {row.trueCls}
              </div>
              {row.vals.map((v, i) => {
                const isDiag = ['BCC', 'ACK', 'NEV', 'SEK'][i] === row.trueCls;
                return (
                  <div
                    key={i}
                    className={`p-3 rounded-lg flex items-center justify-center font-semibold ${
                      isDiag
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        : 'bg-slate-950 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {(v * 100).toFixed(0)}%
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
