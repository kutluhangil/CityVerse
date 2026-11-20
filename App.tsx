/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BANKRUPTCY_LIMIT, BUILDINGS } from './constants';
import { BankruptcyModal, WinModal } from './components/CityModals';
import { GoalConfetti } from './components/GoalConfetti';
import Inspector from './components/Inspector';
import { PhotoModeOverlay } from './components/PhotoModeOverlay';
import StartScreen from './components/StartScreen';
import UIOverlay from './components/UIOverlay';
import { loadGraphicsQuality, saveGraphicsQuality } from './scene/graphics';
import { createInitialAdvisorHistory } from './services/advisor';
import { createInitialGrid } from './sim/grid';
import { createHistoryStack } from './sim/history';
import { INITIAL_GLOBAL_TIME } from './sim/tick';
import {
  BuildingType,
  CityGoal,
  CityStats,
  DataOverlayMode,
  FloatingTextEvent,
  GraphicsQuality,
  Grid,
  NewsItem,
} from './types';
import { playClickSound } from './utils/audio';
import { useCityActions } from './utils/useCityActions';
import { useCityHistory } from './utils/useCityHistory';
import {
  createInitialStats,
  useCityPersistence,
} from './utils/useCityPersistence';
import { useCitySimulation } from './utils/useCitySimulation';
import { useKeyboardShortcuts } from './utils/useKeyboardShortcuts';

const IsoMap = React.lazy(() => import('./components/IsoMap'));

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [grid, setGrid] = useState<Grid>(createInitialGrid);
  const [stats, setStats] = useState<CityStats>(createInitialStats);
  const [selectedTool, setSelectedTool] = useState<BuildingType>(
    BuildingType.Road,
  );
  const [maxCars, setMaxCars] = useState(6);
  const [inspectedTile, setInspectedTile] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [historyFlags, setHistoryFlags] = useState({ canUndo: false, canRedo: false });
  const [globalTime, setGlobalTime] = useState(INITIAL_GLOBAL_TIME);
  const [dataMode, setDataMode] = useState<DataOverlayMode>('none');
  const [heatmapWarning, setHeatmapWarning] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [graphicsQuality, setGraphicsQuality] = useState<GraphicsQuality>(
    loadGraphicsQuality,
  );
  const [photoMode, setPhotoMode] = useState(false);
  const [rotateTrigger, setRotateTrigger] = useState<{
    dir: -1 | 1;
    seq: number;
  } | null>(null);
  const [floatingEvents, setFloatingEvents] = useState<FloatingTextEvent[]>([]);
  const [confettiKey, setConfettiKey] = useState(0);

  const [currentGoal, setCurrentGoal] = useState<CityGoal | null>(null);
  const [newsFeed, setNewsFeed] = useState<NewsItem[]>([]);
  const [demolishedTiles, setDemolishedTiles] = useState<
    {
      x: number;
      y: number;
      id: number;
      type?: BuildingType;
      level?: number;
      color?: string;
    }[]
  >([]);

  const gridRef = useRef(grid);
  const statsRef = useRef(stats);
  const goalRef = useRef(currentGoal);
  const newsFeedRef = useRef(newsFeed);
  const globalTimeRef = useRef(globalTime);
  const weatherTicksRef = useRef(0);
  const eventTicksRef = useRef(0);
  const tickCounterRef = useRef(0);
  const advisorHistoryRef = useRef(createInitialAdvisorHistory());
  const historyRef = useRef(createHistoryStack());
  const heatmapWarnTimerRef = useRef<number | null>(null);
  const hasCelebratedWinRef = useRef(false);

  gridRef.current = grid;
  statsRef.current = stats;
  goalRef.current = currentGoal;
  newsFeedRef.current = newsFeed;
  globalTimeRef.current = globalTime;

  const clearHeatmapTimer = useCallback(() => {
    if (heatmapWarnTimerRef.current !== null) {
      window.clearTimeout(heatmapWarnTimerRef.current);
    }
  }, []);

  useEffect(() => clearHeatmapTimer, [clearHeatmapTimer]);

  const addNewsItem = useCallback((item: NewsItem) => {
    setNewsFeed((prev) => [...prev.slice(-12), item]);
  }, []);

  const pushFloatingEvent = useCallback(
    (x: number, y: number, text: string, positive: boolean) => {
      const id = Date.now() + Math.random();
      setFloatingEvents((prev) => [...prev.slice(-8), { id, x, y, text, positive }]);
      window.setTimeout(() => {
        setFloatingEvents((prev) => prev.filter((ev) => ev.id !== id));
      }, 1450);
    },
    [],
  );

  const triggerCelebration = useCallback(() => {
    setConfettiKey((k) => k + 1);
  }, []);

  const {
    saveSummary,
    isMuted,
    handleStartNew,
    handleContinue,
    handleDeleteSave,
    handleExportSave,
    handleImportSave,
    handleToggleMute,
  } = useCityPersistence({
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
    gridRef,
    statsRef,
    goalRef,
    newsFeedRef,
    globalTimeRef,
    weatherTicksRef,
    eventTicksRef,
    advisorHistoryRef,
    addNewsItem,
  });

  useCitySimulation({
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
  });

  const handleSetDataMode = useCallback((mode: DataOverlayMode) => {
    setDataMode(mode);
    if (mode === 'none') {
      setHeatmapWarning(false);
    }
  }, []);

  const handleChangeGraphicsQuality = useCallback((q: GraphicsQuality) => {
    setGraphicsQuality(q);
    saveGraphicsQuality(q);
  }, []);

  const handleRotateCamera = useCallback((dir: -1 | 1) => {
    setRotateTrigger((prev) => ({ dir, seq: (prev?.seq ?? 0) + 1 }));
  }, []);

  const triggerDemolishParticles = useCallback(
    (x: number, y: number, tile: Grid[number][number]) => {
      const id = Date.now() + Math.random();
      setDemolishedTiles((prev) => [
        ...prev,
        {
          x,
          y,
          id,
          type: tile.buildingType,
          level: tile.level,
          color: BUILDINGS[tile.buildingType].color,
        },
      ]);
      window.setTimeout(() => {
        setDemolishedTiles((prev) => prev.filter((dt) => dt.id !== id));
      }, 2000);
    },
    [],
  );

  const {
    commitHistory,
    recordMutationHistory,
    resetHistory,
    handleStrokeStart,
    handleUndo,
    handleRedo,
    handleExpandMap,
  } = useCityHistory({
    historyRef,
    gridRef,
    statsRef,
    setHistoryFlags,
    setGrid,
    setStats,
    setInspectedTile,
    addNewsItem,
    onCelebration: triggerCelebration,
  });

  const {
    handleTileClick,
    handleClaimReward,
    handleInspectorRepair,
    handleInspectorUpgrade,
    handleInspectorRedevelop,
    handleSetTaxRate,
    handleBailout,
  } = useCityActions({
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
    onFloatingText: pushFloatingEvent,
    onCelebration: triggerCelebration,
  });

  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  useKeyboardShortcuts({
    enabled: gameStarted,
    milestoneTier: stats.milestoneTier,
    onSelectTool: setSelectedTool,
    onTogglePause: handleTogglePause,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onTogglePhotoMode: () => setPhotoMode((prev) => !prev),
    onEscape: () => {
      setPhotoMode(false);
      setInspectedTile(null);
    },
  });

  const damagedCount = useMemo(
    () => grid.reduce((acc, row) => acc + row.filter((t) => t.isDamaged).length, 0),
    [grid],
  );

  const handleInspectDamaged = useCallback(() => {
    for (const row of grid) {
      for (const tile of row) {
        if (tile.isDamaged) {
          setDataMode('none');
          setHeatmapWarning(false);
          setInspectedTile({ x: tile.x, y: tile.y });
          playClickSound();
          return;
        }
      }
    }
  }, [grid]);

  const onStartNewCity = useCallback(() => {
    hasCelebratedWinRef.current = false;
    setShowWinModal(false);
    setPhotoMode(false);
    setIsPaused(false);
    resetHistory();
    handleStartNew();
  }, [handleStartNew, resetHistory]);

  const onContinueCity = useCallback(() => {
    hasCelebratedWinRef.current = false;
    setShowWinModal(false);
    setPhotoMode(false);
    setIsPaused(false);
    resetHistory();
    handleContinue();
  }, [handleContinue, resetHistory]);

  const onImportCity = useCallback(
    (rawJson: string): boolean => {
      const ok = handleImportSave(rawJson);
      if (ok) {
        hasCelebratedWinRef.current = false;
        setShowWinModal(false);
        setIsPaused(false);
        resetHistory();
      }
      return ok;
    },
    [handleImportSave, resetHistory],
  );

  const inspectedTileData = inspectedTile
    ? grid[inspectedTile.y][inspectedTile.x]
    : null;

  return (
    <div className="relative w-screen h-screen overflow-hidden selection:bg-transparent selection:text-transparent bg-bg">
      <Suspense fallback={<div className="absolute inset-0 bg-bg" />}>
        <IsoMap
          grid={grid}
          onTileClick={handleTileClick}
          onStrokeStart={handleStrokeStart}
          hoveredTool={selectedTool}
          population={stats.population}
          money={stats.money}
          milestoneTier={stats.milestoneTier}
          weather={stats.weather}
          maxCars={maxCars}
          demolishedTiles={demolishedTiles}
          gameSpeed={gameSpeed}
          globalTime={globalTime}
          dataMode={dataMode}
          gameStarted={gameStarted}
          graphicsQuality={graphicsQuality}
          floatingEvents={floatingEvents}
          rotateTrigger={rotateTrigger}
          photoMode={photoMode}
        />
      </Suspense>

      <GoalConfetti burstKey={confettiKey} />

      {!gameStarted && (
        <StartScreen
          saveSummary={saveSummary}
          onContinue={onContinueCity}
          onStartNew={onStartNewCity}
          onDeleteSave={handleDeleteSave}
          onImportSave={onImportCity}
        />
      )}

      {gameStarted && !photoMode && (
        <>
          {inspectedTileData && (
            <Inspector
              tile={inspectedTileData}
              money={stats.money}
              onRepair={handleInspectorRepair}
              onUpgrade={handleInspectorUpgrade}
              onRedevelop={handleInspectorRedevelop}
              onClose={() => setInspectedTile(null)}
            />
          )}
          <UIOverlay
            stats={stats}
            selectedTool={selectedTool}
            onSelectTool={setSelectedTool}
            currentGoal={currentGoal}
            newsFeed={newsFeed}
            onClaimReward={handleClaimReward}
            maxCars={maxCars}
            setMaxCars={setMaxCars}
            gameSpeed={gameSpeed}
            setGameSpeed={setGameSpeed}
            isPaused={isPaused}
            onTogglePause={handleTogglePause}
            dataMode={dataMode}
            onSetDataMode={handleSetDataMode}
            heatmapWarning={heatmapWarning}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            canUndo={historyFlags.canUndo}
            canRedo={historyFlags.canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            gridSize={grid.length}
            onExpandMap={handleExpandMap}
            onExportSave={handleExportSave}
            onImportSave={onImportCity}
            onSetTaxRate={handleSetTaxRate}
            showBankruptcyWarning={
              stats.money < 0 ||
              (stats.money < 100 && stats.budget.netIncome < 0)
            }
            graphicsQuality={graphicsQuality}
            onChangeGraphicsQuality={handleChangeGraphicsQuality}
            onRotateCamera={handleRotateCamera}
            onTogglePhotoMode={() => {
              playClickSound();
              setPhotoMode(true);
            }}
            damagedCount={damagedCount}
            onInspectDamaged={handleInspectDamaged}
          />
        </>
      )}

      {gameStarted && photoMode && (
        <PhotoModeOverlay
          onRotate={handleRotateCamera}
          onExit={() => setPhotoMode(false)}
        />
      )}

      {gameStarted && showWinModal && (
        <WinModal
          stats={stats}
          onKeepPlaying={() => setShowWinModal(false)}
          onNewCity={onStartNewCity}
        />
      )}
      {gameStarted && stats.money <= BANKRUPTCY_LIMIT && (
        <BankruptcyModal
          money={stats.money}
          onBailout={handleBailout}
          onNewCity={onStartNewCity}
        />
      )}
    </div>
  );
}

export default App;
