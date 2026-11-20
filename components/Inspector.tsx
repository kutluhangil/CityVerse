import React from 'react';
import { BUILDINGS } from '../constants';
import { BuildingType, TileData } from '../types';
import {
  calculateDemolishRefund,
  getRepairCost,
  getUpgradeCost,
  MAX_BUILDING_LEVEL,
} from '../sim/refund';
import { useI18n } from '../utils/i18n';

interface InspectorProps {
  tile: TileData;
  money: number;
  onUpgrade: () => void;
  onRepair: () => void;
  onRedevelop: () => void;
  onClose: () => void;
}

const LEVEL_NAMES = ['Standard', 'Enhanced', 'Premium'];

const Inspector: React.FC<InspectorProps> = ({
  tile,
  money,
  onUpgrade,
  onRepair,
  onRedevelop,
  onClose,
}) => {
  const { t, buildingName } = useI18n();
  const bConfig = BUILDINGS[tile.buildingType];
  const currentLevel = tile.level || 1;
  const upgradeCost = getUpgradeCost(currentLevel);
  const repairCost = getRepairCost(tile);
  const currentName = LEVEL_NAMES[currentLevel - 1] ?? 'Max';
  const nextName =
    currentLevel < MAX_BUILDING_LEVEL ? LEVEL_NAMES[currentLevel] : 'Max';
  const demolishCost = BUILDINGS[BuildingType.Demolish].cost;
  const refund = calculateDemolishRefund(tile);
  const upkeep = (bConfig.upkeep ?? 0) * currentLevel;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/35 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="paper-card p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-line pb-3 mb-4">
          <h2 className="font-serif text-2xl font-semibold text-ink tracking-tight">
            {t('inspectorTitle')}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close inspector"
            className="text-ink-3 hover:text-ink text-xl leading-none px-1 cursor-pointer"
          >
            &times;
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-mono text-ink-3 uppercase tracking-widest">
              {t('type')}
            </span>
            <span className="text-lg font-serif font-semibold text-ink">
              {buildingName(tile.buildingType)}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-ink-3 uppercase tracking-widest">
              {t('level')}
            </span>
            <div className="flex gap-2">
              {[1, 2, 3].map((l) => (
                <div
                  key={l}
                  className={`w-1/3 h-2 rounded-sm border ${
                    l <= currentLevel
                      ? 'bg-clay border-ink'
                      : 'bg-sunk border-line'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-mono text-ink-2 mt-0.5">
              {currentName}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-sunk border border-line rounded-lg p-3 text-xs font-mono tabular-nums">
            <div className="flex flex-col">
              <span className="text-ink-3 text-[10px] uppercase">{t('income')}</span>
              <span
                className={
                  bConfig.incomeGen > 0 ? 'text-sage font-bold' : 'text-ink'
                }
              >
                {bConfig.incomeGen * currentLevel > 0 ? '+' : ''}
                {bConfig.incomeGen * currentLevel} {t('perDay')}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-ink-3 text-[10px] uppercase">{t('population')}</span>
              <span
                className={
                  bConfig.popGen > 0 ? 'text-clay-ink font-bold' : 'text-ink'
                }
              >
                {bConfig.popGen * currentLevel > 0 ? '+' : ''}
                {bConfig.popGen * currentLevel} {t('perMax')}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-ink-3 text-[10px] uppercase">{t('upkeep')}</span>
              <span
                className={upkeep > 0 ? 'text-danger font-bold' : 'text-ink'}
              >
                -${upkeep} {t('perDay')}
              </span>
            </div>
            {bConfig.serviceRadius && (
              <div className="flex flex-col">
                <span className="text-ink-3 text-[10px] uppercase">
                  {t('serviceRadius')}
                </span>
                <span className="text-ink font-bold">
                  {bConfig.serviceRadius} {t('tiles')}
                </span>
              </div>
            )}
          </div>

          {tile.isDamaged ? (
            <div className="flex flex-col gap-2">
              <div className="px-3 py-2 rounded-lg bg-band/40 border border-danger text-danger text-xs font-mono font-semibold">
                {t('damagedWarn')}
              </div>
              <button
                onClick={onRepair}
                disabled={money < repairCost}
                className={`w-full py-2.5 rounded-lg border font-mono font-bold uppercase tracking-widest text-xs transition-colors ${
                  money >= repairCost
                    ? 'bg-clay hover:bg-clay-ink text-white border-ink shadow-[2px_2px_0_#141413] cursor-pointer'
                    : 'bg-sunk text-ink-3 border-line cursor-not-allowed'
                }`}
              >
                {t('repairBuilding')} (${repairCost})
              </button>
            </div>
          ) : currentLevel < MAX_BUILDING_LEVEL ? (
            <button
              onClick={onUpgrade}
              disabled={money < upgradeCost}
              className={`mt-2 w-full py-2.5 rounded-lg border font-mono font-bold uppercase tracking-widest text-xs transition-colors ${
                money >= upgradeCost
                  ? 'bg-clay hover:bg-clay-ink text-white border-ink shadow-[2px_2px_0_#141413] cursor-pointer'
                  : 'bg-sunk text-ink-3 border-line cursor-not-allowed'
              }`}
            >
              {t('upgradeTo')} {nextName} (${upgradeCost})
            </button>
          ) : (
            <button
              onClick={onRedevelop}
              disabled={money < demolishCost}
              className="mt-2 w-full py-2.5 rounded-lg border border-ink bg-danger hover:opacity-90 disabled:bg-sunk disabled:text-ink-3 disabled:border-line text-white font-mono font-bold uppercase tracking-widest text-xs text-center shadow-[2px_2px_0_#141413] transition-opacity cursor-pointer"
            >
              {t('redevelop')} (+${refund} {t('refundWord')})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inspector;
