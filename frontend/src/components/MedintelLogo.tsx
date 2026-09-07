/**
 * MEDINTEL AI — Official Brand Identity & Vector Logo Component
 * Source of truth: Medical "M+" mark with angular frame & precision typography.
 * Supports subtle 3D perspective interaction, satin highlights, and accessibility reduced-motion.
 */

import React, { useState, useRef, useEffect, MouseEvent } from 'react';

export type LogoVariant = 'full' | 'compact' | 'navbar' | 'hero' | 'footer' | 'favicon' | 'mark-only';

export interface MedintelLogoProps {
  variant?: LogoVariant;
  isDark?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  enable3D?: boolean;
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

export const MedintelLogo: React.FC<MedintelLogoProps> = ({
  variant = 'compact',
  isDark = false,
  size = 'md',
  enable3D = false,
  animated = false,
  className = '',
  onClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotX, setRotX] = useState<number>(0);
  const [rotY, setRotY] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  // Check user accessibility preference for reduced motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // 3D Perspective Hover Tilt (Max ±4 degrees)
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!enable3D || prefersReducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate rotation with max limit of ±4 degrees
    const rX = Math.max(-4, Math.min(4, ((y - centerY) / centerY) * -3.5));
    const rY = Math.max(-4, Math.min(4, ((x - centerX) / centerX) * 3.5));

    setRotX(rX);
    setRotY(rY);
  };

  const handleMouseEnter = () => {
    if (!enable3D || prefersReducedMotion) return;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (!enable3D || prefersReducedMotion) return;
    setIsHovered(false);
    setRotX(0);
    setRotY(0);
  };

  // Color Palette Constants
  const navyColor = isDark ? '#ffffff' : '#0e2246';
  const blueColor = isDark ? '#60a5fa' : '#1d68b8';
  const frameColor = isDark ? '#3b82f6' : '#1d68b8';
  const subtitleColor = isDark ? '#93c5fd' : '#1d68b8';
  const tagColor = isDark ? '#bcbac9' : '#73706d';

  // SVG Mark Graphic matching the exact reference geometry
  const renderMarkSvg = (svgSize: number = 44) => (
    <svg
      width={svgSize}
      height={svgSize}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-200"
      style={{
        filter: isDark 
          ? 'drop-shadow(0 2px 8px rgba(96, 165, 250, 0.25))' 
          : 'drop-shadow(0 2px 6px rgba(14, 34, 70, 0.12))'
      }}
    >
      {/* 1. Angular framing line: Starts above left stem of M, goes right, turns 90deg down */}
      <path
        d="M 68 36 L 164 36 L 164 132"
        stroke={frameColor}
        strokeWidth="14"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />

      {/* 2. Bold Medical "M" Glyph */}
      <path
        d="M 32 148 V 64 H 48 L 74 114 L 100 64 H 116 V 148 H 94 V 98 L 76 132 H 72 L 54 98 V 148 Z"
        fill={navyColor}
      />

      {/* 3. Medical "+" Sign above the right shoulder of the "M" */}
      {/* Horizontal Bar */}
      <rect
        x="122"
        y="60"
        width="36"
        height="12"
        rx="2"
        fill={blueColor}
      />
      {/* Vertical Bar */}
      <rect
        x="134"
        y="48"
        width="12"
        height="36"
        rx="2"
        fill={blueColor}
      />
    </svg>
  );

  // Size mapping
  const markDimensions = {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 84
  };

  const currentMarkSize = markDimensions[size] || 40;

  // 3D Transform styling
  const transformStyle = enable3D && !prefersReducedMotion
    ? {
        transform: `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(${isHovered ? '1.02, 1.02, 1.02' : '1, 1, 1'})`,
        transformStyle: 'preserve-3d' as const,
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out'
      }
    : {};

  // -----------------------------------------------------------------
  // VARIANT: FAVICON / MARK ONLY
  // -----------------------------------------------------------------
  if (variant === 'favicon' || variant === 'mark-only') {
    return (
      <div
        ref={containerRef}
        className={`inline-flex items-center justify-center select-none ${className}`}
        style={transformStyle}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
      >
        {renderMarkSvg(currentMarkSize)}
      </div>
    );
  }

  // -----------------------------------------------------------------
  // VARIANT: FULL (Matching the official Medical Diagnostic card)
  // -----------------------------------------------------------------
  if (variant === 'full') {
    return (
      <div
        ref={containerRef}
        className={`inline-flex flex-col items-center justify-center p-6 rounded-2xl bg-white border border-[#e8e4dd] shadow-sm select-none transition-all duration-200 cursor-pointer group ${
          animated && !prefersReducedMotion ? 'animate-medintel-float' : ''
        } ${className}`}
        style={transformStyle}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
      >
        {/* M+ Mark */}
        <div className="mb-4">
          {renderMarkSvg(88)}
        </div>

        {/* Wordmark: MEDICAL DIAGNOSTIC */}
        <div
          className="text-lg sm:text-xl font-extrabold tracking-tight text-[#0e2246] uppercase font-sans leading-none"
          style={{ letterSpacing: '0.04em' }}
        >
          MEDICAL DIAGNOSTIC
        </div>

        {/* Subtitle: PREDICTION SYSTEM */}
        <div
          className="text-[11px] sm:text-xs font-semibold tracking-[0.24em] text-[#1d68b8] uppercase font-sans mt-1.5 leading-none"
        >
          PREDICTION SYSTEM
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // VARIANT: HERO (Homepage Large 3D Display)
  // -----------------------------------------------------------------
  if (variant === 'hero') {
    return (
      <div
        ref={containerRef}
        className={`inline-flex items-center gap-3.5 select-none cursor-pointer group relative py-1 ${
          animated && !prefersReducedMotion ? 'animate-medintel-float' : ''
        } ${className}`}
        style={transformStyle}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
      >
        {/* 3D Depth Mark */}
        <div className="relative">
          {renderMarkSvg(52)}
          {/* Subtle satin sheen sweep */}
          {!prefersReducedMotion && (
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-lg" />
          )}
        </div>

        {/* Hero Branding Wordmark */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <span className={`text-2xl sm:text-3xl font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-[#0e2246]'
            } font-sans leading-none`}>
              MEDINTEL AI
            </span>
          </div>
          <span className={`text-[10px] sm:text-[11px] font-mono tracking-widest uppercase mt-1 ${
            isDark ? 'text-[#c9b4fa]' : 'text-[#1d68b8]'
          } leading-none font-semibold`}>
            CLINICAL INTELLIGENCE PLATFORM
          </span>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // VARIANT: NAVBAR (Compact & Clean)
  // -----------------------------------------------------------------
  if (variant === 'navbar') {
    return (
      <div
        ref={containerRef}
        className={`inline-flex items-center gap-2.5 select-none cursor-pointer group active:scale-[0.98] transition-transform duration-150 ${className}`}
        style={transformStyle}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
      >
        {/* Navbar M+ Mark */}
        {renderMarkSvg(34)}

        {/* Wordmark */}
        <div className="flex flex-col justify-center">
          <span className={`text-base font-bold tracking-tight transition-colors leading-tight ${
            isDark ? 'text-white' : 'text-[#0e2246]'
          }`}>
            MEDINTEL AI
          </span>
          <span className={`text-[8.5px] font-mono tracking-wider uppercase leading-tight ${
            isDark ? 'text-[#bcbac9]' : 'text-[#1d68b8]'
          }`}>
            CLINICAL INTELLIGENCE PLATFORM
          </span>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // VARIANT: FOOTER
  // -----------------------------------------------------------------
  if (variant === 'footer') {
    return (
      <div
        ref={containerRef}
        className={`inline-flex items-center gap-2.5 select-none ${className}`}
        style={transformStyle}
        onClick={onClick}
      >
        {renderMarkSvg(28)}
        <div className="flex flex-col">
          <span className={`text-sm font-bold tracking-tight ${
            isDark ? 'text-white' : 'text-[#0e2246]'
          }`}>
            MEDINTEL AI
          </span>
          <span className={`text-[8px] font-mono tracking-widest uppercase ${
            isDark ? 'text-[#bcbac9]' : 'text-[#73706d]'
          }`}>
            CLINICAL INTELLIGENCE PLATFORM
          </span>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // VARIANT: COMPACT (Default)
  // -----------------------------------------------------------------
  return (
    <div
      ref={containerRef}
      className={`inline-flex items-center gap-2 select-none ${className}`}
      style={transformStyle}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {renderMarkSvg(currentMarkSize)}
      <span className={`font-bold tracking-tight ${
        size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-sm' : 'text-base'
      } ${isDark ? 'text-white' : 'text-[#0e2246]'}`}>
        MEDINTEL AI
      </span>
    </div>
  );
};

export default MedintelLogo;
