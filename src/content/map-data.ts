import type * as Maps from './maps.ts';

export let MAPS: typeof Maps | null = null;

export function loadMaps(): Promise<typeof Maps | null> {
  return import('./maps.ts').then((m) => (MAPS = m), () => null);
}
