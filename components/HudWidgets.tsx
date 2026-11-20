import React from 'react';
import { CloudRain, CloudSnow, Lock, Sun } from 'lucide-react';
import { BUILDINGS } from '../constants';
import { BuildingType, MilestoneTier } from '../types';
import { useI18n } from '../utils/i18n';
import { IsoIcon } from './ToolIcons';

export const WeatherWidget: React.FC<{ weather: string }> = ({ weather }) => {
  const isRainy = weather === 'rainy';
  const isSnowy = weather === 'snowy';
  const isSunny = !isRainy && !isSnowy;

  return (
    <div
      className={`relative flex items-center justify-center w-8 h-8 rounded-full border border-ink shadow-[1.5px_1.5px_0_#141413] transition-colors ${
        isRainy
          ? 'bg-sunk text-ink-2'
          : isSnowy
            ? 'bg-raised text-ink'
            : 'bg-band/45 text-clay-ink'
      }`}
    >
      {isSunny && <Sun size={17} />}
      {isRainy && <CloudRain size={17} />}
      {isSnowy && <CloudSnow size={17} />}
    </div>
  );
};

export const ToolButton: React.FC<{
  type: BuildingType;
  isSelected: boolean;
  onClick: () => void;
  money: number;
  milestoneTier: MilestoneTier;
  hotkey?: string;
}> = ({ type, isSelected, onClick, money, milestoneTier, hotkey }) => {
  const { t, buildingName, buildingDesc, milestoneName } = useI18n();
  const config = BUILDINGS[type];
  const requiredTier = (config.unlockTier ?? 0) as MilestoneTier;
  const isLocked = requiredTier > milestoneTier;
  const unlockName = milestoneName(requiredTier);
  const canAfford = money >= config.cost;
  const isDemolish = type === BuildingType.Demolish;
  const upkeep = config.upkeep ?? 0;
  const disabled = isLocked || (!isDemolish && !canAfford);
  const name = buildingName(type);
  const desc = buildingDesc(type);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group relative flex flex-col items-center justify-between p-1.5 rounded-lg transition-all flex-shrink-0
        w-[4.7rem] h-20 md:w-[5.1rem] md:h-[5.75rem] outline-none border-[1.5px]
        ${
          isSelected
            ? 'border-clay bg-band/35 ring-2 ring-clay/30 shadow-[2px_2px_0_#d97757] -translate-y-0.5'
            : 'border-line bg-surface hover:bg-sunk hover:border-ink'
        }
        ${disabled ? 'opacity-45 cursor-not-allowed grayscale-[0.4]' : 'cursor-pointer'}
      `}
      title={isLocked ? `${t('unlocksAt')} ${unlockName}: ${desc}` : desc}
    >
      {hotkey && !isLocked && (
        <span className="absolute top-1 left-1 px-1 rounded bg-sunk border border-line text-[8px] font-mono font-bold text-ink-3 leading-tight">
          {hotkey}
        </span>
      )}

      {isLocked && (
        <span className="absolute top-1 right-1 flex items-center gap-0.5 px-1 py-0.5 rounded bg-raised border border-ink text-[8px] font-mono font-bold uppercase text-ink z-10">
          <Lock size={8} />
          {unlockName}
        </span>
      )}

      <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center pointer-events-none mt-0.5">
        <IsoIcon type={type} isDemolish={isDemolish} />
      </div>

      <div className="flex flex-col items-center gap-0 w-full pointer-events-none">
        <span className="text-[9px] md:text-[10px] font-mono font-bold text-ink uppercase tracking-wider leading-none text-center">
          {name}
        </span>
        <div className="flex flex-col items-center mt-0.5">
          {config.cost > 0 && (
            <span
              className={`text-[9px] font-mono leading-none font-bold tabular-nums ${
                canAfford ? 'text-clay-ink' : 'text-danger'
              }`}
            >
              -${config.cost}
            </span>
          )}
          {(config.incomeGen !== 0 || config.popGen !== 0 || upkeep > 0) && (
            <div className="flex gap-1 bg-sunk px-1 py-[1px] rounded border border-line mt-[2px]">
              {config.incomeGen > 0 && (
                <span className="text-[8px] font-mono leading-none text-sage font-bold">
                  +${config.incomeGen}/d
                </span>
              )}
              {config.popGen > 0 && (
                <span className="text-[8px] font-mono leading-none text-ink-2 font-bold">
                  +{config.popGen}p
                </span>
              )}
              {config.incomeGen === 0 && config.popGen === 0 && upkeep > 0 && (
                <span className="text-[8px] font-mono leading-none text-danger font-bold">
                  -${upkeep}/d
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
};
