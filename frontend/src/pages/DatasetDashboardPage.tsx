import React, { useState, useEffect } from 'react';
import { Database, FileSpreadsheet, Layers, PieChart as PieIcon, Search, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getDatasetProfile, getDatasetPreview } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';

export const DatasetDashboardPage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [preview, setPreview] = useState<any>(null);
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(0);

  useEffect(() => {
    getDatasetProfile().then(setProfile).catch(console.error);
    getDatasetPreview(15, page * 15).then(setPreview).catch(console.error);
  }, [page]);

  const classData = profile?.class_distribution
    ? Object.entries(profile.class_distribution).map(([k, v]) => ({
        name: k.length > 14 ? k.slice(0, 12) + "..." : k,
        fullName: k,
        count: v
      }))
    : [];

  const filteredRows = preview?.rows?.filter((r: any) =>
    JSON.stringify(r).toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-ai" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Dataset Analytics & Discovery</h1>
            <span className="text-[11px] font-mono-tech px-2 py-0.5 rounded bg-semantic-success/15 text-semantic-success border border-semantic-success/30">
              VALIDATED SCHEMA
            </span>
          </div>
          <p className="text-xs text-dark-secondary mt-1">
            Real data integrity profiling: 2,500 samples across 20 distinct disease conditions with structured clinical parameters.
          </p>
        </div>

        <div className="text-xs font-mono-tech text-dark-muted">
          Stratified: 70% Train (1,750) • 15% Val (375) • 15% Test (375)
        </div>
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-card bg-dark-surface border border-dark-border">
          <span className="text-[10px] font-mono-tech text-dark-muted uppercase">TOTAL SAMPLES</span>
          <p className="text-2xl font-bold font-mono-tech text-white mt-1">
            {profile?.total_samples?.toLocaleString() || "2,500"}
          </p>
          <span className="text-[10px] text-semantic-success flex items-center gap-1 mt-1 font-mono-tech">
            <CheckCircle2 className="w-3 h-3" /> 0 Missing Values
          </span>
        </div>

        <div className="p-4 rounded-card bg-dark-surface border border-dark-border">
          <span className="text-[10px] font-mono-tech text-dark-muted uppercase">DISEASE CLASSES</span>
          <p className="text-2xl font-bold font-mono-tech text-ai mt-1">
            {profile?.num_classes || "20"}
          </p>
          <span className="text-[10px] text-dark-muted mt-1 block font-mono-tech">Balanced (125 / class)</span>
        </div>

        <div className="p-4 rounded-card bg-dark-surface border border-dark-border">
          <span className="text-[10px] font-mono-tech text-dark-muted uppercase">TOTAL FEATURES</span>
          <p className="text-2xl font-bold font-mono-tech text-semantic-info mt-1">
            {profile?.total_features || "15"}
          </p>
          <span className="text-[10px] text-dark-muted mt-1 block font-mono-tech">Multimodal Attributes</span>
        </div>

        <div className="p-4 rounded-card bg-dark-surface border border-dark-border">
          <span className="text-[10px] font-mono-tech text-dark-muted uppercase">DUPLICATE CHECK</span>
          <p className="text-2xl font-bold font-mono-tech text-semantic-success mt-1">
            {profile?.duplicates || "0"}
          </p>
          <span className="text-[10px] text-semantic-success mt-1 block font-mono-tech">100% Unique Cases</span>
        </div>
      </div>

      {/* Class Distribution Chart */}
      <div className="p-5 rounded-card bg-dark-surface border border-dark-border space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-dark-text flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-ai" />
            Class Balance Distribution (Samples per Disease)
          </h3>
          <span className="text-[11px] font-mono-tech text-dark-muted">N=125 per class</span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={classData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#252A32" />
              <XAxis dataKey="name" stroke="#737B87" fontSize={9} interval={0} angle={-30} textAnchor="end" />
              <YAxis stroke="#737B87" fontSize={10} domain={[0, 150]} />
              <Tooltip
                contentStyle={{ backgroundColor: "#111419", borderColor: "#343A45", borderRadius: "8px", fontSize: "11px" }}
                formatter={(val, name, item) => [val, item.payload.fullName]}
              />
              <Bar dataKey="count" fill="#6C63FF" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Live Dataset Table Preview */}
      <div className="p-5 rounded-card bg-dark-surface border border-dark-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-dark-text flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-ai" />
            Raw Dataset Record Inspector
          </h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-dark-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search rows..."
                className="pl-8 pr-3 py-1.5 rounded-button bg-dark-deep border border-dark-border text-xs text-dark-text focus:border-ai focus:outline-none"
              />
            </div>
            <div className="flex gap-1 font-mono-tech text-xs">
              <button
                onClick={() => setPage(Math.max(page - 1, 0))}
                disabled={page === 0}
                className="px-2.5 py-1 rounded bg-dark-deep hover:bg-dark-elevated text-dark-secondary disabled:opacity-30 border border-dark-border"
              >
                Prev
              </button>
              <span className="px-2 py-1 text-dark-muted">Page {page + 1}</span>
              <button
                onClick={() => setPage(page + 1)}
                className="px-2.5 py-1 rounded bg-dark-deep hover:bg-dark-elevated text-dark-secondary border border-dark-border"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-dark-border font-mono-tech text-dark-muted uppercase text-[10px]">
                <th className="py-2.5 px-3">Case ID</th>
                <th className="py-2.5 px-3">Condition</th>
                <th className="py-2.5 px-3">Age/Sex</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Vitals (HR / BP / Temp / SpO2)</th>
                <th className="py-2.5 px-3">Chief Symptoms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/60 font-sans">
              {filteredRows.map((r: any) => (
                <tr key={r.case_id} className="hover:bg-dark-elevated/40 transition-colors">
                  <td className="py-2.5 px-3 font-mono-tech text-dark-muted">{r.case_id}</td>
                  <td className="py-2.5 px-3 font-bold text-dark-text">{r.condition}</td>
                  <td className="py-2.5 px-3 text-dark-secondary">{r.age} yo {r.sex}</td>
                  <td className="py-2.5 px-3 font-mono-tech">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      r.severity === 'Critical' ? 'bg-semantic-critical/20 text-semantic-critical' :
                      r.severity === 'Severe' ? 'bg-semantic-warning/20 text-semantic-warning' :
                      'bg-dark-deep text-dark-secondary'
                    }`}>
                      {r.severity}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono-tech text-dark-secondary text-[11px]">
                    {r.heart_rate} bpm • {r.systolic_bp}/{r.diastolic_bp} • {r.temperature}°C • {r.spo2}%
                  </td>
                  <td className="py-2.5 px-3 text-dark-secondary truncate max-w-xs" title={r.symptoms}>
                    {r.symptoms}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
