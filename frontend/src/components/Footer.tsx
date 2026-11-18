import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-hairline mt-auto">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-hairline">
          {/* Wordmark and descriptor */}
          <div className="md:col-span-2 space-y-2">
            <span className="font-button text-[16px] tracking-tight text-ink block">
              MEDINTEL AI
            </span>
            <p className="font-caption text-ink-muted max-w-md">
              A clinical intelligence research platform for quality-robust, explainable skin lesion
              classification on low-quality smartphone photographs.
            </p>
          </div>

          {/* Platform Links */}
          <div className="space-y-2">
            <span className="font-micro text-ink-faint block">PLATFORM</span>
            <ul className="space-y-1.5 text-[13px]">
              <li>
                <Link to="/clinical-analysis" className="text-ink-muted hover:text-ink transition-colors">
                  Clinical Analysis
                </Link>
              </li>
              <li>
                <Link to="/research-lab" className="text-ink-muted hover:text-ink transition-colors">
                  Research Lab
                </Link>
              </li>
              <li>
                <Link to="/model-comparison" className="text-ink-muted hover:text-ink transition-colors">
                  Model Benchmark
                </Link>
              </li>
              <li>
                <Link to="/explainability" className="text-ink-muted hover:text-ink transition-colors">
                  Explainability
                </Link>
              </li>
            </ul>
          </div>

          {/* Reference Links */}
          <div className="space-y-2">
            <span className="font-micro text-ink-faint block">RESOURCES</span>
            <ul className="space-y-1.5 text-[13px]">
              <li>
                <Link to="/datasets" className="text-ink-muted hover:text-ink transition-colors">
                  PAD-UFES-20 Dataset
                </Link>
              </li>
              <li>
                <Link to="/knowledge" className="text-ink-muted hover:text-ink transition-colors">
                  Evidence Retrieval
                </Link>
              </li>
              <li>
                <Link to="/presentation" className="text-ink-muted hover:text-ink transition-colors">
                  Viva Presentation
                </Link>
              </li>
              <li>
                <Link to="/history" className="text-ink-muted hover:text-ink transition-colors">
                  Experiment History
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Citation and Disclaimer */}
        <div className="pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-ink-muted">
          <div>
            <p>
              Dataset: Pacheco et al., <span className="italic">PAD-UFES-20: A skin lesion dataset composed of patient data and images collected using smartphones</span>, Data in Brief, 2020.
            </p>
          </div>
          <div className="text-left md:text-right">
            <p className="font-semibold text-ink">
              Research decision-support prototype. Not a diagnostic device.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
