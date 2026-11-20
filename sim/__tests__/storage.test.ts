import { describe, expect, it } from 'vitest';
import { createInitialGrid } from '../grid';
import { parseSave, SAVE_VERSION, serializeSave } from '../storage';
import { BuildingType, CityGoal, CityStats, NewsItem } from '../../types';

const sampleStats: CityStats = {
  money: 2450,
  population: 120,
  day: 7,
  happiness: 84,
  weather: 'rainy',
  taxRate: 9,
  milestoneTier: 0,
  demand: { residential: 30, commercial: 15, industrial: 15 },
  budget: {
    residentialTax: 18,
    commercialIncome: 30,
    industrialIncome: 0,
    upkeep: 7,
    netIncome: 41,
  },
};

const sampleGoal: CityGoal = {
  description: 'Build 2 parks',
  targetType: 'building_count',
  buildingType: BuildingType.Park,
  targetValue: 3,
  reward: 200,
  completed: false,
};

const sampleNews: NewsItem[] = [
  { id: '1', text: 'City is growing.', type: 'positive' },
];

describe('storage serialization & validation', () => {
  it('round-trips version 1 save payloads cleanly', () => {
    const grid = createInitialGrid();
    grid[7][3].buildingType = BuildingType.Road;
    grid[6][3].buildingType = BuildingType.Residential;
    grid[6][3].level = 2;

    const raw = serializeSave({
      grid,
      stats: sampleStats,
      newsFeed: sampleNews,
      currentGoal: sampleGoal,
      globalTime: 3.14,
      maxCars: 10,
      gameSpeed: 2,
    });

    const parsed = parseSave(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.version).toBe(SAVE_VERSION);
    expect(parsed?.stats).toEqual(sampleStats);
    expect(parsed?.grid[7][3].buildingType).toBe(BuildingType.Road);
    expect(parsed?.grid[6][3].level).toBe(2);
    expect(parsed?.currentGoal).toEqual(sampleGoal);
    expect(parsed?.newsFeed).toEqual(sampleNews);
    expect(parsed?.maxCars).toBe(10);
    expect(parsed?.gameSpeed).toBe(2);
  });

  it('rejects corrupt JSON, wrong versions, invalid grid sizes, and bad weather', () => {
    expect(parseSave('not-json')).toBeNull();

    const grid = createInitialGrid();
    const base = {
      version: 1,
      grid,
      stats: sampleStats,
    };

    expect(parseSave(JSON.stringify({ ...base, version: 99 }))).toBeNull();
    expect(parseSave(JSON.stringify({ ...base, grid: grid.slice(0, 5) }))).toBeNull();
    expect(
      parseSave(
        JSON.stringify({
          ...base,
          stats: { ...sampleStats, weather: 'tornado' },
        }),
      ),
    ).toBeNull();
  });

  it('upgrades unversioned legacy saves when grid and stats are valid', () => {
    const grid = createInitialGrid();
    const legacy = JSON.stringify({
      grid,
      stats: sampleStats,
      globalTime: 1.5,
    });

    const parsed = parseSave(legacy);
    expect(parsed).not.toBeNull();
    expect(parsed?.version).toBe(SAVE_VERSION);
    expect(parsed?.stats.money).toBe(2450);
    expect(parsed?.gameSpeed).toBe(1);
    expect(parsed?.maxCars).toBe(6);
  });

  it('fills valid defaults for pre-Faz-4 saves missing taxRate, milestoneTier, demand, and budget', () => {
    const grid = createInitialGrid();
    const preFaz4 = JSON.stringify({
      version: 1,
      savedAt: new Date().toISOString(),
      grid,
      stats: {
        money: 1500,
        population: 60,
        day: 4,
        happiness: 78,
        weather: 'sunny',
      },
      globalTime: 2.0,
    });

    const parsed = parseSave(preFaz4);
    expect(parsed).not.toBeNull();
    expect(parsed?.stats.taxRate).toBe(9);
    expect(parsed?.stats.milestoneTier).toBe(0);
    expect(parsed?.stats.demand).toEqual({
      residential: 30,
      commercial: 15,
      industrial: 15,
    });
    expect(parsed?.stats.budget).toEqual({
      residentialTax: 0,
      commercialIncome: 0,
      industrialIncome: 0,
      upkeep: 0,
      netIncome: 0,
    });
  });
});
