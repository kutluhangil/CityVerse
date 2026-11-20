import { DEFAULT_TAX_RATE } from '../constants';
import { RCIDemand } from '../types';

export const SNOW_INDUSTRIAL_MULTIPLIER = 0.7;
export const RAIN_TRAFFIC_SPEED_MULTIPLIER = 0.65;

export const clamp = (val: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, val));

export interface DemandInput {
  population: number;
  comWeighted: number;
  indWeighted: number;
  taxRate: number;
  happiness: number;
}

export const computeRCIDemand = ({
  population,
  comWeighted,
  indWeighted,
  taxRate,
  happiness,
}: DemandInput): RCIDemand => {
  const jobsAvailable = comWeighted * 25 + indWeighted * 35;

  const residential = clamp(
    Math.round(
      30 +
        (jobsAvailable - population) * 0.8 +
        (DEFAULT_TAX_RATE - taxRate) * 4 +
        (happiness - 50) * 0.8,
    ),
    -100,
    100,
  );

  const commercial = clamp(
    Math.round(
      15 +
        (population / 20 - comWeighted) * 18 +
        (DEFAULT_TAX_RATE - taxRate) * 3 +
        (happiness - 50) * 0.4,
    ),
    -100,
    100,
  );

  const industrial = clamp(
    Math.round(
      15 +
        (comWeighted * 0.8 + population / 40 - indWeighted) * 20 +
        (DEFAULT_TAX_RATE - taxRate) * 3,
    ),
    -100,
    100,
  );

  return { residential, commercial, industrial };
};

export const getResidentialDemandMultiplier = (rDemand: number): number => {
  if (rDemand <= -50) return 0.1;
  if (rDemand < 0) return 0.4;
  return 0.7 + (rDemand / 100) * 0.6;
};

export const getZoneDemandMultiplier = (demand: number): number =>
  clamp(1 + (demand / 100) * 0.25, 0.6, 1.25);
