import { BUILDINGS, GRID_SIZE } from '../constants';
import { computeRoadConnectivity } from './connectivity';
import { BuildingType, CityStats, Grid } from '../types';

export interface ServiceGapSummary {
  power: number;
  powerRegion: string;
  fire: number;
  fireRegion: string;
  school: number;
  schoolRegion: string;
  police: number;
  policeRegion: string;
  hospital: number;
  hospitalRegion: string;
}

export interface CityGridAnalysis {
  damaged: { x: number; y: number }[];
  damagedRegion: string;
  disconnected: { x: number; y: number }[];
  disconnectedRegion: string;
  pollution: { x: number; y: number }[];
  pollutionRegion: string;
  parkless: { x: number; y: number }[];
  parklessRegion: string;
  serviceGaps: ServiceGapSummary;
  counts: Record<string, number>;
}

export const getQuadrantLabel = (
  x: number,
  y: number,
  size = GRID_SIZE,
): string => {
  const center = Math.floor(size / 2);
  if (Math.abs(x - center) <= 1 && Math.abs(y - center) <= 1) {
    return 'central downtown';
  }
  if (y < center) {
    return x < center ? 'the northwest' : 'the northeast';
  }
  return x < center ? 'the southwest' : 'the southeast';
};

const findDominantQuadrant = (
  tiles: { x: number; y: number }[],
  size = GRID_SIZE,
): string => {
  if (tiles.length === 0) return 'central downtown';
  const freq: Record<string, number> = {};
  let best = getQuadrantLabel(tiles[0].x, tiles[0].y, size);
  let bestCount = 0;

  for (const t of tiles) {
    const label = getQuadrantLabel(t.x, t.y, size);
    const next = (freq[label] || 0) + 1;
    freq[label] = next;
    if (next > bestCount) {
      best = label;
      bestCount = next;
    }
  }
  return best;
};

const isParkType = (t: BuildingType): boolean =>
  t === BuildingType.Park ||
  t === BuildingType.ParkPlayground ||
  t === BuildingType.ParkFountain;

export const analyzeCityGrid = (
  grid: Grid,
  stats: Pick<CityStats, 'milestoneTier'>,
): CityGridAnalysis => {
  const size = grid.length;
  const conn = computeRoadConnectivity(grid);
  const counts: Record<string, number> = {};
  const damaged: { x: number; y: number }[] = [];
  const disconnected: { x: number; y: number }[] = [];
  const resTiles: { x: number; y: number }[] = [];
  const comTiles: { x: number; y: number }[] = [];
  const indTiles: { x: number; y: number }[] = [];
  const parkTiles: { x: number; y: number }[] = [];
  const services: { x: number; y: number; type: BuildingType; radius: number }[] = [];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const tile = grid[y][x];
      const bType = tile.buildingType;
      if (bType === BuildingType.None) continue;

      counts[bType] = (counts[bType] || 0) + 1;
      const key = `${x},${y}`;
      const isDisc = conn.disconnectedTiles.has(key);

      if (tile.isDamaged) damaged.push({ x, y });
      if (isDisc) disconnected.push({ x, y });
      if (tile.isDamaged || isDisc) continue;

      if (bType === BuildingType.Residential) resTiles.push({ x, y });
      else if (bType === BuildingType.Commercial) comTiles.push({ x, y });
      else if (bType === BuildingType.Industrial) indTiles.push({ x, y });
      else if (isParkType(bType)) parkTiles.push({ x, y });
      else if (BUILDINGS[bType].serviceRadius) {
        services.push({
          x,
          y,
          type: bType,
          radius: BUILDINGS[bType].serviceRadius ?? 0,
        });
      }
    }
  }

  const pollution: { x: number; y: number }[] = [];
  const parkless: { x: number; y: number }[] = [];
  const unpowered: { x: number; y: number }[] = [];
  const noFire: { x: number; y: number }[] = [];
  const noSchool: { x: number; y: number }[] = [];
  const noPolice: { x: number; y: number }[] = [];
  const noHospital: { x: number; y: number }[] = [];

  const isCovered = (x: number, y: number, sType: BuildingType) =>
    services.some(
      (s) =>
        s.type === sType && Math.abs(s.x - x) + Math.abs(s.y - y) <= s.radius,
    );

  for (const r of resTiles) {
    if (
      indTiles.some(
        (ind) => Math.abs(ind.x - r.x) <= 2 && Math.abs(ind.y - r.y) <= 2,
      )
    ) {
      pollution.push(r);
    }
    if (
      !parkTiles.some((p) => Math.abs(p.x - r.x) + Math.abs(p.y - r.y) <= 4)
    ) {
      parkless.push(r);
    }
    if (stats.milestoneTier >= 1 && !isCovered(r.x, r.y, BuildingType.School)) {
      noSchool.push(r);
    }
    if (stats.milestoneTier >= 2 && !isCovered(r.x, r.y, BuildingType.Hospital)) {
      noHospital.push(r);
    }
  }

  for (const zone of [...resTiles, ...comTiles, ...indTiles]) {
    if (!isCovered(zone.x, zone.y, BuildingType.PowerPlant)) {
      unpowered.push(zone);
    }
    if (
      stats.milestoneTier >= 1 &&
      !isCovered(zone.x, zone.y, BuildingType.FireStation)
    ) {
      noFire.push(zone);
    }
  }

  if (stats.milestoneTier >= 2) {
    for (const rc of [...resTiles, ...comTiles]) {
      if (!isCovered(rc.x, rc.y, BuildingType.PoliceStation)) {
        noPolice.push(rc);
      }
    }
  }

  return {
    damaged,
    damagedRegion: findDominantQuadrant(damaged, size),
    disconnected,
    disconnectedRegion: findDominantQuadrant(disconnected, size),
    pollution,
    pollutionRegion: findDominantQuadrant(pollution, size),
    parkless,
    parklessRegion: findDominantQuadrant(parkless, size),
    serviceGaps: {
      power: unpowered.length,
      powerRegion: findDominantQuadrant(unpowered, size),
      fire: noFire.length,
      fireRegion: findDominantQuadrant(noFire, size),
      school: noSchool.length,
      schoolRegion: findDominantQuadrant(noSchool, size),
      police: noPolice.length,
      policeRegion: findDominantQuadrant(noPolice, size),
      hospital: noHospital.length,
      hospitalRegion: findDominantQuadrant(noHospital, size),
    },
    counts,
  };
};
