import React, { useState, useEffect, useMemo } from 'react';
import {
  Database, Search, ShieldCheck, Activity, Heart, Stethoscope, FileText,
  SlidersHorizontal, ChevronDown, Check, ArrowRight, Info, Scale, BarChart2
} from 'lucide-react';
import { getDatasetProfile, getDatasetPreview } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { TealClosingCTA } from '../components/TealClosingCTA';

interface DatasetTab {
  id: string;
  name: string;
  shortName: string;
  category: string;
  classesCount: string;
  icon: any;
}

const DATASET_TABS: DatasetTab[] = [
  { id: 'all', name: 'All Datasets (MEDINTEL Balanced Master Scope)', shortName: 'All Datasets', category: '249,947 Active Records • 4 Datasets', classesCount: '821 Unique Diseases', icon: Database },
  { id: 'cardio_train', name: 'Cardiovascular Risk Benchmark', shortName: 'Cardiovascular Risk', category: '2,400 Active Records • Tabular Biometrics', classesCount: '2 Binary Risk Classes', icon: Activity },
  { id: 'heart_disease', name: 'Coronary Heart Disease Diagnostic', shortName: 'Coronary Heart Disease', category: '302 Active Records • Diagnostic Ischemia', classesCount: '2 Diagnostic Classes', icon: Heart },
  { id: 'disease_profile', name: 'Disease & Patient Profile Benchmark', shortName: 'Disease & Symptom Profile', category: '300 Active Records • Multi-Condition Diagnosis', classesCount: '116 Disease Diagnoses', icon: Stethoscope },
  { id: 'symptoms_augmented', name: 'Multi-Symptom Differential Matrix', shortName: 'Multi-Symptom Differential', category: '246,945 Active Records • 378 Symptom Matrix', classesCount: '773 Disease Classes', icon: FileText },
];

export const DatasetDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [profile, setProfile] = useState<any>(null);
  const [preview, setPreview] = useState<any>(null);
  const [search, setSearch] = useState<string>('');
  const [graphSearch, setGraphSearch] = useState<string>('');
  const [matrixSearch, setMatrixSearch] = useState<string>('');
  const [matrixPage, setMatrixPage] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [topN, setTopN] = useState<number>(15);
  const [distributionMode, setDistributionMode] = useState<'active' | 'train' | 'val' | 'test' | 'raw'>('active');
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch Dataset Profile
  useEffect(() => {
    setLoading(true);
    getDatasetProfile(activeTab)
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load dataset profile:", err);
        setLoading(false);
      });
  }, [activeTab]);

  // Fetch Dataset Preview Rows
  useEffect(() => {
    getDatasetPreview(15, page * 15, activeTab === 'all' ? 'cardio_train' : activeTab)
      .then(setPreview)
      .catch(console.error);
  }, [activeTab, page]);

  const meta = profile?.datasetMetadata || profile || {};
  const balancingMeta = profile?.balancing_metadata || {};

  // Extract raw classes list from backend
  const rawClassList: any[] = useMemo(() => {
    if (profile?.classes && Array.isArray(profile.classes)) {
      return profile.classes;
    }
    return [];
  }, [profile]);

  // Filter and compute chart data based on active distribution mode
  const filteredClassList = useMemo(() => {
    if (!graphSearch.trim()) return rawClassList;
    const q = graphSearch.toLowerCase().trim();
    return rawClassList.filter((item: any) => {
      const name = (item.standardized_label || item.original_label || '').toLowerCase();
      const meaning = (item.clinical_meaning || '').toLowerCase();
      return name.includes(q) || meaning.includes(q);
    });
  }, [rawClassList, graphSearch]);

  const chartData = useMemo(() => {
    const listToSlice = topN === 0 ? filteredClassList : filteredClassList.slice(0, topN);
    return listToSlice.map((item: any) => {
      const label = item.standardized_label || item.original_label || "Condition";
      const shortLabel = label.length > 34 ? label.substring(0, 32) + '...' : label;
      
      let count = item.active_records ?? item.count;
      let pct = item.percentage || 0;
      
      if (distributionMode === 'train') {
        count = item.train_count ?? Math.round(item.active_records * 0.70);
      } else if (distributionMode === 'val') {
        count = item.val_count ?? Math.round(item.active_records * 0.15);
      } else if (distributionMode === 'test') {
        count = item.test_count ?? Math.round(item.active_records * 0.15);
      } else if (distributionMode === 'raw') {
        count = item.raw_records ?? item.count;
      }

      return {
        name: shortLabel,
        fullName: label,
        count: count,
        rawCount: item.raw_records,
        activeCount: item.active_records ?? item.count,
        trainCount: item.train_count,
        valCount: item.val_count,
        testCount: item.test_count,
        removedCount: item.records_removed ?? 0,
        reductionPct: item.reduction_pct ?? 0,
        clinicalMeaning: item.clinical_meaning,
        sources: item.source_datasets ? item.source_datasets.join(', ') : (profile?.name || activeTab)
      };
    });
  }, [filteredClassList, topN, distributionMode, profile, activeTab]);

  // Filter cross-dataset matrix
  const crossMatrix: any[] = profile?.cross_dataset_matrix || [];
  const filteredMatrix = useMemo(() => {
    if (!matrixSearch.trim()) return crossMatrix;
    const q = matrixSearch.toLowerCase().trim();
    return crossMatrix.filter((row: any) => row.name.toLowerCase().includes(q));
  }, [crossMatrix, matrixSearch]);

  const matrixRowsPerPage = 12;
  const totalMatrixPages = Math.ceil(filteredMatrix.length / matrixRowsPerPage);
  const paginatedMatrix = filteredMatrix.slice(
    matrixPage * matrixRowsPerPage,
    (matrixPage + 1) * matrixRowsPerPage
  );

  const columns = preview?.columns || profile?.columns || [];
  const filteredRows = preview?.rows?.filter((r: any) =>
    JSON.stringify(r).toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-[#fafaf8] text-[#292827] flex flex-col">
      {/* ------------------------------------------------------------- */}
      {/* 1. Page Header                                                */}
      {/* ------------------------------------------------------------- */}
      <section className="w-full bg-white border-b border-[#e8e4dd] py-10 md:py-14">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-wider text-[#73706d] block">
                Clinical Data Provenance & Active Master Benchmark
              </span>
              <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#292827]">
                Datasets
              </h1>
              <p className="text-base text-[#73706d] max-w-2xl">
                Explore the active balanced master clinical dataset (249,947 active records across 821 diseases) with controlled pre-split majority class reduction.
              </p>
            </div>

            {/* Dropdown Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#73706d] hidden sm:inline">Dataset Scope:</span>
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] text-xs font-mono text-[#292827] focus:outline-none focus:border-[#1b1938]"
              >
                {DATASET_TABS.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dataset Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2">
            {DATASET_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    isActive
                      ? 'bg-[#f5f4f0] border-[#1b1938] text-[#1b1938] shadow-sm'
                      : 'bg-[#fafaf8] border-[#e8e4dd] text-[#73706d] hover:text-[#292827] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#1b1938]' : 'text-[#9a9794]'}`} />
                    <span className="text-xs font-semibold truncate">{tab.shortName}</span>
                  </div>
                  <div className="text-[10px] font-mono text-[#73706d] mt-1 truncate">
                    {tab.category}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. Main Content & Provenance Audit                            */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-10 flex-1">
        {/* Dataset Metadata Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-xl bg-white border border-[#e8e4dd]">
            <span className="text-[10px] font-mono uppercase text-[#73706d] block">Active Records</span>
            <p className="text-lg font-mono font-medium text-[#1b1938] mt-0.5">
              {profile?.total_samples?.toLocaleString() || "249,947"}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-[#e8e4dd]">
            <span className="text-[10px] font-mono uppercase text-[#73706d] block">Raw Source Records</span>
            <p className="text-lg font-mono font-medium text-[#73706d] mt-0.5">
              {profile?.raw_samples?.toLocaleString() || "318,319"}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-[#e8e4dd]">
            <span className="text-[10px] font-mono uppercase text-[#73706d] block">Target Classes</span>
            <p className="text-lg font-mono font-medium text-[#1b1938] mt-0.5">
              {profile?.num_classes || "821"}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-[#e8e4dd]">
            <span className="text-[10px] font-mono uppercase text-[#73706d] block">Missing Values</span>
            <p className="text-lg font-mono font-medium text-emerald-700 mt-0.5">
              0 (100% Clean)
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-[#e8e4dd]">
            <span className="text-[10px] font-mono uppercase text-[#73706d] block">Balancing Stage</span>
            <p className="text-lg font-mono font-medium text-[#1b1938] mt-0.5">
              Pre-Split Master ✓
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-[#e8e4dd]">
            <span className="text-[10px] font-mono uppercase text-[#73706d] block">Test Set (15%)</span>
            <p className="text-lg font-mono font-medium text-emerald-700 mt-0.5">
              Real & Untouched
            </p>
          </div>
        </div>

        {/* Balancing Strategy Audit Box */}
        <div className="p-6 rounded-xl bg-white border border-[#e8e4dd] space-y-3">
          <div className="flex items-center justify-between border-b border-[#e8e4dd] pb-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#1b1938]" />
              <h3 className="text-sm font-medium text-[#292827]">
                Active Balanced Master Dataset Strategy (Pre-Split Controlled Undersampling)
              </h3>
            </div>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-[#fafaf8] text-[#1b1938] border border-[#e8e4dd]">
              Reproducible Seed: 42
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] space-y-1">
              <span className="text-[#73706d] uppercase text-[10px] block font-semibold">Balancing Architecture</span>
              <p className="text-[#292827] font-medium">Dataset-Level Master Curation (Pre-Split)</p>
            </div>
            <div className="p-3 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] space-y-1">
              <span className="text-[#73706d] uppercase text-[10px] block font-semibold">Reduced Majority Classes</span>
              <p className="text-[#292827] font-medium">Normative Baseline & Cardiovascular Disease (CVD)</p>
            </div>
            <div className="p-3 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] space-y-1">
              <span className="text-[#73706d] uppercase text-[10px] block font-semibold">Active Record Target Range</span>
              <p className="text-[#1b1938] font-bold">~1,200 records / class (Directly Comparable)</p>
            </div>
          </div>

          <p className="text-[11px] text-[#73706d] leading-relaxed pt-1">
            <strong>Provenance & Integrity:</strong> Raw source files in <code className="bg-[#fafaf8] px-1 py-0.5 rounded border border-[#e8e4dd]">datasets/</code> remain completely untouched. The active balanced master dataset (<code className="bg-[#fafaf8] px-1 py-0.5 rounded border border-[#e8e4dd]">medintel_balanced_master.csv</code>) powers all modeling, splitting (70% Train / 15% Val / 15% Test), and inference across MEDINTEL AI.
          </p>
        </div>

        {/* Empirical Disease Class Distribution Chart */}
        <div className="p-6 rounded-xl bg-white border border-[#e8e4dd] space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e8e4dd] pb-4">
            <div>
              <h2 className="text-base font-medium text-[#292827]">
                Empirical Disease Class Distribution
              </h2>
              <p className="text-xs text-[#73706d] mt-0.5">
                Viewing <strong>{distributionMode === 'active' ? 'Active Master Dataset Distribution' : distributionMode === 'train' ? 'Training Split (70%)' : distributionMode === 'val' ? 'Validation Split (15%)' : distributionMode === 'test' ? 'Held-Out Test Split (15%)' : 'Raw Source Data Distribution'}</strong> ({chartData.length} classes displayed).
              </p>
            </div>

            {/* Controls: Mode Selector, Search & Scale */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#9a9794]" />
                <input
                  type="text"
                  value={graphSearch}
                  onChange={(e) => setGraphSearch(e.target.value)}
                  placeholder="Filter disease names..."
                  className="pl-8 pr-3 py-1.5 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] text-xs font-mono text-[#292827] focus:outline-none w-44"
                />
              </div>

              {/* Distribution Mode Selector */}
              <div className="flex items-center gap-1 border border-[#e8e4dd] rounded-lg p-0.5 bg-[#fafaf8]">
                <button
                  onClick={() => setDistributionMode('active')}
                  className={`px-2.5 py-1 text-[10px] font-mono rounded transition-all ${
                    distributionMode === 'active'
                      ? 'bg-[#1b1938] text-white font-semibold shadow-sm'
                      : 'text-[#73706d] hover:text-[#292827]'
                  }`}
                >
                  Active Records
                </button>
                <button
                  onClick={() => setDistributionMode('train')}
                  className={`px-2.5 py-1 text-[10px] font-mono rounded transition-all ${
                    distributionMode === 'train'
                      ? 'bg-[#1b1938] text-white font-semibold shadow-sm'
                      : 'text-[#73706d] hover:text-[#292827]'
                  }`}
                >
                  Train (70%)
                </button>
                <button
                  onClick={() => setDistributionMode('val')}
                  className={`px-2.5 py-1 text-[10px] font-mono rounded transition-all ${
                    distributionMode === 'val'
                      ? 'bg-[#1b1938] text-white font-semibold shadow-sm'
                      : 'text-[#73706d] hover:text-[#292827]'
                  }`}
                >
                  Val (15%)
                </button>
                <button
                  onClick={() => setDistributionMode('test')}
                  className={`px-2.5 py-1 text-[10px] font-mono rounded transition-all ${
                    distributionMode === 'test'
                      ? 'bg-[#1b1938] text-white font-semibold shadow-sm'
                      : 'text-[#73706d] hover:text-[#292827]'
                  }`}
                >
                  Test (15%)
                </button>
                <button
                  onClick={() => setDistributionMode('raw')}
                  className={`px-2.5 py-1 text-[10px] font-mono rounded transition-all ${
                    distributionMode === 'raw'
                      ? 'bg-[#1b1938] text-white font-semibold shadow-sm'
                      : 'text-[#73706d] hover:text-[#292827]'
                  }`}
                >
                  Raw Source
                </button>
              </div>

              {/* Scale Controls */}
              <div className="flex items-center gap-1 border border-[#e8e4dd] rounded-lg p-0.5 bg-[#fafaf8]">
                {[10, 15, 25, 50, 0].map((n) => (
                  <button
                    key={n}
                    onClick={() => setTopN(n)}
                    className={`px-2 py-1 text-[10px] font-mono rounded ${
                      topN === n
                        ? 'bg-[#1b1938] text-white font-semibold'
                        : 'text-[#73706d] hover:text-[#292827]'
                    }`}
                  >
                    {n === 0 ? 'All' : `Top ${n}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Horizontal Bar Chart */}
          <div className="h-[440px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e4dd" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#73706d" fontSize={10} fontStyle="mono" />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#292827"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#e8e4dd' }}
                  width={130}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="p-3 bg-[#1b1938] text-white rounded-lg shadow-lg text-xs font-mono space-y-1">
                          <p className="font-semibold text-[#c9b4fa]">{item.fullName}</p>
                          <p className="text-white">Active Master Records: {item.activeCount?.toLocaleString()}</p>
                          <p className="text-[#bcbac9]">Raw Source Records: {item.rawCount?.toLocaleString()}</p>
                          <div className="text-[10px] text-[#bcbac9] pt-1 border-t border-[#3f3a52] space-y-0.5">
                            <div>Train (70%): {item.trainCount?.toLocaleString()}</div>
                            <div>Val (15%): {item.valCount?.toLocaleString()}</div>
                            <div>Test (15%): {item.testCount?.toLocaleString()}</div>
                            {item.removedCount > 0 && (
                              <div className="text-amber-300">Reduced: -{item.removedCount?.toLocaleString()} ({item.reductionPct}%)</div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="#1b1938" radius={[0, 4, 4, 0]} barSize={16}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "#1b1938" : "#3f3a52"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Disease Class Registry Harmonization Table */}
        <div className="p-6 rounded-xl bg-white border border-[#e8e4dd] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e8e4dd] pb-4">
            <div>
              <h2 className="text-base font-medium text-[#292827]">
                Global Disease Class Registry & Harmonization Matrix
              </h2>
              <p className="text-xs text-[#73706d] mt-0.5">
                821 authentic clinical disease entities with full raw vs active master provenance ({filteredMatrix.length} matching).
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#9a9794]" />
              <input
                type="text"
                value={matrixSearch}
                onChange={(e) => {
                  setMatrixSearch(e.target.value);
                  setMatrixPage(0);
                }}
                placeholder="Search 821 diseases..."
                className="pl-8 pr-3 py-1.5 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] text-xs font-mono text-[#292827] focus:outline-none w-56"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#e8e4dd] text-[#73706d] uppercase text-[10px]">
                  <th className="py-2.5 px-3">Standardized Clinical Entity</th>
                  <th className="py-2.5 px-3 text-right">Raw Records</th>
                  <th className="py-2.5 px-3 text-right font-bold text-[#1b1938]">Active Records</th>
                  <th className="py-2.5 px-3 text-right">Train (70%)</th>
                  <th className="py-2.5 px-3 text-right">Val (15%)</th>
                  <th className="py-2.5 px-3 text-right">Test (15%)</th>
                  <th className="py-2.5 px-3 text-right">Source Datasets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f0ec]">
                {paginatedMatrix.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#fafaf8]">
                    <td className="py-3 px-3 text-[#292827] font-medium">{row.name}</td>
                    <td className="py-3 px-3 text-right text-[#73706d]">{row.raw?.toLocaleString() || "—"}</td>
                    <td className="py-3 px-3 text-right text-[#1b1938] font-bold">{row.active?.toLocaleString() || "—"}</td>
                    <td className="py-3 px-3 text-right text-[#73706d]">{row.train?.toLocaleString() || "—"}</td>
                    <td className="py-3 px-3 text-right text-[#73706d]">{row.val?.toLocaleString() || "—"}</td>
                    <td className="py-3 px-3 text-right text-emerald-800">{row.test?.toLocaleString() || "—"}</td>
                    <td className="py-3 px-3 text-right text-[#73706d]">{row.sources?.join(', ') || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Matrix Pagination */}
          <div className="flex items-center justify-between pt-2 border-t border-[#e8e4dd] text-xs font-mono text-[#73706d]">
            <span>Showing page {matrixPage + 1} of {Math.max(totalMatrixPages, 1)}</span>
            <div className="flex gap-1">
              <button
                disabled={matrixPage === 0}
                onClick={() => setMatrixPage((p) => Math.max(p - 1, 0))}
                className="px-3 py-1 rounded bg-[#fafaf8] border border-[#e8e4dd] text-[#73706d] hover:text-[#292827] disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={matrixPage >= totalMatrixPages - 1}
                onClick={() => setMatrixPage((p) => p + 1)}
                className="px-3 py-1 rounded bg-[#fafaf8] border border-[#e8e4dd] text-[#73706d] hover:text-[#292827] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Raw Dataset Record Inspector */}
        <div className="p-6 rounded-xl bg-white border border-[#e8e4dd] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e8e4dd] pb-4">
            <div>
              <h2 className="text-base font-medium text-[#292827]">
                Active Master Record Browser
              </h2>
              <p className="text-xs text-[#73706d] mt-0.5">
                Authentic tabular encounter records from the active {profile?.name || activeTab} cohort.
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#9a9794]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search active rows..."
                className="pl-8 pr-3 py-1.5 rounded-lg bg-[#fafaf8] border border-[#e8e4dd] text-xs font-mono text-[#292827] focus:outline-none w-56"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#e8e4dd] text-[#73706d] uppercase text-[10px]">
                  {columns.slice(0, 10).map((col: string) => (
                    <th key={col} className="py-2.5 px-3 whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f0ec]">
                {filteredRows.map((row: any, rIdx: number) => (
                  <tr key={rIdx} className="hover:bg-[#fafaf8]">
                    {columns.slice(0, 10).map((col: string) => (
                      <td key={col} className="py-2.5 px-3 text-[#292827] whitespace-nowrap">
                        {String(row[col] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Row Pagination */}
          <div className="flex items-center justify-between pt-2 border-t border-[#e8e4dd] text-xs font-mono text-[#73706d]">
            <span>Page {page + 1}</span>
            <div className="flex gap-1">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(p - 1, 0))}
                className="px-3 py-1 rounded bg-[#fafaf8] border border-[#e8e4dd] text-[#73706d] hover:text-[#292827] disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded bg-[#fafaf8] border border-[#e8e4dd] text-[#73706d] hover:text-[#292827]"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. Deep Teal Closing Resolution Section                       */}
      {/* ------------------------------------------------------------- */}
      <TealClosingCTA />
    </div>
  );
};

export default DatasetDashboardPage;
