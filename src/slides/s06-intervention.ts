import './s06-intervention.css';
import type { SlideDef } from '../deck/types.ts';
import { mk, q, qa } from './kit.ts';
import { MAPS } from '../content/map-data.ts';
import { cite } from '../content/sources.ts';
import { img, flag } from '../content/media.ts';
import { drawPath, odometer } from '../anim/fx.ts';
import { EASE, EASE_BACK } from '../anim/timeline.ts';
import plane from '@phosphor-icons/core/assets/fill/airplane-fill.svg?raw';

const MARKERS: { id: string; lon: number; lat: number; from: string; label: string }[] = [
  { id: 'fr', lon: -3.9, lat: 15.2, from: 'translate(0px,-420px)', label: 'Serval' },
  { id: 'td', lon: 1.6, lat: 19.2, from: 'translate(520px,0px)', label: 'Czad' },
  { id: 'afisma', lon: -2.2, lat: 13.6, from: 'translate(-60px,420px)', label: 'AFISMA' },
  { id: 'un', lon: -0.1, lat: 16.3, from: 'translate(0px,-320px) scale(2)', label: 'MINUSMA' }
];

function mapSvg(): string {
  if (!MAPS) return '';
  const M = MAPS;
  const [px, py] = M.project(-7.56, 12.86, 'west');
  const [sx, sy] = M.project(MARKERS[0].lon, MARKERS[0].lat, 'west');
  return `<svg class="s6-map" viewBox="150 40 980 700" role="img" aria-label="Mapa: kierunki, z których do Mali przybyły siły międzynarodowe w 2013 roku">
  ${M.WEST_AFRICA.map((c) => `<path d="${c.d}" class="${c.id === 'MLI' ? 'mli' : ''}"/>`).join('')}
  ${MARKERS.map((m) => { const [x, y] = M.project(m.lon, m.lat, 'west'); return `<g class="s6-mk mk-${m.id}" data-from="${m.from}"><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="9"/><text x="${(x + 16).toFixed(0)}" y="${(y + 6).toFixed(0)}">${m.label}</text></g>`; }).join('')}
  <path class="s6-trail" d="M${(sx - 520).toFixed(0)} ${(sy - 460).toFixed(0)} L${sx.toFixed(0)} ${sy.toFixed(0)}"/>
  <circle class="s6-boom" cx="${sx.toFixed(0)}" cy="${sy.toFixed(0)}" r="10"/>
  <g class="s6-jet" data-from="translate(${(sx - 520).toFixed(0)}px,${(sy - 460).toFixed(0)}px) rotate(131deg)" data-to="translate(${sx.toFixed(0)}px,${sy.toFixed(0)}px) rotate(131deg)">${plane.replace('<svg ', '<svg x="-26" y="-26" width="52" height="52" ')}</g>
  <g class="s6-pin"><circle cx="${px.toFixed(0)}" cy="${py.toFixed(0)}" r="7"/><image href="${flag('flag-poland')}" x="${(px - 26).toFixed(0)}" y="${(py - 52).toFixed(0)}" width="52" height="33"/><text x="${(px + 14).toFixed(0)}" y="${(py + 26).toFixed(0)}">Koulikoro</text></g>
</svg>`;
}

export const interventionSlide: SlideDef = {
  id: 'intervention',
  title: 'Interwencja 2013',
  transition: 'push',
  render() {
    return mk(`
<div class="slide-inner s6">
  <div class="s6-left">
    <h2 class="display h2 s6-title">Interwencja</h2>
    <p class="mono s6-year">2013</p>
    <ul class="s6-list">
      <li><img src="${flag('flag-france')}" alt="Flaga Francji"><p><b>11 I 2013 Francja: operacja „Serval”</b> na prośbę władz Mali, dzień po upadku Konny. Do lutego siły francuskie i malijskie odbijają Gao, Timbuktu i Kidal.${cite('universalis-serval-2013', 'irsem-serval-2025')}</p></li>
      <li><img src="${flag('flag-chad')}" alt="Flaga Czadu"><p><b>Czad i misja afrykańska AFISMA</b> (rezolucja ONZ 2085). Czad wysyła ok. 2 000-2 500 żołnierzy, walczą w górach Adrar des Ifoghas.${cite('un-res-2085', 'aljazeera-chad-2013')}</p></li>
      <li><img src="${flag('flag-un')}" alt="Flaga ONZ"><p><b>1 VII 2013 MINUSMA</b>, misja pokojowa ONZ (rezolucja 2100), do 11 200 żołnierzy.${cite('un-news-res-2100', 'scr-res-2100')}</p></li>
      <li><img src="${flag('flag-eu')}" alt="Flaga Unii Europejskiej"><p><b>EUTM Mali</b>, unijna misja szkoleniowa w Koulikoro (2013-2024).${cite('eeas-eutm-mali', 'finland-eutm-end')}</p></li>
    </ul>
    <div class="s6-pl"><img src="${flag('flag-poland')}" alt="Flaga Polski"><p><b>Polacy w Mali:</b> Polski Kontyngent Wojskowy w EUTM, do 20 żołnierzy (II 2013 - V 2014). Szkolili kierowców, mechaników i saperów w Koulikoro, nie brali udziału w walkach.${cite('mp-2013-71', 'mp-2013-1036', 'defence24-pkw-mali-1')}</p></div>
  </div>
  <div class="s6-right">
    ${mapSvg()}
    <div class="s6-counter"><span class="stat s6-odo">311</span><p class="small">zabitych w MINUSMA (2013-2023), najniebezpieczniejszej misji pokojowej ONZ${cite('un-pk-fatalities-2024', 'un-news-minusma-danger')}</p></div>
    <div class="s6-photos">${img('serval-arrival-2013', 'Żołnierze operacji Serval po przylocie do Mali, 2013', '16vw')}${img('minusma-benin', 'Żołnierze misji ONZ MINUSMA z Beninu', '16vw')}</div>
  </div>
</div>`);
  },
  enter({ el, tl }) {
    tl.add(q(el, '.s6-title'), [{ opacity: 0, transform: 'translateX(-60px)' }, { opacity: 1, transform: 'none' }], { at: 0, dur: 650 });
    tl.add(q(el, '.s6-year'), [{ opacity: 0, transform: 'translateX(-30px)' }, { opacity: 1, transform: 'none' }], { at: 150, dur: 600 });
    tl.add(el.querySelector('.s6-map'), [{ opacity: 0 }, { opacity: 1 }], { at: 0, dur: 600 });
    const jet = el.querySelector('.s6-jet');
    if (jet) tl.add(jet, [{ opacity: 0, transform: jet.getAttribute('data-from') || 'none' }, { opacity: 1, offset: 0.12 }, { opacity: 1, offset: 0.9 }, { opacity: 0, transform: jet.getAttribute('data-to') || 'none' }], { at: 150, dur: 1050, ease: 'cubic-bezier(.3,0,.5,1)' });
    const trail = el.querySelector<SVGPathElement>('.s6-trail');
    if (trail) {
      drawPath(tl, trail, 150, 1050, 'cubic-bezier(.3,0,.5,1)');
      tl.add(trail, [{ opacity: 0.9 }, { opacity: 0 }], { at: 1300, dur: 1100 });
    }
    tl.add(el.querySelector('.s6-boom'), [{ opacity: 1, transform: 'scale(.5)' }, { opacity: 0, transform: 'scale(5)' }], { at: 1150, dur: 900, ease: 'cubic-bezier(.2,.6,.3,1)' });
    qa(el, '.s6-mk').forEach((m, i) => {
      tl.add(m, [{ opacity: 0, transform: m.getAttribute('data-from') || 'none' }, { opacity: 1, transform: 'none' }], { at: 350 + i * 260, dur: 900, ease: EASE });
      tl.add(qa(el, '.s6-list li')[i], [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { at: 500 + i * 260, dur: 550 });
    });
    tl.add(el.querySelector('.s6-pin'), [{ opacity: 0, transform: 'translateY(-160px)' }, { opacity: 1, transform: 'translateY(10px)', offset: 0.75 }, { opacity: 1, transform: 'none' }], { at: 1600, dur: 700, ease: EASE_BACK });
    tl.add(q(el, '.s6-pl'), [{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'none' }], { at: 1750, dur: 600, ease: EASE_BACK });
    const odo = q(el, '.s6-odo');
    if (!odo.classList.contains('odo')) odometer(tl, odo, 1300, 110); else tl.add(odo, [{ opacity: 0 }, { opacity: 1 }], { at: 1300, dur: 300 });
    tl.add(q(el, '.s6-counter p'), [{ opacity: 0 }, { opacity: 1 }], { at: 1500, dur: 500 });
    qa(el, '.s6-photos picture').forEach((p, i) => tl.add(p, [{ opacity: 0, transform: `translateX(${i ? 50 : -50}px)` }, { opacity: 1, transform: 'none' }], { at: 1900 + i * 150, dur: 600 }));
  }
};
