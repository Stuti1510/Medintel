import React, { useState } from 'react';
import { EmptyState } from '../EmptyState';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  microLabel?: string;
  loading?: boolean;
  error?: string | null;
  errorUrl?: string | null;
  isNotRun?: boolean;
  notRunMessage?: string;
  heightClass?: string;
  headerAction?: React.ReactNode;
  tableAlternative?: React.ReactNode;
  children: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  microLabel,
  loading = false,
  error = null,
  errorUrl = null,
  isNotRun = false,
  notRunMessage = 'No results yet — run the experiments',
  heightClass = 'h-72',
  headerAction,
  tableAlternative,
  children,
}) => {
  const [showTable, setShowTable] = useState(false);

  return (
    <div className="bg-white border border-hairline rounded-[12px] p-6 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 pb-3 border-b border-hairline">
        <div className="space-y-1">
          {microLabel && (
            <span className="font-micro text-ink-faint block">{microLabel}</span>
          )}
          <h3 className="font-card text-ink">{title}</h3>
          {subtitle && <p className="font-caption text-ink-muted">{subtitle}</p>}
        </div>
        {headerAction && <div className="ml-4">{headerAction}</div>}
      </div>

      {/* Main Content Area */}
      <div className={`w-full min-h-[240px] ${heightClass} relative flex items-center justify-center`}>
        {loading ? (
          <div className="w-full space-y-3 p-4">
            <div className="h-4 bg-hairline/60 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-hairline/50 rounded animate-pulse w-5/6" />
            <div className="h-4 bg-hairline/40 rounded animate-pulse w-2/3" />
            <div className="h-4 bg-hairline/30 rounded animate-pulse w-4/5" />
          </div>
        ) : error ? (
          <div className="w-full p-6 text-center bg-paper border border-hairline rounded-[8px]">
            <span className="font-micro text-status-error block mb-1">DATA FETCH ERROR</span>
            <p className="font-body text-sm text-ink mb-2">{error}</p>
            {errorUrl && (
              <p className="font-mono text-xs text-ink-faint bg-white px-2.5 py-1 rounded border border-hairline inline-block break-all">
                {errorUrl}
              </p>
            )}
          </div>
        ) : isNotRun ? (
          <EmptyState
            label="EXPERIMENT NOT RUN"
            message={notRunMessage}
          />
        ) : showTable && tableAlternative ? (
          <div className="w-full h-full overflow-auto">
            {tableAlternative}
          </div>
        ) : (
          <div className="w-full h-full" role="img" aria-label={title}>
            {children}
          </div>
        )}
      </div>

      {/* Footer / Accessibility link */}
      {tableAlternative && !loading && !error && !isNotRun && (
        <div className="pt-3 mt-2 border-t border-hairline text-right">
          <button
            onClick={() => setShowTable(!showTable)}
            className="font-caption text-xs text-ink-muted hover:text-ink underline transition-colors"
          >
            {showTable ? 'View as chart' : 'View as table'}
          </button>
        </div>
      )}
    </div>
  );
};
