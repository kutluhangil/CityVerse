import { CityGridAnalysis } from '../sim/advisorAnalysis';
import { ActiveCityEvent, BuildingType, CityStats, NewsItem } from '../types';

export const pickUniqueTemplate = (
  candidates: string[],
  recentTexts: string[] = [],
  rng: () => number = Math.random,
): string => {
  const recentSet = new Set(recentTexts);
  const fresh = candidates.filter((c) => !recentSet.has(c));
  const pool = fresh.length > 0 ? fresh : candidates;
  return pool[Math.floor(rng() * pool.length)];
};

const makeNews = (text: string, type: NewsItem['type'], rng: () => number): NewsItem => ({
  id: `${Date.now()}.${Math.floor(rng() * 1e6)}`,
  text,
  type,
});

export const buildBuildingHeadline = (
  type: BuildingType,
  stats: Pick<CityStats, 'day' | 'population'>,
  locationHint: string,
  recentTexts: string[] = [],
  rng: () => number = Math.random,
): NewsItem | null => {
  const pop = Math.floor(stats.population).toLocaleString();
  const byType: Partial<Record<BuildingType, { type: NewsItem['type']; lines: string[] }>> = {
    [BuildingType.Residential]: {
      type: 'positive',
      lines: [
        `Moving vans pull into ${locationHint} as new families arrive.`,
        `Carpenters top out fresh timber cottages in ${locationHint} (pop ${pop}).`,
        `Day ${stats.day}: New residential block in ${locationHint} opens for occupancy.`,
      ],
    },
    [BuildingType.Commercial]: {
      type: 'positive',
      lines: [
        `Shopkeepers hang hand-lettered awnings along ${locationHint}.`,
        `Ribbon cut on a corner market in ${locationHint}; foot traffic brisk.`,
        `Day ${stats.day}: Merchants expect stronger retail turnover in ${locationHint}.`,
      ],
    },
    [BuildingType.Industrial]: {
      type: 'neutral',
      lines: [
        `Workshop shifts begin in ${locationHint}; freight haulers line the curb.`,
        `Foundry stacks rise over ${locationHint} — output climbs, air turns smoky.`,
        `Day ${stats.day}: Manufacturing guild expands operations in ${locationHint}.`,
      ],
    },
    [BuildingType.Park]: {
      type: 'positive',
      lines: [
        `Fresh cedar saplings shade footpaths across ${locationHint}.`,
        `Neighbors gather on stone benches in ${locationHint}'s new pocket park.`,
        `Songbirds settle into ${locationHint} greenery this afternoon.`,
      ],
    },
    [BuildingType.ParkPlayground]: {
      type: 'positive',
      lines: [
        `Swings and sandbox open to cheers in ${locationHint}.`,
        `Families celebrate the new playground built near ${locationHint}.`,
      ],
    },
    [BuildingType.ParkFountain]: {
      type: 'positive',
      lines: [
        `Carved stone fountain sparkles at dusk in ${locationHint}.`,
        `Day ${stats.day}: Citizens toss lucky coins into the ${locationHint} fountain.`,
      ],
    },
    [BuildingType.PowerPlant]: {
      type: 'positive',
      lines: [
        `Turbines hum online in ${locationHint}, steadying municipal grid supply.`,
        `Grid engineers connect nearby blocks to ${locationHint} station.`,
      ],
    },
    [BuildingType.FireStation]: {
      type: 'positive',
      lines: [
        `Firehouse bells gleam in ${locationHint} — response drills begin.`,
        `Volunteer brigade mans the new ${locationHint} fire engine bay.`,
      ],
    },
    [BuildingType.PoliceStation]: {
      type: 'positive',
      lines: [
        `Night patrols launch from ${locationHint} precinct house.`,
        `Merchants welcome added beat officers stationed in ${locationHint}.`,
      ],
    },
    [BuildingType.School]: {
      type: 'positive',
      lines: [
        `School bell rings over ${locationHint}; morning enrollment surges.`,
        `Paper maps and brass globes fill classrooms in ${locationHint}.`,
      ],
    },
    [BuildingType.Hospital]: {
      type: 'positive',
      lines: [
        `City clinic opens wards in ${locationHint}, raising district capacity.`,
        `Doctors cut the ribbon on ${locationHint}'s modern medical wing.`,
      ],
    },
  };

  const entry = byType[type];
  if (!entry) return null;
  return makeNews(pickUniqueTemplate(entry.lines, recentTexts, rng), entry.type, rng);
};

export const buildMilestoneHeadline = (
  tierName: string,
  stats: Pick<CityStats, 'day' | 'population' | 'money'>,
  rng: () => number = Math.random,
): NewsItem => {
  const pop = Math.floor(stats.population).toLocaleString();
  const candidates = [
    `Special Edition — Day ${stats.day}: CityVerse chartered as a ${tierName} (${pop} citizens)!`,
    `Civic Bells Ring: ${tierName} status reached with $${Math.floor(stats.money).toLocaleString()} in treasury.`,
    `Council Proclaims ${tierName}hood — new municipal blueprints unlocked at drafting hall.`,
  ];
  return makeNews(candidates[Math.floor(rng() * candidates.length)], 'positive', rng);
};

export const buildEventHeadline = (
  event: ActiveCityEvent,
  locationHint: string,
  phase: 'start' | 'end' | 'repaired',
  rng: () => number = Math.random,
): NewsItem => {
  if (phase === 'repaired') {
    const lines = [
      `Masons finish restoring the fire-damaged block in ${locationHint}.`,
      `Repairs complete in ${locationHint}; operations and output resume.`,
    ];
    return makeNews(lines[Math.floor(rng() * lines.length)], 'positive', rng);
  }
  if (event.type === 'fire') {
    const startLines = [
      `Alert in ${locationHint}: Blaze damages a building — inspect or upgrade to repair!`,
      `Smoke rises over ${locationHint} after a structural fire took a plot offline.`,
    ];
    const endLines = [
      `Fire crews contain embers in ${locationHint}; structural inspection remains.`,
    ];
    return makeNews(
      phase === 'start' ? startLines[Math.floor(rng() * startLines.length)] : endLines[0],
      phase === 'start' ? 'negative' : 'neutral',
      rng,
    );
  }
  if (event.type === 'festival') {
    return makeNews(
      phase === 'start'
        ? `Lantern Festival begins! Shops enjoy +25% trade and spirits soar across the island.`
        : `Festival lanterns come down cleanly; merchants tally brisk holiday sales.`,
      phase === 'start' ? 'positive' : 'neutral',
      rng,
    );
  }
  return makeNews(
    phase === 'start'
      ? `Labor Strike called in workshops: Industrial output drops 40% temporarily.`
      : `Workshop stewards and council reach accord; factory shifts normalize.`,
    phase === 'start' ? 'negative' : 'positive',
    rng,
  );
};

export const buildAmbientHeadline = (
  stats: CityStats,
  analysis: CityGridAnalysis,
  recentTexts: string[] = [],
  rng: () => number = Math.random,
): NewsItem => {
  const candidates: { text: string; type: NewsItem['type'] }[] = [];
  const pop = Math.floor(stats.population).toLocaleString();

  if (analysis.damaged.length > 0) {
    candidates.push(
      { text: `Damaged buildings in ${analysis.damagedRegion} await municipal repair crews.`, type: 'negative' },
      { text: `Inspectors urge mayor to fund repairs in ${analysis.damagedRegion}.`, type: 'negative' },
    );
  }
  if (analysis.disconnected.length > 0) {
    candidates.push(
      { text: `Delivery carts stranded near ${analysis.disconnectedRegion} without a main road link.`, type: 'negative' },
      { text: `Unconnected lots in ${analysis.disconnectedRegion} sit dark and unproductive.`, type: 'negative' },
    );
  }
  if (analysis.pollution.length > 0) {
    candidates.push(
      { text: `Soot drifts onto homes in ${analysis.pollutionRegion} from nearby smokestacks.`, type: 'negative' },
      { text: `Citizens in ${analysis.pollutionRegion} ask for cleaner buffers around industry.`, type: 'negative' },
    );
  }
  if (analysis.parkless.length > 0) {
    candidates.push(
      { text: `Families in ${analysis.parklessRegion} stroll miles seeking shaded park benches.`, type: 'neutral' },
      { text: `Civic column notes ${analysis.parklessRegion} lacks a neighborhood pocket park.`, type: 'neutral' },
    );
  }
  if (analysis.serviceGaps.power > 0) {
    candidates.push({
      text: `Voltage dips reported across ${analysis.serviceGaps.powerRegion} outside grid radius.`,
      type: 'neutral',
    });
  }
  if (stats.taxRate >= 13) {
    candidates.push({
      text: `Taxpayers debate the ${stats.taxRate}% levy at town hall coffeeshops.`,
      type: 'negative',
    });
  } else if (stats.taxRate <= 7) {
    candidates.push({
      text: `Low ${stats.taxRate}% tax rate draws warm praise from small shopkeepers.`,
      type: 'positive',
    });
  }
  if (stats.weather === 'rainy') {
    candidates.push({
      text: `Slick cobblestones slow tramcars and sedans across central intersections.`,
      type: 'neutral',
    });
  } else if (stats.weather === 'snowy') {
    candidates.push({
      text: `Snow blankets model rooftops; factory freight output slips 30% in cold snap.`,
      type: 'neutral',
    });
  }

  candidates.push(
    { text: `Day ${stats.day}: Census tallies ${pop} residents across island districts.`, type: 'positive' },
    { text: `Morning ferry docks smoothly along the sandy breakwater.`, type: 'positive' },
    { text: `Local bakery unveils terracotta-glazed sourdough loaves.`, type: 'positive' },
    { text: `Evening lamplighters test corners before dusk falls.`, type: 'neutral' },
    { text: `Treasury ledger stands at $${Math.floor(stats.money).toLocaleString()} this morning.`, type: 'neutral' },
    { text: `Musicians gather around the central intersection fountain.`, type: 'positive' },
    { text: `Pigeons stage peaceful sit-in on the town hall eaves.`, type: 'neutral' },
    { text: `Archivists bind fresh street maps for CityVerse's drafting room.`, type: 'neutral' },
    { text: `Sidewalk cafes set out fresh canvas chairs under clear island skies.`, type: 'positive' },
    { text: `Shopkeepers report steady demand (${stats.demand.commercial}) on main avenue.`, type: stats.demand.commercial >= 0 ? 'positive' : 'neutral' },
  );

  const recentSet = new Set(recentTexts);
  const fresh = candidates.filter((c) => !recentSet.has(c.text));
  const pool = fresh.length > 0 ? fresh : candidates;
  const chosen = pool[Math.floor(rng() * pool.length)];
  return makeNews(chosen.text, chosen.type, rng);
};
