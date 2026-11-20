/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { analyzeCityGrid, CityGridAnalysis } from '../sim/advisorAnalysis';
import {
  AdvisorHistory,
  BuildingType,
  CityGoal,
  CityStats,
  Grid,
  NewsItem,
} from '../types';
import { buildAmbientHeadline, pickUniqueTemplate } from './newsTemplates';

export const createInitialAdvisorHistory = (): AdvisorHistory => ({
  completedCount: 0,
  recentDescriptions: [],
});

export const recordGoalInHistory = (
  history: AdvisorHistory,
  goal: Pick<CityGoal, 'description' | 'category'>,
  completed = false,
): AdvisorHistory => {
  const last = history.recentDescriptions[history.recentDescriptions.length - 1];
  const recentDescriptions =
    last === goal.description
      ? history.recentDescriptions
      : [...history.recentDescriptions, goal.description].slice(-60);
  return {
    completedCount: completed ? history.completedCount + 1 : history.completedCount,
    lastCategory: goal.category ?? history.lastCategory,
    recentDescriptions,
  };
};

interface GoalCandidate {
  category: string;
  priority: number;
  targetType: CityGoal['targetType'];
  targetValue: number;
  buildingType?: BuildingType;
  reward: number;
  locationHint?: string;
  templates: string[];
}

const roundTo = (value: number, step: number) =>
  Math.max(step, Math.round(value / step) * step);

const buildCandidates = (
  stats: CityStats,
  analysis: CityGridAnalysis,
  chainStep: number,
): GoalCandidate[] => {
  const completedCount = Math.max(0, chainStep - 1);
  const scaleFactor = 1 + completedCount * 0.15;
  const stepBonus = Math.floor(completedCount / 3);
  const counts = analysis.counts;
  const res = counts[BuildingType.Residential] || 0;
  const com = counts[BuildingType.Commercial] || 0;
  const ind = counts[BuildingType.Industrial] || 0;
  const parks =
    (counts[BuildingType.Park] || 0) +
    (counts[BuildingType.ParkPlayground] || 0) +
    (counts[BuildingType.ParkFountain] || 0);

  const list: GoalCandidate[] = [];

  if (analysis.damaged.length > 0) {
    const loc = analysis.damagedRegion;
    list.push({
      category: 'repair',
      priority: 1,
      targetType: 'repair_all',
      targetValue: 0,
      reward: Math.round(280 * scaleFactor),
      locationHint: loc,
      templates: [
        `Damaged buildings in ${loc} sit offline. Send repair crews right away.`,
        `Fire scars in ${loc} weigh on morale — inspect and restore the block.`,
        `Restore damaged structures in ${loc} to resume full civic services.`,
        `Public safety board urges immediate repairs across ${loc}.`,
        `Drafting hall flagged broken masonry in ${loc}; patch every plot.`,
        `Bring damaged buildings in ${loc} back into active service.`,
      ],
    });
  }

  if (analysis.disconnected.length > 0) {
    const loc = analysis.disconnectedRegion;
    list.push({
      category: 'connectivity',
      priority: 1,
      targetType: 'connect_all',
      targetValue: 0,
      reward: Math.round(240 * scaleFactor),
      locationHint: loc,
      templates: [
        `Isolated plots in ${loc} lack main road access. Link every road network.`,
        `Residents in ${loc} cannot reach avenues — connect stranded buildings.`,
        `Delivery wagons stalled near ${loc}; extend roads to reconnect all lots.`,
        `Clear the grid lock: link unconnected structures in ${loc} to the main hub.`,
        `Road survey found stranded blocks in ${loc}. Build a connecting street.`,
        `Tie every isolated lot in ${loc} back into the primary road grid.`,
      ],
    });
  }

  if (analysis.parkless.length > 0 || stats.happiness < 65 || parks * 3 < res) {
    const loc = analysis.parkless.length > 0 ? analysis.parklessRegion : 'central downtown';
    const addParks = Math.min(4, 1 + Math.floor(completedCount / 4));
    const currentPark = counts[BuildingType.Park] || 0;
    list.push({
      category: 'parks',
      priority: analysis.parkless.length > 0 ? 1 : 2,
      targetType: 'building_count',
      buildingType: BuildingType.Park,
      targetValue: currentPark + addParks,
      reward: Math.round((180 + addParks * 60) * scaleFactor),
      locationHint: loc,
      templates: [
        `Homes in ${loc} have no nearby park. Plant green space for families.`,
        `Avenues around ${loc} need shade — zone ${addParks} new park(s) nearby.`,
        `Neighbors in ${loc} are asking for pocket parks to walk their dogs.`,
        `Green commission recommends ${addParks} cedar park(s) serving ${loc}.`,
        `Give households in ${loc} room to breathe with fresh parkland.`,
        `Civic petition from ${loc}: establish peaceful park benches close by.`,
      ],
    });
  }

  if (analysis.pollution.length > 0) {
    const loc = analysis.pollutionRegion;
    const goalJoy = Math.min(95, Math.max(60, Math.round(stats.happiness / 5) * 5 + 10));
    list.push({
      category: 'pollution',
      priority: 1,
      targetType: 'happiness',
      targetValue: goalJoy,
      reward: Math.round(320 * scaleFactor),
      locationHint: loc,
      templates: [
        `Factory soot near ${loc} is hurting homes. Offset smog and lift joy to ${goalJoy}%.`,
        `Buffer industrial haze around ${loc} with parks or services until morale hits ${goalJoy}%.`,
        `Residents in ${loc} report smokestack odor; raise district happiness to ${goalJoy}%.`,
        `Relocate noisy stacks or cheer ${loc} households back up to ${goalJoy}% joy.`,
        `Environmental audit flagged ${loc} blocks — steady city joy at ${goalJoy}%.`,
        `Clear the gloom hanging over ${loc} neighborhoods to reach ${goalJoy}% morale.`,
      ],
    });
  }

  if (analysis.serviceGaps.power > 0) {
    const loc = analysis.serviceGaps.powerRegion;
    list.push({
      category: 'service_power',
      priority: 2,
      targetType: 'building_count',
      buildingType: BuildingType.PowerPlant,
      targetValue: (counts[BuildingType.PowerPlant] || 0) + 1,
      reward: Math.round(360 * scaleFactor),
      locationHint: loc,
      templates: [
        `Blocks in ${loc} sit outside grid power coverage. Build a Power station.`,
        `Engineers noted unpowered shops near ${loc}; add generation nearby.`,
        `Extend electrical service into ${loc} to raise zone output.`,
        `Steady voltage in ${loc} requires another neighborhood Power Plant.`,
        `Keep lights burning cleanly across ${loc} with expanded power capacity.`,
        `Power survey spotted dark blocks in ${loc} — construct a station within 5 tiles.`,
      ],
    });
  }

  if (stats.milestoneTier >= 1 && analysis.serviceGaps.fire > 0) {
    const loc = analysis.serviceGaps.fireRegion;
    list.push({
      category: 'service_fire',
      priority: 2,
      targetType: 'building_count',
      buildingType: BuildingType.FireStation,
      targetValue: (counts[BuildingType.FireStation] || 0) + 1,
      reward: Math.round(420 * scaleFactor),
      locationHint: loc,
      templates: [
        `Buildings in ${loc} lack Fire coverage. Station a brigade nearby.`,
        `Protect timber roofs in ${loc} with a new neighborhood Fire Station.`,
        `Insurance board asks for firehouse coverage over ${loc}.`,
        `Reduce fire hazard across ${loc} by adding a station within 4 tiles.`,
        `Volunteers in ${loc} are ready — build them a Fire Station.`,
        `Shield ${loc} avenues against outbreaks with an active Fire Station.`,
      ],
    });
  }

  if (stats.milestoneTier >= 1 && analysis.serviceGaps.school > 0) {
    const loc = analysis.serviceGaps.schoolRegion;
    list.push({
      category: 'service_school',
      priority: 2,
      targetType: 'building_count',
      buildingType: BuildingType.School,
      targetValue: (counts[BuildingType.School] || 0) + 1,
      reward: Math.round(440 * scaleFactor),
      locationHint: loc,
      templates: [
        `Families in ${loc} commute far for class. Build a neighborhood School.`,
        `Education board highlights overcrowding gaps near ${loc}; open a School.`,
        `Young citizens in ${loc} await local classrooms to speed town growth.`,
        `Place a School covering ${loc} homes to brighten prospects.`,
        `Parents across ${loc} petitioned town hall for an accessible School.`,
        `Boost family attraction in ${loc} with a dedicated Schoolhouse.`,
      ],
    });
  }

  if (stats.milestoneTier >= 2 && analysis.serviceGaps.police > 0) {
    const loc = analysis.serviceGaps.policeRegion;
    list.push({
      category: 'service_police',
      priority: 2,
      targetType: 'building_count',
      buildingType: BuildingType.PoliceStation,
      targetValue: (counts[BuildingType.PoliceStation] || 0) + 1,
      reward: Math.round(480 * scaleFactor),
      locationHint: loc,
      templates: [
        `Merchants in ${loc} request night patrols. Open a Police Station.`,
        `Establish civic order across ${loc} avenues with precinct coverage.`,
        `Commerce near ${loc} will flourish with local safety patrols.`,
        `Place a Police precinct within 5 tiles of busy ${loc} avenues.`,
        `Safety review points to patrol gaps around ${loc}.`,
        `Give ${loc} neighborhoods dependable day-and-night policing.`,
      ],
    });
  }

  if (stats.milestoneTier >= 2 && analysis.serviceGaps.hospital > 0) {
    const loc = analysis.serviceGaps.hospitalRegion;
    list.push({
      category: 'service_hospital',
      priority: 2,
      targetType: 'building_count',
      buildingType: BuildingType.Hospital,
      targetValue: (counts[BuildingType.Hospital] || 0) + 1,
      reward: Math.round(540 * scaleFactor),
      locationHint: loc,
      templates: [
        `Housing capacity in ${loc} is maxed out without a nearby Hospital.`,
        `Open a medical clinic serving ${loc} to raise residential density.`,
        `Health council prioritizes clinic access for households in ${loc}.`,
        `Keep ${loc} citizens thriving with modern Hospital coverage.`,
        `Doctors advise constructing a Hospital within 5 tiles of ${loc}.`,
        `Expand medical care into ${loc} to support high-density living.`,
      ],
    });
  }

  const addCom = 1 + Math.min(3, Math.floor(completedCount / 3));
  list.push({
    category: 'commercial',
    priority: com < Math.ceil(res / 2) || stats.demand.commercial > 20 ? 2 : 3,
    targetType: 'building_count',
    buildingType: BuildingType.Commercial,
    targetValue: com + addCom,
    reward: Math.round((360 + addCom * 80) * scaleFactor),
    templates: [
      `Retail demand is rising — open ${addCom} more Commercial shopfront(s).`,
      `Hungry commuters need corner stores; expand Commercial zoning by ${addCom}.`,
      `Artisans want storefronts. Add ${addCom} shop(s) along busy avenues.`,
      `Chamber of Commerce calls for ${addCom} new retail block(s) to circulate trade.`,
      `Boost daily municipal revenue with ${addCom} fresh storefront build(s).`,
      `Satisfy bustling avenue shoppers by zoning ${addCom} Commercial lot(s).`,
    ],
  });

  const addRes = 2 + Math.min(3, stepBonus);
  list.push({
    category: 'residential',
    priority: res <= com + ind || stats.demand.residential > 20 ? 2 : 3,
    targetType: 'building_count',
    buildingType: BuildingType.Residential,
    targetValue: res + addRes,
    reward: Math.round((340 + addRes * 60) * scaleFactor),
    templates: [
      `Jobs await workers — zone ${addRes} more Residential lot(s).`,
      `Housing registry sees warm inquiries; add ${addRes} cozy House plot(s).`,
      `Grow the tax base steadily with ${addRes} road-linked family home(s).`,
      `Welcoming gates stand ready for ${addRes} additional residential block(s).`,
      `Meet newcomer shelter demand by plating ${addRes} more houses.`,
      `Keep workshops staffed by adding ${addRes} residential parcel(s).`,
    ],
  });

  const addInd = 1 + Math.min(2, Math.floor(completedCount / 4));
  list.push({
    category: 'industrial',
    priority: ind < Math.max(1, Math.floor(com / 2)) || stats.demand.industrial > 20 ? 2 : 3,
    targetType: 'building_count',
    buildingType: BuildingType.Industrial,
    targetValue: ind + addInd,
    reward: Math.round((400 + addInd * 90) * scaleFactor),
    templates: [
      `Shops need wholesale freight — site ${addInd} Factory lot(s) away from homes.`,
      `Strengthen the supply chain with ${addInd} properly buffered Factory unit(s).`,
      `Manufacturing demand calls for ${addInd} more clean-spaced Industrial plot(s).`,
      `Export goods from the harbor by opening ${addInd} workshop(s) well clear of cottages.`,
      `Diversify city revenues with ${addInd} additional Industrial enterprise(s).`,
      `Meet merchant wholesale orders through ${addInd} new factory floor(s).`,
    ],
  });

  const targetPop = roundTo(stats.population * 1.35 + 45 + completedCount * 20, 25);
  list.push({
    category: 'population',
    priority: 3,
    targetType: 'population',
    targetValue: targetPop,
    reward: Math.round(450 * scaleFactor),
    templates: [
      `Expand housing and services to reach ${targetPop.toLocaleString()} citizens.`,
      `Census office aims for ${targetPop.toLocaleString()} island inhabitants this term.`,
      `Grow CityVerse steadily until population clears ${targetPop.toLocaleString()}.`,
      `Attract new households across town to cross ${targetPop.toLocaleString()} residents.`,
      `Balanced jobs and parks will welcome ${targetPop.toLocaleString()} citizens.`,
      `Steer civic expansion past the ${targetPop.toLocaleString()}-citizen mark.`,
    ],
  });

  const targetMoney = roundTo(Math.max(stats.money, 500) * 1.25 + 400 + completedCount * 150, 250);
  list.push({
    category: 'money',
    priority: 3,
    targetType: 'money',
    targetValue: targetMoney,
    reward: Math.round(350 * scaleFactor),
    templates: [
      `Maintain a healthy surplus and grow treasury reserves to $${targetMoney.toLocaleString()}.`,
      `Comptroller seeks $${targetMoney.toLocaleString()} in reserves for civic projects.`,
      `Balance taxes and upkeep cleanly until the vault holds $${targetMoney.toLocaleString()}.`,
      `Build fiscal resilience — reach a $${targetMoney.toLocaleString()} municipal balance.`,
      `Keep trade moving smoothly until treasury hits $${targetMoney.toLocaleString()}.`,
      `Set aside $${targetMoney.toLocaleString()} in municipal capital before expanding further.`,
    ],
  });

  const targetHap = Math.min(96, Math.max(70, Math.round(stats.happiness / 5) * 5 + 10));
  list.push({
    category: 'happiness',
    priority: stats.happiness < 70 ? 2 : 3,
    targetType: 'happiness',
    targetValue: targetHap,
    reward: Math.round(330 * scaleFactor),
    templates: [
      `Delight citizens across the island and lift overall morale to ${targetHap}%.`,
      `Balance parks, gentle taxes, and services to reach ${targetHap}% joy.`,
      `Neighborhood satisfaction gauge targets ${targetHap}% city happiness.`,
      `Tune civic harmony upward until happiness stands at ${targetHap}%.`,
      `Give residents quiet green spaces and fair taxes for ${targetHap}% approval.`,
      `Raise municipal goodwill across all blocks to ${targetHap}%.`,
    ],
  });

  return list;
};

export const generateCityGoal = (
  stats: CityStats,
  grid: Grid,
  history?: AdvisorHistory,
  rng: () => number = Math.random,
): CityGoal => {
  const hist = history ?? createInitialAdvisorHistory();
  const chainStep = hist.completedCount + 1;
  const analysis = analyzeCityGrid(grid, stats);
  const all = buildCandidates(stats, analysis, chainStep);

  const nonRepeatingCat = all.filter((c) => c.category !== hist.lastCategory);
  const catPool = nonRepeatingCat.length > 0 ? nonRepeatingCat : all;

  const recentSet = new Set(hist.recentDescriptions);
  const minPriority = Math.min(...catPool.map((c) => c.priority));
  const topTier = catPool.filter((c) => c.priority === minPriority);

  const unusedTop = topTier.filter((c) =>
    c.templates.some((t) => !recentSet.has(t)),
  );
  const finalPool =
    unusedTop.length > 0
      ? unusedTop
      : catPool.filter((c) => c.templates.some((t) => !recentSet.has(t)));

  const pickedPool = finalPool.length > 0 ? finalPool : topTier;
  const selected = pickedPool[Math.floor(rng() * pickedPool.length)];
  const unusedTemplates = selected.templates.filter((t) => !recentSet.has(t));
  const description =
    unusedTemplates.length > 0
      ? unusedTemplates[Math.floor(rng() * unusedTemplates.length)]
      : `${selected.templates[Math.floor(rng() * selected.templates.length)]} (Directive #${chainStep})`;

  return {
    description,
    targetType: selected.targetType,
    targetValue: selected.targetValue,
    ...(selected.buildingType ? { buildingType: selected.buildingType } : {}),
    reward: selected.reward,
    completed: false,
    category: selected.category,
    chainStep,
    ...(selected.locationHint ? { locationHint: selected.locationHint } : {}),
  };
};

export const generateNewsEvent = (
  stats: CityStats,
  grid?: Grid,
  recentTexts: string[] = [],
  rng: () => number = Math.random,
): NewsItem => {
  if (!grid) {
    const pool: { text: string; type: NewsItem['type'] }[] = [
      { text: `Day ${stats.day}: local bakery reports record queues.`, type: 'positive' },
      { text: `${Math.floor(stats.population).toLocaleString()} residents and counting, says city hall.`, type: 'positive' },
      { text: `Treasury stands at $${Math.floor(stats.money).toLocaleString()}.`, type: 'neutral' },
      { text: `Council debates the color of new paper tramway stops.`, type: 'neutral' },
    ];
    const picked = pickUniqueTemplate(pool.map((p) => p.text), recentTexts, rng);
    const match = pool.find((p) => p.text === picked) ?? pool[0];
    return { id: `${Date.now()}.${Math.floor(rng() * 1e6)}`, text: match.text, type: match.type };
  }
  const analysis = analyzeCityGrid(grid, stats);
  return buildAmbientHeadline(stats, analysis, recentTexts, rng);
};
