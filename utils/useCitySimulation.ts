import { useCallback, useEffect } from 'react';
import { TICK_RATE_MS } from '../constants';
import { generateNewsEvent } from '../services/advisor';
import { stepSimulation } from '../sim/tick';
import {
  BuildingType,
  CityGoal,
  CityStats,
  Grid,
  NewsItem,
} from '../types';
import { playRewardSound } from './audio';

interface UseCitySimulationArgs {
  gameStarted: boolean;
  isPaused: boolean;
  gameSpeed: number;
  setGlobalTime: React.Dispatch<React.SetStateAction<number>>;
  setStats: React.Dispatch<React.SetStateAction<CityStats>>;
  setGrid: React.Dispatch<React.SetStateAction<Grid>>;
  setCurrentGoal: React.Dispatch<React.SetStateAction<CityGoal | null>>;
  setShowWinModal: React.Dispatch<React.SetStateAction<boolean>>;
  gridRef: React.MutableRefObject<Grid>;
  statsRef: React.MutableRefObject<CityStats>;
  goalRef: React.MutableRefObject<CityGoal | null>;
  newsFeedRef: React.MutableRefObject<NewsItem[]>;
  globalTimeRef: React.MutableRefObject<number>;
  weatherTicksRef: React.MutableRefObject<number>;
  eventTicksRef: React.MutableRefObject<number>;
  tickCounterRef: React.MutableRefObject<number>;
  hasCelebratedWinRef: React.MutableRefObject<boolean>;
  addNewsItem: (item: NewsItem) => void;
  pushFloatingEvent: (x: number, y: number, text: string, positive: boolean) => void;
  triggerCelebration: () => void;
}

export const useCitySimulation = ({
  gameStarted,
  isPaused,
  gameSpeed,
  setGlobalTime,
  setStats,
  setGrid,
  setCurrentGoal,
  setShowWinModal,
  gridRef,
  statsRef,
  goalRef,
  newsFeedRef,
  globalTimeRef,
  weatherTicksRef,
  eventTicksRef,
  tickCounterRef,
  hasCelebratedWinRef,
  addNewsItem,
  pushFloatingEvent,
  triggerCelebration,
}: UseCitySimulationArgs) => {
  const fetchNews = useCallback(() => {
    if (Math.random() > 0.08) return;
    const recentTexts = newsFeedRef.current.map((n) => n.text);
    addNewsItem(generateNewsEvent(statsRef.current, gridRef.current, recentTexts));
  }, [addNewsItem, newsFeedRef, statsRef, gridRef]);

  useEffect(() => {
    if (!gameStarted || isPaused) return;

    const intervalId = setInterval(() => {
      const res = stepSimulation({
        grid: gridRef.current,
        stats: statsRef.current,
        globalTime: globalTimeRef.current,
        weatherTicks: weatherTicksRef.current,
        eventTicks: eventTicksRef.current,
        currentGoal: goalRef.current,
      });

      globalTimeRef.current = res.nextGlobalTime;
      weatherTicksRef.current = res.nextWeatherTicks;
      eventTicksRef.current = res.nextEventTicks;
      tickCounterRef.current += 1;
      setGlobalTime(res.nextGlobalTime);
      setStats((prev) => ({
        ...res.nextStats,
        money: prev.money + res.nextStats.budget.netIncome,
        taxRate: prev.taxRate,
      }));
      if (res.damagedTile) {
        const { x: dx, y: dy } = res.damagedTile;
        setGrid((prevGrid) => {
          const next = prevGrid.map((row) => [...row]);
          if (next[dy]?.[dx]) {
            next[dy][dx] = { ...next[dy][dx], isDamaged: true };
          }
          return next;
        });
      }
      res.events.forEach(addNewsItem);

      if (res.goalCompleted && goalRef.current) {
        setCurrentGoal({ ...goalRef.current, completed: true });
      }

      if (res.milestoneUnlocked) {
        playRewardSound();
        triggerCelebration();
        if (res.nextStats.milestoneTier === 3 && !hasCelebratedWinRef.current) {
          hasCelebratedWinRef.current = true;
          setShowWinModal(true);
        }
      }

      if (tickCounterRef.current % 2 === 0 && res.nextStats.budget.netIncome !== 0) {
        const net = res.nextStats.budget.netIncome;
        let anchor: { x: number; y: number } | null = null;
        for (const row of gridRef.current) {
          for (const t of row) {
            if (
              !t.isDamaged &&
              (t.buildingType === BuildingType.Commercial ||
                t.buildingType === BuildingType.Industrial ||
                t.buildingType === BuildingType.Residential)
            ) {
              anchor = { x: t.x, y: t.y };
              break;
            }
          }
          if (anchor) break;
        }
        const center = Math.floor(gridRef.current.length / 2);
        const target = anchor ?? { x: center, y: center };
        pushFloatingEvent(
          target.x,
          target.y,
          `${net >= 0 ? '+' : '-'}$${Math.abs(net)}`,
          net >= 0,
        );
      }

      fetchNews();
    }, TICK_RATE_MS / gameSpeed);

    return () => clearInterval(intervalId);
  }, [
    fetchNews,
    addNewsItem,
    gameStarted,
    isPaused,
    gameSpeed,
    pushFloatingEvent,
    triggerCelebration,
    gridRef,
    statsRef,
    goalRef,
    globalTimeRef,
    weatherTicksRef,
    eventTicksRef,
    tickCounterRef,
    hasCelebratedWinRef,
    setGlobalTime,
    setStats,
    setGrid,
    setCurrentGoal,
    setShowWinModal,
  ]);
};
