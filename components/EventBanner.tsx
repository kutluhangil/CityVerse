import React from 'react';
import { Flame, Megaphone, PartyPopper, Wrench } from 'lucide-react';
import { ActiveCityEvent } from '../types';
import { useI18n } from '../utils/i18n';

interface EventBannerProps {
  activeEvent: ActiveCityEvent | null;
  damagedCount: number;
  onInspectDamaged: () => void;
}

export const EventBanner: React.FC<EventBannerProps> = ({
  activeEvent,
  damagedCount,
  onInspectDamaged,
}) => {
  const { t } = useI18n();
  if (!activeEvent && damagedCount === 0) return null;

  const type = activeEvent?.type ?? 'fire';
  const isFestival = type === 'festival';
  const Icon =
    type === 'festival'
      ? PartyPopper
      : type === 'strike'
        ? Megaphone
        : Flame;

  return (
    <div
      data-testid="event-banner"
      className={`paper-card w-full md:w-80 p-3 text-xs flex flex-col gap-2 ${
        isFestival ? 'border-sage' : 'border-danger'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-mono font-bold uppercase tracking-wider text-[10px]">
          <Icon
            size={14}
            className={isFestival ? 'text-sage' : 'text-danger'}
          />
          <span className="text-ink">
            {activeEvent?.title ?? t('damagedStruct')}
          </span>
        </div>
        {activeEvent && (
          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-sunk border border-line text-ink-2 tabular-nums">
            {activeEvent.ticksRemaining}t
          </span>
        )}
      </div>

      <p className="text-ink-2 text-[11px] leading-snug">
        {activeEvent?.description ?? `${damagedCount} plot(s) offline.`}
      </p>

      {damagedCount > 0 && (
        <button
          type="button"
          onClick={onInspectDamaged}
          aria-label="Inspect Damaged Building"
          className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-md bg-clay hover:bg-clay-ink text-white border border-ink font-mono text-[10px] font-bold uppercase tracking-wider shadow-[1.5px_1.5px_0_#141413] cursor-pointer"
        >
          <Wrench size={11} />
          {t('inspectDamaged')} ({damagedCount})
        </button>
      )}
    </div>
  );
};
