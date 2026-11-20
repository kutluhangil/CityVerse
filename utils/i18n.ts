import React, { createContext, useCallback, useContext, useState } from 'react';
import { BUILDINGS } from '../constants';
import { MILESTONES } from '../sim/milestones';
import { BuildingType, DataOverlayMode, MilestoneTier } from '../types';

export type Locale = 'en' | 'tr';

const LANG_STORAGE_KEY = 'cityverse_lang';

export const loadLocale = (): Locale => {
  if (typeof window === 'undefined') return 'en';
  try {
    const raw = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (raw === 'tr' || raw === 'en') return raw;
  } catch {
    // Ignore storage read errors
  }
  return 'en';
};

export const saveLocale = (locale: Locale): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, locale);
  } catch {
    // Ignore storage write errors
  }
};

const EN = {
  brandBadge: 'CityVerse Architectural Model',
  heroTitleA: 'Build a Living City.',
  heroTitleB: 'One Block at a Time.',
  heroDesc: 'Survey the island, lay paper avenues, balance municipal taxes, and guide your settlement from a quiet village to a balanced metropolis.',
  savedPrefix: 'Saved: Day',
  citizensWord: 'citizens',
  continueCity: 'Continue City',
  initSim: 'Initialize Simulation',
  newCity: 'New City',
  deleteSave: 'Delete Save',
  importJson: 'Import JSON',
  invalidSave: 'Invalid save JSON. Choose a valid CityVerse export file.',
  featEcon: 'RCI Economy',
  featDiorama: 'Island Diorama',
  featTraffic: 'Live Traffic',
  livePreview: 'Live Model Preview',
  treasury: 'Treasury',
  citizens: 'Citizens',
  day: 'Day',
  joy: 'Joy',
  weather: 'Weather',
  data: 'Data',
  budget: 'Budget',
  bankruptcyRisk: 'Bankruptcy Risk',
  overlayWarn: 'Build tools disabled while Data Overlay is active.',
  advisor: 'City Advisor',
  step: 'Step',
  goal: 'Goal',
  collectReward: 'Collect Reward',
  noGoal: 'No active goal.',
  trafficCap: 'Traffic Cap',
  cityFeed: 'City Feed',
  noNews: 'No active dispatches.',
  cityBudgetTax: 'City Budget & Tax',
  taxRate: 'Tax Rate',
  resTax: 'Residential Tax',
  comTax: 'Commercial',
  indTax: 'Industrial',
  upkeep: 'Upkeep',
  netTick: 'Net / tick',
  tier: 'Tier',
  next: 'Next',
  reqPrefix: 'Req',
  maxMetropolis: 'Maximum Metropolis milestone achieved.',
  islandSize: 'Island Map',
  expandLand: 'Expand Land',
  maxIsland: 'Maximum island expansion reached.',
  inspectorTitle: 'Building Inspector',
  type: 'Type',
  level: 'Level',
  income: 'Income',
  population: 'Population',
  serviceRadius: 'Service Radius',
  tiles: 'tiles',
  perDay: '/ day',
  perMax: '/ max',
  damagedWarn: 'Structure Damaged — Offline until repaired.',
  repairBuilding: 'Repair Building',
  upgradeTo: 'Upgrade to',
  redevelop: 'Redevelop',
  refundWord: 'refund',
  milestoneDone: 'Milestone Complete',
  metropolisWin: 'Metropolis Achieved!',
  metropolisDesc: 'Your city grew into a thriving Metropolis with balanced finances and happy citizens.',
  keepPlaying: 'Keep Playing',
  treasuryDefault: 'Treasury Default',
  cityBankrupt: 'City Bankrupt',
  bailout: 'Emergency Bailout (+$500, -15 Joy)',
  damagedStruct: 'Damaged Structure',
  inspectDamaged: 'Inspect Damaged',
  exitPhotoMode: 'Exit Photo Mode',
  fpsUnit: 'FPS',
  pausedBadge: 'Paused',
  repairGoal: 'Repair damaged',
  connectGoal: 'Connect roads',
  unlocksAt: 'Unlocks at',
} as const;

const TR: Record<keyof typeof EN, string> = {
  brandBadge: 'CityVerse Mimari Maket',
  heroTitleA: 'Yaşayan Şehir Kur.',
  heroTitleB: 'Her Kareyi Tasarla.',
  heroDesc: 'Adayı keşfet, kâğıt caddeler döşe, belediye vergilerini dengele ve yerleşimini sakin bir köyden metropole büyüt.',
  savedPrefix: 'Kayıtlı: Gün',
  citizensWord: 'nüfus',
  continueCity: 'Şehre Devam Et',
  initSim: 'Simülasyonu Başlat',
  newCity: 'Yeni Şehir',
  deleteSave: 'Kaydı Sil',
  importJson: 'JSON İçe Aktar',
  invalidSave: 'Geçersiz kayıt dosyası. Geçerli bir CityVerse JSON dosyası seçin.',
  featEcon: 'RCI Ekonomi',
  featDiorama: 'Ada Maketi',
  featTraffic: 'Canlı Trafik',
  livePreview: 'Canlı Maket Önizleme',
  treasury: 'Hazine',
  citizens: 'Nüfus',
  day: 'Gün',
  joy: 'Mutluluk',
  weather: 'Hava',
  data: 'Katman',
  budget: 'Bütçe',
  bankruptcyRisk: 'İflas Riski',
  overlayWarn: 'Veri Katmanı açıkken inşa araçları devre dışıdır.',
  advisor: 'Şehir Danışmanı',
  step: 'Adım',
  goal: 'Hedef',
  collectReward: 'Ödülü Topla',
  noGoal: 'Aktif hedef yok.',
  trafficCap: 'Trafik Limiti',
  cityFeed: 'Şehir Bülteni',
  noNews: 'Henüz haber akışı yok.',
  cityBudgetTax: 'Bütçe, Vergi ve Arsa',
  taxRate: 'Vergi Oranı',
  resTax: 'Konut Vergisi',
  comTax: 'Ticaret',
  indTax: 'Sanayi',
  upkeep: 'Bakım Gideri',
  netTick: 'Net / tur',
  tier: 'Kademe',
  next: 'Sonraki',
  reqPrefix: 'Koşul',
  maxMetropolis: 'En yüksek Metropol kademesine ulaşıldı.',
  islandSize: 'Ada Haritası',
  expandLand: 'Arsayı Genişlet',
  maxIsland: 'Azami ada boyutuna ulaşıldı.',
  inspectorTitle: 'Bina Denetçisi',
  type: 'Tür',
  level: 'Seviye',
  income: 'Gelir',
  population: 'Kapasite',
  serviceRadius: 'Etki Alanı',
  tiles: 'kare',
  perDay: '/ gün',
  perMax: '/ maks',
  damagedWarn: 'Yapı Hasarlı — Onarılana kadar devre dışı.',
  repairBuilding: 'Binayı Onar',
  upgradeTo: 'Yükselt:',
  redevelop: 'Yık & Dönüştür',
  refundWord: 'iade',
  milestoneDone: 'Kademe Tamamlandı',
  metropolisWin: 'Metropole Ulaşıldı!',
  metropolisDesc: 'Şehrin dengeli maliyesi ve mutlu sakinleriyle gelişen bir Metropole dönüştü.',
  keepPlaying: 'Oynamaya Devam Et',
  treasuryDefault: 'Mali İflas',
  cityBankrupt: 'Şehir İflas Etti',
  bailout: 'Acil Kurtarma (+$500, -15 Mutluluk)',
  damagedStruct: 'Hasarlı Yapı',
  inspectDamaged: 'Hasarı İncele',
  exitPhotoMode: 'Fotoğraf Modundan Çık',
  fpsUnit: 'FPS',
  pausedBadge: 'Duraklatıldı',
  repairGoal: 'Hasarlıyı onar',
  connectGoal: 'Yolları bağla',
  unlocksAt: 'Açılış kademesi',
};

const TR_BUILDINGS: Partial<Record<BuildingType, { name: string; desc: string }>> = {
  [BuildingType.None]: { name: 'Temizle', desc: 'Kareyi temizle' },
  [BuildingType.Road]: { name: 'Yol', desc: 'Binaları bağlar (R).' },
  [BuildingType.Residential]: { name: 'Konut', desc: '+5 Nüfus/gün' },
  [BuildingType.Commercial]: { name: 'Dükkân', desc: '+$15/gün ticaret' },
  [BuildingType.Industrial]: { name: 'Fabrika', desc: '+$36/gün sanayi' },
  [BuildingType.Park]: { name: 'Park', desc: 'Mutluluk verir.' },
  [BuildingType.ParkPlayground]: { name: 'Oyun Alanı', desc: 'Yol yanında yüksek mutluluk.' },
  [BuildingType.ParkFountain]: { name: 'Çeşme', desc: 'Bölge cazibesini artırır.' },
  [BuildingType.PowerPlant]: { name: 'Santral', desc: 'Yakın bölgelere güç verir (5 kare).' },
  [BuildingType.FireStation]: { name: 'İtfaiye', desc: 'Yangına karşı korur (Kasaba).' },
  [BuildingType.School]: { name: 'Okul', desc: 'Büyüme & mutluluk artışı (Kasaba).' },
  [BuildingType.PoliceStation]: { name: 'Polis', desc: 'Güvenlik & ticaret bonusu (Şehir).' },
  [BuildingType.Hospital]: { name: 'Hastane', desc: 'Konut kapasitesi & mutluluk (Şehir).' },
  [BuildingType.Upgrade]: { name: 'Yükselt', desc: 'Yükselt veya hasarlıyı onar.' },
  [BuildingType.Inspect]: { name: 'İncele', desc: 'Bina detaylarını gör.' },
  [BuildingType.Demolish]: { name: 'Yık', desc: 'Binayı yık veya orman temizle.' },
};

const TR_MILESTONES: Record<MilestoneTier, string> = {
  0: 'Köy',
  1: 'Kasaba',
  2: 'Şehir',
  3: 'Metropol',
};

const TR_DATA_MODES: Record<DataOverlayMode, string> = {
  none: 'yok',
  population: 'nüfus',
  income: 'gelir',
  happiness: 'mutluluk',
  services: 'hizmet',
};

export type TranslationKey = keyof typeof EN;

interface I18nContextValue {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  toggleLocale: () => void;
  t: (key: TranslationKey) => string;
  buildingName: (type: BuildingType) => string;
  buildingDesc: (type: BuildingType) => string;
  milestoneName: (tier: MilestoneTier) => string;
  dataModeLabel: (mode: DataOverlayMode) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [locale, setLocaleState] = useState<Locale>(loadLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    saveLocale(next);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => {
      const next: Locale = prev === 'en' ? 'tr' : 'en';
      saveLocale(next);
      return next;
    });
  }, []);

  const t = useCallback(
    (key: TranslationKey) => (locale === 'tr' ? TR[key] : EN[key]),
    [locale],
  );

  const buildingName = useCallback(
    (type: BuildingType) =>
      locale === 'tr'
        ? (TR_BUILDINGS[type]?.name ?? BUILDINGS[type].name)
        : BUILDINGS[type].name,
    [locale],
  );

  const buildingDesc = useCallback(
    (type: BuildingType) =>
      locale === 'tr'
        ? (TR_BUILDINGS[type]?.desc ?? BUILDINGS[type].description)
        : BUILDINGS[type].description,
    [locale],
  );

  const milestoneName = useCallback(
    (tier: MilestoneTier) =>
      locale === 'tr' ? TR_MILESTONES[tier] : MILESTONES[tier].name,
    [locale],
  );

  const dataModeLabel = useCallback(
    (mode: DataOverlayMode) => (locale === 'tr' ? TR_DATA_MODES[mode] : mode),
    [locale],
  );

  return React.createElement(
    I18nContext.Provider,
    {
      value: {
        locale,
        setLocale,
        toggleLocale,
        t,
        buildingName,
        buildingDesc,
        milestoneName,
        dataModeLabel,
      },
    },
    children,
  );
};

export const useI18n = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
};
