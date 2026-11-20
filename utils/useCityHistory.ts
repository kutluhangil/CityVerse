import { useCallback, useRef } from 'react';
import { expandGrid, getExpansionCost } from '../sim/grid';
import {
  CitySnapshot,
  createHistoryStack,
  HistoryStack,
  pushSnapshot,
  redoHistory,
  undoHistory,
} from '../sim/history';
import { CityStats, Grid, NewsItem } from '../types';
import { playClickSound, playRewardSound } from './audio';

interface UseCityHistoryArgs {
  historyRef: React.MutableRefObject<HistoryStack>;
  gridRef: React.MutableRefObject<Grid>;
  statsRef: React.MutableRefObject<CityStats>;
  setHistoryFlags: (flags: { canUndo: boolean; canRedo: boolean }) => void;
  setGrid: React.Dispatch<React.SetStateAction<Grid>>;
  setStats: React.Dispatch<React.SetStateAction<CityStats>>;
  setInspectedTile: React.Dispatch<
    React.SetStateAction<{ x: number; y: number } | null>
  >;
  addNewsItem: (item: NewsItem) => void;
  onCelebration?: () => void;
}

export const useCityHistory = ({
  historyRef,
  gridRef,
  statsRef,
  setHistoryFlags,
  setGrid,
  setStats,
  setInspectedTile,
  addNewsItem,
  onCelebration,
}: UseCityHistoryArgs) => {
  const strokeSavedRef = useRef(false);
  const pendingStrokeRef = useRef<CitySnapshot | null>(null);

  const syncHistoryFlags = useCallback(() => {
    setHistoryFlags({
      canUndo: historyRef.current.past.length > 0,
      canRedo: historyRef.current.future.length > 0,
    });
  }, [historyRef, setHistoryFlags]);

  const resetHistory = useCallback(() => {
    historyRef.current = createHistoryStack();
    pendingStrokeRef.current = null;
    strokeSavedRef.current = false;
    setHistoryFlags({ canUndo: false, canRedo: false });
  }, [historyRef, setHistoryFlags]);

  const commitHistory = useCallback(
    (snap: CitySnapshot) => {
      historyRef.current = pushSnapshot(historyRef.current, snap);
      syncHistoryFlags();
    },
    [historyRef, syncHistoryFlags],
  );

  const recordMutationHistory = useCallback(
    (fallbackSnap: CitySnapshot, isDrag: boolean) => {
      if (isDrag) {
        if (!strokeSavedRef.current && pendingStrokeRef.current) {
          commitHistory(pendingStrokeRef.current);
          strokeSavedRef.current = true;
        }
        return;
      }
      if (!strokeSavedRef.current) {
        commitHistory(pendingStrokeRef.current ?? fallbackSnap);
        strokeSavedRef.current = true;
      }
    },
    [commitHistory],
  );

  const handleStrokeStart = useCallback(() => {
    strokeSavedRef.current = false;
    pendingStrokeRef.current = {
      grid: gridRef.current,
      money: statsRef.current.money,
    };
  }, [gridRef, statsRef]);

  const applyRestoredSnapshot = useCallback(
    (snapshot: CitySnapshot, nextStack: HistoryStack) => {
      historyRef.current = nextStack;
      syncHistoryFlags();
      gridRef.current = snapshot.grid;
      setGrid(snapshot.grid);
      setStats((prev) => ({ ...prev, money: snapshot.money }));
      setInspectedTile(null);
      playClickSound();
    },
    [historyRef, syncHistoryFlags, gridRef, setGrid, setStats, setInspectedTile],
  );

  const handleUndo = useCallback(() => {
    const res = undoHistory(historyRef.current, {
      grid: gridRef.current,
      money: statsRef.current.money,
    });
    if (!res.snapshot) return;
    applyRestoredSnapshot(res.snapshot, res.stack);
  }, [historyRef, gridRef, statsRef, applyRestoredSnapshot]);

  const handleRedo = useCallback(() => {
    const res = redoHistory(historyRef.current, {
      grid: gridRef.current,
      money: statsRef.current.money,
    });
    if (!res.snapshot) return;
    applyRestoredSnapshot(res.snapshot, res.stack);
  }, [historyRef, gridRef, statsRef, applyRestoredSnapshot]);

  const handleExpandMap = useCallback(() => {
    const currentGrid = gridRef.current;
    const currentStats = statsRef.current;
    const cost = getExpansionCost(currentGrid.length);
    if (cost === null || currentStats.money < cost) return;

    commitHistory({ grid: currentGrid, money: currentStats.money });
    const nextGrid = expandGrid(currentGrid);
    gridRef.current = nextGrid;
    setGrid(nextGrid);
    setStats((prev) => ({
      ...prev,
      money: prev.money - cost,
      activeEvent: prev.activeEvent?.affectedTile
        ? {
            ...prev.activeEvent,
            affectedTile: {
              x: prev.activeEvent.affectedTile.x + 3,
              y: prev.activeEvent.affectedTile.y + 3,
            },
          }
        : prev.activeEvent,
    }));
    setInspectedTile((prev) =>
      prev ? { x: prev.x + 3, y: prev.y + 3 } : null,
    );
    playRewardSound();
    onCelebration?.();
    addNewsItem({
      id: Date.now().toString(),
      text: `Surveying complete: Island expanded to ${nextGrid.length}x${nextGrid.length}!`,
      type: 'positive',
    });
  }, [
    gridRef,
    statsRef,
    commitHistory,
    setGrid,
    setStats,
    setInspectedTile,
    onCelebration,
    addNewsItem,
  ]);

  return {
    commitHistory,
    recordMutationHistory,
    resetHistory,
    handleStrokeStart,
    handleUndo,
    handleRedo,
    handleExpandMap,
  };
};
