import { describe, expect, it } from 'vitest';
import { BuildingType, CityGoal, CityStats } from '../../types';
import { createEmptyGrid } from '../grid';
import {
  checkGoalCompleted,
  GLOBAL_TIME_STEP,
  INITIAL_GLOBAL_TIME,
  stepSimulation,
  TICKS_PER_DAY,
} from '../tick';

const baseStats = (overrides: Partial<CityStats> = {}): CityStats => ({
  money: 1000,
  population: 0,
  day: 1,
  happiness: 50,
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

describe('stepSimulation & goals (B1, B8, B13)', () => {
  it('advances globalTime by fixed GLOBAL_TIME_STEP and increments day after 24 ticks (B1)', () => {
    const grid = createEmptyGrid();
    let stats = baseStats();
    let globalTime = INITIAL_GLOBAL_TIME;
    let weatherTicks = 0;

    // 20 ticks from PI/4 -> still inside first 2*PI cycle -> day 1 or flips right near end
    const totalPerCycle = Math.round((Math.PI * 2) / GLOBAL_TIME_STEP);
    expect(totalPerCycle).toBe(TICKS_PER_DAY);

    for (let i = 0; i < TICKS_PER_DAY; i++) {
      const res = stepSimulation({
        grid,
        stats,
        globalTime,
        weatherTicks,
        currentGoal: null,
        rng: () => 0.5,
        now: 1000,
      });
      expect(res.nextGlobalTime - globalTime).toBeCloseTo(GLOBAL_TIME_STEP, 10);
      stats = res.nextStats;
      globalTime = res.nextGlobalTime;
      weatherTicks = res.nextWeatherTicks;
    }

    // One full 24-tick solar cycle advances day from 1 to 2
    expect(stats.day).toBe(2);
  });

  it('does not apply overcrowding penalty at 90%, applies mild penalty at >=98% (B8)', () => {
    const gridAt90 = createEmptyGrid();
    gridAt90[7][6].buildingType = BuildingType.Road;
    gridAt90[7][7].buildingType = BuildingType.Residential; // maxPop = 50
    // varietyBonus = 4 (Road + Residential), weatherMod(sunny) = 2, base = 50 -> targetHappiness = 56
    const res90 = stepSimulation({
      grid: gridAt90,
      stats: baseStats({ population: 45, happiness: 50 }), // 90%
      globalTime: INITIAL_GLOBAL_TIME,
      weatherTicks: 0,
      currentGoal: null,
      rng: () => 0.5,
    });
    // Happiness ticks upward toward 56 (no -15 crash)
    expect(res90.nextStats.happiness).toBeGreaterThanOrEqual(50);

    const gridAt99 = createEmptyGrid();
    gridAt99[7][6].buildingType = BuildingType.Road;
    gridAt99[7][7].buildingType = BuildingType.Residential; // maxPop = 50
    const res99 = stepSimulation({
      grid: gridAt99,
      stats: baseStats({ population: 50, happiness: 56 }), // 100%
      globalTime: INITIAL_GLOBAL_TIME,
      weatherTicks: 0,
      currentGoal: null,
      rng: () => 0.5,
    });
    // Target drops by max 8 (56 -> 48), gentle 0.1 lerp -> 55
    expect(res99.nextStats.happiness).toBe(55);
  });

  it('counts real building tiles rather than level-weighted counts for building_count goals (B13)', () => {
    const grid = createEmptyGrid();
    // 3 level-3 houses = 9 weighted, but only 3 real tiles
    grid[7][6] = { x: 6, y: 7, buildingType: BuildingType.Residential, level: 3 };
    grid[7][7] = { x: 7, y: 7, buildingType: BuildingType.Residential, level: 3 };
    grid[7][8] = { x: 8, y: 7, buildingType: BuildingType.Residential, level: 3 };

    const goal: CityGoal = {
      description: 'Build 5 houses',
      targetType: 'building_count',
      buildingType: BuildingType.Residential,
      targetValue: 5,
      reward: 300,
      completed: false,
    };

    const resNotMet = stepSimulation({
      grid,
      stats: baseStats(),
      globalTime: INITIAL_GLOBAL_TIME,
      weatherTicks: 0,
      currentGoal: goal,
      rng: () => 0.5,
    });
    expect(resNotMet.goalCompleted).toBe(false);

    grid[6][6] = { x: 6, y: 6, buildingType: BuildingType.Residential, level: 1 };
    grid[6][7] = { x: 7, y: 6, buildingType: BuildingType.Residential, level: 1 };

    const resMet = stepSimulation({
      grid,
      stats: baseStats(),
      globalTime: INITIAL_GLOBAL_TIME,
      weatherTicks: 0,
      currentGoal: goal,
      rng: () => 0.5,
    });
    expect(resMet.goalCompleted).toBe(true);

    expect(
      checkGoalCompleted(
        { ...goal, targetType: 'population', targetValue: 10 },
        baseStats({ population: 9.9 }),
        {},
      ),
    ).toBe(false);
  });

  it('applies industrial pollution within 2 tiles but not 4 tiles away', () => {
    const nearGrid = createEmptyGrid();
    nearGrid[6][7].buildingType = BuildingType.Road;
    nearGrid[6][8].buildingType = BuildingType.Road;
    nearGrid[6][9].buildingType = BuildingType.Road;
    nearGrid[7][7].buildingType = BuildingType.Residential;
    nearGrid[7][9].buildingType = BuildingType.Industrial; // distance 2

    const farGrid = createEmptyGrid();
    farGrid[6][7].buildingType = BuildingType.Road;
    farGrid[6][8].buildingType = BuildingType.Road;
    farGrid[6][9].buildingType = BuildingType.Road;
    farGrid[6][10].buildingType = BuildingType.Road;
    farGrid[6][11].buildingType = BuildingType.Road;
    farGrid[7][7].buildingType = BuildingType.Residential;
    farGrid[7][11].buildingType = BuildingType.Industrial; // distance 4

    const nearRes = stepSimulation({
      grid: nearGrid,
      stats: baseStats({ happiness: 80 }),
      globalTime: INITIAL_GLOBAL_TIME,
      weatherTicks: 0,
      currentGoal: null,
      rng: () => 0.5,
    });
    const farRes = stepSimulation({
      grid: farGrid,
      stats: baseStats({ happiness: 80 }),
      globalTime: INITIAL_GLOBAL_TIME,
      weatherTicks: 0,
      currentGoal: null,
      rng: () => 0.5,
    });

    expect(nearRes.nextStats.happiness).toBeLessThan(farRes.nextStats.happiness);
  });
});
