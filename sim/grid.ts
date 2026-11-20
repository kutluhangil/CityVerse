import { GRID_SIZE } from '../constants';
import { BuildingType, Grid } from '../types';

export const MAX_GRID_SIZE = 33;
export const GRID_EXPAND_STEP = 6;
export const ALLOWED_GRID_SIZES = [15, 21, 27, 33] as const;

export const getExpansionCost = (currentSize: number): number | null => {
  if (currentSize < 21) return 600;
  if (currentSize < 27) return 1400;
  if (currentSize < MAX_GRID_SIZE) return 2600;
  return null;
};

export const createEmptyGrid = (size = GRID_SIZE): Grid =>
  Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => ({
      x,
      y,
      buildingType: BuildingType.None,
      terrain: 'land',
      level: 1,
    })),
  );

const WATER_COORDS: [number, number][] = [
  [0, 0],
  [1, 0],
  [2, 0],
  [0, 1],
  [1, 1],
  [2, 1],
  [0, 2],
  [1, 2],
  [12, 11],
  [12, 12],
  [12, 13],
  [12, 14],
  [13, 10],
  [13, 11],
  [13, 12],
  [13, 13],
  [13, 14],
  [14, 9],
  [14, 10],
  [14, 11],
  [14, 12],
  [14, 13],
  [14, 14],
];

const FOREST_COORDS: [number, number][] = [
  [1, 4],
  [1, 5],
  [2, 4],
  [1, 10],
  [2, 11],
  [11, 1],
  [12, 2],
  [13, 2],
  [10, 12],
  [9, 13],
];

const isProtectedTownPlot = (x: number, y: number): boolean =>
  (x >= 4 && x <= 10 && y >= 4 && y <= 10) ||
  (x === 3 && (y === 6 || y === 7));

export const createInitialGrid = (): Grid => {
  const grid = createEmptyGrid();
  const center = Math.floor(GRID_SIZE / 2);

  // Pre-build a small intersection and town for the live demo
  for (let x = center - 3; x <= center + 3; x++) {
    grid[center][x].buildingType = BuildingType.Road;
  }
  for (let y = center - 3; y <= center + 3; y++) {
    grid[y][center].buildingType = BuildingType.Road;
  }

  grid[center - 1][center - 1].buildingType = BuildingType.Commercial;
  grid[center - 1][center + 1].buildingType = BuildingType.Residential;
  grid[center + 1][center - 1].buildingType = BuildingType.Residential;
  grid[center + 1][center + 1].buildingType = BuildingType.ParkFountain;

  grid[center - 2][center - 1].buildingType = BuildingType.Commercial;
  grid[center - 2][center + 1].buildingType = BuildingType.Residential;

  grid[center + 2][center + 1].buildingType = BuildingType.ParkPlayground;
  grid[center + 2][center - 1].buildingType = BuildingType.Park;

  for (const [wx, wy] of WATER_COORDS) {
    if (wy < GRID_SIZE && wx < GRID_SIZE && !isProtectedTownPlot(wx, wy)) {
      grid[wy][wx].terrain = 'water';
    }
  }

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (isProtectedTownPlot(x, y)) continue;
      if (grid[y][x].terrain !== 'land') continue;
      const onRim =
        x === 0 || x === GRID_SIZE - 1 || y === 0 || y === GRID_SIZE - 1;
      const nearWater = [
        grid[y - 1]?.[x],
        grid[y + 1]?.[x],
        grid[y]?.[x - 1],
        grid[y]?.[x + 1],
      ].some((n) => n?.terrain === 'water');
      if (onRim || nearWater) {
        grid[y][x].terrain = 'sand';
      }
    }
  }

  for (const [fx, fy] of FOREST_COORDS) {
    if (
      fy < GRID_SIZE &&
      fx < GRID_SIZE &&
      !isProtectedTownPlot(fx, fy) &&
      grid[fy][fx].buildingType === BuildingType.None &&
      grid[fy][fx].terrain === 'land'
    ) {
      grid[fy][fx].terrain = 'forest';
    }
  }

  return grid;
};

export const expandGrid = (grid: Grid): Grid => {
  const currentSize = grid.length;
  if (currentSize >= MAX_GRID_SIZE) return grid;

  const offset = GRID_EXPAND_STEP / 2;
  const nextSize = currentSize + GRID_EXPAND_STEP;
  const next = createEmptyGrid(nextSize);

  for (let y = 0; y < currentSize; y++) {
    for (let x = 0; x < currentSize; x++) {
      const old = grid[y][x];
      const nearWater = [
        grid[y - 1]?.[x],
        grid[y + 1]?.[x],
        grid[y]?.[x - 1],
        grid[y]?.[x + 1],
      ].some((n) => n?.terrain === 'water');
      const convertRimSand = old.terrain === 'sand' && !nearWater;

      next[y + offset][x + offset] = {
        ...old,
        x: x + offset,
        y: y + offset,
        terrain: convertRimSand ? 'land' : (old.terrain ?? 'land'),
      };
    }
  }

  const inNewRing = (x: number, y: number) =>
    x < offset ||
    x >= nextSize - offset ||
    y < offset ||
    y >= nextSize - offset;

  // Deterministic corner coves in new outer ring
  for (let y = 0; y < nextSize; y++) {
    for (let x = 0; x < nextSize; x++) {
      if (!inNewRing(x, y)) continue;
      const inNwCove = x <= 1 && y <= 2 && x + y <= 2;
      const inSeCove = x >= nextSize - 2 && y >= nextSize - 2;
      if (inNwCove || inSeCove) {
        next[y][x].terrain = 'water';
      }
    }
  }

  for (let y = 0; y < nextSize; y++) {
    for (let x = 0; x < nextSize; x++) {
      if (!inNewRing(x, y) || next[y][x].terrain !== 'land') continue;
      const onRim = x === 0 || x === nextSize - 1 || y === 0 || y === nextSize - 1;
      const nearWater = [
        next[y - 1]?.[x],
        next[y + 1]?.[x],
        next[y]?.[x - 1],
        next[y]?.[x + 1],
      ].some((n) => n?.terrain === 'water');
      if (onRim || nearWater) {
        next[y][x].terrain = 'sand';
      } else if ((x * 5 + y * 11) % 9 === 0) {
        next[y][x].terrain = 'forest';
      }
    }
  }

  return next;
};
