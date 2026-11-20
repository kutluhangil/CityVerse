import { describe, expect, it } from 'vitest';
import { FOREST_CLEAR_COST } from '../../constants';
import { BuildingType } from '../../types';
import { createEmptyGrid, createInitialGrid } from '../grid';
import { validatePlacement } from '../placement';
import { parseSave, serializeSave } from '../storage';

describe('terrain generation, placement rules & storage compatibility', () => {
  it('populates island water, sand, and forest tiles while keeping central starter plots buildable', () => {
    const grid = createInitialGrid();
    const flat = grid.flat();

    expect(flat.some((t) => t.terrain === 'water')).toBe(true);
    expect(flat.some((t) => t.terrain === 'sand')).toBe(true);
    expect(flat.some((t) => t.terrain === 'forest')).toBe(true);

    // Essential starter tiles & E2E plots stay clear buildable land next to main road
    expect(grid[7][3].terrain).toBe('land');
    expect(grid[7][3].buildingType).toBe(BuildingType.None);
    expect(grid[6][3].terrain).toBe('land');
    expect(grid[6][3].buildingType).toBe(BuildingType.None);
    expect(grid[7][4].buildingType).toBe(BuildingType.Road);
  });

  it('blocks building on water and uncleared forest, while allowing land and sand', () => {
    const grid = createEmptyGrid();
    grid[7][7].buildingType = BuildingType.Road;

    grid[6][7].terrain = 'water';
    const waterCheck = validatePlacement(grid, 7, 6, BuildingType.Residential, 1000);
    expect(waterCheck.ok).toBe(false);
    if (!waterCheck.ok && 'reason' in waterCheck) {
      expect(waterCheck.reason?.toLowerCase()).toContain('water');
    }

    grid[6][7].terrain = 'forest';
    const forestCheck = validatePlacement(grid, 7, 6, BuildingType.Residential, 1000);
    expect(forestCheck.ok).toBe(false);
    if (!forestCheck.ok && 'reason' in forestCheck) {
      expect(forestCheck.reason).toContain(String(FOREST_CLEAR_COST));
    }

    grid[6][7].terrain = 'sand';
    expect(validatePlacement(grid, 7, 6, BuildingType.Residential, 1000).ok).toBe(
      true,
    );
  });

  it('round-trips terrain field and accepts pre-Faz-5 saves without terrain', () => {
    const grid = createInitialGrid();
    const raw = serializeSave({
      grid,
      stats: {
        money: 1200,
        population: 50,
        day: 2,
        happiness: 85,
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
      },
      newsFeed: [],
      currentGoal: null,
      globalTime: 1,
      maxCars: 6,
      gameSpeed: 1,
    });

    const parsed = parseSave(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.grid[0][0].terrain).toBe('water');

    const legacyGrid = createEmptyGrid().map((row) =>
      row.map(({ terrain: _t, ...rest }) => rest),
    );
    const legacyObj = JSON.parse(raw);
    legacyObj.grid = legacyGrid;
    const legacyParsed = parseSave(JSON.stringify(legacyObj));
    expect(legacyParsed).not.toBeNull();
  });
});
