import { BUILDINGS } from '../constants';
import { buildEventHeadline } from '../services/newsTemplates';
import { getQuadrantLabel } from './advisorAnalysis';
import { ActiveCityEvent, BuildingType, CityStats, Grid, NewsItem } from '../types';

export const MIN_EVENT_COOLDOWN_TICKS = 14;
export const FESTIVAL_COMMERCIAL_MULT = 1.25;
export const FESTIVAL_HAPPINESS_BONUS = 12;
export const STRIKE_INDUSTRIAL_MULT = 0.6;
export const STRIKE_HAPPINESS_PENALTY = 6;
export const DAMAGED_HAPPINESS_PENALTY_PER_TILE = 4;
export const MAX_DAMAGED_HAPPINESS_PENALTY = 16;

export interface EventStepInput {
  grid: Grid;
  stats: Pick<
    CityStats,
    'population' | 'happiness' | 'taxRate' | 'weather' | 'activeEvent'
  >;
  eventTicks: number;
  disconnectedTiles: Set<string>;
  rng?: () => number;
  now?: number;
}

export interface EventStepResult {
  nextEvent: ActiveCityEvent | null;
  nextEventTicks: number;
  damagedTile: { x: number; y: number } | null;
  eventNews: NewsItem[];
}

const isFlammableBuilding = (type: BuildingType): boolean =>
  type !== BuildingType.None &&
  type !== BuildingType.Road &&
  type !== BuildingType.Park &&
  type !== BuildingType.ParkPlayground &&
  type !== BuildingType.ParkFountain;

export const stepCityEvent = ({
  grid,
  stats,
  eventTicks,
  disconnectedTiles,
  rng = Math.random,
  now = Date.now(),
}: EventStepInput): EventStepResult => {
  const current = stats.activeEvent ?? null;

  if (current) {
    const remaining = current.ticksRemaining - 1;
    if (remaining <= 0) {
      const hint = current.affectedTile
        ? getQuadrantLabel(current.affectedTile.x, current.affectedTile.y, grid.length)
        : 'central downtown';
      return {
        nextEvent: null,
        nextEventTicks: 0,
        damagedTile: null,
        eventNews: [buildEventHeadline(current, hint, 'end', rng)],
      };
    }
    return {
      nextEvent: { ...current, ticksRemaining: remaining },
      nextEventTicks: 0,
      damagedTile: null,
      eventNews: [],
    };
  }

  const nextEventTicks = eventTicks + 1;
  if (nextEventTicks < MIN_EVENT_COOLDOWN_TICKS || rng() >= 0.08) {
    return {
      nextEvent: null,
      nextEventTicks,
      damagedTile: null,
      eventNews: [],
    };
  }

  const fireStations: { x: number; y: number; radius: number }[] = [];
  const flammable: { x: number; y: number }[] = [];
  let hasProduction = false;

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const tile = grid[y][x];
      const key = `${x},${y}`;
      if (tile.isDamaged || disconnectedTiles.has(key)) continue;

      if (tile.buildingType === BuildingType.FireStation) {
        fireStations.push({
          x,
          y,
          radius: BUILDINGS[BuildingType.FireStation].serviceRadius ?? 4,
        });
      }
      if (isFlammableBuilding(tile.buildingType)) {
        flammable.push({ x, y });
      }
      if (
        tile.buildingType === BuildingType.Industrial ||
        tile.buildingType === BuildingType.Commercial
      ) {
        hasProduction = true;
      }
    }
  }

  const pool: ('fire' | 'festival' | 'strike')[] = [];
  if (flammable.length > 0) pool.push('fire');
  if (stats.population >= 25 && stats.happiness >= 55) pool.push('festival');
  if (hasProduction && (stats.taxRate >= 10 || stats.happiness < 75)) {
    pool.push('strike');
  }

  if (pool.length === 0) {
    return {
      nextEvent: null,
      nextEventTicks,
      damagedTile: null,
      eventNews: [],
    };
  }

  const chosen = pool[Math.floor(rng() * pool.length)];

  if (chosen === 'fire') {
    const target = flammable[Math.floor(rng() * flammable.length)];
    const fireProtected = fireStations.some(
      (fs) => Math.abs(fs.x - target.x) + Math.abs(fs.y - target.y) <= fs.radius,
    );
    const hint = getQuadrantLabel(target.x, target.y, grid.length);
    if (fireProtected && rng() < 0.7) {
      return {
        nextEvent: null,
        nextEventTicks: 0,
        damagedTile: null,
        eventNews: [
          {
            id: `${now}.${Math.floor(rng() * 1e6)}`,
            text: `Fire Station crew quickly doused a stove spark in ${hint}!`,
            type: 'positive',
          },
        ],
      };
    }

    const evt: ActiveCityEvent = {
      id: `${now}.fire`,
      type: 'fire',
      title: 'Structural Fire',
      description: `Fire damaged a block in ${hint}. Inspect or Upgrade tool to repair.`,
      ticksRemaining: 6,
      totalTicks: 6,
      affectedTile: target,
    };
    return {
      nextEvent: evt,
      nextEventTicks: 0,
      damagedTile: target,
      eventNews: [buildEventHeadline(evt, hint, 'start', rng)],
    };
  }

  if (chosen === 'festival') {
    const evt: ActiveCityEvent = {
      id: `${now}.festival`,
      type: 'festival',
      title: 'Lantern Festival',
      description: '+25% Commercial trade and +12 Joy while crowds celebrate.',
      ticksRemaining: 8,
      totalTicks: 8,
    };
    return {
      nextEvent: evt,
      nextEventTicks: 0,
      damagedTile: null,
      eventNews: [buildEventHeadline(evt, 'central downtown', 'start', rng)],
    };
  }

  const evt: ActiveCityEvent = {
    id: `${now}.strike`,
    type: 'strike',
    title: 'Industry Strike',
    description: '-40% Industrial output and -6 Joy until shifts settle.',
    ticksRemaining: 7,
    totalTicks: 7,
  };
  return {
    nextEvent: evt,
    nextEventTicks: 0,
    damagedTile: null,
    eventNews: [buildEventHeadline(evt, 'central downtown', 'start', rng)],
  };
};
