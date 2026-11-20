import { describe, expect, it } from 'vitest';
import { computeRoadConnectivity } from '../connectivity';
import { createEmptyGrid } from '../grid';
import { evaluateMilestoneTier } from '../milestones';
import { validatePlacement } from '../placement';
import { computeServiceCoverage } from '../services';
import { INITIAL_GLOBAL_TIME, stepSimulation } from '../tick';
import { BuildingType, CityStats } from '../../types';

const baseStats = (overrides: Partial<CityStats> = {}): CityStats => ({
  money: 2000,
  population: 50,
  day: 1,
  happiness: 80,
  weather: 'sunny',
  taxRate: 9,
  milestoneTier: 2,
  demand: { residential: 30, commercial: 15, industrial: 15 },
  budget: {
    residentialTax: 0,
    commercialIncome: 0,
    industrialIncome: 0,
    upkeep: 0,
    netIncome: 0,
  },
  ...overrides,
});

describe('service coverage & milestone unlocks', () => {
  it('computes Manhattan serviceRadius coverage accurately and ignores disconnected services', () => {
    const grid = createEmptyGrid();
    for (let x = 4; x <= 9; x++) {
      grid[7][x].buildingType = BuildingType.Road;
    }

    // Connected FireStation at (4, 6), radius = 4
    grid[6][4].buildingType = BuildingType.FireStation;
    // House at (8, 6): Manhattan distance 4 -> covered
    grid[6][8].buildingType = BuildingType.Residential;
    // Disconnected PowerPlant at (5, 4), no adjacent road -> ignored
    grid[4][5].buildingType = BuildingType.PowerPlant;

    const conn1 = computeRoadConnectivity(grid);
    const cov1 = computeServiceCoverage(grid, conn1.disconnectedTiles);
    expect(cov1.fireRatio).toBe(1);
    expect(cov1.powerRatio).toBe(0);

    // Add second house at (9, 6): Manhattan distance 5 -> outside FireStation radius 4
    grid[6][9].buildingType = BuildingType.Residential;
    const conn2 = computeRoadConnectivity(grid);
    const cov2 = computeServiceCoverage(grid, conn2.disconnectedTiles);
    expect(cov2.fireRatio).toBe(0.5);
  });

  it('increases residential max population capacity when covered by a connected Hospital', () => {
    const withoutHospital = createEmptyGrid();
    withoutHospital[7][5].buildingType = BuildingType.Road;
    withoutHospital[7][6].buildingType = BuildingType.Road;
    withoutHospital[6][5].buildingType = BuildingType.Residential; // maxPop = 50

    const resWithout = stepSimulation({
      grid: withoutHospital,
      stats: baseStats({ population: 50 }),
      globalTime: INITIAL_GLOBAL_TIME,
      weatherTicks: 0,
      currentGoal: null,
      rng: () => 0.5,
    });
    expect(resWithout.nextStats.population).toBe(50);

    const withHospital = createEmptyGrid();
    withHospital[7][5].buildingType = BuildingType.Road;
    withHospital[7][6].buildingType = BuildingType.Road;
    withHospital[6][5].buildingType = BuildingType.Residential;
    withHospital[6][6].buildingType = BuildingType.Hospital; // maxPop = 60

    const resWith = stepSimulation({
      grid: withHospital,
      stats: baseStats({ population: 50 }),
      globalTime: INITIAL_GLOBAL_TIME,
      weatherTicks: 0,
      currentGoal: null,
      rng: () => 0.5,
    });
    expect(resWith.nextStats.population).toBeGreaterThan(50);
  });

  it('upgrades milestone tiers monotonically and unlocks service buildings by tier', () => {
    expect(
      evaluateMilestoneTier(0, { population: 99, money: 5000, happiness: 90 }),
    ).toBe(0);
    expect(
      evaluateMilestoneTier(0, { population: 100, money: 1500, happiness: 50 }),
    ).toBe(1);
    expect(
      evaluateMilestoneTier(1, { population: 350, money: 4000, happiness: 60 }),
    ).toBe(2);
    expect(
      evaluateMilestoneTier(2, { population: 800, money: 10000, happiness: 70 }),
    ).toBe(3);
    // Never downgrades even if city drops later
    expect(
      evaluateMilestoneTier(2, { population: 10, money: 0, happiness: 10 }),
    ).toBe(2);

    const grid = createEmptyGrid();
    grid[7][7].buildingType = BuildingType.Road;

    const lockedFire = validatePlacement(grid, 6, 7, BuildingType.FireStation, 1000, 0);
    expect(lockedFire.ok).toBe(false);
    if (!lockedFire.ok && 'reason' in lockedFire) {
      expect(lockedFire.reason).toContain('Town');
    }

    expect(validatePlacement(grid, 6, 7, BuildingType.FireStation, 1000, 1).ok).toBe(true);
    expect(validatePlacement(grid, 6, 7, BuildingType.Hospital, 1000, 1).ok).toBe(false);
    expect(validatePlacement(grid, 6, 7, BuildingType.Hospital, 1000, 2).ok).toBe(true);
  });
});
