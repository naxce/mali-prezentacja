export function parseHash(hash: string, count: number): { index: number; src: number | null } {
  const m = /^#\/(\d+)(?:\/s(\d+))?$/.exec(hash);
  if (!m) return { index: 0, src: null };
  const index = Math.min(Math.max(parseInt(m[1], 10) - 1, 0), count - 1);
  return { index, src: m[2] ? parseInt(m[2], 10) : null };
}

export function formatHash(index: number, src?: number): string {
  return `#/${index + 1}${src ? `/s${src}` : ''}`;
}
