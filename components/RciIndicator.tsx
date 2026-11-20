import React from 'react';
import { RCIDemand } from '../types';

const BARS: {
  key: keyof RCIDemand;
  label: string;
  posColor: string;
  negColor: string;
}[] = [
  { key: 'residential', label: 'R', posColor: 'bg-sage', negColor: 'bg-danger/70' },
  { key: 'commercial', label: 'C', posColor: 'bg-clay', negColor: 'bg-clay-ink/60' },
  { key: 'industrial', label: 'I', posColor: 'bg-ink', negColor: 'bg-ink-3' },
];

export const RciIndicator: React.FC<{ demand: RCIDemand }> = ({ demand }) => {
  return (
    <div
      className="flex items-end gap-1.5 px-2 py-1 rounded-md bg-sunk border border-line"
      title={`Demand — R: ${demand.residential} | C: ${demand.commercial} | I: ${demand.industrial}`}
      aria-label="RCI demand bars"
    >
      {BARS.map(({ key, label, posColor, negColor }) => {
        const val = demand[key];
        const absPct = Math.min(100, Math.abs(val)) / 2;
        const isPos = val >= 0;

        return (
          <div key={key} className="flex flex-col items-center gap-0.5">
            <div className="relative w-2 h-8 bg-raised border border-line rounded-sm overflow-hidden">
              <div className="absolute left-0 right-0 top-1/2 h-px bg-ink-3/50 z-10" />
              <div
                className={`absolute left-0 right-0 transition-all ${isPos ? posColor : negColor}`}
                style={
                  isPos
                    ? { bottom: '50%', height: `${absPct}%` }
                    : { top: '50%', height: `${absPct}%` }
                }
              />
            </div>
            <span className="text-[8px] font-mono font-bold text-ink-2 leading-none">
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
