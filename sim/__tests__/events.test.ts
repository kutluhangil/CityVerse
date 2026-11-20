import { describe, expect, it } from 'vitest';
import { BuildingType, CityStats } from '../../types';
import { MIN_EVENT_COOLDOWN_TICKS, stepCityEvent } from '../events';
import { createEmptyGrid } from '../grid';
import { getRepairCost } from '../refund';
import { parseSave, serializeSave } from '../storage';
import { checkGoalCompleted, INITIAL_GLOBAL_TIME, stepSimulation } from '../tick';

const baseStats = (overrides: Partial<CityStats> = {}): CityStats => ({
  money: 2000,
  population: 60,
  day: 3,
  happiness: 75,
  weather: 'sunny',
  taxRate: 9,
  milestoneTier: 1,
  demand: { residential: 30, commercial: 20, industrial: 15 },
  budget: {
    residentialTax: 9,
    commercialIncome: 30,
    industrialIncome: 25,
    upkeep: 10,
    netIncome: 54,
  },
  activeEvent: null,
  ...overrides,
});

describe('city random events, damaged tiles & repairs', () => {
  it('enforces cooldown before triggering events and triggers deterministic fire / festival / strike', () => {
    const grid = createEmptyGrid();
    grid[7][6].buildingType = BuildingType.Road;
    grid[7][7].buildingType = BuildingType.Road;
    grid[6][6].buildingType = BuildingType.Commercial;
    grid[6][7].buildingType = BuildingType.Industrial;

    const blockedBeforeCooldown = stepCityEvent({
      grid,
      stats: baseStats(),
      eventTicks: 2,
      disconnectedTiles: new Set(),
      rng: () => 0.01,
    });
    expect(blockedBeforeCooldown.nextEvent).toBeNull();
    expect(blockedBeforeCooldown.nextEventTicks).toBe(3);

    // Deterministic roll: rng() < 0.08 triggers -> first call 0.01 (< 0.08),
    // second call 0.0 picks index 0 ('fire'), third call 0.0 picks target[0]
    let seq = 0;
    const fireRolls = [0.01, 0.0, 0.0, 0.0];
    const fireRes = stepCityEvent({
      grid,
      stats: baseStats(),
      eventTicks: MIN_EVENT_COOLDOWN_TICKS,
      disconnectedTiles: new Set(),
      rng: () => fireRolls[seq++] ?? 0.0,
      now: 1234,
    });
    expect(fireRes.nextEvent?.type).toBe('fire');
    expect(fireRes.damagedTile).toEqual({ x: 6, y: 6 });
    // Pure: input grid not mutated in place
    expect(grid[6][6].isDamaged).toBeUndefined();

    // Festival roll: pool has ['fire', 'festival'], index 1 -> 0.7
    let fSeq = 0;
    const festRolls = [0.01, 0.7, 0.0];
    const festRes = stepCityEvent({
      grid,
      stats: baseStats(),
      eventTicks: MIN_EVENT_COOLDOWN_TICKS,
      disconnectedTiles: new Set(),
      rng: () => festRolls[fSeq++] ?? 0.0,
      now: 1235,
    });
    expect(festRes.nextEvent?.type).toBe('festival');

    // Strike roll with high taxRate (pool has ['fire', 'festival', 'strike'], index 2 -> 0.85)
    let sSeq = 0;
    const strikeRolls = [0.01, 0.85, 0.0];
    const strikeRes = stepCityEvent({
      grid,
      stats: baseStats({ taxRate: 15 }),
      eventTicks: MIN_EVENT_COOLDOWN_TICKS,
      disconnectedTiles: new Set(),
      rng: () => strikeRolls[sSeq++] ?? 0.0,
      now: 1236,
    });
    expect(strikeRes.nextEvent?.type).toBe('strike');
  });

  it('halts output on damaged buildings, supports repairs, and modifies economy on festival / strike', () => {
    const grid = createEmptyGrid();
    grid[7][5].buildingType = BuildingType.Road;
    grid[7][6].buildingType = BuildingType.Road;
    grid[6][5].buildingType = BuildingType.Commercial;
    grid[6][6].buildingType = BuildingType.Industrial;

    // Damaged shop produces 0 commercial income; strike reduces industrial income
    grid[6][5].isDamaged = true;
    const strikeAndDamaged = stepSimulation({
      grid,
      stats: baseStats({
        activeEvent: {
          id: 'e1',
          type: 'strike',
          title: 'Industry Strike',
          description: '-40% industry',
          ticksRemaining: 3,
          totalTicks: 7,
        },
      }),
      globalTime: INITIAL_GLOBAL_TIME,
      weatherTicks: 0,
      eventTicks: 0,
      currentGoal: {
        description: 'Repair damaged lots.',
        targetType: 'repair_all',
        targetValue: 0,
        reward: 300,
        completed: false,
      },
      rng: () => 0.5,
    });
    expect(strikeAndDamaged.nextStats.budget.commercialIncome).toBe(0);
    expect(strikeAndDamaged.goalCompleted).toBe(false);

    // Repair shop + switch to festival -> commerce boosts +25% and repair goal completes
    const cost = getRepairCost(grid[6][5]);
    expect(cost).toBeGreaterThanOrEqual(45);
    grid[6][5].isDamaged = false;

    const normalRes = stepSimulation({
      grid,
      stats: baseStats({ activeEvent: null }),
      globalTime: INITIAL_GLOBAL_TIME,
      weatherTicks: 0,
      eventTicks: 0,
      currentGoal: null,
      rng: () => 0.5,
    });

    const festRes = stepSimulation({
      grid,
      stats: baseStats({
        activeEvent: {
          id: 'e2',
          type: 'festival',
          title: 'Lantern Festival',
          description: '+25% trade',
          ticksRemaining: 3,
          totalTicks: 8,
        },
      }),
      globalTime: INITIAL_GLOBAL_TIME,
      weatherTicks: 0,
      eventTicks: 0,
      currentGoal: null,
      rng: () => 0.5,
    });

    expect(festRes.nextStats.budget.commercialIncome).toBeGreaterThan(
      normalRes.nextStats.budget.commercialIncome,
    );
    expect(
      checkGoalCompleted(
        {
          description: 'Repair',
          targetType: 'repair_all',
          targetValue: 0,
          reward: 300,
          completed: false,
        },
        festRes.nextStats,
        {},
        { damagedCount: 0 },
      ),
    ).toBe(true);
  });

  it('persists isDamaged, activeEvent, advisorHistory & new goal targetTypes cleanly', () => {
    const grid = createEmptyGrid();
    grid[7][6].buildingType = BuildingType.Road;
    grid[6][6] = {
      x: 6,
      y: 6,
      buildingType: BuildingType.Commercial,
      isDamaged: true,
      level: 2,
    };

    const raw = serializeSave({
      grid,
      stats: baseStats({
        activeEvent: {
          id: 'ev1',
          type: 'fire',
          title: 'Structural Fire',
          description: 'Damaged plot',
          ticksRemaining: 4,
          totalTicks: 6,
          affectedTile: { x: 6, y: 6 },
        },
      }),
      newsFeed: [],
      currentGoal: {
        description: 'Repair block',
        targetType: 'repair_all',
        targetValue: 0,
        reward: 300,
        completed: false,
        category: 'repair',
        chainStep: 3,
      },
      advisorHistory: {
        completedCount: 2,
        lastCategory: 'repair',
        recentDescriptions: ['Old goal'],
      },
      globalTime: 1,
      maxCars: 6,
      gameSpeed: 1,
    });

    const parsed = parseSave(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.grid[6][6].isDamaged).toBe(true);
    expect(parsed?.stats.activeEvent?.type).toBe('fire');
    expect(parsed?.stats.activeEvent?.affectedTile).toEqual({ x: 6, y: 6 });
    expect(parsed?.advisorHistory?.completedCount).toBe(2);
    expect(parsed?.currentGoal?.targetType).toBe('repair_all');
    expect(parsed?.currentGoal?.chainStep).toBe(3);
  });
});
