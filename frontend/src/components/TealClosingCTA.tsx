import React from 'react';
import { Link } from 'react-router-dom';

export const TealClosingCTA: React.FC = () => {
  return (
    <section className="w-full bg-teal-deep text-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-content mx-auto text-center space-y-6">
        <h2 className="font-section text-white max-w-2xl mx-auto">
          Make clinical intelligence easier to understand.
        </h2>
        <p className="font-lead text-white-muted max-w-xl mx-auto">
          Explore the complete MEDINTEL research pipeline — from image quality assessment and self-supervised U-Net restoration to exact linear attributions and grounded evidence.
        </p>
        <div className="pt-4">
          <Link
            to="/clinical-analysis"
            className="inline-flex items-center gap-2 bg-white text-teal-deep font-button px-6 py-3.5 rounded-[8px] hover:bg-paper transition-all focus:outline-none focus:ring-2 focus:ring-violet focus:ring-offset-2"
          >
            Run Clinical Analysis →
          </Link>
        </div>
      </div>
    </section>
  );
};
