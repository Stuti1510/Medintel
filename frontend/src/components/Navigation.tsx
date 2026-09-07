import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { getSystemStatus } from '../services/api';
import { SystemStatusResponse } from '../types/clinical';
import { MedintelLogo } from './MedintelLogo';

export const Navigation: React.FC = () => {
  const location = useLocation();
  const [status, setStatus] = useState<SystemStatusResponse | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    getSystemStatus().then(setStatus).catch(() => {});
  }, []);

  const isDarkPage = location.pathname === '/' || location.pathname === '/presentation';

  const navLinks = [
    { label: "Clinical Analysis", path: "/clinical-analysis" },
    { label: "Motor Screening", path: "/motor-screening" },
    { label: "Research Lab", path: "/transformer-lab" },
    { label: "Model Benchmark", path: "/model-comparison" },
    { label: "Explainability", path: "/explainability" },
    { label: "Evidence", path: "/knowledge" },
    { label: "LLM Lab", path: "/llm-lab" },
    { label: "Datasets", path: "/datasets" },
    { label: "Presentation", path: "/presentation" },
  ];

  return (
    <header className={`sticky top-0 z-50 w-full transition-colors duration-200 border-b ${
      isDarkPage 
        ? 'bg-[#1b1938] border-[#3f3a52] text-white' 
        : 'bg-white/95 backdrop-blur-md border-[#e8e4dd] text-[#292827]'
    }`}>
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Official Medintel Logo */}
        <Link to="/" className="flex items-center group py-1">
          <MedintelLogo variant="navbar" isDark={isDarkPage} enable3D={true} />
        </Link>

        {/* Center: Clean Nav Links */}
        <nav className="hidden lg:flex items-center space-x-1 xl:space-x-1.5">
          {navLinks.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? isDarkPage
                      ? 'text-white bg-[#232047] font-semibold'
                      : 'text-[#292827] bg-[#f5f4f0] font-semibold'
                    : isDarkPage
                      ? 'text-[#bcbac9] hover:text-white hover:bg-[#232047]/60'
                      : 'text-[#73706d] hover:text-[#292827] hover:bg-[#fafaf8]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Status Indicator & Quick Action */}
        <div className="flex items-center gap-3">
          {/* Subtle System Status Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className={isDarkPage ? 'text-[#bcbac9]' : 'text-[#73706d]'}>
              System Ready
            </span>
          </div>

          {/* Clinical Analysis Quick CTA (when not on clinical analysis page) */}
          {location.pathname !== '/clinical-analysis' && (
            <Link
              to="/clinical-analysis"
              className={`hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                isDarkPage
                  ? 'bg-[#c9b4fa] hover:bg-[#d8c7fd] text-[#1b1938] font-semibold shadow-sm'
                  : 'bg-[#1b1938] hover:bg-[#232047] text-white font-medium shadow-sm'
              }`}
            >
              <span>Analyze</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-1.5 rounded-md lg:hidden ${
              isDarkPage 
                ? 'text-white hover:bg-[#232047]' 
                : 'text-[#292827] hover:bg-[#fafaf8]'
            }`}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className={`lg:hidden border-t px-4 py-4 space-y-1 ${
          isDarkPage 
            ? 'bg-[#1b1938] border-[#3f3a52]' 
            : 'bg-white border-[#e8e4dd]'
        }`}>
          {navLinks.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  isActive
                    ? isDarkPage 
                      ? 'bg-[#232047] text-white font-semibold' 
                      : 'bg-[#fafaf8] text-[#292827] font-semibold'
                    : isDarkPage 
                      ? 'text-[#bcbac9] hover:text-white' 
                      : 'text-[#73706d] hover:text-[#292827]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};

export default Navigation;
