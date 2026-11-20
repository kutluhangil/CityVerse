import { describe, expect, it } from 'vitest';
import { BuildingType, TileData } from '../../types';
import {
  calculateDemolishRefund,
  getUpgradeCost,
  MAX_BUILDING_LEVEL,
} from '../refund';

const makeTile = (buildingType: BuildingType, level = 1): TileData => ({
  x: 0,
  y: 0,
  buildingType,
  level,
});

describe('refund & upgrade costs (B9)', () => {
  it('computes upgrade costs for levels 1 and 2 up to max level 3', () => {
    expect(MAX_BUILDING_LEVEL).toBe(3);
    expect(getUpgradeCost(1)).toBe(100);
    expect(getUpgradeCost(2)).toBe(200);
  });

  it('returns consistent demolish refund across levels 1-3', () => {
    // House cost = 100 -> 50% base = 50, +25 per level above 1
    expect(calculateDemolishRefund(makeTile(BuildingType.Residential, 1))).toBe(50);
    expect(calculateDemolishRefund(makeTile(BuildingType.Residential, 2))).toBe(75);
    expect(calculateDemolishRefund(makeTile(BuildingType.Residential, 3))).toBe(100);
  });

  it('handles roads and empty tiles without negative refunds', () => {
    expect(calculateDemolishRefund(makeTile(BuildingType.Road, 1))).toBe(5);
    expect(calculateDemolishRefund(makeTile(BuildingType.None, 1))).toBe(0);
  });
});
