import React from 'react';
import { DEFAULT_TAX_RATE, MAX_TAX_RATE, MIN_TAX_RATE } from '../constants';
import { getExpansionCost, GRID_EXPAND_STEP } from '../sim/grid';
import { getNextMilestone, MILESTONES } from '../sim/milestones';
import { CityStats } from '../types';
import { useI18n } from '../utils/i18n';

interface BudgetPanelProps {
  stats: CityStats;
  gridSize: number;
  onSetTaxRate: (rate: number) => void;
  onExpandMap: () => void;
  onClose: () => void;
}

export const BudgetPanel: React.FC<BudgetPanelProps> = ({
  stats,
  gridSize,
  onSetTaxRate,
  onExpandMap,
  onClose,
}) => {
  const { t, milestoneName } = useI18n();
  const { budget, taxRate, milestoneTier, weather, money } = stats;
  const taxJoyDelta = (DEFAULT_TAX_RATE - taxRate) * 2;
  const currentMilestone = MILESTONES[milestoneTier];
  const nextMilestone = getNextMilestone(milestoneTier);
  const expandCost = getExpansionCost(gridSize);
  const nextGridSize = gridSize + GRID_EXPAND_STEP;

  return (
    <div
      data-testid="budget-panel"
      className="paper-card w-full md:w-80 p-3.5 text-xs flex flex-col gap-3"
    >
      <div className="flex items-center justify-between border-b border-line pb-2">
        <span className="font-mono font-bold uppercase tracking-[0.14em] text-[10px] text-ink">
          {t('cityBudgetTax')}
        </span>
        <button
          onClick={onClose}
          aria-label="Close budget"
          className="text-ink-3 hover:text-ink px-1.5 text-base leading-none cursor-pointer"
        >
          &times;
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <label htmlFor="tax-slider" className="text-ink-2 font-semibold">
            {t('taxRate')}:{' '}
            <span className="font-mono text-ink font-bold tabular-nums">
              {taxRate}%
            </span>
          </label>
          <span
            className={`font-mono text-[11px] font-bold tabular-nums ${
              taxJoyDelta >= 0 ? 'text-sage' : 'text-danger'
            }`}
          >
            {taxJoyDelta >= 0 ? `+${taxJoyDelta}` : taxJoyDelta} {t('joy')}
          </span>
        </div>
        <input
          id="tax-slider"
          type="range"
          min={MIN_TAX_RATE}
          max={MAX_TAX_RATE}
          step={1}
          value={taxRate}
          onChange={(e) => onSetTaxRate(Number(e.target.value))}
          className="w-full accent-clay cursor-pointer"
        />
      </div>

      <div className="bg-sunk rounded-lg p-2.5 border border-line space-y-1.5 font-mono tabular-nums">
        <div className="flex justify-between">
          <span className="text-ink-2">{t('resTax')}</span>
          <span className="text-sage font-semibold">+${budget.residentialTax}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-2">{t('comTax')}</span>
          <span className="text-sage font-semibold">+${budget.commercialIncome}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-ink-2 flex items-center gap-1.5">
            {t('indTax')}
            {weather === 'snowy' && (
              <span className="px-1 py-0.5 rounded bg-band/50 border border-clay text-clay-ink text-[9px] font-bold">
                Snow -30%
              </span>
            )}
          </span>
          <span className="text-sage font-semibold">+${budget.industrialIncome}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-2">{t('upkeep')}</span>
          <span className="text-danger font-semibold">-${budget.upkeep}</span>
        </div>
        <div className="border-t border-line pt-1.5 flex justify-between font-bold text-ink">
          <span>{t('netTick')}</span>
          <span className={budget.netIncome >= 0 ? 'text-sage' : 'text-danger'}>
            {budget.netIncome >= 0 ? '+' : '-'}${Math.abs(budget.netIncome)}
          </span>
        </div>
      </div>

      <div className="bg-sunk rounded-lg p-2.5 border border-line text-[11px]">
        <div className="flex justify-between items-center mb-1">
          <span className="text-ink-3 uppercase tracking-wider font-mono font-bold text-[10px]">
            {t('tier')}: {milestoneName(currentMilestone.tier)}
          </span>
          {nextMilestone && (
            <span className="text-clay-ink font-mono font-bold">
              {t('next')}: {milestoneName(nextMilestone.tier)}
            </span>
          )}
        </div>
        {nextMilestone ? (
          <div className="text-ink-2 font-mono tabular-nums">
            {t('reqPrefix')}: {nextMilestone.minPop} pop · ${nextMilestone.minMoney.toLocaleString()} · {nextMilestone.minHappiness}%
          </div>
        ) : (
          <div className="text-sage font-semibold">{t('maxMetropolis')}</div>
        )}
      </div>

      <div className="bg-sunk rounded-lg p-2.5 border border-line text-[11px] flex flex-col gap-2">
        <div className="flex justify-between items-center font-mono">
          <span className="text-ink-3 uppercase tracking-wider font-bold text-[10px]">
            {t('islandSize')}
          </span>
          <span className="font-bold text-ink tabular-nums">
            {gridSize}&times;{gridSize}
          </span>
        </div>
        {expandCost !== null ? (
          <button
            type="button"
            onClick={onExpandMap}
            disabled={money < expandCost}
            className={`w-full py-1.5 px-3 rounded-md border font-mono font-bold uppercase tracking-wider text-[10px] transition-colors ${
              money >= expandCost
                ? 'bg-clay hover:bg-clay-ink text-white border-ink shadow-[1.5px_1.5px_0_#141413] cursor-pointer'
                : 'bg-raised text-ink-3 border-line cursor-not-allowed'
            }`}
          >
            {t('expandLand')} ({nextGridSize}&times;{nextGridSize} · ${expandCost})
          </button>
        ) : (
          <div className="text-sage font-semibold font-mono text-[10px]">
            {t('maxIsland')}
          </div>
        )}
      </div>
    </div>
  );
};
