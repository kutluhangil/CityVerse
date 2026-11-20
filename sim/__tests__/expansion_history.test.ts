import { describe, expect, it } from 'vitest';
import {
  createEmptyGrid,
  createInitialGrid,
  expandGrid,
  getExpansionCost,
  MAX_GRID_SIZE,
} from '../grid';
import {
  createHistoryStack,
  pushSnapshot,
  redoHistory,
  undoHistory,
} from '../history';
import { parseSave, serializeSave } from '../storage';
import { BuildingType, CityStats } from '../../types';

const sampleStats: CityStats = {
  money: 2000,
  population: 50,
  day: 3,
  happiness: 85,
  weather: 'sunny',
  taxRate: 9,
  milestoneTier: 0,
  demand: { residential: 30, commercial: 15, industrial: 15 },
  budget: {
    residentialTax: 10,
    commercialIncome: 15,
    industrialIncome: 0,
    upkeep: 2,
    netIncome: 23,
  },
};

describe('dynamic grid expansion', () => {
  it('returns tiered expansion costs and stops at MAX_GRID_SIZE', () => {
    expect(getExpansionCost(15)).toBe(600);
    expect(getExpansionCost(21)).toBe(1400);
    expect(getExpansionCost(27)).toBe(2600);
    expect(getExpansionCost(MAX_GRID_SIZE)).toBeNull();
  });

  it('expands 15 -> 21 -> 27 -> 33 while shifting coordinates by +3,+3', () => {
    const base = createInitialGrid();
    base[7][3].buildingType = BuildingType.Road;
    base[6][3].buildingType = BuildingType.Residential;
    base[6][3].level = 3;
    base[6][3].isDamaged = true;

    const g21 = expandGrid(base);
    expect(g21.length).toBe(21);
    expect(g21[10][6].buildingType).toBe(BuildingType.Road);
    expect(g21[9][6]).toMatchObject({
      x: 6,
      y: 9,
      buildingType: BuildingType.Residential,
      level: 3,
      isDamaged: true,
    });

    const g27 = expandGrid(g21);
    const g33 = expandGrid(g27);
    const capped = expandGrid(g33);
    expect(g27.length).toBe(27);
    expect(g33.length).toBe(33);
    expect(capped).toBe(g33);
  });

  it('validates expanded saves and rejects unsupported sizes', () => {
    const g21 = expandGrid(createInitialGrid());
    const raw = serializeSave({
      grid: g21,
      stats: sampleStats,
      newsFeed: [],
      currentGoal: null,
      globalTime: 1,
      maxCars: 6,
      gameSpeed: 1,
    });
    expect(parseSave(raw)?.grid.length).toBe(21);

    const badRaw = serializeSave({
      grid: createEmptyGrid(5),
      stats: sampleStats,
      newsFeed: [],
      currentGoal: null,
      globalTime: 1,
      maxCars: 6,
      gameSpeed: 1,
    });
    expect(parseSave(badRaw)).toBeNull();
  });
});

describe('undo/redo history stack', () => {
  it('isolates grid clones, undoes, redoes, clears future, and caps length', () => {
    const g0 = createInitialGrid();
    const g1 = createInitialGrid();
    g1[7][3].buildingType = BuildingType.Road;
    const g2 = createInitialGrid();
    g2[7][3].buildingType = BuildingType.Road;
    g2[6][3].buildingType = BuildingType.Residential;

    let stack = createHistoryStack(2);
    stack = pushSnapshot(stack, { grid: g0, money: 500 });
    g0[0][0].buildingType = BuildingType.Park; // mutate caller grid after push
    expect(stack.past[0].grid[0][0].buildingType).toBe(BuildingType.None);

    stack = pushSnapshot(stack, { grid: g1, money: 480 });
    stack = pushSnapshot(stack, { grid: g2, money: 380 });
    expect(stack.past).toHaveLength(2);
    expect(stack.past[0].money).toBe(480);

    const undo1 = undoHistory(stack, { grid: g2, money: 300 });
    expect(undo1.snapshot?.money).toBe(380);
    expect(undo1.stack.future).toHaveLength(1);

    const redo1 = redoHistory(undo1.stack, { grid: g1, money: 380 });
    expect(redo1.snapshot?.money).toBe(300);
    expect(redo1.stack.future).toHaveLength(0);

    const cleared = pushSnapshot(undo1.stack, { grid: g1, money: 350 });
    expect(cleared.future).toHaveLength(0);
  });
});
