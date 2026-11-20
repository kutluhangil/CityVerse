/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
export enum BuildingType {
  None = 'None',
  Road = 'Road',
  Residential = 'Residential',
  Commercial = 'Commercial',
  Industrial = 'Industrial',
  Park = 'Park',
  ParkPlayground = 'ParkPlayground',
  ParkFountain = 'ParkFountain',
  PowerPlant = 'PowerPlant',
  FireStation = 'FireStation',
  PoliceStation = 'PoliceStation',
  School = 'School',
  Hospital = 'Hospital',
  Upgrade = 'Upgrade',
  Inspect = 'Inspect',
  Demolish = 'Demolish',
}

export type MilestoneTier = 0 | 1 | 2 | 3;

export interface BuildingConfig {
  type: BuildingType;
  cost: number;
  name: string;
  description: string;
  color: string; // Main color for 3D material
  popGen: number; // Population generation per tick
  incomeGen: number; // Money generation per tick
  upkeep?: number; // Maintenance cost per tick
  serviceRadius?: number; // Manhattan coverage radius
  unlockTier?: MilestoneTier; // Required city milestone tier
}

export type TerrainType = 'land' | 'sand' | 'water' | 'forest';

export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface FloatingTextEvent {
  id: number;
  x: number;
  y: number;
  text: string;
  positive: boolean;
}

export interface TileData {
  x: number;
  y: number;
  buildingType: BuildingType;
  terrain?: TerrainType;
  isDamaged?: boolean;
  // Reserved for per-tile visual variants
  variant?: number;
  level?: number;
}

export type Grid = TileData[][];

export type WeatherType = 'sunny' | 'rainy' | 'snowy';

export type DataOverlayMode =
  | 'none'
  | 'population'
  | 'income'
  | 'happiness'
  | 'services';

export interface RCIDemand {
  residential: number;
  commercial: number;
  industrial: number;
}

export interface BudgetBreakdown {
  residentialTax: number;
  commercialIncome: number;
  industrialIncome: number;
  upkeep: number;
  netIncome: number;
}

export type CityEventType = 'fire' | 'festival' | 'strike';

export interface ActiveCityEvent {
  id: string;
  type: CityEventType;
  title: string;
  description: string;
  ticksRemaining: number;
  totalTicks: number;
  affectedTile?: { x: number; y: number };
}

export interface AdvisorHistory {
  completedCount: number;
  lastCategory?: string;
  recentDescriptions: string[];
}

export interface CityStats {
  money: number;
  population: number;
  day: number;
  happiness: number;
  weather: WeatherType;
  taxRate: number;
  milestoneTier: MilestoneTier;
  demand: RCIDemand;
  budget: BudgetBreakdown;
  activeEvent?: ActiveCityEvent | null;
}

export interface CityGoal {
  description: string;
  targetType:
    | 'population'
    | 'money'
    | 'building_count'
    | 'happiness'
    | 'repair_all'
    | 'connect_all';
  targetValue: number;
  buildingType?: BuildingType; // If target is building_count
  reward: number;
  completed: boolean;
  category?: string;
  chainStep?: number;
  locationHint?: string;
}

export interface NewsItem {
  id: string;
  text: string;
  type: 'positive' | 'negative' | 'neutral';
}
