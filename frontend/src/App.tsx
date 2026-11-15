import React, { useState } from 'react';
import { ClinicalAnalysisPage } from './pages/ClinicalAnalysisPage';
import { ModelComparisonPage } from './pages/ModelComparisonPage';
import { DatasetDashboardPage } from './pages/DatasetDashboardPage';
import { ExplainabilityPage } from './pages/ExplainabilityPage';
import {
  Stethoscope,
  BarChart3,
  Database,
  Sparkles,
  ShieldAlert,
  GitBranch,
  Layers
} from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'clinical' | 'models' | 'dataset' | 'xai'>('clinical');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Branding */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-tr from-sky-500 to-blue-600 rounded-xl text-white shadow-md shadow-sky-500/20">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-white tracking-tight">MEDINTEL AI</h1>
                  <span className="text-[10px] bg-sky-500/10 text-sky-400 font-semibold px-2 py-0.5 rounded-full border border-sky-500/30">
                    PAD-UFES-20
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Quality-Robust Explainable Multimodal Lesion Classifier</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center space-x-1 sm:space-x-2">
              {[
                { id: 'clinical', label: 'Clinical Analysis', icon: Stethoscope },
                { id: 'models', label: 'Benchmarks & Robustness', icon: BarChart3 },
                { id: 'dataset', label: 'PAD-UFES-20 Dataset', icon: Database },
                { id: 'xai', label: 'Explainability Lab', icon: Sparkles },
              ].map(({ id, label, icon: Icon }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id as any)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">{label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'clinical' && <ClinicalAnalysisPage />}
        {activeTab === 'models' && <ModelComparisonPage />}
        {activeTab === 'dataset' && <DatasetDashboardPage />}
        {activeTab === 'xai' && <ExplainabilityPage />}
      </main>

      {/* Research Disclaimer Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Research Decision-Support Prototype — Not a Certified Medical Diagnostic Device.</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 text-[11px]">
            <span>PAD-UFES-20 Smartphone Dataset</span>
            <span>•</span>
            <span>4 Target Classes (BCC, ACK, NEV, SEK)</span>
            <span>•</span>
            <span>Zero-Leakage 5-Fold Grouping</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
