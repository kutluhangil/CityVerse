import { BUILDINGS, REPAIR_COST_BASE } from '../constants';
import { TileData } from '../types';

export const MAX_BUILDING_LEVEL = 3;

export const getUpgradeCost = (currentLevel: number): number => 100 * currentLevel;

export const getRepairCost = (tile: TileData): number => {
  const base = BUILDINGS[tile.buildingType]?.cost ?? 100;
  const level = tile.level ?? 1;
  return Math.max(REPAIR_COST_BASE, Math.round(base * 0.35 * level));
};

/** Unified demolish/redevelop refund across tools and inspector. */
export const calculateDemolishRefund = (tile: TileData): number => {
  const baseCost = BUILDINGS[tile.buildingType]?.cost ?? 0;
  const level = tile.level ?? 1;
  return Math.floor(baseCost * 0.5) + (level > 1 ? (level - 1) * 25 : 0);
};
