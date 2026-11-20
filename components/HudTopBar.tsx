import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  Download,
  Globe,
  Pause,
  Play,
  Redo2,
  RotateCcw,
  RotateCw,
  Undo2,
  Upload,
  Volume2,
  VolumeX,
  Wallet,
} from 'lucide-react';
import { BANKRUPTCY_LIMIT } from '../constants';
import {
  CityStats,
  DataOverlayMode,
  GraphicsQuality,
} from '../types';
import { playClickSound } from '../utils/audio';
import { useI18n } from '../utils/i18n';
import { AnimatedCounter } from './AnimatedCounter';
import { BudgetPanel } from './BudgetPanel';
import { GraphicsControl } from './GraphicsControl';
import { WeatherWidget } from './HudWidgets';
import { RciIndicator } from './RciIndicator';

const DATA_MODES: DataOverlayMode[] = [
  'none',
  'population',
  'income',
  'happiness',
  'services',
];

interface HudTopBarProps {
  stats: CityStats;
  gameSpeed: number;
  setGameSpeed: (speed: number) => void;
  isPaused: boolean;
  onTogglePause: () => void;
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
}

export const HudTopBar: React.FC<HudTopBarProps> = ({
  stats,
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
}) => {
  const { locale, toggleLocale, t, milestoneName, dataModeLabel } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showBudget, setShowBudget] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onImportSave(String(reader.result ?? ''));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-1.5 w-full md:w-auto">
      <div className="paper-card px-3 py-2 flex gap-3 md:gap-4 items-center justify-start md:justify-between w-full md:w-auto overflow-x-auto no-scrollbar">
        <div className="flex flex-col">
          <span className="font-mono text-[9px] text-ink-3 uppercase font-bold tracking-widest leading-tight">
            {t('treasury')}
          </span>
          <AnimatedCounter
            value={stats.money}
            prefix="$"
            testId="treasury-value"
            className={`font-mono text-lg md:text-xl font-bold leading-none mt-1 ${
              stats.money < 0 ? 'text-danger' : 'text-ink'
            }`}
          />
        </div>
        <div className="w-px h-8 bg-line" />
        <div className="flex flex-col">
          <span className="font-mono text-[9px] text-ink-3 uppercase font-bold tracking-widest leading-tight">
            {t('citizens')}
          </span>
          <span className="font-mono text-base md:text-lg font-bold text-ink tabular-nums leading-none mt-1">
            {Math.floor(stats.population).toLocaleString()}
          </span>
        </div>
        <div className="w-px h-8 bg-line" />
        <RciIndicator demand={stats.demand} />
        <div className="w-px h-8 bg-line" />
        <div className="flex flex-col items-end">
          <span className="font-mono text-[9px] text-ink-3 uppercase font-bold tracking-widest leading-tight">
            {t('day')}
          </span>
          <span className="font-mono text-base md:text-lg font-bold text-ink tabular-nums leading-none mt-1">
            {stats.day}
          </span>
        </div>
        <div className="flex flex-row items-center gap-1">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onTogglePause();
            }}
            aria-label={isPaused ? 'Resume simulation' : 'Pause simulation'}
            title="Space"
            className={`p-1.5 rounded font-mono font-bold border transition-colors cursor-pointer ${
              isPaused
                ? 'bg-clay text-white border-ink'
                : 'bg-sunk text-ink-2 border-line hover:border-ink'
            }`}
          >
            {isPaused ? <Play size={11} /> : <Pause size={11} />}
          </button>
          {[1, 2, 3].map((speed) => (
            <button
              key={speed}
              onClick={() => {
                playClickSound();
                if (isPaused) onTogglePause();
                setGameSpeed(speed);
              }}
              className={`px-2 py-1 text-[11px] rounded font-mono font-bold border transition-colors cursor-pointer ${
                !isPaused && gameSpeed === speed
                  ? 'bg-clay text-white border-ink'
                  : 'bg-sunk text-ink-2 border-line hover:border-ink'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
        <div className="w-px h-8 bg-line" />
        <div className="flex flex-col items-end">
          <span className="font-mono text-[9px] text-ink-3 uppercase font-bold tracking-widest leading-tight">
            {t('joy')}
          </span>
          <span
            className={`font-mono text-base md:text-lg font-bold tabular-nums leading-none mt-1 ${
              stats.happiness >= 60
                ? 'text-sage'
                : stats.happiness < 40
                  ? 'text-danger'
                  : 'text-clay-ink'
            }`}
          >
            {stats.happiness}%
          </span>
        </div>
        <div className="w-px h-8 bg-line" />
        <div className="flex flex-col items-center">
          <span className="font-mono text-[9px] text-ink-3 uppercase font-bold tracking-widest leading-tight mb-0.5">
            {t('weather')}
          </span>
          <WeatherWidget weather={stats.weather} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <div className="paper-pill flex items-center gap-1 px-2 py-1">
          <span className="font-mono text-[9px] text-ink-3 font-bold uppercase tracking-widest mr-0.5">
            {t('data')}
          </span>
          {DATA_MODES.map((mode) => (
            <button
              key={mode}
              onClick={() => {
                playClickSound();
                onSetDataMode(mode);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                dataMode === mode
                  ? 'bg-clay text-white'
                  : 'text-ink-2 hover:bg-sunk hover:text-ink'
              }`}
            >
              {dataModeLabel(mode)}
            </button>
          ))}
        </div>

        <div className="paper-pill flex items-center gap-0.5 px-1.5 py-1">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
            className={`p-1 rounded transition-colors ${
              canUndo
                ? 'text-ink-2 hover:bg-sunk hover:text-ink cursor-pointer'
                : 'text-ink-3/40 cursor-not-allowed'
            }`}
          >
            <Undo2 size={13} />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Redo"
            title="Redo (Ctrl+Shift+Z)"
            className={`p-1 rounded transition-colors ${
              canRedo
                ? 'text-ink-2 hover:bg-sunk hover:text-ink cursor-pointer'
                : 'text-ink-3/40 cursor-not-allowed'
            }`}
          >
            <Redo2 size={13} />
          </button>
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            title={isMuted ? 'Unmute audio' : 'Mute audio'}
            className="p-1 rounded text-ink-2 hover:bg-sunk hover:text-ink transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onRotateCamera(-1);
            }}
            aria-label="Rotate camera left"
            title="Rotate Left (Q)"
            className="p-1 rounded text-ink-2 hover:bg-sunk hover:text-ink transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
          </button>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onRotateCamera(1);
            }}
            aria-label="Rotate camera right"
            title="Rotate Right (E)"
            className="p-1 rounded text-ink-2 hover:bg-sunk hover:text-ink transition-colors cursor-pointer"
          >
            <RotateCw size={13} />
          </button>
          <button
            type="button"
            onClick={onTogglePhotoMode}
            aria-label="Photo mode"
            title="Photo Mode (P)"
            className="p-1 rounded text-ink-2 hover:bg-sunk hover:text-ink transition-colors cursor-pointer"
          >
            <Camera size={13} />
          </button>
          <button
            onClick={onExportSave}
            aria-label="Export city JSON"
            title="Export city JSON"
            className="p-1 rounded text-ink-2 hover:bg-sunk hover:text-ink transition-colors cursor-pointer"
          >
            <Download size={13} />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            aria-label="Import city JSON"
            title="Import city JSON"
            className="p-1 rounded text-ink-2 hover:bg-sunk hover:text-ink transition-colors cursor-pointer"
          >
            <Upload size={13} />
          </button>
          <button
            type="button"
            data-testid="lang-toggle"
            onClick={toggleLocale}
            aria-label="Toggle language"
            title={locale === 'en' ? 'Türkçe' : 'English'}
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase text-ink-2 hover:bg-sunk hover:text-ink transition-colors cursor-pointer"
          >
            <Globe size={11} />
            {locale.toUpperCase()}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <GraphicsControl
          quality={graphicsQuality}
          onChangeQuality={onChangeGraphicsQuality}
        />

        <span
          data-testid="milestone-badge"
          className="paper-pill px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-ink"
        >
          {milestoneName(stats.milestoneTier)}
        </span>

        {isPaused && (
          <span className="paper-pill !bg-band/60 px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-ink">
            {t('pausedBadge')}
          </span>
        )}

        <button
          type="button"
          onClick={() => {
            playClickSound();
            setShowBudget((prev) => !prev);
          }}
          className={`paper-pill flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer ${
            showBudget ? '!bg-clay !text-white' : 'hover:bg-sunk'
          }`}
        >
          <Wallet size={12} />
          {t('budget')}
          <span
            className={`tabular-nums ${
              showBudget
                ? 'text-white'
                : stats.budget.netIncome >= 0
                  ? 'text-sage'
                  : 'text-danger'
            }`}
          >
            {stats.budget.netIncome >= 0 ? '+' : '-'}$
            {Math.abs(stats.budget.netIncome)}
          </span>
        </button>

        {showBankruptcyWarning && (
          <div
            role="status"
            title={`Treasury critical (default at $${BANKRUPTCY_LIMIT})`}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-danger text-white border border-ink font-mono text-[10px] font-bold uppercase tracking-wider animate-pulse"
          >
            <AlertTriangle size={12} />
            {t('bankruptcyRisk')}
          </div>
        )}

        {dataMode !== 'none' && (
          <div
            role="status"
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border transition-all ${
              heatmapWarning
                ? 'bg-danger text-white border-ink animate-pulse'
                : 'bg-band/55 text-ink border-ink'
            }`}
          >
            {t('overlayWarn')}
          </div>
        )}
      </div>

      {showBudget && (
        <BudgetPanel
          stats={stats}
          gridSize={gridSize}
          onSetTaxRate={onSetTaxRate}
          onExpandMap={onExpandMap}
          onClose={() => setShowBudget(false)}
        />
      )}
    </div>
  );
};
