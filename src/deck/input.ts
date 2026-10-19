import type { Action } from './types.ts';

const KEYS: Record<string, Action> = {
  ArrowRight: 'next', ArrowDown: 'next', ' ': 'next', Spacebar: 'next', PageDown: 'next',
  ArrowLeft: 'prev', ArrowUp: 'prev', PageUp: 'prev',
  Home: 'first', End: 'last',
  f: 'fullscreen', F: 'fullscreen',
  l: 'lite', L: 'lite',
  Escape: 'escape', Esc: 'escape'
};

export function keyToAction(e: { key: string; repeat: boolean; ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean }): Action | null {
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return null;
  return KEYS[e.key] || null;
}

export function swipeToAction(dx: number, dy: number, ms: number): 'next' | 'prev' | null {
  if (ms > 800 || Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return null;
  return dx < 0 ? 'next' : 'prev';
}
