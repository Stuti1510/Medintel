import React from 'react';

export interface TabOption {
  id: string;
  label: string;
  badge?: string | number;
}

interface PillTabsProps {
  tabs: TabOption[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const PillTabs: React.FC<PillTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`} role="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`font-caption text-xs px-3.5 py-1.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-violet focus:ring-offset-1 ${
              isActive
                ? 'bg-indigo text-white font-medium shadow-sm'
                : 'bg-paper text-ink-muted hover:text-ink hover:bg-hairline border border-hairline'
            }`}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                isActive ? 'bg-white/20 text-white' : 'bg-hairline text-ink-muted'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
