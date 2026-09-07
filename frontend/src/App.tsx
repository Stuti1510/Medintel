import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { LandingPage } from './pages/LandingPage';
import { ClinicalAnalysisPage } from './pages/ClinicalAnalysisPage';
import { MotorScreeningPage } from './pages/MotorScreeningPage';
import { TransformerLabPage } from './pages/TransformerLabPage';
import { ModelComparisonPage } from './pages/ModelComparisonPage';
import { ExplainabilityPage } from './pages/ExplainabilityPage';
import { EvidenceRetrievalPage } from './pages/EvidenceRetrievalPage';
import { LLMLabPage } from './pages/LLMLabPage';
import { DatasetDashboardPage } from './pages/DatasetDashboardPage';
import { PredictionHistoryPage } from './pages/PredictionHistoryPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { PresentationPage } from './pages/PresentationPage';

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#fafaf8] text-[#292827] flex flex-col font-sans selection:bg-[#c9b4fa] selection:text-[#1b1938]">
        <Navigation />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/clinical-analysis" element={<ClinicalAnalysisPage />} />
            <Route path="/motor-screening" element={<MotorScreeningPage />} />
            <Route path="/transformer-lab" element={<TransformerLabPage />} />
            <Route path="/model-comparison" element={<ModelComparisonPage />} />
            <Route path="/explainability" element={<ExplainabilityPage />} />
            <Route path="/knowledge" element={<EvidenceRetrievalPage />} />
            <Route path="/llm-lab" element={<LLMLabPage />} />
            <Route path="/datasets" element={<DatasetDashboardPage />} />
            <Route path="/history" element={<PredictionHistoryPage />} />
            <Route path="/architecture" element={<ArchitecturePage />} />
            <Route path="/presentation" element={<PresentationPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
