import { describe, expect, it } from 'vitest';
import { computeRoadConnectivity } from '../connectivity';
import { createEmptyGrid } from '../grid';
import { INITIAL_GLOBAL_TIME, stepSimulation } from '../tick';
import { BuildingType, CityStats } from '../../types';

const baseStats = (overrides: Partial<CityStats> = {}): CityStats => ({
  money: 1000,
  population: 0,
  day: 1,
  happiness: 75,
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

describe('road connectivity (BFS)', () => {
  it('identifies the largest connected road network as mainRoads and flags buildings on isolated road stubs', () => {
    const grid = createEmptyGrid();
    // Main road strip at y=7, x=4..6 (3 tiles)
    grid[7][4].buildingType = BuildingType.Road;
    grid[7][5].buildingType = BuildingType.Road;
    grid[7][6].buildingType = BuildingType.Road;
    grid[6][5].buildingType = BuildingType.Commercial; // (5, 6) connected to main road

    // Isolated 1-tile road stub at (2, 2)
    grid[2][2].buildingType = BuildingType.Road;
    grid[1][2].buildingType = BuildingType.Commercial; // (2, 1)
    grid[2][1].buildingType = BuildingType.PowerPlant; // (1, 2)

    const result = computeRoadConnectivity(grid);

    expect(result.mainRoads.has('5,7')).toBe(true);
    expect(result.mainRoads.has('2,2')).toBe(false);
    expect(result.disconnectedTiles.has('5,6')).toBe(false);
    expect(result.disconnectedTiles.has('2,1')).toBe(true);
    expect(result.disconnectedTiles.has('1,2')).toBe(true);
  });

  it('gives zero income and zero population growth to disconnected buildings', () => {
    const disconnectedGrid = createEmptyGrid();
    disconnectedGrid[2][2].buildingType = BuildingType.Commercial;
    disconnectedGrid[10][10].buildingType = BuildingType.Residential;

    const disconnectedRes = stepSimulation({
      grid: disconnectedGrid,
      stats: baseStats(),
      globalTime: INITIAL_GLOBAL_TIME,
      weatherTicks: 0,
      currentGoal: null,
      rng: () => 0.5,
    });

    expect(disconnectedRes.nextStats.population).toBe(0);
    expect(disconnectedRes.nextStats.budget.commercialIncome).toBe(0);
    expect(disconnectedRes.nextStats.budget.upkeep).toBe(4);

    const connectedGrid = createEmptyGrid();
    connectedGrid[3][2].buildingType = BuildingType.Road;
    connectedGrid[3][3].buildingType = BuildingType.Road;
    connectedGrid[2][2].buildingType = BuildingType.Commercial;
    connectedGrid[4][3].buildingType = BuildingType.Residential;

    const connectedRes = stepSimulation({
      grid: connectedGrid,
      stats: baseStats({ population: 25 }),
      globalTime: INITIAL_GLOBAL_TIME,
      weatherTicks: 0,
      currentGoal: null,
      rng: () => 0.5,
    });

    expect(connectedRes.nextStats.population).toBeGreaterThan(25);
    expect(connectedRes.nextStats.budget.commercialIncome).toBeGreaterThan(0);
  });
});
