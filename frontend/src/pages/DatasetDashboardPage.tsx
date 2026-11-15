import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ChartCard } from '../components/charts/ChartCard';
import { getDatasetSummary, API_BASE_URL } from '../services/api';
import { DatasetSummaryResponse } from '../types';
import { Database, Users, Image as ImageIcon, Layers, Filter } from 'lucide-react';

export const DatasetDashboardPage: React.FC = () => {
  const [data, setData] = useState<DatasetSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorUrl, setErrorUrl] = useState<string | null>(null);
  const [isNotRun, setIsNotRun] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await getDatasetSummary();
        if (res.status === 'not_run') {
          setIsNotRun(true);
        } else if (res.status === 'success') {
          setData(res);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch dataset summary');
        setErrorUrl(err?.url || `${API_BASE_URL}/dataset/summary`);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const classColors: Record<string, string> = {
    BCC: '#38bdf8', // sky-400
    ACK: '#f59e0b', // amber-500
    NEV: '#10b981', // emerald-500
    SEK: '#8b5cf6', // purple-500
  };

  const classBarData = React.useMemo(() => {
    if (!data?.classes) return [];
    return Object.entries(data.classes).map(([cls, count]) => ({
      name: cls,
      count,
      fill: classColors[cls] || '#38bdf8',
    }));
  }, [data]);

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-sky-400" />
            PAD-UFES-20 Dataset Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real smartphone dermatology dataset collected at Federal University of Espírito Santo (4 target classes).
          </p>
        </div>
        <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300">
          Split Protocol: <span className="font-semibold text-emerald-400">5-Fold Patient-Grouped (Zero Leakage)</span>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <ImageIcon className="w-4 h-4 text-sky-400" />
            Total Paired Samples
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {data?.total_samples?.toLocaleString() || (loading ? '...' : '0')}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Images + clinical narratives</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Users className="w-4 h-4 text-emerald-400" />
            Unique Patients
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {data?.num_patients?.toLocaleString() || (loading ? '...' : '0')}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Grouped strictly by patient_id</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Filter className="w-4 h-4 text-amber-400" />
            Target Classes
          </div>
          <div className="text-2xl font-bold text-white font-mono">4</div>
          <p className="text-[11px] text-slate-500 mt-0.5">BCC, ACK, NEV, SEK (MEL/SCC excluded)</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Layers className="w-4 h-4 text-purple-400" />
            Cross-Validation
          </div>
          <div className="text-2xl font-bold text-white font-mono">5 Folds</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Patient-level grouped splits</p>
        </div>
      </div>

      {/* Class & Fold Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Class Distribution Bar Chart */}
        <ChartCard
          title="Class Distribution"
          subtitle="Number of paired smartphone image-clinical samples per class"
          loading={loading}
          error={error}
          errorUrl={errorUrl}
          isNotRun={isNotRun}
          heightClass="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={classBarData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {classBarData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Stacked Folds Distribution */}
        <ChartCard
          title="Patient-Grouped Fold Distribution"
          subtitle="Class composition across 5 folds with zero patient overlap"
          loading={loading}
          error={error}
          errorUrl={errorUrl}
          isNotRun={isNotRun}
          heightClass="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.folds || []} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="fold" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />
              <Bar dataKey="BCC" stackId="a" fill="#38bdf8" />
              <Bar dataKey="ACK" stackId="a" fill="#f59e0b" />
              <Bar dataKey="NEV" stackId="a" fill="#10b981" />
              <Bar dataKey="SEK" stackId="a" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Quality Histograms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sharpness (Laplacian) */}
        <ChartCard
          title="Image Sharpness Distribution (Laplacian Variance)"
          subtitle="Variance of Laplacian showing prevalence of blurred smartphone images"
          loading={loading}
          error={error}
          errorUrl={errorUrl}
          isNotRun={isNotRun}
          heightClass="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.sharpness_histogram || []} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="bin" stroke="#94a3b8" fontSize={10} angle={-25} textAnchor="end" />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Brightness (LAB L) */}
        <ChartCard
          title="Image Brightness Distribution (LAB L Channel)"
          subtitle="Mean lightness distribution highlighting underexposed clinical photos"
          loading={loading}
          error={error}
          errorUrl={errorUrl}
          isNotRun={isNotRun}
          heightClass="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.brightness_histogram || []} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="bin" stroke="#94a3b8" fontSize={10} angle={-25} textAnchor="end" />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};
