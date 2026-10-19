import './s10-now.css';
import type { SlideDef } from '../deck/types.ts';
import { mk, q, qa } from './kit.ts';
import { MAPS } from '../content/map-data.ts';
import { cite, FACTS_DATE } from '../content/sources.ts';
import { img } from '../content/media.ts';
import { typeOut } from '../anim/fx.ts';
import { EASE } from '../anim/timeline.ts';

const EVENTS: [string, string, string][] = [
  ['14 XI 2023', 'Kidal', `Armia z Grupą Wagnera zajmuje Kidal, bastion separatystów.${cite('bnn-kidal-2023')}`],
  ['25 I 2024', '', `Junta zrywa porozumienie pokojowe z Algieru z 2015 r.${cite('africanews-algiers-end-2024')}`],
  ['VII 2024', 'Tinzaouaten', `Separatyści pokonują kolumnę armii i Wagnera. Liczby zabitych są sporne.${cite('alarabiya-wagner-2024', 'pism-tinzaouaten-2024')}`],
  ['17 IX 2024', 'Bamako', `JNIM atakuje szkołę żandarmerii i lotnisko w stolicy. AFP: 77 zabitych (sporne).${cite('voa-bamako-2024', 'ewn-bamako-2024')}`],
  ['30 XI 2024', '', `Separatyści łączą się we Front Wyzwolenia Azawadu (FLA).${cite('lesoleil-fla-2024')}`],
  ['IX-X 2025', 'Bamako', `JNIM blokuje dostawy paliwa, w Bamako brakuje prądu. Pod koniec października szkoły zamknięte na dwa tygodnie.${cite('aljazeera-fuel-2025', 'hrw-education-2025')}`],
  ['25 IV 2026', 'Gao', `Największa ofensywa od 2012 r.: JNIM i FLA atakują Kati, Bamako, Gao i Kidal. Ginie minister obrony Sadio Camara.${cite('npr-attacks-2026', 'aljazeera-camara-2026')}`],
  ['6 X 2026', 'Kidal', `Armia z rosyjskim Korpusem Afrykańskim wraca do Kidalu. FLA mówi o „tymczasowym odwrocie”.${cite('aljazeera-kidal-2026', 'cfr-sahel-tracker')}`]
];

function mapSvg(): string {
  if (!MAPS) return '';
  const M = MAPS;
  const marks = ['Kidal', 'Tinzaouaten', 'Bamako', 'Gao'];
  const bam = M.CITIES.find((x) => x.name === 'Bamako');
  const [bx, by] = bam ? M.project(bam.lon, bam.lat, 'mali') : [0, 0];
  return `<svg class="s10-map" viewBox="0 0 1000 900" aria-hidden="true">
  <path class="s10-mali" d="${M.MALI_OUTLINE}"/>
  <circle class="s10-siege" cx="${bx.toFixed(0)}" cy="${by.toFixed(0)}" r="62"/>
  ${marks.map((n) => { const c = M.CITIES.find((x) => x.name === n); if (!c) return ''; const [x, y] = M.project(c.lon, c.lat, 'mali'); return `<g class="s10-mk" data-c="${n}"><circle class="ping" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="10"/><circle class="dot" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="9"/><text x="${(x + 18).toFixed(0)}" y="${(y + 8).toFixed(0)}">${n}</text></g>`; }).join('')}
</svg>`;
}

export const nowSlide: SlideDef = {
  id: 'now',
  title: 'Nowa faza wojny 2023-2026',
  transition: 'rise',
  render() {
    return mk(`
<div class="bg s10-bg">${img('bamako-martyrs-bridge', '', '100vw')}</div>
<div class="scrim s10-scrim"></div>
<div class="slide-inner s10">
  <div class="s10-side">
    <h2 class="display h2 s10-title">Nowa faza wojny</h2>
    <p class="mono s10-range">2023-2026</p>
    ${mapSvg()}
    <p class="small s10-now">Dziś JNIM to najsilniejsze ugrupowanie zbrojne poza armią. Sojusz JNIM z FLA trwa, a blokada dróg do Bamako nie została w pełni przełamana.${cite('africacenter-2026', 'aljazeera-independence-2026')}</p>
    <p class="mono s10-date">Stan na: ${FACTS_DATE}</p>
  </div>
  <ol class="s10-line">${EVENTS.map(([d, place, t]) => `<li data-c="${place}"><time class="mono">${d}</time><p>${t}</p></li>`).join('')}</ol>
</div>`);
  },
  enter({ el, tl }) {
    tl.add(q(el, '.s10-bg'), [{ opacity: 0 }, { opacity: 1 }], { at: 0, dur: 1000 });
    tl.add(q(el, '.s10-title'), [{ opacity: 0, transform: 'translateY(40px)' }, { opacity: 1, transform: 'none' }], { at: 0, dur: 650, ease: EASE });
    tl.add(q(el, '.s10-range'), [{ opacity: 0 }, { opacity: 1 }], { at: 300, dur: 500 });
    tl.add(el.querySelector('.s10-mali'), [{ opacity: 0 }, { opacity: 1 }], { at: 200, dur: 600 });
    const items = qa(el, '.s10-line li');
    items.forEach((li, i) => {
      const at = 300 + i * 190;
      tl.add(li, [{ opacity: 0, transform: 'translateY(60px)' }, { opacity: 1, transform: 'none' }], { at, dur: 600, ease: EASE });
      const place = li.getAttribute('data-c');
      const mk = place ? el.querySelector(`.s10-mk[data-c="${place}"]`) : null;
      if (mk) {
        tl.add(mk.querySelector('.ping'), [{ opacity: 0.9, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(4)' }], { at: at + 150, dur: 800, ease: 'cubic-bezier(.2,.6,.3,1)' });
      }
    });
    qa(el, '.s10-mk').forEach((m, i) => {
      tl.add(m.querySelector('.dot'), [{ opacity: 0, transform: 'scale(0)' }, { opacity: 1, transform: 'none' }], { at: 450 + i * 120, dur: 400, ease: EASE });
      tl.add(m.querySelector('text'), [{ opacity: 0 }, { opacity: 1 }], { at: 550 + i * 120, dur: 400 });
    });
    tl.add(el.querySelector('.s10-siege'), [{ opacity: 0, transform: 'scale(3.2) rotate(-120deg)' }, { opacity: 1, transform: 'scale(.92) rotate(6deg)', offset: 0.75 }, { opacity: 1, transform: 'scale(1) rotate(0deg)' }], { at: 1250, dur: 1500, ease: EASE });
    tl.add(q(el, '.s10-now'), [{ opacity: 0 }, { opacity: 1 }], { at: 1600, dur: 600 });
    const date = q(el, '.s10-date');
    if (date.querySelector('.ch')) tl.add(date, [{ opacity: 0 }, { opacity: 1 }], { at: 1800, dur: 300 });
    else typeOut(tl, date, 1800, 22);
  }
};
