import { GraphicsQuality } from '../types';

export interface GraphicsPreset {
  label: string;
  dpr: [number, number];
  shadows: boolean;
  softShadows: boolean;
  shadowMapSize: number;
  ao: boolean;
  bloom: boolean;
  edges: boolean;
  particleScale: number;
}

export const GRAPHICS_PRESETS: Record<GraphicsQuality, GraphicsPreset> = {
  low: {
    label: 'Low',
    dpr: [1, 1],
    shadows: false,
    softShadows: false,
    shadowMapSize: 512,
    ao: false,
    bloom: false,
    edges: false,
    particleScale: 0.25,
  },
  medium: {
    label: 'Med',
    dpr: [1, 1.25],
    shadows: true,
    softShadows: false,
    shadowMapSize: 1024,
    ao: false,
    bloom: true,
    edges: true,
    particleScale: 0.6,
  },
  high: {
    label: 'High',
    dpr: [1, 1.5],
    shadows: true,
    softShadows: true,
    shadowMapSize: 2048,
    ao: true,
    bloom: true,
    edges: true,
    particleScale: 1.0,
  },
};

const GRAPHICS_STORAGE_KEY = 'cityverse_graphics';

export const loadGraphicsQuality = (): GraphicsQuality => {
  if (typeof window === 'undefined') return 'medium';
  try {
    const val = window.localStorage.getItem(GRAPHICS_STORAGE_KEY);
    if (val === 'low' || val === 'medium' || val === 'high') return val;
  } catch {
    // Ignore storage read errors
  }
  return 'medium';
};

export const saveGraphicsQuality = (quality: GraphicsQuality): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(GRAPHICS_STORAGE_KEY, quality);
  } catch {
    // Ignore storage write errors
  }
};
