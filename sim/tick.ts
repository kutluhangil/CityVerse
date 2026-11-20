import { BUILDINGS, DEFAULT_TAX_RATE } from '../constants';
import { buildMilestoneHeadline } from '../services/newsTemplates';
import {
  BudgetBreakdown,
  BuildingType,
  CityGoal,
  CityStats,
  Grid,
  MilestoneTier,
  NewsItem,
  WeatherType,
} from '../types';
import { computeRoadConnectivity } from './connectivity';
import {
  clamp,
  computeRCIDemand,
  getResidentialDemandMultiplier,
  getZoneDemandMultiplier,
  SNOW_INDUSTRIAL_MULTIPLIER,
} from './economy';
import {
  DAMAGED_HAPPINESS_PENALTY_PER_TILE,
  FESTIVAL_COMMERCIAL_MULT,
  FESTIVAL_HAPPINESS_BONUS,
  MAX_DAMAGED_HAPPINESS_PENALTY,
  stepCityEvent,
  STRIKE_HAPPINESS_PENALTY,
  STRIKE_INDUSTRIAL_MULT,
} from './events';
import { evaluateMilestoneTier, MILESTONES } from './milestones';
import { computeServiceCoverage } from './services';

export const TICKS_PER_DAY = 24;
export const GLOBAL_TIME_STEP = (Math.PI * 2) / TICKS_PER_DAY;
/** Start in bright morning light so day 1 matches the day counter. */
export const INITIAL_GLOBAL_TIME = Math.PI * 0.25;
export const MIN_WEATHER_TICKS = 60;

export const checkGoalCompleted = (
  goal: CityGoal,
  stats: CityStats,
  tileCounts: Record<string, number>,
  context?: { damagedCount?: number; disconnectedCount?: number },
): boolean => {
  if (goal.targetType === 'money') return stats.money >= goal.targetValue;
  if (goal.targetType === 'population') {
    return Math.floor(stats.population) >= goal.targetValue;
  }
  if (goal.targetType === 'happiness') return stats.happiness >= goal.targetValue;
  if (goal.targetType === 'building_count' && goal.buildingType) {
    return (tileCounts[goal.buildingType] || 0) >= goal.targetValue;
  }
  if (goal.targetType === 'repair_all') {
    return (context?.damagedCount ?? 0) === 0;
  }
  if (goal.targetType === 'connect_all') {
    return (context?.disconnectedCount ?? 0) === 0;
  }
  return false;
};

export interface TickInput {
  grid: Grid;
  stats: CityStats;
  globalTime: number;
  weatherTicks: number;
  eventTicks?: number;
  currentGoal: CityGoal | null;
  rng?: () => number;
  now?: number;
}

export interface TickResult {
  nextStats: CityStats;
  nextGlobalTime: number;
  nextWeatherTicks: number;
  nextEventTicks: number;
  damagedTile: { x: number; y: number } | null;
  goalCompleted: boolean;
  milestoneUnlocked: boolean;
  events: NewsItem[];
}

export const stepSimulation = (input: TickInput): TickResult => {
  const {
    grid,
    stats,
    globalTime,
    weatherTicks,
    eventTicks = 0,
    currentGoal,
    rng = Math.random,
    now = Date.now(),
  } = input;

  const connectivity = computeRoadConnectivity(grid);
  const services = computeServiceCoverage(grid, connectivity.disconnectedTiles);

  let rawComIncome = 0;
  let rawIndIncome = 0;
  let dailyPopGrowth = 0;
  let totalUpkeep = 0;
  let damagedCount = 0;
  const weightedCounts: Record<string, number> = {};
  const tileCounts: Record<string, number> = {};

  grid.forEach((row) => {
    row.forEach((tile) => {
      if (tile.buildingType === BuildingType.None) return;
      const config = BUILDINGS[tile.buildingType];
      if (!config) return;
      const levelMultiplier = tile.level || 1;
      totalUpkeep += (config.upkeep ?? 0) * levelMultiplier;
      tileCounts[tile.buildingType] = (tileCounts[tile.buildingType] || 0) + 1;

      if (tile.isDamaged) {
        damagedCount++;
        return;
      }
      if (connectivity.disconnectedTiles.has(`${tile.x},${tile.y}`)) return;

      if (tile.buildingType === BuildingType.Commercial) {
        rawComIncome += config.incomeGen * levelMultiplier;
      } else if (tile.buildingType === BuildingType.Industrial) {
        rawIndIncome += config.incomeGen * levelMultiplier;
      }
      dailyPopGrowth += config.popGen * levelMultiplier;
      weightedCounts[tile.buildingType] =
        (weightedCounts[tile.buildingType] || 0) + levelMultiplier;
    });
  });

  const resCount = weightedCounts[BuildingType.Residential] || 0;
  const parkCount = weightedCounts[BuildingType.Park] || 0;
  const playCount = weightedCounts[BuildingType.ParkPlayground] || 0;
  const fountCount = weightedCounts[BuildingType.ParkFountain] || 0;
  const comCount = weightedCounts[BuildingType.Commercial] || 0;
  const indCount = weightedCounts[BuildingType.Industrial] || 0;

  let resConnectedTiles = 0;
  let localizedPollutionPenalty = 0;
  grid.forEach((row, rY) => {
    row.forEach((tile, rX) => {
      if (
        tile.buildingType === BuildingType.Residential &&
        !tile.isDamaged &&
        !connectivity.disconnectedTiles.has(`${rX},${rY}`)
      ) {
        resConnectedTiles++;
        let nearbyInd = 0;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const ny = rY + dy;
            const nx = rX + dx;
            if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[ny].length) {
              if (
                grid[ny][nx].buildingType === BuildingType.Industrial &&
                !grid[ny][nx].isDamaged &&
                !connectivity.disconnectedTiles.has(`${nx},${ny}`)
              ) {
                nearbyInd += grid[ny][nx].level || 1;
              }
            }
          }
        }
        localizedPollutionPenalty += nearbyInd * 5;
      }
    });
  });

  const events: NewsItem[] = [];
  let newWeather: WeatherType = stats.weather;
  let nextWeatherTicks = weatherTicks + 1;

  if (nextWeatherTicks >= MIN_WEATHER_TICKS && rng() > 0.97) {
    const transitions: Record<WeatherType, WeatherType[]> = {
      sunny: ['sunny', 'sunny', 'sunny', 'rainy'],
      rainy: ['rainy', 'sunny', 'sunny', 'snowy'],
      snowy: ['snowy', 'rainy', 'rainy'],
    };
    const options = transitions[stats.weather];
    const nextWeather = options[Math.floor(rng() * options.length)];
    if (nextWeather !== newWeather) {
      newWeather = nextWeather;
      nextWeatherTicks = 0;
      if (newWeather === 'rainy' && rng() > 0.3) {
        events.push({
          id: `${now}.${Math.floor(rng() * 1e6)}`,
          text: "Citizen: 'Make sure to bring an umbrella today!'",
          type: 'neutral',
        });
      } else if (newWeather === 'snowy' && rng() > 0.3) {
        events.push({
          id: `${now}.${Math.floor(rng() * 1e6)}`,
          text: "Citizen: 'The snow is beautiful, but the roads are slippery.'",
          type: 'neutral',
        });
      } else if (newWeather === 'sunny' && stats.weather !== 'sunny') {
        events.push({
          id: `${now}.${Math.floor(rng() * 1e6)}`,
          text: "Citizen: 'Finally, some clear skies!'",
          type: 'positive',
        });
      }
    }
  }

  const taxRate = stats.taxRate ?? DEFAULT_TAX_RATE;
  const taxMult = taxRate / DEFAULT_TAX_RATE;
  const taxHappinessMod = (DEFAULT_TAX_RATE - taxRate) * 2;

  const demand = computeRCIDemand({
    population: stats.population,
    comWeighted: comCount,
    indWeighted: indCount,
    taxRate,
    happiness: stats.happiness,
  });

  const maxPop = resCount * 50 + services.hospitalCoveredResWeighted * 10;
  const happinessMultiplier = Math.max(0.2, stats.happiness / 60);
  const resGrowthFactor =
    getResidentialDemandMultiplier(demand.residential) *
    (1 + services.schoolRatio * 0.15);

  let newPop = stats.population + dailyPopGrowth * happinessMultiplier * resGrowthFactor;
  if (newPop > maxPop) newPop = maxPop;
  if (resCount === 0 && stats.population > 0) {
    newPop = Math.max(0, stats.population - 5);
  }

  const eventRes = stepCityEvent({
    grid,
    stats,
    eventTicks,
    disconnectedTiles: connectivity.disconnectedTiles,
    rng,
    now,
  });
  events.push(...eventRes.eventNews);
  const activeEvent = eventRes.nextEvent;
  const effectiveDamaged = damagedCount + (eventRes.damagedTile ? 1 : 0);

  const residentialTax = Math.round(stats.population * 0.15 * taxMult);
  const comEfficiency =
    clamp(0.25 + stats.population / Math.max(1, comCount * 30), 0.25, 1.25) *
    (1 + services.powerRatio * 0.1 + services.policeRatio * 0.1) *
    getZoneDemandMultiplier(demand.commercial) *
    (activeEvent?.type === 'festival' ? FESTIVAL_COMMERCIAL_MULT : 1);
  const commercialIncome = Math.round(rawComIncome * comEfficiency * taxMult);

  const indEfficiency =
    clamp(0.2 + stats.population / Math.max(1, indCount * 25), 0.2, 1.15) *
    (1 + services.powerRatio * 0.1) *
    getZoneDemandMultiplier(demand.industrial) *
    (newWeather === 'snowy' ? SNOW_INDUSTRIAL_MULTIPLIER : 1) *
    (activeEvent?.type === 'strike' ? STRIKE_INDUSTRIAL_MULT : 1);
  const industrialIncome = Math.round(rawIndIncome * indEfficiency * taxMult);

  const budget: BudgetBreakdown = {
    residentialTax,
    commercialIncome,
    industrialIncome,
    upkeep: totalUpkeep,
    netIncome: residentialTax + commercialIncome + industrialIncome - totalUpkeep,
  };

  const buildingTypesPresent = Object.keys(weightedCounts).length;
  const varietyBonus = buildingTypesPresent * 2;
  const parksPerCapitaBonus =
    stats.population > 0
      ? ((parkCount + playCount * 3 + fountCount * 5) /
          (stats.population / 100)) *
        10
      : 0;

  let weatherMod = 0;
  if (newWeather === 'rainy') weatherMod = -5;
  if (newWeather === 'snowy') weatherMod = -2;
  if (newWeather === 'sunny') weatherMod = 2;

  const serviceJoyBonus = Math.round(
    services.powerRatio * 6 +
      services.schoolRatio * 8 +
      services.hospitalRatio * 10 +
      services.policeRatio * 6 +
      services.fireRatio * 6,
  );

  const pollutionImpact =
    resConnectedTiles > 0 ? localizedPollutionPenalty / resConnectedTiles : 0;

  const eventJoyMod =
    activeEvent?.type === 'festival'
      ? FESTIVAL_HAPPINESS_BONUS
      : activeEvent?.type === 'strike'
        ? -STRIKE_HAPPINESS_PENALTY
        : 0;
  const damagedJoyPenalty = Math.min(
    MAX_DAMAGED_HAPPINESS_PENALTY,
    effectiveDamaged * DAMAGED_HAPPINESS_PENALTY_PER_TILE,
  );

  let targetHappiness =
    50 +
    varietyBonus +
    Math.min(30, parksPerCapitaBonus) +
    comCount * 2 -
    pollutionImpact +
    weatherMod +
    serviceJoyBonus +
    taxHappinessMod +
    eventJoyMod -
    damagedJoyPenalty;

  if (newPop > 0 && maxPop > 0 && newPop >= maxPop * 0.98) {
    const ratio = Math.min(1, (newPop / maxPop - 0.98) / 0.02);
    targetHappiness -= Math.round(4 + ratio * 4);
  }
  targetHappiness = clamp(targetHappiness, 0, 100);

  const currentHap = stats.happiness ?? 100;
  let newHappiness = currentHap;
  if (Math.abs(targetHappiness - currentHap) > 1) {
    newHappiness = Math.round(
      currentHap + (targetHappiness - currentHap) * 0.1,
    );
    if (targetHappiness < currentHap - 10 && rng() > 0.5) {
      events.push({
        id: `${now}.${Math.floor(rng() * 1e6)}`,
        text: "Citizen: 'The city feels so bleak lately...'",
        type: 'negative',
      });
    } else if (targetHappiness > currentHap + 10 && rng() > 0.5) {
      events.push({
        id: `${now}.${Math.floor(rng() * 1e6)}`,
        text: "Citizen: 'Things are really looking up around here!'",
        type: 'positive',
      });
    }
  }

  const nextMoney = stats.money + budget.netIncome;
  const prevTier: MilestoneTier = stats.milestoneTier ?? 0;
  const nextTier = evaluateMilestoneTier(prevTier, {
    population: newPop,
    money: nextMoney,
    happiness: newHappiness,
  });
  const milestoneUnlocked = nextTier > prevTier;

  const nextGlobalTime = globalTime + GLOBAL_TIME_STEP;
  const nextDay = Math.floor(nextGlobalTime / (Math.PI * 2)) + 1;

  if (milestoneUnlocked) {
    const milestoneDef = MILESTONES[nextTier];
    events.push(
      buildMilestoneHeadline(
        milestoneDef.name,
        { day: nextDay, population: newPop, money: nextMoney },
        rng,
      ),
    );
  }

  const nextStats: CityStats = {
    money: nextMoney,
    population: newPop,
    day: nextDay,
    happiness: newHappiness,
    weather: newWeather,
    taxRate,
    milestoneTier: nextTier,
    demand,
    budget,
    activeEvent,
  };

  const goalCompleted = Boolean(
    currentGoal &&
      !currentGoal.completed &&
      checkGoalCompleted(currentGoal, nextStats, tileCounts, {
        damagedCount: effectiveDamaged,
        disconnectedCount: connectivity.disconnectedTiles.size,
      }),
  );

  return {
    nextStats,
    nextGlobalTime,
    nextWeatherTicks,
    nextEventTicks: eventRes.nextEventTicks,
    damagedTile: eventRes.damagedTile,
    goalCompleted,
    milestoneUnlocked,
    events,
  };
};
