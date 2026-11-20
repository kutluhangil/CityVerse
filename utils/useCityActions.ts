import { useCallback } from 'react';
import {
  BUILDINGS,
  FOREST_CLEAR_COST,
  MAX_TAX_RATE,
  MIN_TAX_RATE,
} from '../constants';
import { generateCityGoal, recordGoalInHistory } from '../services/advisor';
import { buildBuildingHeadline, buildEventHeadline } from '../services/newsTemplates';
import { getQuadrantLabel } from '../sim/advisorAnalysis';
import { CitySnapshot } from '../sim/history';
import { validatePlacement, validateUpgrade } from '../sim/placement';
import { calculateDemolishRefund, getRepairCost } from '../sim/refund';
import {
  AdvisorHistory,
  BuildingType,
  CityGoal,
  CityStats,
  DataOverlayMode,
  Grid,
  NewsItem,
} from '../types';
import {
  playBuildSound,
  playClickSound,
  playDemolishSound,
  playRewardSound,
} from './audio';

interface UseCityActionsArgs {
  gameStarted: boolean;
  dataMode: DataOverlayMode;
  selectedTool: BuildingType;
  setGrid: React.Dispatch<React.SetStateAction<Grid>>;
  setStats: React.Dispatch<React.SetStateAction<CityStats>>;
  currentGoal: CityGoal | null;
  setCurrentGoal: React.Dispatch<React.SetStateAction<CityGoal | null>>;
  inspectedTile: { x: number; y: number } | null;
  setInspectedTile: React.Dispatch<
    React.SetStateAction<{ x: number; y: number } | null>
  >;
  setHeatmapWarning: React.Dispatch<React.SetStateAction<boolean>>;
  heatmapWarnTimerRef: React.MutableRefObject<number | null>;
  gridRef: React.MutableRefObject<Grid>;
  statsRef: React.MutableRefObject<CityStats>;
  advisorHistoryRef: React.MutableRefObject<AdvisorHistory>;
  newsFeedRef: React.MutableRefObject<NewsItem[]>;
  commitHistory: (snap: CitySnapshot) => void;
  recordMutationHistory: (fallbackSnap: CitySnapshot, isDrag: boolean) => void;
  resetHistory: () => void;
  addNewsItem: (item: NewsItem) => void;
  triggerDemolishParticles: (
    x: number,
    y: number,
    tile: Grid[number][number],
  ) => void;
  onFloatingText?: (x: number, y: number, text: string, positive: boolean) => void;
  onCelebration?: () => void;
}

export const useCityActions = ({
  gameStarted,
  dataMode,
  selectedTool,
  setGrid,
  setStats,
  currentGoal,
  setCurrentGoal,
  inspectedTile,
  setInspectedTile,
  setHeatmapWarning,
  heatmapWarnTimerRef,
  gridRef,
  statsRef,
  advisorHistoryRef,
  newsFeedRef,
  commitHistory,
  recordMutationHistory,
  resetHistory,
  addNewsItem,
  triggerDemolishParticles,
  onFloatingText,
  onCelebration,
}: UseCityActionsArgs) => {

  const repairAt = useCallback(
    (x: number, y: number, closeInspector: boolean) => {
      const currentGrid = gridRef.current;
      const currentStats = statsRef.current;
      const tile = currentGrid[y][x];
      const repairCost = getRepairCost(tile);
      if (currentStats.money < repairCost) {
        addNewsItem({
          id: Date.now().toString(),
          text: `Need $${repairCost} to repair damaged building.`,
          type: 'negative',
        });
        return;
      }
      commitHistory({ grid: currentGrid, money: currentStats.money });
      const newGrid = currentGrid.map((row) => [...row]);
      newGrid[y][x] = { ...tile, isDamaged: false };
      setGrid(newGrid);
      setStats((prev) => ({ ...prev, money: prev.money - repairCost }));
      playBuildSound();
      onFloatingText?.(x, y, `-$${repairCost}`, false);
      const hint = getQuadrantLabel(x, y, currentGrid.length);
      addNewsItem(
        currentStats.activeEvent
          ? buildEventHeadline(currentStats.activeEvent, hint, 'repaired')
          : {
              id: Date.now().toString(),
              text: `Repaired ${BUILDINGS[tile.buildingType].name} in ${hint}.`,
              type: 'positive',
            },
      );
      if (closeInspector) setInspectedTile(null);
    },
    [
      gridRef,
      statsRef,
      commitHistory,
      setGrid,
      setStats,
      onFloatingText,
      addNewsItem,
      setInspectedTile,
    ],
  );

  const upgradeAt = useCallback(
    (x: number, y: number, closeInspector: boolean) => {
      const currentGrid = gridRef.current;
      const currentStats = statsRef.current;
      const tile = currentGrid[y][x];
      const check = validateUpgrade(tile, currentStats.money);
      if (!check.ok) {
        if ('reason' in check && check.reason) {
          addNewsItem({
            id: `${Date.now()}.${Math.floor(Math.random() * 1e6)}`,
            text: check.reason,
            type: check.newsType ?? 'neutral',
          });
        }
        return;
      }
      commitHistory({ grid: currentGrid, money: currentStats.money });
      const newGrid = currentGrid.map((row) => [...row]);
      newGrid[y][x] = { ...tile, level: check.nextLevel };
      setGrid(newGrid);
      setStats((prev) => ({ ...prev, money: prev.money - check.cost }));
      playBuildSound();
      onFloatingText?.(x, y, `-$${check.cost}`, false);
      const hint = getQuadrantLabel(x, y, currentGrid.length);
      addNewsItem({
        id: `${Date.now()}.${Math.floor(Math.random() * 1e6)}`,
        text: `Upgraded ${BUILDINGS[tile.buildingType].name} in ${hint} to level ${check.nextLevel}.`,
        type: 'positive',
      });
      if (closeInspector) setInspectedTile(null);
    },
    [
      gridRef,
      statsRef,
      commitHistory,
      setGrid,
      setStats,
      onFloatingText,
      addNewsItem,
      setInspectedTile,
    ],
  );

  const demolishAt = useCallback(
    (x: number, y: number, isRedevelop: boolean, isDrag: boolean) => {
      const currentGrid = gridRef.current;
      const currentStats = statsRef.current;
      const tile = currentGrid[y][x];

      if (tile.buildingType !== BuildingType.None) {
        const demolishCost = BUILDINGS[BuildingType.Demolish].cost;
        if (currentStats.money < demolishCost) {
          addNewsItem({
            id: Date.now().toString(),
            text: 'Cannot afford demolition costs.',
            type: 'negative',
          });
          return;
        }
        recordMutationHistory({ grid: currentGrid, money: currentStats.money }, isDrag);
        const newGrid = currentGrid.map((row) => [...row]);
        const refund = calculateDemolishRefund(tile);
        newGrid[y][x] = {
          ...tile,
          buildingType: BuildingType.None,
          isDamaged: false,
          level: 1,
        };
        gridRef.current = newGrid;
        statsRef.current = {
          ...currentStats,
          money: currentStats.money - demolishCost + refund,
        };
        setGrid(newGrid);
        setStats((prev) => ({
          ...prev,
          money: prev.money - demolishCost + refund,
        }));
        playDemolishSound();
        triggerDemolishParticles(x, y, tile);
        const net = refund - demolishCost;
        onFloatingText?.(x, y, `${net >= 0 ? '+' : '-'}$${Math.abs(net)}`, net >= 0);
        if (isRedevelop) setInspectedTile(null);
        if (refund > 0 && !isDrag) {
          addNewsItem({
            id: Date.now().toString(),
            text: isRedevelop
              ? `Redeveloped building for a $${refund} refund.`
              : `Refund of $${refund} received for demolishing building.`,
            type: 'positive',
          });
        }
        return;
      }

      if (!isRedevelop && tile.terrain === 'forest') {
        if (currentStats.money < FOREST_CLEAR_COST) {
          addNewsItem({
            id: Date.now().toString(),
            text: `Need $${FOREST_CLEAR_COST} to clear forest.`,
            type: 'negative',
          });
          return;
        }
        recordMutationHistory({ grid: currentGrid, money: currentStats.money }, isDrag);
        const newGrid = currentGrid.map((row) => [...row]);
        newGrid[y][x] = { ...tile, terrain: 'land' };
        gridRef.current = newGrid;
        statsRef.current = {
          ...currentStats,
          money: currentStats.money - FOREST_CLEAR_COST,
        };
        setGrid(newGrid);
        setStats((prev) => ({ ...prev, money: prev.money - FOREST_CLEAR_COST }));
        playDemolishSound();
        triggerDemolishParticles(x, y, { ...tile, buildingType: BuildingType.Park });
        onFloatingText?.(x, y, `-$${FOREST_CLEAR_COST}`, false);
        if (!isDrag) {
          addNewsItem({
            id: Date.now().toString(),
            text: `Cleared woodland plot in ${getQuadrantLabel(x, y, currentGrid.length)} for $${FOREST_CLEAR_COST}.`,
            type: 'neutral',
          });
        }
      }
    },
    [
      gridRef,
      statsRef,
      recordMutationHistory,
      setGrid,
      setStats,
      triggerDemolishParticles,
      onFloatingText,
      setInspectedTile,
      addNewsItem,
    ],
  );

  const handleTileClick = useCallback(
    (x: number, y: number, isDrag = false) => {
      if (!gameStarted) return;

      if (dataMode !== 'none') {
        setHeatmapWarning(true);
        if (heatmapWarnTimerRef.current !== null) {
          window.clearTimeout(heatmapWarnTimerRef.current);
        }
        heatmapWarnTimerRef.current = window.setTimeout(() => {
          setHeatmapWarning(false);
        }, 2500);
        return;
      }

      const currentGrid = gridRef.current;
      const size = currentGrid.length;
      if (x < 0 || x >= size || y < 0 || y >= size) return;

      const currentStats = statsRef.current;
      const currentTile = currentGrid[y][x];
      const tool = selectedTool;

      if (tool === BuildingType.Demolish) {
        demolishAt(x, y, false, isDrag);
        return;
      }
      if (tool === BuildingType.Inspect) {
        if (
          currentTile.buildingType !== BuildingType.None &&
          currentTile.buildingType !== BuildingType.Road
        ) {
          setInspectedTile({ x, y });
          playClickSound();
        } else {
          setInspectedTile(null);
        }
        return;
      }
      if (tool === BuildingType.Upgrade) {
        if (currentTile.isDamaged) repairAt(x, y, false);
        else upgradeAt(x, y, false);
        return;
      }

      const placementCheck = validatePlacement(
        currentGrid,
        x,
        y,
        tool,
        currentStats.money,
        currentStats.milestoneTier,
      );
      if (!placementCheck.ok) {
        if (!isDrag && 'reason' in placementCheck && placementCheck.reason) {
          addNewsItem({
            id: `${Date.now()}.${Math.floor(Math.random() * 1e6)}`,
            text: placementCheck.reason,
            type: placementCheck.newsType ?? 'neutral',
          });
        }
        return;
      }

      recordMutationHistory({ grid: currentGrid, money: currentStats.money }, isDrag);
      const newGrid = currentGrid.map((row) => [...row]);
      newGrid[y][x] = { ...currentTile, buildingType: tool, isDamaged: false };
      gridRef.current = newGrid;
      statsRef.current = {
        ...currentStats,
        money: currentStats.money - placementCheck.cost,
      };
      setStats((prev) => ({ ...prev, money: prev.money - placementCheck.cost }));
      setGrid(newGrid);
      playBuildSound();
      if (placementCheck.cost > 0) {
        onFloatingText?.(x, y, `-$${placementCheck.cost}`, false);
      }

      if (!isDrag) {
        const headline = buildBuildingHeadline(
          tool,
          currentStats,
          getQuadrantLabel(x, y, size),
          newsFeedRef.current.map((n) => n.text),
        );
        if (headline && Math.random() < 0.65) {
          addNewsItem(headline);
        }
      }
    },
    [
      selectedTool,
      gameStarted,
      dataMode,
      gridRef,
      statsRef,
      newsFeedRef,
      demolishAt,
      repairAt,
      upgradeAt,
      recordMutationHistory,
      setGrid,
      setStats,
      setInspectedTile,
      setHeatmapWarning,
      heatmapWarnTimerRef,
      onFloatingText,
      addNewsItem,
    ],
  );

  const handleClaimReward = useCallback(() => {
    if (currentGoal && currentGoal.completed) {
      setStats((prev) => ({ ...prev, money: prev.money + currentGoal.reward }));
      playRewardSound();
      onCelebration?.();
      addNewsItem({
        id: Date.now().toString(),
        text: `Goal achieved! $${currentGoal.reward} deposited to treasury.`,
        type: 'positive',
      });
      const afterComplete = recordGoalInHistory(
        advisorHistoryRef.current,
        currentGoal,
        true,
      );
      const nextGoal = generateCityGoal(
        statsRef.current,
        gridRef.current,
        afterComplete,
      );
      advisorHistoryRef.current = recordGoalInHistory(
        afterComplete,
        nextGoal,
        false,
      );
      setCurrentGoal(nextGoal);
    }
  }, [
    currentGoal,
    setStats,
    addNewsItem,
    setCurrentGoal,
    statsRef,
    gridRef,
    advisorHistoryRef,
    onCelebration,
  ]);

  const handleInspectorRepair = useCallback(() => {
    if (inspectedTile) repairAt(inspectedTile.x, inspectedTile.y, true);
  }, [inspectedTile, repairAt]);

  const handleInspectorUpgrade = useCallback(() => {
    if (inspectedTile) upgradeAt(inspectedTile.x, inspectedTile.y, true);
  }, [inspectedTile, upgradeAt]);

  const handleInspectorRedevelop = useCallback(() => {
    if (inspectedTile) demolishAt(inspectedTile.x, inspectedTile.y, true, false);
  }, [inspectedTile, demolishAt]);

  const handleSetTaxRate = useCallback(
    (rate: number) => {
      const clamped = Math.max(MIN_TAX_RATE, Math.min(MAX_TAX_RATE, Math.round(rate)));
      setStats((prev) => ({ ...prev, taxRate: clamped }));
    },
    [setStats],
  );

  const handleBailout = useCallback(() => {
    resetHistory();
    setStats((prev) => ({
      ...prev,
      money: prev.money + 500,
      happiness: Math.max(0, prev.happiness - 15),
    }));
    playClickSound();
    addNewsItem({
      id: Date.now().toString(),
      text: 'Emergency bailout secured (+$500, -15 Joy).',
      type: 'negative',
    });
  }, [resetHistory, setStats, addNewsItem]);

  return {
    handleTileClick,
    handleClaimReward,
    handleInspectorRepair,
    handleInspectorUpgrade,
    handleInspectorRedevelop,
    handleSetTaxRate,
    handleBailout,
  };
};
