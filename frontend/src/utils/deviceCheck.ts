/**
 * MEDINTEL AI — Device & Input Environment Auditing Utility
 * Evaluates hardware capabilities, pointer precision, touch events, and viewport constraints.
 */

import { DeviceAuditInfo } from '../types/motor';

export function auditDeviceCapabilities(): DeviceAuditInfo {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
  const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;

  // Pointer precision query
  const hasFinePointer = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(pointer: fine)').matches
    : true;
  
  const hasCoarsePointer = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(pointer: coarse)').matches
    : false;

  const hasTouch = typeof window !== 'undefined' && (
    'ontouchstart' in window ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
    false
  );

  // Inferred category
  let inferredDevice: 'Desktop / Laptop' | 'Tablet' | 'Mobile Phone' | 'Unknown' = 'Desktop / Laptop';
  if (/iPad|Tablet|(Android(?!.*Mobile))/i.test(ua) || (hasTouch && screenWidth >= 768 && screenWidth <= 1200)) {
    inferredDevice = 'Tablet';
  } else if (/Mobi|Android|iPhone|iPod/i.test(ua) || (hasTouch && screenWidth < 768)) {
    inferredDevice = 'Mobile Phone';
  } else if (hasFinePointer || !hasTouch) {
    inferredDevice = 'Desktop / Laptop';
  }

  // Recommended input device guidance
  let recommendedInput = 'Standard Mouse or Precision Trackpad';
  if (inferredDevice === 'Mobile Phone' || inferredDevice === 'Tablet') {
    recommendedInput = 'Capacitive Direct Touch Screen';
  }

  const isPointerCapable = hasFinePointer || hasCoarsePointer || !hasTouch;

  return {
    hasFinePointer,
    hasCoarsePointer: Boolean(hasCoarsePointer),
    hasTouch: Boolean(hasTouch),
    hasKeyboard: inferredDevice === 'Desktop / Laptop' || (!hasTouch && screenWidth >= 1024),
    screenWidth,
    screenHeight,
    devicePixelRatio: dpr,
    userAgent: ua,
    inferredDevice,
    recommendedInput,
    isPointerCapable: Boolean(isPointerCapable)
  };
}
