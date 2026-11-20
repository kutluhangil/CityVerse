import { describe, expect, it } from 'vitest';
import { computeRCIDemand } from '../economy';
import { createEmptyGrid } from '../grid';
import { INITIAL_GLOBAL_TIME, stepSimulation } from '../tick';
import { BuildingType, CityStats } from '../../types';

const baseStats = (overrides: Partial<CityStats> = {}): CityStats => ({
  money: 2000,
  population: 40,
  day: 1,
  happiness: 70,
  weather: 'sunny',
  taxRate: 9,
  milestoneTier: 0,
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

describe('RCI demand, taxes, snow impact & progression gates', () => {
  it('shifts RCI demand dynamically based on population, jobs, and tax rate', () => {
    const jobSurplus = computeRCIDemand({
      population: 10,
      comWeighted: 2,
      indWeighted: 2,
      taxRate: 9,
      happiness: 80,
    });
    expect(jobSurplus.residential).toBeGreaterThan(50);

    const popSurplus = computeRCIDemand({
      population: 400,
      comWeighted: 0,
      indWeighted: 0,
      taxRate: 9,
      happiness: 60,
    });
    expect(popSurplus.commercial).toBeGreaterThan(50);
    expect(popSurplus.industrial).toBeGreaterThan(50);
    expect(popSurplus.residential).toBeLessThan(0);

    const highTax = computeRCIDemand({
      population: 50,
      comWeighted: 1,
      indWeighted: 1,
      taxRate: 18,
      happiness: 60,
    });
    const lowTax = computeRCIDemand({
      population: 50,
      comWeighted: 1,
      indWeighted: 1,
      taxRate: 5,
      happiness: 60,
    });
    expect(highTax.residential).toBeLessThan(lowTax.residential);
    expect(highTax.commercial).toBeLessThan(lowTax.commercial);
    expect(highTax.industrial).toBeLessThan(lowTax.industrial);
  });

  it('increases tax revenue while reducing happiness at higher tax rates', () => {
    const grid = createEmptyGrid();
    grid[7][5].buildingType = BuildingType.Road;
    grid[7][6].buildingType = BuildingType.Road;
    grid[6][5].buildingType = BuildingType.Residential;
    grid[6][6].buildingType = BuildingType.Commercial;

    const lowTax = stepSimulation({
      grid,
      stats: baseStats({ taxRate: 5 }),
      globalTime: INITIAL_GLOBAL_TIME,
      weatherTicks: 0,
      currentGoal: null,
      rng: () => 0.5,
    });

    const highTax = stepSimulation({
      grid,
      stats: baseStats({ taxRate: 18 }),
      globalTime: INITIAL_GLOBAL_TIME,
      weatherTicks: 0,
      currentGoal: null,
      rng: () => 0.5,
    });

    expect(highTax.nextStats.budget.residentialTax).toBeGreaterThan(
      lowTax.nextStats.budget.residentialTax,
    );
    expect(highTax.nextStats.budget.commercialIncome).toBeGreaterThan(
      lowTax.nextStats.budget.commercialIncome,
    );
    expect(highTax.nextStats.happiness).toBeLessThan(lowTax.nextStats.happiness);
  });

  it('reduces industrial income by 30% during snowy weather', () => {
    const grid = createEmptyGrid();
    grid[7][5].buildingType = BuildingType.Road;
    grid[7][6].buildingType = BuildingType.Road;
    grid[6][5].buildingType = BuildingType.Industrial;

    const sunnyRes = stepSimulation({
      grid,
      stats: baseStats({ population: 25, happiness: 50, weather: 'sunny' }),
      globalTime: INITIAL_GLOBAL_TIME,
      weatherTicks: 0,
      currentGoal: null,
      rng: () => 0.5,
    });

    const snowyRes = stepSimulation({
      grid,
      stats: baseStats({ population: 25, happiness: 50, weather: 'snowy' }),
      globalTime: INITIAL_GLOBAL_TIME,
      weatherTicks: 0,
      currentGoal: null,
      rng: () => 0.5,
    });

    const sunnyInd = sunnyRes.nextStats.budget.industrialIncome;
    const snowyInd = snowyRes.nextStats.budget.industrialIncome;
    expect(sunnyInd).toBeGreaterThan(0);
    expect(snowyInd).toBeLessThan(sunnyInd);
    expect(Math.abs(snowyInd - sunnyInd * 0.7)).toBeLessThanOrEqual(1);
  });

  it('prevents milestone progression with factories alone (0 residential population)', () => {
    const grid = createEmptyGrid();
    for (let x = 2; x <= 11; x++) {
      grid[7][x].buildingType = BuildingType.Road;
      grid[6][x].buildingType = BuildingType.Industrial;
    }

    const res = stepSimulation({
      grid,
      stats: baseStats({ money: 20000, population: 0, happiness: 100 }),
      globalTime: INITIAL_GLOBAL_TIME,
      weatherTicks: 0,
      currentGoal: null,
      rng: () => 0.5,
    });

    expect(res.nextStats.population).toBe(0);
    expect(res.nextStats.milestoneTier).toBe(0);
    expect(res.milestoneUnlocked).toBe(false);
  });
});
