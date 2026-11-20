import React, { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  testId?: string;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  prefix = '',
  testId,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevRef = useRef(value);

  useEffect(() => {
    const start = prevRef.current;
    const target = value;
    prevRef.current = target;
    if (start === target) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let rafId = 0;
    const flashTimer = window.setTimeout(() => {
      setFlash(target > start ? 'up' : 'down');
    }, 0);
    const clearFlashTimer = window.setTimeout(() => {
      setFlash(null);
    }, 320);

    if (reducedMotion || Math.abs(target - start) < 1) {
      rafId = window.requestAnimationFrame(() => setDisplayValue(target));
    } else {
      const duration = 140;
      const startTime = performance.now();
      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, Math.max(0.35, elapsed / duration));
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(start + (target - start) * eased);
        if (elapsed < duration) {
          rafId = window.requestAnimationFrame(step);
        } else {
          setDisplayValue(target);
        }
      };
      rafId = window.requestAnimationFrame(step);
    }

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.clearTimeout(flashTimer);
      window.clearTimeout(clearFlashTimer);
    };
  }, [value]);

  const flashClass =
    flash === 'up'
      ? 'text-sage'
      : flash === 'down'
        ? 'text-danger'
        : '';

  const formatted = Math.floor(displayValue);
  const sign = formatted < 0 ? '-' : '';
  const absFormatted = Math.abs(formatted).toLocaleString();

  return (
    <span
      data-testid={testId}
      className={`tabular-nums transition-colors duration-200 ${className} ${flashClass}`}
    >
      {sign}
      {prefix}
      {absFormatted}
    </span>
  );
};
