import { Grid } from '../types';

export interface CitySnapshot {
  grid: Grid;
  money: number;
}

export interface HistoryStack {
  past: CitySnapshot[];
  future: CitySnapshot[];
  maxLength: number;
}

export const cloneGrid = (grid: Grid): Grid =>
  grid.map((row) => row.map((tile) => ({ ...tile })));

export const createHistoryStack = (maxLength = 30): HistoryStack => ({
  past: [],
  future: [],
  maxLength,
});

export const pushSnapshot = (
  stack: HistoryStack,
  snapshot: CitySnapshot,
): HistoryStack => ({
  past: [
    ...stack.past,
    { grid: cloneGrid(snapshot.grid), money: snapshot.money },
  ].slice(-stack.maxLength),
  future: [],
  maxLength: stack.maxLength,
});

export const undoHistory = (
  stack: HistoryStack,
  current: CitySnapshot,
): { stack: HistoryStack; snapshot: CitySnapshot | null } => {
  if (stack.past.length === 0) return { stack, snapshot: null };
  const prev = stack.past[stack.past.length - 1];
  return {
    stack: {
      past: stack.past.slice(0, -1),
      future: [
        ...stack.future,
        { grid: cloneGrid(current.grid), money: current.money },
      ].slice(-stack.maxLength),
      maxLength: stack.maxLength,
    },
    snapshot: { grid: cloneGrid(prev.grid), money: prev.money },
  };
};

export const redoHistory = (
  stack: HistoryStack,
  current: CitySnapshot,
): { stack: HistoryStack; snapshot: CitySnapshot | null } => {
  if (stack.future.length === 0) return { stack, snapshot: null };
  const next = stack.future[stack.future.length - 1];
  return {
    stack: {
      past: [
        ...stack.past,
        { grid: cloneGrid(current.grid), money: current.money },
      ].slice(-stack.maxLength),
      future: stack.future.slice(0, -1),
      maxLength: stack.maxLength,
    },
    snapshot: { grid: cloneGrid(next.grid), money: next.money },
  };
};
