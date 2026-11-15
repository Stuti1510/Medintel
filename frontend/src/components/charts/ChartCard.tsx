import React from 'react';
import { AlertCircle, FileQuestion, Loader2 } from 'lucide-react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  loading?: boolean;
  error?: string | null;
  errorUrl?: string | null;
  isNotRun?: boolean;
  notRunMessage?: string;
  heightClass?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  loading = false,
  error = null,
  errorUrl = null,
  isNotRun = false,
  notRunMessage = 'No results yet — run the experiments',
  heightClass = 'h-80',
  headerAction,
  children,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {headerAction && <div className="ml-4">{headerAction}</div>}
      </div>

      <div className={`w-full min-h-[260px] ${heightClass} relative flex items-center justify-center`}>
        {loading ? (
          <div className="flex flex-col items-center justify-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
            <p className="text-xs">Loading benchmark data...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-6 text-center max-w-md bg-rose-950/20 border border-rose-900/50 rounded-lg">
            <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
            <p className="text-sm font-medium text-rose-300">Data Fetch Error</p>
            <p className="text-xs text-rose-400/80 mt-1">{error}</p>
            {errorUrl && (
              <p className="text-[11px] font-mono text-slate-400 mt-2 bg-slate-950 px-2 py-1 rounded border border-slate-800 break-all">
                URL: {errorUrl}
              </p>
            )}
          </div>
        ) : isNotRun ? (
          <div className="flex flex-col items-center justify-center p-6 text-center max-w-md bg-slate-950/40 border border-dashed border-slate-800 rounded-lg">
            <FileQuestion className="w-8 h-8 text-slate-500 mb-2" />
            <p className="text-sm font-medium text-slate-300">{notRunMessage}</p>
            <p className="text-xs text-slate-500 mt-1">
              Run <code className="text-sky-400 font-mono">python scripts/run_experiments.py</code> to generate benchmark CSVs.
            </p>
          </div>
        ) : (
          <div className="w-full h-full">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};
