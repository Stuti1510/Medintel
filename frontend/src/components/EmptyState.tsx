import React from 'react';

interface EmptyStateProps {
  label?: string;
  message: string;
  errorUrl?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  label = 'NO DATA AVAILABLE',
  message,
  errorUrl,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`p-10 text-center border border-dashed border-hairline rounded-[8px] bg-paper ${className}`}
    >
      <span className="font-micro text-ink-faint block mb-2">
        {label}
      </span>
      <p className="font-caption text-ink-muted max-w-md mx-auto">
        {message}
      </p>
      {errorUrl && (
        <span className="font-mono text-[11px] text-ink-faint block mt-2 break-all">
          Failed request: {errorUrl}
        </span>
      )}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 font-button text-xs text-indigo underline hover:text-ink transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
