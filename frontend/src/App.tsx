import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { ClinicalAnalysisPage } from './pages/ClinicalAnalysisPage';
import { ResearchLabPage } from './pages/ResearchLabPage';
import { ModelComparisonPage } from './pages/ModelComparisonPage';
import { ExplainabilityPage } from './pages/ExplainabilityPage';
import { EvidenceRetrievalPage } from './pages/EvidenceRetrievalPage';
import { LLMLabPage } from './pages/LLMLabPage';
import { DatasetDashboardPage } from './pages/DatasetDashboardPage';
import { HistoryPage } from './pages/HistoryPage';
import { PresentationPage } from './pages/PresentationPage';

export const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="min-h-screen bg-white text-ink flex flex-col font-body selection:bg-violet selection:text-indigo">
        {/* Editorial Navigation */}
        <Navigation />

        {/* Dynamic Route Content */}
        <main className="flex-1 w-full">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/clinical-analysis" element={<ClinicalAnalysisPage />} />
            <Route path="/research-lab" element={<ResearchLabPage />} />
            <Route path="/model-comparison" element={<ModelComparisonPage />} />
            <Route path="/explainability" element={<ExplainabilityPage />} />
            <Route path="/knowledge" element={<EvidenceRetrievalPage />} />
            <Route path="/llm-lab" element={<LLMLabPage />} />
            <Route path="/datasets" element={<DatasetDashboardPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/presentation" element={<PresentationPage />} />
            {/* Fallback to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Responsible AI Disclaimer & Provenance Footer */}
        <Footer />
      </div>
    </HashRouter>
  );
};
