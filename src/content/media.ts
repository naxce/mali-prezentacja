import data from './media.json';

export interface MediaItem {
  key: string;
  kind: 'image' | 'video' | 'flag';
  title: string;
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
  widths?: number[];
  sepia?: boolean;
  gray?: boolean;
  ext?: string;
}

export const MEDIA = data as MediaItem[];

const BASE = `${import.meta.env.BASE_URL}media/`;
const byKey = new Map<string, MediaItem>(MEDIA.map((m) => [m.key, m]));

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export function hasMedia(key: string): boolean {
  return byKey.has(key);
}

export function img(key: string, alt: string, sizes = '100vw', variant?: 'sepia', cls = ''): string {
  const m = byKey.get(key);
  if (!m) return `<span class="img-missing" role="img" aria-label="${esc(alt)}"></span>`;
  const ws = m.widths && m.widths.length ? m.widths : [960];
  const name = variant ? `${key}-${variant}` : key;
  const set = ws.map((w) => `${BASE}img/${name}-${w}.webp ${w}w`).join(', ');
  return `<picture${cls ? ` class="${cls}"` : ''}><source type="image/webp" srcset="${set}" sizes="${sizes}"><img src="${BASE}img/${name}.jpg" alt="${esc(alt)}" decoding="async"></picture>`;
}

export function videoTag(key: string, cls = 'bg-video'): string {
  const m = byKey.get(key);
  if (!m) return '';
  return `<video class="${cls}" muted playsinline loop preload="none" aria-hidden="true" tabindex="-1" disablepictureinpicture poster="${BASE}video/${key}.jpg" data-src="${BASE}video/${key}.mp4"></video>`;
}

export function flag(key: string): string {
  const m = byKey.get(key);
  return m ? `${BASE}flag/${key}.${m.ext || 'svg'}` : '';
}
