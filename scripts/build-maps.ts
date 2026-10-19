import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type Ring = number[][];
interface Feature { properties: Record<string, unknown>; geometry: { type: string; coordinates: unknown } }

const CACHE = '.cache/ne';
const BASE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/';

const VIEWS = {
  africa: { lon: [-18.5, 52.5], lat: [-35.5, 38.5], w: 1000, h: 1000 },
  west: { lon: [-18.5, 25], lat: [3.5, 27.5], w: 1600, h: 900 },
  mali: { lon: [-12.6, 4.6], lat: [9.9, 25.3], w: 1000, h: 900 }
} as const;
type View = keyof typeof VIEWS;

async function get(name: string): Promise<{ features: Feature[] }> {
  mkdirSync(CACHE, { recursive: true });
  const p = join(CACHE, name);
  if (!existsSync(p)) {
    const r = await fetch(BASE + name, { headers: { 'user-agent': 'mali-prezentacja build' } });
    if (!r.ok) throw new Error(`download ${name}: ${r.status}`);
    writeFileSync(p, Buffer.from(await r.arrayBuffer()));
  }
  return JSON.parse(readFileSync(p, 'utf8'));
}

function fit(v: View) {
  const c = VIEWS[v];
  const lat0 = ((c.lat[0] + c.lat[1]) / 2) * Math.PI / 180;
  const cos = Math.cos(lat0);
  const gw = (c.lon[1] - c.lon[0]) * cos;
  const gh = c.lat[1] - c.lat[0];
  const k = Math.min(c.w / gw, c.h / gh);
  const ox = (c.w - gw * k) / 2;
  const oy = (c.h - gh * k) / 2;
  return { lon0: c.lon[0], lat1: c.lat[1], cos: +cos.toFixed(6), k: +k.toFixed(4), ox: +ox.toFixed(2), oy: +oy.toFixed(2) };
}

const FITS = { africa: fit('africa'), west: fit('west'), mali: fit('mali') };

function project(lon: number, lat: number, v: View): [number, number] {
  const f = FITS[v];
  return [(lon - f.lon0) * f.cos * f.k + f.ox, (f.lat1 - lat) * f.k + f.oy];
}

function rings(g: Feature['geometry']): Ring[] {
  if (g.type === 'Polygon') return g.coordinates as Ring[];
  if (g.type === 'MultiPolygon') return (g.coordinates as Ring[][]).flat();
  return [];
}

function pathFor(g: Feature['geometry'], v: View, tol: number): string {
  let d = '';
  for (const ring of rings(g)) {
    const pts: [number, number][] = [];
    const c = VIEWS[v];
    for (const [lon, lat] of ring) {
      const [px, py] = project(lon, lat, v);
      const x = Math.min(Math.max(px, -40), c.w + 40);
      const y = Math.min(Math.max(py, -40), c.h + 40);
      const last = pts[pts.length - 1];
      if (!last || Math.hypot(x - last[0], y - last[1]) >= tol) pts.push([x, y]);
    }
    if (pts.length < 4) continue;
    d += 'M' + pts.map(([x, y]) => `${Math.round(x)} ${Math.round(y)}`).join('L') + 'Z';
  }
  return d;
}

function bboxHits(g: Feature['geometry'], v: View): boolean {
  const c = VIEWS[v];
  for (const ring of rings(g)) for (const [lon, lat] of ring) if (lon >= c.lon[0] && lon <= c.lon[1] && lat >= c.lat[0] && lat <= c.lat[1]) return true;
  return false;
}

const CITIES = [
  ['Bamako', -8.0029, 12.6392], ['Timbuktu', -3.0074, 16.7735], ['Gao', -0.0442, 16.2666], ['Kidal', 1.4078, 18.4411],
  ['Mopti', -4.1979, 14.4843], ['Konna', -3.8937, 14.9425], ['Ménaka', 2.4025, 15.9182], ['Aguelhok', 0.8594, 19.4614],
  ['Tinzaouaten', 2.9833, 19.95], ['Koulikoro', -7.5596, 12.8627], ['Ségou', -6.2659, 13.4317], ['Niamey', 2.1254, 13.5116],
  ['Wagadugu', -1.5197, 12.3714], ['Nawakszut', -15.9785, 18.0735], ['Dakar', -17.4677, 14.7167], ['Konakry', -13.578, 9.6412]
] as const;

const countries = await get('ne_50m_admin_0_countries.geojson');
const admin1 = await get('ne_10m_admin_1_states_provinces.geojson');

const id = (p: Record<string, unknown>) => String(p.ADM0_A3 || p.adm0_a3 || p.ISO_A3 || '').toUpperCase();

const africa = countries.features
  .filter((f) => f.properties.CONTINENT === 'Africa')
  .map((f) => ({ id: id(f.properties), d: pathFor(f.geometry, 'africa', 5) }))
  .filter((x) => x.d);

const west = countries.features
  .filter((f) => bboxHits(f.geometry, 'west') && ['EGY', 'SDN', 'SDS', 'COD', 'COG', 'GNQ'].indexOf(id(f.properties)) < 0)
  .map((f) => ({ id: id(f.properties), d: pathFor(f.geometry, 'west', 4.5) }))
  .filter((x) => x.d);

const mali = admin1.features
  .filter((f) => String(f.properties.adm0_a3) === 'MLI')
  .map((f) => ({ id: String(f.properties.name || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]+/g, '-'), name: String(f.properties.name || ''), d: pathFor(f.geometry, 'mali', 3) }))
  .filter((x) => x.d);

const maliOutline = countries.features.filter((f) => id(f.properties) === 'MLI').map((f) => pathFor(f.geometry, 'mali', 2))[0] || '';

const out = `export type MapView = 'africa' | 'west' | 'mali';

export const MAP_SIZE: Record<MapView, [number, number]> = { africa: [${VIEWS.africa.w}, ${VIEWS.africa.h}], west: [${VIEWS.west.w}, ${VIEWS.west.h}], mali: [${VIEWS.mali.w}, ${VIEWS.mali.h}] };

const FITS: Record<MapView, { lon0: number; lat1: number; cos: number; k: number; ox: number; oy: number }> = ${JSON.stringify(FITS)};

export function project(lon: number, lat: number, view: MapView): [number, number] {
  const f = FITS[view];
  return [Math.round(((lon - f.lon0) * f.cos * f.k + f.ox) * 10) / 10, Math.round(((f.lat1 - lat) * f.k + f.oy) * 10) / 10];
}

export const AFRICA: { id: string; d: string }[] = ${JSON.stringify(africa)};

export const WEST_AFRICA: { id: string; d: string }[] = ${JSON.stringify(west)};

export const MALI_OUTLINE = ${JSON.stringify(maliOutline)};

export const MALI_REGIONS: { id: string; name: string; d: string }[] = ${JSON.stringify(mali)};

export const CITIES: { name: string; lon: number; lat: number }[] = ${JSON.stringify(CITIES.map(([name, lon, lat]) => ({ name, lon, lat })))};
`;
writeFileSync('src/content/maps.ts', out);
console.log(`africa=${africa.length} west=${west.length} mali=${mali.length} bytes=${out.length}`);
console.log('mali regions:', mali.map((m) => m.name).join(', '));
console.log('west ids:', west.map((w) => w.id).join(' '));
