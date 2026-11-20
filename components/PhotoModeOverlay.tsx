import React from 'react';
import { Camera, RotateCcw, RotateCw } from 'lucide-react';
import { playClickSound } from '../utils/audio';
import { useI18n } from '../utils/i18n';

interface PhotoModeOverlayProps {
  onRotate: (dir: -1 | 1) => void;
  onExit: () => void;
}

export const PhotoModeOverlay: React.FC<PhotoModeOverlayProps> = ({
  onRotate,
  onExit,
}) => {
  const { t } = useI18n();

  return (
    <>
      <div className="tilt-shift-mask fixed inset-0 z-20" />
      <div className="tilt-shift-edge-top fixed top-0 left-0 right-0 h-20 z-20" />
      <div className="tilt-shift-edge-bottom fixed bottom-0 left-0 right-0 h-20 z-20" />
      <div className="paper-pill fixed bottom-5 right-5 z-30 flex items-center gap-1.5 px-3 py-1.5">
        <button
          type="button"
          onClick={() => onRotate(-1)}
          aria-label="Rotate camera left"
          className="p-1.5 rounded hover:bg-sunk text-ink cursor-pointer"
        >
          <RotateCcw size={14} />
        </button>
        <button
          type="button"
          onClick={() => onRotate(1)}
          aria-label="Rotate camera right"
          className="p-1.5 rounded hover:bg-sunk text-ink cursor-pointer"
        >
          <RotateCw size={14} />
        </button>
        <button
          type="button"
          onClick={() => {
            playClickSound();
            onExit();
          }}
          aria-label="Exit Photo Mode"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-clay text-white font-mono text-[10px] font-bold uppercase tracking-wider cursor-pointer"
        >
          <Camera size={12} />
          {t('exitPhotoMode')}
        </button>
      </div>
    </>
  );
};
