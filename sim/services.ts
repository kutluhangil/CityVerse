import { BUILDINGS } from '../constants';
import { BuildingType, Grid } from '../types';
import { SERVICE_BUILDING_TYPES } from './connectivity';

export interface ServiceCoverageResult {
  tileCoverage: number[][];
  powerRatio: number;
  schoolRatio: number;
  hospitalRatio: number;
  policeRatio: number;
  fireRatio: number;
  hospitalCoveredResWeighted: number;
}

export const computeServiceCoverage = (
  grid: Grid,
  disconnectedTiles: Set<string>,
): ServiceCoverageResult => {
  const height = grid.length;
  const width = height > 0 ? grid[0].length : 0;

  const activeServices: { x: number; y: number; type: BuildingType; radius: number }[] =
    [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const bType = grid[y][x].buildingType;
      if (
        SERVICE_BUILDING_TYPES.has(bType) &&
        !disconnectedTiles.has(`${x},${y}`) &&
        !grid[y][x].isDamaged
      ) {
        activeServices.push({
          x,
          y,
          type: bType,
          radius: BUILDINGS[bType].serviceRadius ?? 0,
        });
      }
    }
  }

  const tileCoverage: number[][] = Array.from({ length: height }, () =>
    Array<number>(width).fill(0),
  );

  let rciTotal = 0;
  let rTotal = 0;
  let rcTotal = 0;

  let powerCovered = 0;
  let fireCovered = 0;
  let schoolCovered = 0;
  let hospitalCovered = 0;
  let policeCovered = 0;
  let hospitalCoveredResWeighted = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const coveredTypes = new Set<BuildingType>();
      for (const svc of activeServices) {
        if (Math.abs(svc.x - x) + Math.abs(svc.y - y) <= svc.radius) {
          coveredTypes.add(svc.type);
        }
      }
      tileCoverage[y][x] = Math.min(1, coveredTypes.size / 3);

      const tile = grid[y][x];
      if (disconnectedTiles.has(`${x},${y}`) || tile.isDamaged) continue;

      const bType = tile.buildingType;
      const isR = bType === BuildingType.Residential;
      const isC = bType === BuildingType.Commercial;
      const isI = bType === BuildingType.Industrial;

      if (isR || isC || isI) {
        rciTotal++;
        if (coveredTypes.has(BuildingType.PowerPlant)) powerCovered++;
        if (coveredTypes.has(BuildingType.FireStation)) fireCovered++;
      }
      if (isR) {
        rTotal++;
        if (coveredTypes.has(BuildingType.School)) schoolCovered++;
        if (coveredTypes.has(BuildingType.Hospital)) {
          hospitalCovered++;
          hospitalCoveredResWeighted += tile.level || 1;
        }
      }
      if (isR || isC) {
        rcTotal++;
        if (coveredTypes.has(BuildingType.PoliceStation)) policeCovered++;
      }
    }
  }

  return {
    tileCoverage,
    powerRatio: rciTotal > 0 ? powerCovered / rciTotal : 0,
    fireRatio: rciTotal > 0 ? fireCovered / rciTotal : 0,
    schoolRatio: rTotal > 0 ? schoolCovered / rTotal : 0,
    hospitalRatio: rTotal > 0 ? hospitalCovered / rTotal : 0,
    policeRatio: rcTotal > 0 ? policeCovered / rcTotal : 0,
    hospitalCoveredResWeighted,
  };
};
