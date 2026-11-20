import {
  DEFAULT_TAX_RATE,
  MAX_TAX_RATE,
  MIN_TAX_RATE,
} from '../constants';
import { ALLOWED_GRID_SIZES } from './grid';
import {
  ActiveCityEvent,
  AdvisorHistory,
  BudgetBreakdown,
  BuildingType,
  CityEventType,
  CityGoal,
  CityStats,
  Grid,
  MilestoneTier,
  NewsItem,
  RCIDemand,
  TileData,
  WeatherType,
} from '../types';
import { INITIAL_GLOBAL_TIME } from './tick';

export const SAVE_VERSION = 1 as const;
export const SAVE_STORAGE_KEY = 'cityverse_save_v1';
export const LEGACY_SAVE_KEY = 'skymetropolis_save';

export interface CitySaveData {
  version: 1;
  savedAt: string;
  grid: Grid;
  stats: CityStats;
  newsFeed: NewsItem[];
  currentGoal: CityGoal | null;
  advisorHistory?: AdvisorHistory;
  globalTime: number;
  maxCars: number;
  gameSpeed: number;
}

export interface SaveSummary {
  day: number;
  population: number;
  money: number;
  savedAt: string;
}

const VALID_BUILDING_TYPES = new Set<string>(Object.values(BuildingType));
const VALID_TERRAINS = new Set<string>(['land', 'sand', 'water', 'forest']);
const ALLOWED_GRID_SIZE_SET = new Set<number>(ALLOWED_GRID_SIZES);
const VALID_WEATHER = new Set<string>(['sunny', 'rainy', 'snowy']);
const VALID_NEWS_TYPES = new Set<string>(['positive', 'negative', 'neutral']);
const VALID_EVENT_TYPES = new Set<string>(['fire', 'festival', 'strike']);
const VALID_GOAL_TYPES = new Set<string>([
  'population',
  'money',
  'building_count',
  'happiness',
  'repair_all',
  'connect_all',
]);

const DEFAULT_DEMAND: RCIDemand = {
  residential: 30,
  commercial: 15,
  industrial: 15,
};

const DEFAULT_BUDGET: BudgetBreakdown = {
  residentialTax: 0,
  commercialIncome: 0,
  industrialIncome: 0,
  upkeep: 0,
  netIncome: 0,
};

const isValidGrid = (grid: unknown): grid is Grid => {
  if (!Array.isArray(grid) || !ALLOWED_GRID_SIZE_SET.has(grid.length)) {
    return false;
  }
  const size = grid.length;
  return grid.every(
    (row, y) =>
      Array.isArray(row) &&
      row.length === size &&
      row.every((tile: unknown, x) => {
        if (!tile || typeof tile !== 'object') return false;
        const t = tile as Partial<TileData>;
        return (
          typeof t.x === 'number' &&
          t.x === x &&
          typeof t.y === 'number' &&
          t.y === y &&
          typeof t.buildingType === 'string' &&
          VALID_BUILDING_TYPES.has(t.buildingType) &&
          (t.terrain === undefined ||
            (typeof t.terrain === 'string' && VALID_TERRAINS.has(t.terrain))) &&
          (t.isDamaged === undefined || typeof t.isDamaged === 'boolean') &&
          (t.level === undefined ||
            (typeof t.level === 'number' &&
              Number.isFinite(t.level) &&
              t.level >= 1))
        );
      }),
  );
};

const isValidStats = (stats: unknown): stats is Partial<CityStats> => {
  if (!stats || typeof stats !== 'object') return false;
  const s = stats as Partial<CityStats>;
  return (
    typeof s.money === 'number' &&
    Number.isFinite(s.money) &&
    typeof s.population === 'number' &&
    Number.isFinite(s.population) &&
    typeof s.day === 'number' &&
    Number.isFinite(s.day) &&
    s.day >= 1 &&
    typeof s.happiness === 'number' &&
    Number.isFinite(s.happiness) &&
    typeof s.weather === 'string' &&
    VALID_WEATHER.has(s.weather)
  );
};

const sanitizeDemand = (raw: unknown): RCIDemand => {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_DEMAND };
  const d = raw as Partial<RCIDemand>;
  return {
    residential:
      typeof d.residential === 'number' && Number.isFinite(d.residential)
        ? d.residential
        : DEFAULT_DEMAND.residential,
    commercial:
      typeof d.commercial === 'number' && Number.isFinite(d.commercial)
        ? d.commercial
        : DEFAULT_DEMAND.commercial,
    industrial:
      typeof d.industrial === 'number' && Number.isFinite(d.industrial)
        ? d.industrial
        : DEFAULT_DEMAND.industrial,
  };
};

const sanitizeBudget = (raw: unknown): BudgetBreakdown => {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_BUDGET };
  const b = raw as Partial<BudgetBreakdown>;
  const num = (v: unknown) =>
    typeof v === 'number' && Number.isFinite(v) ? v : 0;
  return {
    residentialTax: num(b.residentialTax),
    commercialIncome: num(b.commercialIncome),
    industrialIncome: num(b.industrialIncome),
    upkeep: num(b.upkeep),
    netIncome: num(b.netIncome),
  };
};

const sanitizeNewsFeed = (raw: unknown): NewsItem[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is NewsItem => {
      if (!item || typeof item !== 'object') return false;
      const n = item as Partial<NewsItem>;
      return (
        typeof n.id === 'string' &&
        typeof n.text === 'string' &&
        typeof n.type === 'string' &&
        VALID_NEWS_TYPES.has(n.type)
      );
    })
    .slice(-13);
};

const sanitizeGoal = (raw: unknown): CityGoal | null => {
  if (!raw || typeof raw !== 'object') return null;
  const g = raw as Partial<CityGoal>;
  if (
    typeof g.description !== 'string' ||
    typeof g.targetType !== 'string' ||
    !VALID_GOAL_TYPES.has(g.targetType) ||
    typeof g.targetValue !== 'number' ||
    !Number.isFinite(g.targetValue) ||
    typeof g.reward !== 'number' ||
    !Number.isFinite(g.reward)
  ) {
    return null;
  }
  const buildingType =
    typeof g.buildingType === 'string' && VALID_BUILDING_TYPES.has(g.buildingType)
      ? (g.buildingType as BuildingType)
      : undefined;
  if (g.targetType === 'building_count' && !buildingType) return null;
  return {
    description: g.description,
    targetType: g.targetType as CityGoal['targetType'],
    targetValue: g.targetValue,
    ...(buildingType ? { buildingType } : {}),
    reward: g.reward,
    completed: Boolean(g.completed),
    ...(typeof g.category === 'string' ? { category: g.category } : {}),
    ...(typeof g.chainStep === 'number' && Number.isFinite(g.chainStep)
      ? { chainStep: g.chainStep }
      : {}),
    ...(typeof g.locationHint === 'string'
      ? { locationHint: g.locationHint }
      : {}),
  };
};

const sanitizeActiveEvent = (
  raw: unknown,
  gridSize: number,
): ActiveCityEvent | null => {
  if (!raw || typeof raw !== 'object') return null;
  const e = raw as Partial<ActiveCityEvent>;
  if (
    typeof e.id !== 'string' ||
    typeof e.type !== 'string' ||
    !VALID_EVENT_TYPES.has(e.type) ||
    typeof e.title !== 'string' ||
    typeof e.description !== 'string' ||
    typeof e.ticksRemaining !== 'number' ||
    !Number.isFinite(e.ticksRemaining) ||
    e.ticksRemaining < 1 ||
    typeof e.totalTicks !== 'number' ||
    !Number.isFinite(e.totalTicks) ||
    e.totalTicks < 1
  ) {
    return null;
  }
  const tile =
    e.affectedTile &&
    typeof e.affectedTile.x === 'number' &&
    typeof e.affectedTile.y === 'number' &&
    e.affectedTile.x >= 0 &&
    e.affectedTile.x < gridSize &&
    e.affectedTile.y >= 0 &&
    e.affectedTile.y < gridSize
      ? { x: e.affectedTile.x, y: e.affectedTile.y }
      : undefined;

  return {
    id: e.id,
    type: e.type as CityEventType,
    title: e.title,
    description: e.description,
    ticksRemaining: e.ticksRemaining,
    totalTicks: e.totalTicks,
    ...(tile ? { affectedTile: tile } : {}),
  };
};

const sanitizeAdvisorHistory = (raw: unknown): AdvisorHistory | undefined => {
  if (!raw || typeof raw !== 'object') return undefined;
  const h = raw as Partial<AdvisorHistory>;
  return {
    completedCount:
      typeof h.completedCount === 'number' &&
      Number.isFinite(h.completedCount) &&
      h.completedCount >= 0
        ? Math.floor(h.completedCount)
        : 0,
    ...(typeof h.lastCategory === 'string'
      ? { lastCategory: h.lastCategory }
      : {}),
    recentDescriptions: Array.isArray(h.recentDescriptions)
      ? h.recentDescriptions.filter((d): d is string => typeof d === 'string').slice(-60)
      : [],
  };
};

export type SavePayloadInput = Omit<CitySaveData, 'version' | 'savedAt'>;

export const serializeSave = (data: SavePayloadInput): string =>
  JSON.stringify({
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    ...data,
  } satisfies CitySaveData);

export const parseSave = (raw: string): CitySaveData | null => {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const obj = parsed as Record<string, unknown>;

    if (obj.version !== undefined && obj.version !== SAVE_VERSION) {
      return null;
    }
    if (!isValidGrid(obj.grid) || !isValidStats(obj.stats)) {
      return null;
    }

    const s = obj.stats;
    const taxRate =
      typeof s.taxRate === 'number' && Number.isFinite(s.taxRate)
        ? Math.max(MIN_TAX_RATE, Math.min(MAX_TAX_RATE, Math.round(s.taxRate)))
        : DEFAULT_TAX_RATE;
    const milestoneTier: MilestoneTier =
      s.milestoneTier === 0 ||
      s.milestoneTier === 1 ||
      s.milestoneTier === 2 ||
      s.milestoneTier === 3
        ? s.milestoneTier
        : 0;

    const globalTime =
      typeof obj.globalTime === 'number' && Number.isFinite(obj.globalTime)
        ? obj.globalTime
        : INITIAL_GLOBAL_TIME;
    const maxCars =
      typeof obj.maxCars === 'number' && Number.isFinite(obj.maxCars)
        ? Math.max(0, Math.min(50, Math.round(obj.maxCars)))
        : 6;
    const gameSpeed =
      obj.gameSpeed === 1 || obj.gameSpeed === 2 || obj.gameSpeed === 3
        ? obj.gameSpeed
        : 1;
    const savedAt =
      typeof obj.savedAt === 'string' ? obj.savedAt : new Date().toISOString();

    const activeEvent = sanitizeActiveEvent(s.activeEvent, obj.grid.length);
    const advisorHistory = sanitizeAdvisorHistory(obj.advisorHistory);

    return {
      version: SAVE_VERSION,
      savedAt,
      grid: obj.grid,
      stats: {
        money: s.money!,
        population: s.population!,
        day: s.day!,
        happiness: Math.max(0, Math.min(100, s.happiness!)),
        weather: s.weather as WeatherType,
        taxRate,
        milestoneTier,
        demand: sanitizeDemand(s.demand),
        budget: sanitizeBudget(s.budget),
        ...(activeEvent !== null ? { activeEvent } : {}),
      },
      newsFeed: sanitizeNewsFeed(obj.newsFeed),
      currentGoal: sanitizeGoal(obj.currentGoal),
      ...(advisorHistory ? { advisorHistory } : {}),
      globalTime,
      maxCars,
      gameSpeed,
    };
  } catch {
    return null;
  }
};

export const saveCityToStorage = (data: SavePayloadInput): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(SAVE_STORAGE_KEY, serializeSave(data));
    return true;
  } catch {
    return false;
  }
};

export const loadCityFromStorage = (): CitySaveData | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      window.localStorage.getItem(SAVE_STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_SAVE_KEY);
    if (!raw) return null;
    return parseSave(raw);
  } catch {
    return null;
  }
};

export const clearCitySave = (): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(SAVE_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_SAVE_KEY);
  } catch {
    // Ignore storage errors
  }
};

export const getSaveSummary = (): SaveSummary | null => {
  const data = loadCityFromStorage();
  if (!data) return null;
  return {
    day: data.stats.day,
    population: data.stats.population,
    money: data.stats.money,
    savedAt: data.savedAt,
  };
};
