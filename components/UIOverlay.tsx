import React, { useEffect, useRef, useState } from 'react';
import {
  BuildingType,
  CityGoal,
  CityStats,
  DataOverlayMode,
  GraphicsQuality,
  NewsItem,
} from '../types';
import { playClickSound } from '../utils/audio';
import { useI18n } from '../utils/i18n';
import { AdvisorCard } from './AdvisorCard';
import { EventBanner } from './EventBanner';
import { HudTopBar } from './HudTopBar';
import { ToolButton } from './HudWidgets';
import { NewsFeedCard } from './NewsFeedCard';

interface UIOverlayProps {
  stats: CityStats;
  selectedTool: BuildingType;
  onSelectTool: (type: BuildingType) => void;
  currentGoal: CityGoal | null;
  newsFeed: NewsItem[];
  onClaimReward: () => void;
  gameSpeed: number;
  setGameSpeed: (speed: number) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  maxCars: number;
  setMaxCars: (n: number) => void;
  dataMode: DataOverlayMode;
  onSetDataMode: (mode: DataOverlayMode) => void;
  heatmapWarning: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  gridSize: number;
  onExpandMap: () => void;
  onExportSave: () => void;
  onImportSave: (json: string) => boolean;
  onSetTaxRate: (rate: number) => void;
  showBankruptcyWarning: boolean;
  graphicsQuality: GraphicsQuality;
  onChangeGraphicsQuality: (q: GraphicsQuality) => void;
  onRotateCamera: (dir: -1 | 1) => void;
  onTogglePhotoMode: () => void;
  damagedCount: number;
  onInspectDamaged: () => void;
}

const TOOL_HOTKEYS: Partial<Record<BuildingType, string>> = {
  [BuildingType.Road]: 'R',
  [BuildingType.Residential]: '2',
  [BuildingType.Commercial]: '3',
  [BuildingType.Industrial]: '4',
  [BuildingType.Park]: '5',
  [BuildingType.PowerPlant]: '6',
  [BuildingType.FireStation]: '7',
  [BuildingType.Upgrade]: '8',
  [BuildingType.Inspect]: '9',
  [BuildingType.Demolish]: 'Del',
};

const tools = [
  BuildingType.Demolish,
  BuildingType.Road,
  BuildingType.Residential,
  BuildingType.Commercial,
  BuildingType.Industrial,
  BuildingType.Park,
  BuildingType.ParkPlayground,
  BuildingType.ParkFountain,
  BuildingType.PowerPlant,
  BuildingType.FireStation,
  BuildingType.School,
  BuildingType.PoliceStation,
  BuildingType.Hospital,
  BuildingType.Upgrade,
  BuildingType.Inspect,
];

const UIOverlay: React.FC<UIOverlayProps> = ({
  stats,
  selectedTool,
  onSelectTool,
  currentGoal,
  newsFeed,
  onClaimReward,
  maxCars,
  setMaxCars,
  gameSpeed,
  setGameSpeed,
  isPaused,
  onTogglePause,
  dataMode,
  onSetDataMode,
  heatmapWarning,
  isMuted,
  onToggleMute,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  gridSize,
  onExpandMap,
  onExportSave,
  onImportSave,
  onSetTaxRate,
  showBankruptcyWarning,
  graphicsQuality,
  onChangeGraphicsQuality,
  onRotateCamera,
  onTogglePhotoMode,
  damagedCount,
  onInspectDamaged,
}) => {
  const { t } = useI18n();
  const newsRef = useRef<HTMLDivElement>(null);
  const [showGoalMobile, setShowGoalMobile] = useState(false);
  const [showNewsMobile, setShowNewsMobile] = useState(false);

  useEffect(() => {
    if (newsRef.current) {
      newsRef.current.scrollTop = newsRef.current.scrollHeight;
    }
  }, [newsFeed]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 md:p-4 font-sans z-10">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start pointer-events-auto gap-3 w-full max-w-full">
        <HudTopBar
          stats={stats}
          gameSpeed={gameSpeed}
          setGameSpeed={setGameSpeed}
          isPaused={isPaused}
          onTogglePause={onTogglePause}
          dataMode={dataMode}
          onSetDataMode={onSetDataMode}
          heatmapWarning={heatmapWarning}
          isMuted={isMuted}
          onToggleMute={onToggleMute}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={onUndo}
          onRedo={onRedo}
          gridSize={gridSize}
          onExpandMap={onExpandMap}
          onExportSave={onExportSave}
          onImportSave={onImportSave}
          onSetTaxRate={onSetTaxRate}
          showBankruptcyWarning={showBankruptcyWarning}
          graphicsQuality={graphicsQuality}
          onChangeGraphicsQuality={onChangeGraphicsQuality}
          onRotateCamera={onRotateCamera}
          onTogglePhotoMode={onTogglePhotoMode}
        />

        <div className="flex flex-col gap-2 w-full md:w-80">
          <AdvisorCard
            currentGoal={currentGoal}
            showGoalMobile={showGoalMobile}
            onToggleMobile={() => setShowGoalMobile(!showGoalMobile)}
            onClaimReward={onClaimReward}
          />
          <EventBanner
            activeEvent={stats.activeEvent ?? null}
            damagedCount={damagedCount}
            onInspectDamaged={onInspectDamaged}
          />
        </div>
      </div>

      <div className="flex flex-col-reverse md:flex-row md:justify-between md:items-end pointer-events-auto mt-auto gap-3 w-full max-w-full pb-1 md:pb-0">
        <div className="paper-card flex gap-1.5 p-1.5 md:p-2 w-full md:w-auto overflow-x-auto no-scrollbar justify-start items-center">
          <div className="flex gap-1.5 min-w-max px-0.5">
            {tools.map((type) => (
              <ToolButton
                key={type}
                type={type}
                isSelected={selectedTool === type}
                onClick={() => {
                  playClickSound();
                  onSelectTool(type);
                }}
                money={stats.money}
                milestoneTier={stats.milestoneTier}
                hotkey={TOOL_HOTKEYS[type]}
              />
            ))}
          </div>
        </div>

        <div className="hidden md:flex flex-col gap-1.5 p-2.5 paper-card items-center justify-center min-w-[116px]">
          <div className="font-mono text-[9px] text-ink-3 font-bold uppercase tracking-widest text-center">
            {t('trafficCap')}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                playClickSound();
                setMaxCars(Math.max(0, maxCars - 2));
              }}
              className="w-7 h-7 rounded bg-sunk hover:bg-line border border-ink text-ink font-mono font-bold transition-colors cursor-pointer"
            >
              -
            </button>
            <span className="text-ink font-mono text-base font-bold tabular-nums w-6 text-center">
              {maxCars}
            </span>
            <button
              onClick={() => {
                playClickSound();
                setMaxCars(Math.min(50, maxCars + 2));
              }}
              className="w-7 h-7 rounded bg-sunk hover:bg-line border border-ink text-ink font-mono font-bold transition-colors cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        <NewsFeedCard
          newsFeed={newsFeed}
          newsRef={newsRef}
          showNewsMobile={showNewsMobile}
          onToggleMobile={() => setShowNewsMobile(!showNewsMobile)}
        />
      </div>
    </div>
  );
};

export default UIOverlay;
