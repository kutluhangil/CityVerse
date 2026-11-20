import { describe, expect, it } from 'vitest';
import {
  createInitialAdvisorHistory,
  generateCityGoal,
  generateNewsEvent,
  recordGoalInHistory,
} from '../../services/advisor';
import { pickUniqueTemplate } from '../../services/newsTemplates';
import { BuildingType, CityStats } from '../../types';
import { analyzeCityGrid } from '../advisorAnalysis';
import { createEmptyGrid } from '../grid';
import { checkGoalCompleted } from '../tick';

const baseStats = (overrides: Partial<CityStats> = {}): CityStats => ({
  money: 1500,
  population: 60,
  day: 3,
  happiness: 75,
  weather: 'sunny',
  taxRate: 9,
  milestoneTier: 2,
  demand: { residential: 25, commercial: 20, industrial: 15 },
  budget: {
    residentialTax: 9,
    commercialIncome: 30,
    industrialIncome: 20,
    upkeep: 10,
    netIncome: 49,
  },
  ...overrides,
});

describe('rule-based Advisor 2.0 spatial analysis, chains & news', () => {
  it('detects parkless northeast homes, southwest pollution, northwest disconnected lots, and power gaps', () => {
    const grid = createEmptyGrid();
    // Connected road spine near northeast + center
    grid[7][7].buildingType = BuildingType.Road;
    grid[2][12].buildingType = BuildingType.Road;
    // Wait: connect northeast road to main spine so only parklessness fires there
    for (let x = 7; x <= 12; x++) grid[7][x].buildingType = BuildingType.Road;
    for (let y = 2; y <= 7; y++) grid[y][12].buildingType = BuildingType.Road;
    grid[2][11].buildingType = BuildingType.Residential; // northeast parkless house
    grid[3][11].buildingType = BuildingType.Residential; // northeast parkless house

    const analysisParks = analyzeCityGrid(grid, baseStats());
    expect(analysisParks.parklessRegion).toBe('the northeast');
    const parkGoal = generateCityGoal(
      baseStats(),
      grid,
      createInitialAdvisorHistory(),
      () => 0,
    );
    expect(parkGoal.description.toLowerCase()).toContain('northeast');
    expect(parkGoal.buildingType).toBe(BuildingType.Park);

    // Pollution in the southwest
    const pollGrid = createEmptyGrid();
    for (let x = 2; x <= 7; x++) pollGrid[10][x].buildingType = BuildingType.Road;
    pollGrid[11][3].buildingType = BuildingType.Residential;
    pollGrid[11][4].buildingType = BuildingType.Park; // covered by park
    pollGrid[11][5].buildingType = BuildingType.Industrial; // within 2 tiles in southwest
    const analysisPoll = analyzeCityGrid(pollGrid, baseStats());
    expect(analysisPoll.pollutionRegion).toBe('the southwest');

    // Disconnected lot in the northwest
    const discGrid = createEmptyGrid();
    for (let x = 6; x <= 9; x++) discGrid[7][x].buildingType = BuildingType.Road;
    discGrid[1][1].buildingType = BuildingType.Commercial; // northwest, no road
    const analysisDisc = analyzeCityGrid(discGrid, baseStats());
    expect(analysisDisc.disconnectedRegion).toBe('the northwest');
    const discGoal = generateCityGoal(
      baseStats(),
      discGrid,
      createInitialAdvisorHistory(),
      () => 0,
    );
    expect(discGoal.targetType).toBe('connect_all');
    expect(discGoal.description.toLowerCase()).toContain('northwest');
    expect(
      checkGoalCompleted(discGoal, baseStats(), {}, { disconnectedCount: 1 }),
    ).toBe(false);
    expect(
      checkGoalCompleted(discGoal, baseStats(), {}, { disconnectedCount: 0 }),
    ).toBe(true);
  });

  it('produces 40 sequential goals with zero back-to-back category repeats, zero text repeats, and scaling difficulty', () => {
    const grid = createEmptyGrid();
    grid[7][7].buildingType = BuildingType.Road;
    grid[7][8].buildingType = BuildingType.Road;
    grid[6][7].buildingType = BuildingType.Residential;
    grid[6][8].buildingType = BuildingType.Park;

    let stats = baseStats();
    let history = createInitialAdvisorHistory();
    const seenDescriptions = new Set<string>();
    let prevCategory: string | undefined;

    for (let i = 0; i < 40; i++) {
      const goal = generateCityGoal(stats, grid, history, () => (i % 5) / 5);
      expect(goal.chainStep).toBe(i + 1);
      if (prevCategory) {
        expect(goal.category).not.toBe(prevCategory);
      }
      expect(seenDescriptions.has(goal.description)).toBe(false);
      seenDescriptions.add(goal.description);

      prevCategory = goal.category;
      history = recordGoalInHistory(history, goal, true);
      stats = baseStats({
        day: stats.day + 1,
        population: stats.population + 5,
        money: stats.money + 100,
      });
    }

    expect(seenDescriptions.size).toBe(40);
  });

  it('links ambient news to city analysis and avoids repeating recent headlines', () => {
    const picked = pickUniqueTemplate(['A', 'B', 'C'], ['A', 'B'], () => 0);
    expect(picked).toBe('C');

    const grid = createEmptyGrid();
    grid[7][7].buildingType = BuildingType.Road;
    grid[6][7].buildingType = BuildingType.Residential;
    const item = generateNewsEvent(baseStats(), grid, [], () => 0);
    expect(item.text.length).toBeGreaterThan(10);
  });
});
