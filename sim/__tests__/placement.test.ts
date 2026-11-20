import { describe, expect, it } from 'vitest';
import { BuildingType, Grid } from '../../types';
import { validatePlacement, validateUpgrade } from '../placement';

const createEmptyGrid = (size = 15): Grid =>
  Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => ({
      x,
      y,
      buildingType: BuildingType.None,
      level: 1,
    })),
  );

describe('validatePlacement & validateUpgrade (B2)', () => {
  it('rejects Upgrade tool in validatePlacement so empty tiles cannot hold Upgrade buildings', () => {
    const grid = createEmptyGrid();
    grid[7][7].buildingType = BuildingType.Road;

    const res = validatePlacement(grid, 7, 6, BuildingType.Upgrade, 1000);
    expect(res.ok).toBe(false);
  });

  it('rejects Upgrade on empty tiles, roads, and max-level buildings, and allows L1/L2 buildings', () => {
    const empty = { x: 0, y: 0, buildingType: BuildingType.None, level: 1 };
    const road = { x: 1, y: 0, buildingType: BuildingType.Road, level: 1 };
    const houseL1 = { x: 2, y: 0, buildingType: BuildingType.Residential, level: 1 };
    const houseL2 = { x: 3, y: 0, buildingType: BuildingType.Residential, level: 2 };
    const houseL3 = { x: 4, y: 0, buildingType: BuildingType.Residential, level: 3 };

    expect(validateUpgrade(empty, 500)).toEqual({ ok: false });
    expect(validateUpgrade(road, 500)).toEqual({ ok: false });

    expect(validateUpgrade(houseL1, 500)).toEqual({
      ok: true,
      nextLevel: 2,
      cost: 100,
    });
    expect(validateUpgrade(houseL2, 500)).toEqual({
      ok: true,
      nextLevel: 3,
      cost: 200,
    });

    const poor = validateUpgrade(houseL2, 150);
    expect(poor.ok).toBe(false);

    const max = validateUpgrade(houseL3, 500);
    expect(max.ok).toBe(false);
  });

  it('enforces road adjacency except for Road and Park', () => {
    const grid = createEmptyGrid();
    expect(validatePlacement(grid, 7, 7, BuildingType.Road, 1000)).toEqual({
      ok: true,
      cost: 10,
    });
    expect(validatePlacement(grid, 3, 3, BuildingType.Park, 1000)).toEqual({
      ok: true,
      cost: 50,
    });

    const noRoad = validatePlacement(grid, 3, 4, BuildingType.Residential, 1000);
    expect(noRoad.ok).toBe(false);
    if ('reason' in noRoad) expect(noRoad.reason).toContain('road');

    grid[7][7].buildingType = BuildingType.Road;
    expect(validatePlacement(grid, 7, 6, BuildingType.Residential, 1000)).toEqual({
      ok: true,
      cost: 100,
    });
  });

  it('enforces 3-tile Residential/Industrial zoning separation and treasury funds', () => {
    const grid = createEmptyGrid();
    grid[7][7].buildingType = BuildingType.Road;
    grid[7][8].buildingType = BuildingType.Road;
    grid[6][7].buildingType = BuildingType.Residential;

    const tooClose = validatePlacement(grid, 8, 8, BuildingType.Industrial, 1000);
    expect(tooClose.ok).toBe(false);
    if ('reason' in tooClose) expect(tooClose.reason).toContain('Zoning error');

    const broke = validatePlacement(grid, 7, 8, BuildingType.Commercial, 50);
    expect(broke.ok).toBe(false);
    if ('reason' in broke) expect(broke.reason).toContain('insufficient');
  });
});
