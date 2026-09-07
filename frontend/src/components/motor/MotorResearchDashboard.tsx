/**
 * MEDINTEL AI — Motor & Behavioral Screening Research Dashboard
 * Aggregate distribution analytics, registry session explorer, raw telemetry inspector,
 * and multi-format CSV/JSON scientific data export.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Timer,
  Hand,
  Database,
  Download,
  FileSpreadsheet,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  Laptop,
  Eye,
  X,
  Search,
  Sliders,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { getMotorScreeningStats, getMotorScreeningSessions, getMotorScreeningSessionDetails } from '../../services/motorApi';
import { exportSessionAsJson, exportTrialsAsCsv, exportSessionsSummaryAsCsv } from '../../utils/motorExport';

export const MotorResearchDashboard: React.FC = () => {
  const [stats, setStats] = useState<any | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [qualityFilter, setQualityFilter] = useState<string>('ALL');

  // Selected Session for Telemetry Inspection Modal
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [inspectingSession, setInspectingSession] = useState<any | null>(null);
  const [loadingInspection, setLoadingInspection] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, sessionsData] = await Promise.all([
        getMotorScreeningStats().catch(() => null),
        getMotorScreeningSessions(50, 0).catch(() => [])
      ]);
      setStats(statsData);
      setSessions(sessionsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch motor screening registry data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleInspectSession = async (sessionId: number) => {
    setSelectedSessionId(sessionId);
    setLoadingInspection(true);
    try {
      const details = await getMotorScreeningSessionDetails(sessionId);
      setInspectingSession(details);
    } catch (err: any) {
      alert(`Could not load session details: ${err.message}`);
    } finally {
      setLoadingInspection(false);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      (s.session_token || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.device_tier || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesQuality = qualityFilter === 'ALL' || s.quality_grade === qualityFilter;
    return matchesSearch && matchesQuality;
  });

  // Recharts Data Mappings from recorded sessions
  const rtDistributionData = sessions
    .filter((s) => s.metrics?.rt_median_ms)
    .map((s, idx) => ({
      index: `#${s.id}`,
      token: s.session_token?.slice(0, 8),
      rtMedian: s.metrics.rt_median_ms,
      rtVar: s.metrics.rt_variability || 0,
      quality: s.quality_grade
    }));

  const msDistributionData = sessions
    .filter((s) => s.metrics?.ms_mean_deviation_px)
    .map((s, idx) => ({
      index: `#${s.id}`,
      token: s.session_token?.slice(0, 8),
      meanDev: s.metrics.ms_mean_deviation_px,
      pathEff: s.metrics.ms_path_efficiency_pct || 0,
      quality: s.quality_grade
    }));

  const ftDistributionData = sessions
    .filter((s) => s.metrics?.ft_taps_per_second)
    .map((s, idx) => ({
      index: `#${s.id}`,
      token: s.session_token?.slice(0, 8),
      tapRate: s.metrics.ft_taps_per_second,
      cvPct: s.metrics.ft_cv_pct || 0,
      quality: s.quality_grade
    }));

  return (
    <div className="space-y-8 animate-fadeIn text-[#292827]">
      {/* ------------------------------------------------------------- */}
      {/* 1. Header Banner & Registry Actions                           */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-[#e8e4dd] rounded-card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#73706d] bg-[#fafaf8] px-2 py-0.5 rounded border border-[#e8e4dd]">
              Registry Database
            </span>
            <span className="text-[10px] font-mono text-[#155555] bg-[#eef7f7] px-2 py-0.5 rounded border border-[#a3cfcf]/40">
              Biomedical Behavioral Triad
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-editorial text-[#292827] tracking-tight">
            Motor & Behavioral Screening Registry
          </h2>
          <p className="text-xs sm:text-sm text-[#73706d] max-w-2xl leading-relaxed">
            Longitudinal repository of high-precision browser reaction latencies, mouse-tracking deviations, and finger-tap isocadence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => exportSessionsSummaryAsCsv(sessions)}
            disabled={sessions.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#fafaf8] border border-[#e8e4dd] text-xs font-semibold text-[#292827] rounded-button transition-colors shadow-sm disabled:opacity-50"
            title="Download full registry summary as CSV for Python / R"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#155555]" />
            <span>Export Registry CSV</span>
          </button>

          <button
            onClick={fetchDashboardData}
            className="p-2 bg-white hover:bg-[#fafaf8] border border-[#e8e4dd] text-[#73706d] hover:text-[#292827] rounded-button transition-colors"
            title="Refresh database records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/motor-screening"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1b1938] hover:bg-[#0e0c1f] text-white text-xs font-semibold rounded-button transition-all shadow-sm"
          >
            <span>Launch Screening Suite</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. Registry Metric Cards                                      */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-[#e8e4dd] rounded-card space-y-2">
          <div className="flex items-center justify-between text-[#73706d]">
            <span className="text-xs font-mono uppercase tracking-wider">Total Sessions</span>
            <Database className="w-4 h-4 text-[#155555]" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-[#1b1938]">
            {stats?.total_sessions ?? sessions.length}
          </p>
          <span className="text-[11px] text-[#73706d] block">
            {stats?.total_trials ? `${stats.total_trials} measured trials` : 'Persistent battery runs'}
          </span>
        </div>

        <div className="p-5 bg-white border border-[#e8e4dd] rounded-card space-y-2">
          <div className="flex items-center justify-between text-[#73706d]">
            <span className="text-xs font-mono uppercase tracking-wider">Avg Reaction Time</span>
            <Timer className="w-4 h-4 text-[#155555]" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-[#292827]">
            {stats?.avg_reaction_time_ms ? `${Math.round(stats.avg_reaction_time_ms)} ms` : '—'}
          </p>
          <span className="text-[11px] text-[#73706d] block">
            Median latency benchmark
          </span>
        </div>

        <div className="p-5 bg-white border border-[#e8e4dd] rounded-card space-y-2">
          <div className="flex items-center justify-between text-[#73706d]">
            <span className="text-xs font-mono uppercase tracking-wider">Avg Path Efficiency</span>
            <Activity className="w-4 h-4 text-[#155555]" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-[#292827]">
            {stats?.avg_path_efficiency_pct ? `${stats.avg_path_efficiency_pct.toFixed(1)}%` : '—'}
          </p>
          <span className="text-[11px] text-[#73706d] block">
            Ideal vs actual length ratio
          </span>
        </div>

        <div className="p-5 bg-white border border-[#e8e4dd] rounded-card space-y-2">
          <div className="flex items-center justify-between text-[#73706d]">
            <span className="text-xs font-mono uppercase tracking-wider">Avg Tapping Rate</span>
            <Hand className="w-4 h-4 text-[#155555]" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-[#292827]">
            {stats?.avg_tapping_rate_hz ? `${stats.avg_tapping_rate_hz.toFixed(2)} Hz` : '—'}
          </p>
          <span className="text-[11px] text-[#73706d] block">
            Cadence frequency
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. Distribution Visualizers                                   */}
      {/* ------------------------------------------------------------- */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: RT Latency Distribution */}
          <div className="bg-white border border-[#e8e4dd] rounded-card p-5 space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#73706d]">Instrument 01 Distribution</span>
              <h4 className="text-sm font-bold text-[#292827]">Reaction Time Latencies (ms)</h4>
            </div>

            <div className="h-44 w-full">
              {rtDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rtDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f0ec" vertical={false} />
                    <XAxis dataKey="token" tick={{ fontSize: 9, fill: '#73706d' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#73706d' }} domain={[100, 'auto']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1b1938', color: '#fff', borderRadius: '6px', fontSize: '11px' }}
                      formatter={(val: any) => [`${val} ms`, 'Median RT']}
                    />
                    <Bar dataKey="rtMedian" fill="#1b1938" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#73706d] bg-[#fafaf8] rounded">
                  No Reaction-Time sessions recorded yet.
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Motor Stability Mean Deviation */}
          <div className="bg-white border border-[#e8e4dd] rounded-card p-5 space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#73706d]">Instrument 02 Distribution</span>
              <h4 className="text-sm font-bold text-[#292827]">Tracking Deviation (px)</h4>
            </div>

            <div className="h-44 w-full">
              {msDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={msDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f0ec" vertical={false} />
                    <XAxis dataKey="token" tick={{ fontSize: 9, fill: '#73706d' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#73706d' }} domain={[0, 'auto']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#155555', color: '#fff', borderRadius: '6px', fontSize: '11px' }}
                      formatter={(val: any) => [`${val} px`, 'Mean Deviation']}
                    />
                    <Bar dataKey="meanDev" fill="#155555" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#73706d] bg-[#fafaf8] rounded">
                  No Motor Stability sessions recorded yet.
                </div>
              )}
            </div>
          </div>

          {/* Chart 3: Finger-Tap Cadence (Hz) */}
          <div className="bg-white border border-[#e8e4dd] rounded-card p-5 space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#73706d]">Instrument 03 Distribution</span>
              <h4 className="text-sm font-bold text-[#292827]">Tapping Cadence (Hz)</h4>
            </div>

            <div className="h-44 w-full">
              {ftDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ftDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f0ec" vertical={false} />
                    <XAxis dataKey="token" tick={{ fontSize: 9, fill: '#73706d' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#73706d' }} domain={[0, 'auto']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#232047', color: '#fff', borderRadius: '6px', fontSize: '11px' }}
                      formatter={(val: any) => [`${val} Hz`, 'Tap Frequency']}
                    />
                    <Bar dataKey="tapRate" fill="#3f3a52" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#73706d] bg-[#fafaf8] rounded">
                  No Finger-Tap sessions recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. Session History Registry Table                             */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-[#e8e4dd] rounded-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e8e4dd] pb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#292827]">Recorded Behavioral Sessions</h3>
            <p className="text-xs text-[#73706d]">
              Audited sessions stored in the local SQLite/PostgreSQL experiment registry.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#73706d] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by token or device..."
                className="pl-8 pr-3 py-1.5 text-xs bg-[#fafaf8] border border-[#e8e4dd] rounded-button focus:outline-none focus:border-[#1b1938] w-48 sm:w-56 font-mono"
              />
            </div>

            <select
              value={qualityFilter}
              onChange={(e) => setQualityFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs bg-[#fafaf8] border border-[#e8e4dd] rounded-button focus:outline-none focus:border-[#1b1938] font-mono"
            >
              <option value="ALL">All Quality Grades</option>
              <option value="HIGH QUALITY">High Quality</option>
              <option value="ACCEPTABLE">Acceptable</option>
              <option value="LOW QUALITY">Low Quality</option>
            </select>
          </div>
        </div>

        {/* Table Container */}
        {loading ? (
          <div className="py-12 text-center text-xs text-[#73706d] space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#155555]" />
            <p>Loading motor screening registry records...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="py-12 text-center bg-[#fafaf8] rounded-card border border-[#e8e4dd] space-y-3 p-6">
            <Database className="w-8 h-8 mx-auto text-[#73706d]" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#292827]">No screening sessions recorded</p>
              <p className="text-xs text-[#73706d]">
                Run a screening protocol from the Motor Screening suite and save it to populate the registry.
              </p>
            </div>
            <Link
              to="/motor-screening"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1b1938] text-white text-xs font-semibold rounded-button hover:bg-[#0e0c1f] transition-colors"
            >
              <span>Begin First Session</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#e8e4dd] text-[10px] font-mono uppercase text-[#73706d] bg-[#fafaf8]">
                  <th className="py-3 px-3">Session Token</th>
                  <th className="py-3 px-3">Recorded At</th>
                  <th className="py-3 px-3">Device Tier</th>
                  <th className="py-3 px-3">Quality</th>
                  <th className="py-3 px-3">RT (Median)</th>
                  <th className="py-3 px-3">MS (Deviation)</th>
                  <th className="py-3 px-3">FT (Rate)</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f0ec]">
                {filteredSessions.map((s) => {
                  const m = s.metrics || {};
                  return (
                    <tr key={s.id} className="hover:bg-[#fafaf8] transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-[#1b1938]">
                        {s.session_token}
                      </td>
                      <td className="py-3 px-3 text-[#73706d] font-mono text-[11px]">
                        {s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-3 text-[#292827]">
                        {s.device_tier || 'Desktop'}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded font-mono text-[10px] font-semibold ${
                          s.quality_grade === 'HIGH QUALITY'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : s.quality_grade === 'ACCEPTABLE'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {s.quality_grade || 'INSUFFICIENT'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[#292827]">
                        {m.rt_median_ms ? `${m.rt_median_ms} ms` : '—'}
                      </td>
                      <td className="py-3 px-3 font-mono text-[#292827]">
                        {m.ms_mean_deviation_px ? `${m.ms_mean_deviation_px} px` : '—'}
                      </td>
                      <td className="py-3 px-3 font-mono text-[#292827]">
                        {m.ft_taps_per_second ? `${m.ft_taps_per_second} Hz` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleInspectSession(s.id)}
                            className="p-1.5 hover:bg-[#e8e4dd]/60 text-[#73706d] hover:text-[#292827] rounded transition-colors"
                            title="Inspect Raw Telemetry"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. Telemetry Inspection Modal                                 */}
      {/* ------------------------------------------------------------- */}
      {selectedSessionId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-[#e8e4dd] rounded-card shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-[#292827]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#e8e4dd] bg-[#fafaf8]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-button bg-[#1b1938] text-white flex items-center justify-center font-mono text-xs">
                  #{selectedSessionId}
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#73706d]">
                    Raw Measurement Telemetry
                  </span>
                  <h3 className="text-base font-bold text-[#292827]">
                    Session: {inspectingSession?.session_token || `#${selectedSessionId}`}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedSessionId(null);
                  setInspectingSession(null);
                }}
                className="p-2 rounded-md hover:bg-[#e8e4dd]/50 text-[#73706d] hover:text-[#292827] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {loadingInspection ? (
                <div className="py-16 text-center text-xs text-[#73706d] space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#155555]" />
                  <p>Fetching trial coordinates from database...</p>
                </div>
              ) : inspectingSession ? (
                <div className="space-y-6">
                  {/* Summary Metric Header */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#fafaf8] p-3.5 rounded-button border border-[#e8e4dd]">
                    <div>
                      <span className="text-[10px] font-mono text-[#9a9794] uppercase block">Device Tier</span>
                      <span className="font-semibold text-[#292827]">{inspectingSession.device_tier || 'Desktop'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#9a9794] uppercase block">Quality Grade</span>
                      <span className="font-mono font-bold text-[#155555]">{inspectingSession.quality_grade}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#9a9794] uppercase block">Total Trials</span>
                      <span className="font-mono text-[#292827]">{inspectingSession.trials?.length || 0} recorded</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#9a9794] uppercase block">Coordinates</span>
                      <span className="font-mono text-[#292827]">
                        {inspectingSession.trials?.reduce((acc: number, t: any) => acc + (t.raw_coordinates?.length || 0), 0)} points
                      </span>
                    </div>
                  </div>

                  {/* Trials Table */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm text-[#292827]">Recorded Trial Streams</h4>
                    <div className="border border-[#e8e4dd] rounded-card overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-[#fafaf8] text-[10px] font-mono uppercase text-[#73706d] border-b border-[#e8e4dd]">
                            <th className="py-2.5 px-3">Trial #</th>
                            <th className="py-2.5 px-3">Instrument</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">ISI / Path</th>
                            <th className="py-2.5 px-3">Latency / Dev</th>
                            <th className="py-2.5 px-3 text-right">Coordinates</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f1f0ec]">
                          {inspectingSession.trials?.map((tr: any) => (
                            <tr key={tr.id} className="hover:bg-[#fafaf8]">
                              <td className="py-2.5 px-3 font-mono">{tr.trial_number}</td>
                              <td className="py-2.5 px-3 font-mono text-[11px] text-[#155555]">{tr.instrument_type}</td>
                              <td className="py-2.5 px-3">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                                  tr.status === 'VALID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {tr.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px] text-[#73706d]">
                                {tr.isi_ms ? `${tr.isi_ms}ms ISI` : tr.path_id || '—'}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-semibold text-[#292827]">
                                {tr.response_time_ms ? `${tr.response_time_ms} ms` : tr.mean_deviation_px ? `${tr.mean_deviation_px} px` : '—'}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-right text-[#73706d]">
                                {tr.raw_coordinates?.length || 0} pts
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-[#e8e4dd] bg-[#fafaf8]">
              <div className="text-[11px] text-[#73706d] font-mono">
                MEDINTEL Non-Diagnostic Behavioral Telemetry
              </div>
              <button
                onClick={() => {
                  setSelectedSessionId(null);
                  setInspectingSession(null);
                }}
                className="px-4 py-2 bg-[#1b1938] text-white text-xs font-semibold rounded-button hover:bg-[#0e0c1f] transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
