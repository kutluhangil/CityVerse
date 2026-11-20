import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_TAX_RATE, INITIAL_MONEY } from '../constants';
import {
  createInitialAdvisorHistory,
  generateCityGoal,
  recordGoalInHistory,
} from '../services/advisor';
import { createInitialGrid } from '../sim/grid';
import {
  clearCitySave,
  getSaveSummary,
  loadCityFromStorage,
  parseSave,
  saveCityToStorage,
  SaveSummary,
  serializeSave,
} from '../sim/storage';
import { INITIAL_GLOBAL_TIME } from '../sim/tick';
import {
  AdvisorHistory,
  CityGoal,
  CityStats,
  DataOverlayMode,
  Grid,
  NewsItem,
} from '../types';
import {
  getMuted,
  playClickSound,
  playRewardSound,
  setMuted,
  toggleAmbientHum,
} from './audio';

export const createInitialStats = (): CityStats => ({
  money: INITIAL_MONEY,
  population: 0,
  day: 1,
  happiness: 100,
  weather: 'sunny',
  taxRate: DEFAULT_TAX_RATE,
  milestoneTier: 0,
  demand: { residential: 30, commercial: 15, industrial: 15 },
  budget: {
    residentialTax: 0,
    commercialIncome: 0,
    industrialIncome: 0,
    upkeep: 0,
    netIncome: 0,
  },
  activeEvent: null,
});

interface UseCityPersistenceArgs {
  gameStarted: boolean;
  setGameStarted: (started: boolean) => void;
  grid: Grid;
  setGrid: (grid: Grid) => void;
  stats: CityStats;
  setStats: (stats: CityStats) => void;
  currentGoal: CityGoal | null;
  setCurrentGoal: (goal: CityGoal | null) => void;
  setNewsFeed: (news: NewsItem[]) => void;
  setGlobalTime: (time: number) => void;
  maxCars: number;
  setMaxCars: (maxCars: number) => void;
  gameSpeed: number;
  setGameSpeed: (speed: number) => void;
  setDataMode: (mode: DataOverlayMode) => void;
  setHeatmapWarning: (warn: boolean) => void;
  setInspectedTile: (tile: { x: number; y: number } | null) => void;
  gridRef: React.MutableRefObject<Grid>;
  statsRef: React.MutableRefObject<CityStats>;
  goalRef: React.MutableRefObject<CityGoal | null>;
  newsFeedRef: React.MutableRefObject<NewsItem[]>;
  globalTimeRef: React.MutableRefObject<number>;
  weatherTicksRef: React.MutableRefObject<number>;
  eventTicksRef: React.MutableRefObject<number>;
  advisorHistoryRef: React.MutableRefObject<AdvisorHistory>;
  addNewsItem: (item: NewsItem) => void;
}

export const useCityPersistence = ({
  gameStarted,
  setGameStarted,
  grid,
  setGrid,
  stats,
  setStats,
  currentGoal,
  setCurrentGoal,
  setNewsFeed,
  setGlobalTime,
  maxCars,
  setMaxCars,
  gameSpeed,
  setGameSpeed,
  setDataMode,
  setHeatmapWarning,
  setInspectedTile,
  statsRef,
  goalRef,
  newsFeedRef,
  globalTimeRef,
  weatherTicksRef,
  eventTicksRef,
  advisorHistoryRef,
  addNewsItem,
}: UseCityPersistenceArgs) => {
  const [saveSummary, setSaveSummary] = useState<SaveSummary | null>(() =>
    getSaveSummary(),
  );
  const [isMuted, setIsMuted] = useState<boolean>(() => getMuted());

  useEffect(() => {
    toggleAmbientHum(gameStarted && !isMuted);
    return () => {
      toggleAmbientHum(false);
    };
  }, [gameStarted, isMuted]);

  useEffect(() => {
    if (!gameStarted) return;
    const ok = saveCityToStorage({
      grid,
      stats: statsRef.current,
      newsFeed: newsFeedRef.current,
      currentGoal,
      advisorHistory: advisorHistoryRef.current,
      globalTime: globalTimeRef.current,
      maxCars,
      gameSpeed,
    });
    if (ok) {
      setSaveSummary({
        day: statsRef.current.day,
        population: statsRef.current.population,
        money: statsRef.current.money,
        savedAt: new Date().toISOString(),
      });
    }
  }, [
    gameStarted,
    grid,
    stats.day,
    stats.taxRate,
    stats.milestoneTier,
    maxCars,
    gameSpeed,
    currentGoal,
    statsRef,
    newsFeedRef,
    globalTimeRef,
    advisorHistoryRef,
  ]);

  const handleStartNew = useCallback(() => {
    const freshGrid = createInitialGrid();
    const freshStats = createInitialStats();
    const initialHistory = createInitialAdvisorHistory();
    const firstGoal = generateCityGoal(freshStats, freshGrid, initialHistory);
    advisorHistoryRef.current = recordGoalInHistory(
      initialHistory,
      firstGoal,
      false,
    );
    eventTicksRef.current = 0;

    setGrid(freshGrid);
    setStats(freshStats);
    setGlobalTime(INITIAL_GLOBAL_TIME);
    globalTimeRef.current = INITIAL_GLOBAL_TIME;
    weatherTicksRef.current = 0;
    setMaxCars(6);
    setGameSpeed(1);
    setDataMode('none');
    setHeatmapWarning(false);
    setInspectedTile(null);
    setNewsFeed([
      {
        id: Date.now().toString(),
        text: 'Welcome to CityVerse. Terrain generation complete.',
        type: 'positive',
      },
    ]);
    setCurrentGoal(firstGoal);
    setGameStarted(true);
    playClickSound();
  }, [
    setGrid,
    setStats,
    setGlobalTime,
    globalTimeRef,
    weatherTicksRef,
    eventTicksRef,
    advisorHistoryRef,
    setMaxCars,
    setGameSpeed,
    setDataMode,
    setHeatmapWarning,
    setInspectedTile,
    setNewsFeed,
    setCurrentGoal,
    setGameStarted,
  ]);

  const handleContinue = useCallback(() => {
    const loaded = loadCityFromStorage();
    if (!loaded) {
      handleStartNew();
      return;
    }
    const baseHistory = loaded.advisorHistory ?? createInitialAdvisorHistory();
    const restoredGoal =
      loaded.currentGoal ??
      generateCityGoal(loaded.stats, loaded.grid, baseHistory);
    advisorHistoryRef.current = recordGoalInHistory(
      baseHistory,
      restoredGoal,
      false,
    );
    eventTicksRef.current = 0;

    setGrid(loaded.grid);
    setStats(loaded.stats);
    setGlobalTime(loaded.globalTime);
    globalTimeRef.current = loaded.globalTime;
    weatherTicksRef.current = 0;
    setMaxCars(loaded.maxCars);
    setGameSpeed(loaded.gameSpeed);
    setDataMode('none');
    setHeatmapWarning(false);
    setInspectedTile(null);
    setCurrentGoal(restoredGoal);
    setNewsFeed([
      ...loaded.newsFeed.slice(-11),
      {
        id: Date.now().toString(),
        text: 'City simulation restored.',
        type: 'positive',
      },
    ]);
    setGameStarted(true);
    playRewardSound();
  }, [
    handleStartNew,
    setGrid,
    setStats,
    setGlobalTime,
    globalTimeRef,
    weatherTicksRef,
    eventTicksRef,
    advisorHistoryRef,
    setMaxCars,
    setGameSpeed,
    setDataMode,
    setHeatmapWarning,
    setInspectedTile,
    setCurrentGoal,
    setNewsFeed,
    setGameStarted,
  ]);

  const handleDeleteSave = useCallback(() => {
    clearCitySave();
    setSaveSummary(null);
    playClickSound();
  }, []);

  const handleExportSave = useCallback(() => {
    const payload = serializeSave({
      grid,
      stats: statsRef.current,
      newsFeed: newsFeedRef.current,
      currentGoal: goalRef.current,
      advisorHistory: advisorHistoryRef.current,
      globalTime: globalTimeRef.current,
      maxCars,
      gameSpeed,
    });
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cityverse-day-${statsRef.current.day}.json`;
    link.click();
    URL.revokeObjectURL(url);
    playClickSound();
  }, [grid, statsRef, newsFeedRef, goalRef, advisorHistoryRef, globalTimeRef, maxCars, gameSpeed]);

  const handleImportSave = useCallback(
    (rawJson: string): boolean => {
      const parsed = parseSave(rawJson);
      if (!parsed) {
        if (gameStarted) {
          addNewsItem({
            id: Date.now().toString(),
            text: 'Invalid save file format.',
            type: 'negative',
          });
        }
        return false;
      }

      const baseHistory = parsed.advisorHistory ?? createInitialAdvisorHistory();
      const restoredGoal =
        parsed.currentGoal ??
        generateCityGoal(parsed.stats, parsed.grid, baseHistory);
      advisorHistoryRef.current = recordGoalInHistory(
        baseHistory,
        restoredGoal,
        false,
      );
      eventTicksRef.current = 0;

      saveCityToStorage({
        grid: parsed.grid,
        stats: parsed.stats,
        newsFeed: parsed.newsFeed,
        currentGoal: restoredGoal,
        advisorHistory: advisorHistoryRef.current,
        globalTime: parsed.globalTime,
        maxCars: parsed.maxCars,
        gameSpeed: parsed.gameSpeed,
      });
      setSaveSummary({
        day: parsed.stats.day,
        population: parsed.stats.population,
        money: parsed.stats.money,
        savedAt: new Date().toISOString(),
      });
      setGrid(parsed.grid);
      setStats(parsed.stats);
      setGlobalTime(parsed.globalTime);
      globalTimeRef.current = parsed.globalTime;
      weatherTicksRef.current = 0;
      setMaxCars(parsed.maxCars);
      setGameSpeed(parsed.gameSpeed);
      setDataMode('none');
      setHeatmapWarning(false);
      setInspectedTile(null);
      setCurrentGoal(restoredGoal);
      setNewsFeed([
        ...parsed.newsFeed.slice(-11),
        {
          id: Date.now().toString(),
          text: 'City imported from JSON save.',
          type: 'positive',
        },
      ]);
      setGameStarted(true);
      playRewardSound();
      return true;
    },
    [
      addNewsItem,
      gameStarted,
      setGrid,
      setStats,
      setGlobalTime,
      globalTimeRef,
      weatherTicksRef,
      eventTicksRef,
      advisorHistoryRef,
      setMaxCars,
      setGameSpeed,
      setDataMode,
      setHeatmapWarning,
      setInspectedTile,
      setCurrentGoal,
      setNewsFeed,
      setGameStarted,
    ],
  );

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      setMuted(next);
      if (!next) playClickSound();
      return next;
    });
  }, []);

  return {
    saveSummary,
    isMuted,
    handleStartNew,
    handleContinue,
    handleDeleteSave,
    handleExportSave,
    handleImportSave,
    handleToggleMute,
  };
};
