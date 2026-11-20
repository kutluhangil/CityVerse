import React from 'react';
import { Html } from '@react-three/drei';
import { FloatingTextEvent } from '../../types';
import { gridToWorld } from '../shared';

export const FloatingIncome: React.FC<{
  events: FloatingTextEvent[];
  gridSize?: number;
}> = ({ events, gridSize }) => {
  if (events.length === 0) return null;

  return (
    <group raycast={() => null}>
      {events.map((ev) => {
        const [wx, _wy, wz] = gridToWorld(ev.x, ev.y, gridSize);
        return (
          <Html
            key={ev.id}
            position={[wx, 1.45, wz]}
            center
            style={{ pointerEvents: 'none' }}
          >
            <div
              className="animate-float-up px-2 py-0.5 rounded border text-[11px] font-mono font-bold whitespace-nowrap"
              style={{
                backgroundColor: '#ffffff',
                borderColor: '#141413',
                color: ev.positive ? '#4d7c5a' : '#c44536',
                boxShadow: '2px 2px 0 #141413',
              }}
            >
              {ev.text}
            </div>
          </Html>
        );
      })}
    </group>
  );
};
