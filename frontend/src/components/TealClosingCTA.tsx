import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';

interface TealClosingCTAProps {
  heading?: string;
  supportingText?: string;
  buttonText?: string;
  buttonLink?: string;
}

export const TealClosingCTA: React.FC<TealClosingCTAProps> = ({
  heading = "Make clinical intelligence easier to understand.",
  supportingText = "Explore the complete MEDINTEL research pipeline combining tabular machine learning, biomedical transformer representations, retrieval-augmented evidence, and constrained LLM synthesis.",
  buttonText = "Run Clinical Analysis →",
  buttonLink = "/clinical-analysis"
}) => {
  return (
    <section className="w-full bg-[#0e3030] text-white py-16 md:py-24 border-t border-[#1c5e5e]/50">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#a3cfcf]">
              <ShieldCheck className="w-4 h-4 text-[#a3cfcf]" />
              <span>Responsible Clinical Intelligence</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-white leading-[1.04]">
              {heading}
            </h2>
            <p className="text-base sm:text-lg text-[#a3cfcf] font-normal leading-relaxed">
              {supportingText}
            </p>
          </div>

          <div className="shrink-0">
            <Link
              to={buttonLink}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-white text-[#0e3030] font-semibold text-base hover:bg-[#fafaf8] hover:shadow-lg transition-all"
            >
              <span>{buttonText.replace('→', '').trim()}</span>
              <ArrowRight className="w-4 h-4 text-[#0e3030]" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TealClosingCTA;
