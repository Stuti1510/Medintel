import React from 'react';

interface SectionHeaderProps {
  label?: string;
  micro?: string;
  title: string;
  subtitle?: string;
  lead?: string;
  className?: string;
  rightAction?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  label,
  micro,
  title,
  subtitle,
  lead,
  className = '',
  rightAction,
}) => {
  const displayLabel = label || micro;
  const displaySubtitle = subtitle || lead;

  return (
    <div className={`pb-6 border-b border-hairline ${className}`}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          {displayLabel && (
            <span className="font-micro text-ink-faint block">
              {displayLabel}
            </span>
          )}
          <h1 className="font-section text-ink">
            {title}
          </h1>
          {displaySubtitle && (
            <p className="font-lead text-ink-muted max-w-3xl pt-1">
              {displaySubtitle}
            </p>
          )}
        </div>
        {rightAction && <div className="shrink-0">{rightAction}</div>}
      </div>
    </div>
  );
};
