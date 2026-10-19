import './s08-coups.css';
import type { SlideDef } from '../deck/types.ts';
import { mk, q, qa, pathBox } from './kit.ts';
import { MAPS } from '../content/map-data.ts';
import { cite } from '../content/sources.ts';
import { img } from '../content/media.ts';
import { flipBoard } from '../anim/fx.ts';
import { EASE } from '../anim/timeline.ts';

const COUPS: [string, string, string][] = [
  ['MLI', '18.08.2020', 'Mali'],
  ['TCD', '20.04.2021', 'Czad'],
  ['MLI', '24.05.2021', 'Mali'],
  ['GIN', '05.09.2021', 'Gwinea'],
  ['BFA', '24.01.2022', 'Burkina Faso'],
  ['BFA', '30.09.2022', 'Burkina Faso'],
  ['NER', '26.07.2023', 'Niger']
];

function mapSvg(): string {
  if (!MAPS) return '';
  const ids = ['MLI', 'TCD', 'GIN', 'BFA', 'NER'];
  return `<svg class="s8-map" viewBox="0 60 1600 800" role="img" aria-label="Mapa Afryki Zachodniej: państwa, w których doszło do zamachów stanu w latach 2020-2023">
  ${MAPS.WEST_AFRICA.map((c) => `<path d="${c.d}" class="${ids.indexOf(c.id) >= 0 ? 'coup' : ''}" data-id="${c.id}"/>`).join('')}
  ${ids.map((id) => { const c = MAPS!.WEST_AFRICA.find((x) => x.id === id); if (!c) return ''; const b = pathBox(c.d); return `<circle class="s8-pulse" data-id="${id}" cx="${b.cx.toFixed(0)}" cy="${b.cy.toFixed(0)}" r="26"/>`; }).join('')}
</svg>`;
}

export const coupsSlide: SlideDef = {
  id: 'coups',
  title: 'Zamachy stanu 2020-2023',
  transition: 'flip',
  render() {
    return mk(`
<div class="slide-inner s8">
  <div class="s8-top">
    <h2 class="display h2 s8-title">Zamachy stanu</h2>
    <p class="lede s8-lede">Junty tłumaczą przejęcie władzy nieskutecznością rządów cywilnych w walce z dżihadystami. Krytycy, m.in. ECOWAS, wytykają im zwlekanie z oddaniem władzy cywilom.${cite('aljazeera-coup-belt-2024', 'hrw-wr-2026')}</p>
  </div>
  <div class="s8-mid">
    ${mapSvg()}
    <ol class="s8-board">${COUPS.map(([id, d, n]) => `<li data-id="${id}"><i class="s8-wipe" aria-hidden="true"></i><span class="mono s8-date">${d}</span><span class="s8-name">${n}</span></li>`).join('')}</ol>
  </div>
  <div class="s8-goita">
    ${img('goita-portrait', 'Assimi Goïta', '12vw')}
    <p class="body"><strong>Assimi Goïta</strong> obala prezydenta Keïtę (2020), potem rząd przejściowy (2021). Ustawa z 2025 r. daje mu 5-letnią kadencję, odnawialną bez wyborów.${cite('aljazeera-coup-belt-2024', 'hrw-wr-2026')}</p>
  </div>
</div>`);
  },
  enter({ el, tl }) {
    tl.add(q(el, '.s8-title'), [{ opacity: 0, transform: 'perspective(600px) rotateX(-80deg)' }, { opacity: 1, transform: 'none' }], { at: 0, dur: 700, ease: EASE });
    tl.add(q(el, '.s8-lede'), [{ opacity: 0 }, { opacity: 1 }], { at: 300, dur: 700 });
    tl.add(el.querySelector('.s8-map'), [{ opacity: 0 }, { opacity: 1 }], { at: 100, dur: 600 });
    const seen: Record<string, boolean> = {};
    qa(el, '.s8-board li').forEach((li, i) => {
      const at = 450 + i * 230;
      const id = li.getAttribute('data-id') || '';
      const date = q(li, '.s8-date');
      tl.add(q(li, '.s8-wipe'), [{ opacity: 0.95, transform: 'translateX(-101%)' }, { opacity: 0.95, transform: 'translateX(0%)', offset: 0.42 }, { opacity: 0, transform: 'translateX(101%)' }], { at: at - 80, dur: 760, ease: 'cubic-bezier(.65,0,.35,1)' });
      if (!date.querySelector('.ch')) flipBoard(tl, date, at, 30); else tl.add(date, [{ opacity: 0 }, { opacity: 1 }], { at, dur: 300 });
      tl.add(q(li, '.s8-name'), [{ opacity: 0, transform: 'translateX(-14px)' }, { opacity: 1, transform: 'none' }], { at: at + 200, dur: 400 });
      if (!seen[id]) {
        seen[id] = true;
        tl.add(el.querySelector(`.s8-map path[data-id="${id}"]`), [{ fill: '#232a38' }, { fill: '#c4532c' }], { at: at + 100, dur: 400 });
      }
      tl.add(el.querySelector(`.s8-pulse[data-id="${id}"]`), [{ opacity: 0.9, transform: 'scale(.3)' }, { opacity: 0, transform: 'scale(2.6)' }], { at: at + 100, dur: 900, ease: 'cubic-bezier(.2,.6,.3,1)' });
    });
    tl.add(q(el, '.s8-goita picture'), [{ opacity: 0, transform: 'scale(1.15)' }, { opacity: 1, transform: 'none' }], { at: 1900, dur: 700 });
    tl.add(q(el, '.s8-goita p'), [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { at: 2050, dur: 550 });
  }
};
