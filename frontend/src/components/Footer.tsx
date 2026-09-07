import React from 'react';
import { Link } from 'react-router-dom';
import { MedintelLogo } from './MedintelLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#fafaf8] border-t border-[#e8e4dd] py-10 text-xs text-[#73706d]">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Logo & Subtitle */}
          <Link to="/" className="inline-block">
            <MedintelLogo variant="footer" isDark={false} />
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link to="/clinical-analysis" className="hover:text-[#292827] transition-colors">
              Clinical Analysis
            </Link>
            <Link to="/motor-screening" className="hover:text-[#292827] transition-colors">
              Motor Screening
            </Link>
            <Link to="/transformer-lab" className="hover:text-[#292827] transition-colors">
              Research Lab
            </Link>
            <Link to="/model-comparison" className="hover:text-[#292827] transition-colors">
              Model Benchmark
            </Link>
            <Link to="/explainability" className="hover:text-[#292827] transition-colors">
              Explainability
            </Link>
            <Link to="/knowledge" className="hover:text-[#292827] transition-colors">
              Evidence
            </Link>
            <Link to="/datasets" className="hover:text-[#292827] transition-colors">
              Datasets
            </Link>
            <Link to="/presentation" className="hover:text-[#292827] transition-colors">
              Presentation
            </Link>
          </nav>
        </div>

        {/* Bottom Disclaimer */}
        <div className="pt-4 border-t border-[#e8e4dd]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-[#9a9794]">
          <p>
            MEDINTEL AI — Medical Diagnostic Prediction & Decision-Support System. Research Prototype.
          </p>
          <p className="font-mono">
            Zero-Leakage 4-Dataset Architecture
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
