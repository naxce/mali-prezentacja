import './s05-jihad.css';
import type { SlideDef } from '../deck/types.ts';
import { mk, q, qa, rand } from './kit.ts';
import { MAPS } from '../content/map-data.ts';
import { cite } from '../content/sources.ts';
import { img, flag } from '../content/media.ts';
import { drawPath } from '../anim/fx.ts';
import { EASE, EASE_INOUT } from '../anim/timeline.ts';

const NORTH = ['gao', 'timbuktu', 'kidal'];
const CITY = ['Timbuktu', 'Gao', 'Kidal', 'Konna', 'Mopti', 'Bamako'];
const GROUPS: Record<string, string> = { gao: 'MUJAO', timbuktu: 'Ansar Dine, AQIM', kidal: 'Ansar Dine' };

function mapSvg(): string {
  if (!MAPS) return '';
  const M = MAPS;
  const pos = (name: string) => {
    const c = M.CITIES.find((x) => x.name === name);
    return c ? M.project(c.lon, c.lat, 'mali') : [0, 0];
  };
  const [tx, ty] = pos('Timbuktu');
  const [kx, ky] = pos('Konna');
  const r = rand(11);
  const dust = Array.from({ length: 36 }, (_, i) => `<circle class="s5-p${i >= 12 ? ' heavy' : ''}" cx="${(120 + r() * 760).toFixed(0)}" cy="${(40 + r() * 380).toFixed(0)}" r="${(2 + r() * 5).toFixed(1)}"/>`).join('');
  return `<svg class="s5-map" viewBox="0 0 1000 900" role="img" aria-label="Mapa Mali: północ przechodzi spod kontroli MNLA pod kontrolę ugrupowań dżihadystycznych w 2012 roku">
  <defs><linearGradient id="s5-sand" x1="0" x2="1"><stop offset="0" stop-color="#d9b778" stop-opacity="0"/><stop offset=".5" stop-color="#d9b778" stop-opacity=".42"/><stop offset="1" stop-color="#d9b778" stop-opacity="0"/></linearGradient></defs>
  <g class="s5-regions">${M.MALI_REGIONS.map((g) => `<path d="${g.d}" class="r ${NORTH.indexOf(g.id) >= 0 ? 'north' : ''}" data-id="${g.id}"/>`).join('')}</g>
  <g class="s5-azawad">${M.MALI_REGIONS.filter((g) => NORTH.indexOf(g.id) >= 0).map((g) => `<path d="${g.d}" data-id="${g.id}"/>`).join('')}</g>
  <g class="s5-dark">${NORTH.map((id) => { const g = M.MALI_REGIONS.find((x) => x.id === id); return g ? `<path d="${g.d}" data-id="${id}"/>` : ''; }).join('')}</g>
  <g class="s5-dust">${dust}</g>
  <g class="s5-storm"><rect class="sheet a" x="-200" y="20" width="520" height="440" fill="url(#s5-sand)"/><rect class="sheet b" x="-260" y="80" width="420" height="380" fill="url(#s5-sand)"/></g>
  <path class="s5-outline" d="${M.MALI_OUTLINE}"/>
  <path class="s5-arrow" d="M${tx.toFixed(0)} ${(ty + 30).toFixed(0)} C${(tx - 30).toFixed(0)} ${(ty + 120).toFixed(0)} ${(kx + 40).toFixed(0)} ${(ky - 80).toFixed(0)} ${kx.toFixed(0)} ${(ky - 12).toFixed(0)}"/>
  <circle class="s5-strike" cx="${kx.toFixed(0)}" cy="${ky.toFixed(0)}" r="16"/><circle class="s5-strike" cx="${kx.toFixed(0)}" cy="${ky.toFixed(0)}" r="16"/>
  ${CITY.map((name) => { const [x, y] = pos(name); return `<g class="s5-city" data-c="${name}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6"/><text x="${(x + 12).toFixed(1)}" y="${(y + 6).toFixed(1)}">${name}</text></g>`; }).join('')}
  ${NORTH.map((id) => { const g = M.MALI_REGIONS.find((x) => x.id === id); if (!g) return ''; const nums = (g.d.match(/-?\d+/g) || []).map(Number); let sx = 0, sy = 0, n = 0; for (let i = 0; i + 1 < nums.length; i += 2) { sx += nums[i]; sy += nums[i + 1]; n++; } return `<text class="s5-group" data-id="${id}" x="${(sx / n - 60).toFixed(0)}" y="${(sy / n + 50).toFixed(0)}">${GROUPS[id]}</text>`; }).join('')}
</svg>`;
}

export const jihadSlide: SlideDef = {
  id: 'jihad',
  title: 'Dżihadyści przejmują północ 2012-2013',
  transition: 'drift',
  render() {
    return mk(`
<div class="slide-inner s5">
  <div class="s5-mapbox">${mapSvg()}
    <figure class="s5-banner"><img src="${flag('flag-jihadist-black')}" alt="Czarna flaga z szahadą używana przez Ansar Dine"><figcaption class="mono">Czarna flaga z szahadą (muzułmańskim wyznaniem wiary). Używają jej Ansar Dine i inne ugrupowania dżihadystyczne. Sama szahada nie jest symbolem ekstremizmu.${cite('fotw-azawad-flags')}</figcaption></figure>
  </div>
  <div class="s5-text">
    <h2 class="display h2 s5-title">Dżihadyści przejmują północ</h2>
    <p class="mono s5-range">2012-2013</p>
    <ul class="s5-list">
      <li><b>27 VI 2012</b> MUJAO wypędza MNLA z Gao. Sojusz separatystów z dżihadystami się rozpada.${cite('voa-gao-2012', 'mapping-militants-mujao')}</li>
      <li><b>Szariat</b> Timbuktu, Gao i Kidal są w rękach Ansar Dine, MUJAO i AQIM. Według HRW: chłosty, amputacje, werbowanie dzieci.${cite('mapping-militants-mujao', 'hrw-mali-islamists-2012')}</li>
      <li><b>Zabytki</b> Zniszczono 14 z 16 mauzoleów Timbuktu z listy UNESCO. W 2016 r. MTK skazał Ahmada al-Mahdiego na 9 lat za atak na 9 mauzoleów i meczet Sidi Yahia.${cite('un-news-timbuktu-2015', 'icc-al-mahdi-verdict')}</li>
      <li><b>10 I 2013</b> Ugrupowania zdobywają Konnę, bramę na południe. Władze w Bamako proszą Francję o pomoc.${cite('universalis-serval-2013')}</li>
    </ul>
    <figure class="s5-photo">${img('timbuktu-burnt-manuscript', 'Spalony rękopis z Timbuktu', '20vw')}<figcaption class="small">Ok. 4 tys. rękopisów spłonęło lub zaginęło. Mieszkańcy potajemnie wywieźli do Bamako ponad 300 tys.${cite('unesco-timbuktu-activities', 'pbs-timbuktu')}</figcaption></figure>
  </div>
</div>
<div class="fx fx-heavy" aria-hidden="true"><i class="s5-haze"></i></div>`);
  },
  enter({ el, tl, lite }) {
    tl.add(q(el, '.s5-regions'), [{ opacity: 0 }, { opacity: 1 }], { at: 0, dur: 500 });
    const outline = el.querySelector<SVGPathElement>('.s5-outline');
    if (outline) drawPath(tl, outline, 0, 900);
    qa(el, '.s5-azawad path').forEach((p, i) => tl.add(p, [{ opacity: 0 }, { opacity: 1 }], { at: 350 + i * 120, dur: 450 }));
    const order = ['gao', 'timbuktu', 'kidal'];
    order.forEach((id, i) => {
      const at = 1000 + i * 420;
      tl.add(el.querySelector(`.s5-dark path[data-id="${id}"]`), [{ opacity: 0, transform: 'translateX(-4%)' }, { opacity: 1, transform: 'none' }], { at, dur: 650, ease: EASE_INOUT });
      tl.add(el.querySelector(`.s5-group[data-id="${id}"]`), [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { at: at + 300, dur: 450 });
    });
    qa(el, '.s5-dust circle').forEach((c, i) => {
      if (lite && i >= 12) return;
      tl.add(c, [{ opacity: 0, transform: 'translate(-180px, 20px)' }, { opacity: 0.85, transform: 'translate(-40px, 6px)', offset: 0.5 }, { opacity: 0, transform: 'translate(120px, -10px)' }], { at: 850 + (i % 12) * 90, dur: 1400, ease: 'linear' });
    });
    qa(el, '.s5-storm .sheet').forEach((sh, i) => {
      if (lite && i > 0) return;
      tl.add(sh, [{ opacity: 0, transform: 'translateX(0px)' }, { opacity: 1, transform: 'translateX(500px)', offset: 0.5 }, { opacity: 0, transform: 'translateX(1100px)' }], { at: 900 + i * 260, dur: 1500, ease: 'cubic-bezier(.4,0,.6,1)' });
    });
    const arrow = el.querySelector<SVGPathElement>('.s5-arrow');
    if (arrow) drawPath(tl, arrow, 2350, 700, EASE);
    qa(el, '.s5-strike').forEach((s, i) => tl.add(s, [{ opacity: 1, transform: 'scale(.4)' }, { opacity: 0, transform: 'scale(4.5)' }], { at: 2950 + i * 220, dur: 1000, ease: 'cubic-bezier(.2,.6,.3,1)' }));
    if (!lite) tl.add(q(el, '.s5-haze'), [{ opacity: 0, transform: 'translateX(-100%)' }, { opacity: 1, transform: 'translateX(40%)', offset: 0.4 }, { opacity: 0, transform: 'translateX(190%)' }], { at: 700, dur: 2300, ease: 'cubic-bezier(.4,0,.6,1)' });
    qa(el, '.s5-city').forEach((c, i) => tl.add(c, [{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }], { at: 500 + i * 110, dur: 400 }));
    tl.add(q(el, '.s5-banner'), [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { at: 2000, dur: 700 });
    tl.add(q(el, '.s5-title'), [{ opacity: 0, transform: 'translateY(-20px)' }, { opacity: 1, transform: 'none' }], { at: 100, dur: 700 });
    tl.add(q(el, '.s5-range'), [{ opacity: 0 }, { opacity: 1 }], { at: 400, dur: 500 });
    qa(el, '.s5-list li').forEach((li, i) => tl.add(li, [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { at: 1050 + i * 420, dur: 550 }));
    tl.add(q(el, '.s5-photo'), [{ opacity: 0, transform: 'rotate(2deg) translateY(20px)' }, { opacity: 1, transform: 'none' }], { at: 2600, dur: 700 });
  }
};
