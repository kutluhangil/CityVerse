import React, { useEffect, useState } from 'react';

const COLORS = ['#d97757', '#141413', '#ebc9b7', '#4d7c5a', '#e1e1df'];

const PIECES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: ((i * 37) % 94) + 3,
  delay: (i % 7) * 45,
  width: 6 + (i % 3) * 2,
  height: 10 + (i % 4) * 2,
  color: COLORS[i % COLORS.length],
}));

const ConfettiBurst: React.FC = () => {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setDone(true), 1900);
    return () => window.clearTimeout(id);
  }, []);

  if (done) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
    >
      {PIECES.map((p) => (
        <span
          key={p.id}
          className="animate-confetti absolute top-0 block rounded-[1px] border border-ink/25"
          style={{
            left: `${p.left}%`,
            width: `${p.width}px`,
            height: `${p.height}px`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}ms`,
          }}
        />
      ))}
    </div>
  );
};

export const GoalConfetti: React.FC<{ burstKey: number }> = ({ burstKey }) => {
  if (burstKey <= 0) return null;
  return <ConfettiBurst key={burstKey} />;
};
