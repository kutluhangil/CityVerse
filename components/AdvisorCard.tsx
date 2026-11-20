import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { CityGoal } from '../types';
import { useI18n } from '../utils/i18n';

interface AdvisorCardProps {
  currentGoal: CityGoal | null;
  showGoalMobile: boolean;
  onToggleMobile: () => void;
  onClaimReward: () => void;
}

export const AdvisorCard: React.FC<AdvisorCardProps> = ({
  currentGoal,
  showGoalMobile,
  onToggleMobile,
  onClaimReward,
}) => {
  const { t, buildingName } = useI18n();

  const formatGoalTarget = (goal: CityGoal): string => {
    if (goal.targetType === 'money') {
      return `$${goal.targetValue.toLocaleString()}`;
    }
    if (goal.targetType === 'happiness') {
      return `${goal.targetValue}% ${t('joy')}`;
    }
    if (goal.targetType === 'repair_all') {
      return t('repairGoal');
    }
    if (goal.targetType === 'connect_all') {
      return t('connectGoal');
    }
    if (goal.targetType === 'building_count' && goal.buildingType) {
      return `${goal.targetValue} ${buildingName(goal.buildingType)}`;
    }
    return `${goal.targetValue.toLocaleString()} ${t('citizens')}`;
  };

  return (
    <div className="paper-card w-full md:w-80 overflow-hidden transition-all">
      <div
        className="bg-sunk px-3.5 py-2 flex justify-between items-center border-b border-line cursor-pointer md:cursor-default"
        onClick={onToggleMobile}
      >
        <span className="font-mono font-bold uppercase text-[10px] tracking-[0.14em] text-clay-ink flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-clay animate-pulse" />
          {t('advisor')}
        </span>
        <div className="flex items-center gap-2">
          {currentGoal?.chainStep && (
            <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-ink-3 tabular-nums">
              {t('step')} #{currentGoal.chainStep}
            </span>
          )}
          <div className="md:hidden text-ink-2">
            {showGoalMobile ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      <div className={`p-3.5 ${!showGoalMobile ? 'hidden md:block' : 'block'}`}>
        {currentGoal ? (
          <>
            <p className="font-serif italic text-[14px] text-ink mb-3 leading-snug">
              &ldquo;{currentGoal.description}&rdquo;
            </p>

            <div className="flex justify-between items-center bg-sunk px-2.5 py-1.5 rounded-md border border-line">
              <div className="text-[10px] font-mono text-ink-3 uppercase tracking-wider font-semibold">
                {t('goal')}:{' '}
                <span className="text-ink font-bold ml-0.5">
                  {formatGoalTarget(currentGoal)}
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold text-clay-ink tabular-nums">
                +${currentGoal.reward}
              </span>
            </div>

            <div className="mt-2 h-1.5 w-full rounded-full bg-sunk border border-line overflow-hidden">
              <div
                className="h-full bg-clay transition-all duration-300"
                style={{ width: currentGoal.completed ? '100%' : '45%' }}
              />
            </div>

            {currentGoal.completed && (
              <button
                onClick={onClaimReward}
                className="mt-3 w-full bg-clay hover:bg-clay-ink text-white font-mono font-bold py-2 px-4 rounded-lg border border-ink shadow-[2px_2px_0_#141413] transition-colors text-[11px] uppercase tracking-widest cursor-pointer"
              >
                {t('collectReward')}
              </button>
            )}
          </>
        ) : (
          <div className="text-xs text-ink-3 py-1 text-center font-mono">
            {t('noGoal')}
          </div>
        )}
      </div>
    </div>
  );
};
