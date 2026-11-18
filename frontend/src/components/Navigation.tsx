import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { StatusDot } from './StatusDot';
import { getSystemStatus } from '../services/api';
import { Menu, X } from 'lucide-react';

interface NavigationProps {
  isDarkHero?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({ isDarkHero = false }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState<string>('loading');

  useEffect(() => {
    let mounted = true;
    getSystemStatus()
      .then((data) => {
        if (mounted) {
          setSystemStatus(data.status === 'healthy' ? 'ready' : data.status || 'ready');
        }
      })
      .catch(() => {
        if (mounted) setSystemStatus('unavailable');
      });
    return () => {
      mounted = false;
    };
  }, []);

  const navLinks = [
    { label: 'Clinical Analysis', path: '/clinical-analysis' },
    { label: 'Research Lab', path: '/research-lab' },
    { label: 'Model Performance', path: '/model-performance' },
    { label: 'Explainability', path: '/explainability' },
    { label: 'Evidence', path: '/knowledge' },
    { label: 'LLM Lab', path: '/llm-lab' },
    { label: 'Datasets', path: '/datasets' },
    { label: 'Presentation', path: '/presentation' },
  ];

  const isLight = !isDarkHero;

  return (
    <nav
      className={`w-full transition-colors ${
        isLight
          ? 'bg-white text-ink border-b border-hairline'
          : 'bg-indigo text-white border-b border-hairline-dark'
      }`}
    >
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Wordmark */}
          <div className="flex items-baseline gap-2.5">
            <Link
              to="/"
              className={`font-button text-[17px] tracking-tight hover:opacity-80 transition-opacity ${
                isLight ? 'text-ink' : 'text-white'
              }`}
            >
              MEDINTEL AI
            </Link>
            <span
              className={`hidden sm:inline-block font-micro text-[10px] tracking-widest ${
                isLight ? 'text-ink-muted' : 'text-white-muted'
              }`}
            >
              CLINICAL INTELLIGENCE PLATFORM
            </span>
          </div>

          {/* Centre: Desktop Links */}
          <div className="hidden lg:flex items-center space-x-6 text-[13px]">
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`transition-all pb-0.5 ${
                    active
                      ? isLight
                        ? 'text-ink font-semibold border-b border-ink'
                        : 'text-white font-semibold border-b border-white'
                      : isLight
                      ? 'text-ink-muted hover:text-ink'
                      : 'text-white-muted hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right: Status & Viva Mode */}
          <div className="hidden md:flex items-center gap-4">
            <div className={`px-2.5 py-1 rounded border text-[11px] ${
              isLight ? 'border-hairline bg-paper' : 'border-hairline-dark bg-indigo-deep'
            }`}>
              <StatusDot status={systemStatus} />
            </div>

            <Link
              to="/presentation"
              className={`font-micro text-[11px] px-2.5 py-1 rounded transition-colors ${
                isLight
                  ? 'bg-paper text-ink-muted hover:text-ink hover:bg-hairline'
                  : 'bg-indigo-deep text-white-muted hover:text-white'
              }`}
            >
              Viva Mode ↗
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
              className={`p-2 rounded focus:outline-none focus:ring-2 focus:ring-violet ${
                isLight ? 'text-ink' : 'text-white'
              }`}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Sheet */}
      {mobileMenuOpen && (
        <div
          className={`lg:hidden border-b px-4 pt-3 pb-6 space-y-3 ${
            isLight
              ? 'bg-paper border-hairline text-ink'
              : 'bg-indigo-deep border-hairline-dark text-white'
          }`}
        >
          <div className="flex flex-col space-y-2 text-sm">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`py-1.5 px-2 rounded ${
                  location.pathname === link.path
                    ? isLight
                      ? 'bg-white font-semibold text-ink'
                      : 'bg-indigo font-semibold text-white'
                    : isLight
                    ? 'text-ink-muted'
                    : 'text-white-muted'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-hairline flex items-center justify-between text-xs">
            <StatusDot status={systemStatus} />
            <Link
              to="/presentation"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs text-ink-muted underline"
            >
              Open Viva Mode ↗
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
