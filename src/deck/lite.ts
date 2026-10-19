export function initialLite(o: { query: string; reducedMotion: boolean; saveData: boolean; stored: string | null }): boolean {
  const m = /[?&]lite=([01])/.exec(o.query);
  if (m) return m[1] === '1';
  if (o.stored === '1') return true;
  if (o.stored === '0') return false;
  return o.reducedMotion || o.saveData;
}

export function shouldDowngrade(frameDeltas: number[]): boolean {
  if (frameDeltas.length < 60) return false;
  const sorted = frameDeltas.slice().sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] > 28;
}

export function watchFps(ms: number, done: (slow: boolean) => void): void {
  const deltas: number[] = [];
  let last = 0;
  const start = performance.now();
  const tick = (t: number) => {
    if (last) deltas.push(t - last);
    last = t;
    if (t - start < ms && !document.hidden) requestAnimationFrame(tick);
    else done(!document.hidden && shouldDowngrade(deltas));
  };
  requestAnimationFrame(tick);
}
