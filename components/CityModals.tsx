import React from 'react';
import { AlertTriangle, Trophy } from 'lucide-react';
import { CityStats } from '../types';
import { useI18n } from '../utils/i18n';

export const WinModal: React.FC<{
  stats: CityStats;
  onKeepPlaying: () => void;
  onNewCity: () => void;
}> = ({ stats, onKeepPlaying, onNewCity }) => {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-[2px]">
      <div className="paper-card p-6 w-full max-w-md">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 rounded-lg bg-band/45 text-clay-ink border border-ink">
            <Trophy size={24} />
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-clay-ink font-bold">
              {t('milestoneDone')}
            </span>
            <h2 className="font-serif text-2xl font-semibold text-ink">
              {t('metropolisWin')}
            </h2>
          </div>
        </div>

        <p className="text-sm text-ink-2 mb-4 leading-relaxed">
          {t('metropolisDesc')}
        </p>

        <div className="grid grid-cols-2 gap-3 bg-sunk rounded-lg p-3 text-sm font-mono tabular-nums mb-5 border border-line">
          <div>
            <span className="text-[10px] text-ink-3 block uppercase">{t('day')}</span>
            <span className="font-bold text-ink">{stats.day}</span>
          </div>
          <div>
            <span className="text-[10px] text-ink-3 block uppercase">{t('citizens')}</span>
            <span className="font-bold text-clay-ink">
              {Math.floor(stats.population).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-ink-3 block uppercase">{t('treasury')}</span>
            <span className="font-bold text-sage">
              ${Math.floor(stats.money).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-ink-3 block uppercase">{t('joy')}</span>
            <span className="font-bold text-ink">{stats.happiness}%</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onKeepPlaying}
            className="flex-1 py-2.5 rounded-lg bg-clay hover:bg-clay-ink text-white border border-ink shadow-[2px_2px_0_#141413] font-mono font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            {t('keepPlaying')}
          </button>
          <button
            onClick={onNewCity}
            className="py-2.5 px-4 rounded-lg bg-sunk hover:bg-line border border-ink text-ink font-mono font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            {t('newCity')}
          </button>
        </div>
      </div>
    </div>
  );
};

export const BankruptcyModal: React.FC<{
  money: number;
  onBailout: () => void;
  onNewCity: () => void;
}> = ({ money, onBailout, onNewCity }) => {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/45 backdrop-blur-[2px]">
      <div className="paper-card p-6 w-full max-w-md border-danger">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 rounded-lg bg-band/40 text-danger border border-danger">
            <AlertTriangle size={24} />
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-danger font-bold">
              {t('treasuryDefault')}
            </span>
            <h2 className="font-serif text-2xl font-semibold text-ink">
              {t('cityBankrupt')}
            </h2>
          </div>
        </div>

        <p className="text-sm text-ink-2 mb-5 leading-relaxed">
          ${Math.floor(money).toLocaleString()} — {t('bailout')}
        </p>

        <div className="flex gap-2">
          <button
            onClick={onBailout}
            className="flex-1 py-2.5 rounded-lg bg-clay hover:bg-clay-ink text-white border border-ink shadow-[2px_2px_0_#141413] font-mono font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            {t('bailout')}
          </button>
          <button
            onClick={onNewCity}
            className="py-2.5 px-4 rounded-lg bg-sunk hover:bg-line border border-ink text-ink font-mono font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            {t('newCity')}
          </button>
        </div>
      </div>
    </div>
  );
};
