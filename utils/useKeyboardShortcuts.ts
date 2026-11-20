import { useEffect } from 'react';
import { BUILDINGS } from '../constants';
import { BuildingType, MilestoneTier } from '../types';

const NUMBER_HOTKEYS: Record<string, BuildingType> = {
  '1': BuildingType.Road,
  '2': BuildingType.Residential,
  '3': BuildingType.Commercial,
  '4': BuildingType.Industrial,
  '5': BuildingType.Park,
  '6': BuildingType.PowerPlant,
  '7': BuildingType.FireStation,
  '8': BuildingType.Upgrade,
  '9': BuildingType.Inspect,
};

interface UseKeyboardShortcutsArgs {
  enabled: boolean;
  milestoneTier: MilestoneTier;
  onSelectTool: (tool: BuildingType) => void;
  onTogglePause: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onTogglePhotoMode: () => void;
  onEscape: () => void;
}

export const useKeyboardShortcuts = ({
  enabled,
  milestoneTier,
  onSelectTool,
  onTogglePause,
  onUndo,
  onRedo,
  onTogglePhotoMode,
  onEscape,
}: UseKeyboardShortcutsArgs) => {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }

      const mod = e.ctrlKey || e.metaKey;
      const lower = e.key.toLowerCase();

      if (mod && lower === 'z') {
        e.preventDefault();
        if (e.shiftKey) onRedo();
        else onUndo();
        return;
      }
      if (mod && lower === 'y') {
        e.preventDefault();
        onRedo();
        return;
      }
      if (mod || e.altKey) return;

      if (e.code === 'Space') {
        e.preventDefault();
        onTogglePause();
        return;
      }
      if (e.key === 'Escape') {
        onEscape();
        return;
      }
      if (lower === 'p') {
        onTogglePhotoMode();
        return;
      }
      if (lower === 'r') {
        onSelectTool(BuildingType.Road);
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace' || e.key === '0') {
        e.preventDefault();
        onSelectTool(BuildingType.Demolish);
        return;
      }

      const mapped = NUMBER_HOTKEYS[e.key];
      if (mapped) {
        const req = BUILDINGS[mapped].unlockTier ?? 0;
        if (req <= milestoneTier) {
          onSelectTool(mapped);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    enabled,
    milestoneTier,
    onSelectTool,
    onTogglePause,
    onUndo,
    onRedo,
    onTogglePhotoMode,
    onEscape,
  ]);
};
