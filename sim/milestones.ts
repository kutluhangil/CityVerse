import { CityStats, MilestoneTier } from '../types';

export interface MilestoneDef {
  tier: MilestoneTier;
  name: string;
  minPop: number;
  minMoney: number;
  minHappiness: number;
  unlocks: string[];
}

export const MILESTONES: MilestoneDef[] = [
  {
    tier: 0,
    name: 'Village',
    minPop: 0,
    minMoney: 0,
    minHappiness: 0,
    unlocks: [],
  },
  {
    tier: 1,
    name: 'Town',
    minPop: 100,
    minMoney: 1500,
    minHappiness: 50,
    unlocks: ['Fire Station', 'School'],
  },
  {
    tier: 2,
    name: 'City',
    minPop: 350,
    minMoney: 4000,
    minHappiness: 60,
    unlocks: ['Police Station', 'Hospital'],
  },
  {
    tier: 3,
    name: 'Metropolis',
    minPop: 800,
    minMoney: 10000,
    minHappiness: 70,
    unlocks: ['Metropolis Victory'],
  },
];

export const evaluateMilestoneTier = (
  currentTier: MilestoneTier,
  stats: Pick<CityStats, 'population' | 'money' | 'happiness'>,
): MilestoneTier => {
  const pop = Math.floor(stats.population);
  let highestMet: MilestoneTier = currentTier;

  for (const def of MILESTONES) {
    if (
      pop >= def.minPop &&
      stats.money >= def.minMoney &&
      stats.happiness >= def.minHappiness &&
      def.tier > highestMet
    ) {
      highestMet = def.tier;
    }
  }

  return highestMet;
};

export const getNextMilestone = (tier: MilestoneTier): MilestoneDef | null => {
  const next = MILESTONES.find((m) => m.tier === tier + 1);
  return next ?? null;
};
