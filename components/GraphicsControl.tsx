import React, { useEffect, useState } from 'react';
import { GRAPHICS_PRESETS } from '../scene/graphics';
import { GraphicsQuality } from '../types';
import { playClickSound } from '../utils/audio';
import { useI18n } from '../utils/i18n';

interface GraphicsControlProps {
  quality: GraphicsQuality;
  onChangeQuality: (q: GraphicsQuality) => void;
}

const LEVELS: GraphicsQuality[] = ['low', 'medium', 'high'];

export const GraphicsControl: React.FC<GraphicsControlProps> = ({
  quality,
  onChangeQuality,
}) => {
  const { locale, t } = useI18n();
  const [fps, setFps] = useState(60);

  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      frames++;
      const elapsed = now - last;
      if (elapsed >= 500) {
        setFps(Math.min(120, Math.round((frames * 1000) / elapsed)));
        frames = 0;
        last = now;
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  const labels: Record<GraphicsQuality, string> =
    locale === 'tr'
      ? { low: 'Düşük', medium: 'Orta', high: 'Yüksek' }
      : {
          low: GRAPHICS_PRESETS.low.label,
          medium: GRAPHICS_PRESETS.medium.label,
          high: GRAPHICS_PRESETS.high.label,
        };

  return (
    <div
      className="paper-pill flex items-center gap-1 px-2 py-1"
      aria-label="Graphics quality"
    >
      <span
        data-testid="fps-counter"
        className="font-mono text-[10px] font-bold tabular-nums text-ink-2 pr-1 border-r border-line"
      >
        {fps} {t('fpsUnit')}
      </span>
      {LEVELS.map((lvl) => {
        const active = quality === lvl;
        return (
          <button
            key={lvl}
            type="button"
            onClick={() => {
              playClickSound();
              onChangeQuality(lvl);
            }}
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer transition-colors ${
              active
                ? 'bg-clay text-white'
                : 'text-ink-2 hover:bg-sunk hover:text-ink'
            }`}
          >
            {labels[lvl]}
          </button>
        );
      })}
    </div>
  );
};
