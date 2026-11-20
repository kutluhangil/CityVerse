/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useRef, useState } from 'react';
import { motion, type Variants } from 'motion/react';
import {
  Activity,
  ChevronRight,
  Focus,
  Globe,
  Layers,
  RotateCcw,
  Trash2,
  Upload,
  Zap,
} from 'lucide-react';
import { SaveSummary } from '../sim/storage';
import { useI18n } from '../utils/i18n';

interface StartScreenProps {
  saveSummary: SaveSummary | null;
  onContinue: () => void;
  onStartNew: () => void;
  onDeleteSave: () => void;
  onImportSave: (json: string) => boolean;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.12,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', damping: 28, stiffness: 220 },
  },
};

const StartScreen: React.FC<StartScreenProps> = ({
  saveSummary,
  onContinue,
  onStartNew,
  onDeleteSave,
  onImportSave,
}) => {
  const { locale, toggleLocale, t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = onImportSave(String(reader.result ?? ''));
      setImportError(!ok);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="absolute inset-0 z-50 flex pointer-events-auto font-sans overflow-hidden">
      <button
        type="button"
        data-testid="lang-toggle"
        onClick={toggleLocale}
        aria-label="Toggle language"
        className="paper-pill fixed top-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-ink hover:bg-sunk cursor-pointer"
      >
        <Globe size={13} />
        {locale.toUpperCase()}
      </button>

      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', damping: 35, stiffness: 220 }}
        className="w-full md:w-[45vw] lg:w-[40vw] h-full paper-dot-bg relative border-r-2 border-ink flex flex-col justify-center px-8 md:px-14"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative z-10 max-w-lg"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-ink bg-raised mb-6 shadow-[2px_2px_0_#141413]"
          >
            <span className="flex h-2 w-2 rounded-full bg-clay animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] font-bold text-ink">
              {t('brandBadge')}
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="font-serif text-5xl md:text-6xl font-medium leading-[1.02] tracking-tight text-ink mb-5"
          >
            {t('heroTitleA')}
            <br />
            <span className="italic text-clay-ink">{t('heroTitleB')}</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-ink-2 text-base md:text-[17px] mb-7 leading-relaxed"
          >
            {t('heroDesc')}
          </motion.p>

          {saveSummary && (
            <motion.div
              variants={itemVariants}
              className="paper-pill mb-4 px-4 py-2.5 text-xs font-mono tabular-nums flex items-center justify-between bg-sunk"
            >
              <span className="text-ink-2">
                {t('savedPrefix')} {saveSummary.day} ·{' '}
                {Math.floor(saveSummary.population).toLocaleString()}{' '}
                {t('citizensWord')}
              </span>
              <span className="text-sage font-bold">
                ${Math.floor(saveSummary.money).toLocaleString()}
              </span>
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="flex flex-col gap-3 mb-8">
            <button
              onClick={saveSummary ? onContinue : onStartNew}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-7 rounded-xl font-mono font-bold uppercase tracking-wider text-xs bg-clay hover:bg-clay-ink text-white border-[1.5px] border-ink shadow-[3px_3px_0_#141413] active:translate-x-[1px] active:translate-y-[1px] transition-all group cursor-pointer"
            >
              <span>{saveSummary ? t('continueCity') : t('initSim')}</span>
              <ChevronRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>

            <div className="flex flex-wrap gap-2">
              {saveSummary && (
                <>
                  <button
                    onClick={onStartNew}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border-[1.5px] border-ink bg-raised hover:bg-sunk text-xs font-mono font-bold uppercase tracking-wider text-ink shadow-[2px_2px_0_#141413] transition-colors cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    {t('newCity')}
                  </button>
                  <button
                    onClick={onDeleteSave}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border-[1.5px] border-danger bg-raised hover:bg-band/30 text-xs font-mono font-bold uppercase tracking-wider text-danger shadow-[2px_2px_0_#c44536] transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                    {t('deleteSave')}
                  </button>
                </>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border-[1.5px] border-ink bg-raised hover:bg-sunk text-xs font-mono font-bold uppercase tracking-wider text-ink shadow-[2px_2px_0_#141413] transition-colors cursor-pointer"
              >
                <Upload size={13} />
                {t('importJson')}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {importError && (
              <p className="text-xs font-mono text-danger">{t('invalidSave')}</p>
            )}
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex gap-8 border-t border-line pt-6"
          >
            <div className="flex flex-col gap-1.5">
              <Activity size={16} className="text-clay" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink-3 font-bold">
                {t('featEcon')}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <Layers size={16} className="text-ink" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink-3 font-bold">
                {t('featDiorama')}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <Zap size={16} className="text-sage" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink-3 font-bold">
                {t('featTraffic')}
              </span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 1.2 }}
        className="hidden md:flex flex-1 relative pointer-events-none"
      >
        <div className="paper-pill absolute bottom-10 right-10 flex items-center gap-2.5 px-4 py-2">
          <Focus size={15} className="text-clay" />
          <span className="font-mono text-[11px] uppercase tracking-widest font-bold text-ink">
            {t('livePreview')}
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default StartScreen;
