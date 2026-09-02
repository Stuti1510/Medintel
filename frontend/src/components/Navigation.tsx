import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Cpu, Database, BookOpen, Layers, History, ShieldAlert, Sparkles, Presentation } from 'lucide-react';
import { getSystemStatus } from '../services/api';
import { SystemStatusResponse } from '../types/clinical';

export const Navigation: React.FC = () => {
  const location = useLocation();
  const [status, setStatus] = useState<SystemStatusResponse | null>(null);

  useEffect(() => {
    getSystemStatus().then(setStatus).catch(() => {});
  }, []);

  const navItems = [
    { label: "Clinical Analysis", path: "/clinical-analysis", icon: Activity },
    { label: "Transformer Lab", path: "/transformer-lab", icon: Cpu },
    { label: "Model Comparison", path: "/model-comparison", icon: Layers },
    { label: "Explainability", path: "/explainability", icon: Sparkles },
    { label: "Evidence (RAG)", path: "/knowledge", icon: BookOpen },
    { label: "LLM Lab", path: "/llm-lab", icon: Sparkles },
    { label: "Datasets", path: "/datasets", icon: Database },
    { label: "History", path: "/history", icon: History },
    { label: "Architecture", path: "/architecture", icon: Layers },
    { label: "Viva Deck", path: "/presentation", icon: Presentation, highlight: true }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-dark-border bg-dark-bg/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-button bg-gradient-to-br from-ai to-ai-soft flex items-center justify-center text-white shadow-lg shadow-ai/20 group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5 text-white animate-pulse-subtle" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-dark-text flex items-center gap-2">
              MEDINTEL <span className="text-xs px-2 py-0.5 rounded-full bg-ai/20 text-ai font-mono-tech border border-ai/30">AI</span>
            </span>
            <p className="text-[10px] text-dark-muted hidden sm:block tracking-wider uppercase font-mono-tech">
              Clinical Intelligence, Made Interpretable
            </p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.slice(0, 7).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded-button text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-dark-elevated text-dark-text border border-dark-strongBorder shadow-sm'
                    : 'text-dark-secondary hover:text-dark-text hover:bg-dark-surface'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-ai' : 'text-dark-muted'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Telemetry & Action */}
        <div className="flex items-center gap-3">
          {/* Status Pill */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-dark-surface border border-dark-border text-[11px] font-mono-tech text-dark-secondary">
            <span className="w-2 h-2 rounded-full bg-semantic-success animate-ping" />
            <span>ML: ONLINE</span>
            <span className="text-dark-muted">•</span>
            <span>BIOBERT: READY</span>
          </div>

          <Link
            to="/presentation"
            className="px-3 py-1.5 rounded-button text-xs font-semibold bg-gradient-to-r from-ai to-ai-hover text-white shadow-md shadow-ai/25 hover:shadow-ai/40 hover:scale-[1.02] transition-all flex items-center gap-1.5"
          >
            <Presentation className="w-3.5 h-3.5" />
            <span>Viva Mode</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
