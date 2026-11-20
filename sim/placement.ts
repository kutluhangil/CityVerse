import { BUILDINGS, FOREST_CLEAR_COST } from '../constants';
import { BuildingType, Grid, MilestoneTier, NewsItem, TileData } from '../types';
import { MILESTONES } from './milestones';
import { getUpgradeCost, MAX_BUILDING_LEVEL } from './refund';

const PLACEABLE_TYPES = new Set<BuildingType>([
  BuildingType.Road,
  BuildingType.Residential,
  BuildingType.Commercial,
  BuildingType.Industrial,
  BuildingType.Park,
  BuildingType.ParkPlayground,
  BuildingType.ParkFountain,
  BuildingType.PowerPlant,
  BuildingType.FireStation,
  BuildingType.PoliceStation,
  BuildingType.School,
  BuildingType.Hospital,
]);

export const isPlaceableBuilding = (tool: BuildingType): boolean =>
  PLACEABLE_TYPES.has(tool);

export const isUpgradeableTile = (tile: TileData): boolean =>
  tile.buildingType !== BuildingType.None &&
  tile.buildingType !== BuildingType.Road &&
  PLACEABLE_TYPES.has(tile.buildingType);

export const hasBuildingInRadius = (
  grid: Grid,
  x: number,
  y: number,
  type: BuildingType,
  radius: number,
): boolean => {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx === 0 && dy === 0) continue;
      const cx = x + dx;
      const cy = y + dy;
      if (cy >= 0 && cy < grid.length && cx >= 0 && cx < grid[cy].length) {
        if (grid[cy][cx].buildingType === type) return true;
      }
    }
  }
  return false;
};

export type PlacementValidation =
  | { ok: true; cost: number }
  | { ok: false; reason?: string; newsType?: NewsItem['type'] };

export const validatePlacement = (
  grid: Grid,
  x: number,
  y: number,
  tool: BuildingType,
  money: number,
  milestoneTier: MilestoneTier = 0,
): PlacementValidation => {
  if (y < 0 || y >= grid.length || x < 0 || x >= grid[y].length) {
    return { ok: false };
  }
  if (!isPlaceableBuilding(tool)) {
    return { ok: false };
  }
  if (grid[y][x].buildingType !== BuildingType.None) {
    return { ok: false, reason: 'Tile is occupied.', newsType: 'neutral' };
  }
  const terrain = grid[y][x].terrain ?? 'land';
  if (terrain === 'water') {
    return {
      ok: false,
      reason: 'Cannot build on water.',
      newsType: 'negative',
    };
  }
  if (terrain === 'forest') {
    return {
      ok: false,
      reason: `Clear forest first (Demolish, $${FOREST_CLEAR_COST}).`,
      newsType: 'neutral',
    };
  }

  const requiredTier = BUILDINGS[tool].unlockTier ?? 0;
  if (requiredTier > milestoneTier) {
    const milestoneName = MILESTONES[requiredTier]?.name ?? 'a higher tier';
    return {
      ok: false,
      reason: `${BUILDINGS[tool].name} unlocks at ${milestoneName}.`,
      newsType: 'neutral',
    };
  }

  if (tool !== BuildingType.Road && tool !== BuildingType.Park) {
    if (!hasBuildingInRadius(grid, x, y, BuildingType.Road, 1)) {
      return {
        ok: false,
        reason: 'Buildings must be placed next to a road.',
        newsType: 'negative',
      };
    }
  }

  if (
    tool === BuildingType.Industrial &&
    hasBuildingInRadius(grid, x, y, BuildingType.Residential, 3)
  ) {
    return {
      ok: false,
      reason: 'Zoning error: Industrial cannot be within 3 blocks of Residential.',
      newsType: 'neutral',
    };
  }

  if (
    tool === BuildingType.Residential &&
    hasBuildingInRadius(grid, x, y, BuildingType.Industrial, 3)
  ) {
    return {
      ok: false,
      reason: 'Zoning error: Residential cannot be within 3 blocks of Industrial.',
      newsType: 'neutral',
    };
  }

  const cost = BUILDINGS[tool].cost;
  if (money < cost) {
    return {
      ok: false,
      reason: `Treasury insufficient for ${BUILDINGS[tool].name}.`,
      newsType: 'negative',
    };
  }

  return { ok: true, cost };
};

export type UpgradeValidation =
  | { ok: true; nextLevel: number; cost: number }
  | { ok: false; reason?: string; newsType?: NewsItem['type'] };

export const validateUpgrade = (
  tile: TileData,
  money: number,
): UpgradeValidation => {
  if (!isUpgradeableTile(tile)) {
    return { ok: false };
  }

  const currentLevel = tile.level ?? 1;
  if (currentLevel >= MAX_BUILDING_LEVEL) {
    return {
      ok: false,
      reason: 'Building is already at maximum level.',
      newsType: 'neutral',
    };
  }

  const cost = getUpgradeCost(currentLevel);
  if (money < cost) {
    return {
      ok: false,
      reason: 'Insufficient funds to upgrade building.',
      newsType: 'negative',
    };
  }

  return { ok: true, nextLevel: currentLevel + 1, cost };
};
