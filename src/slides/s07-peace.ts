import './s07-peace.css';
import type { SlideDef } from '../deck/types.ts';
import { mk, q, qa, rand } from './kit.ts';
import { MAPS } from '../content/map-data.ts';
import { cite } from '../content/sources.ts';
import { img } from '../content/media.ts';
import { drawPath, stamp } from '../anim/fx.ts';
import { EASE } from '../anim/timeline.ts';

const HOT: [number, number][] = [[-3.6, 14.3], [-4.2, 14.5], [-3.3, 14.9], [-4.9, 14.0], [-6.2, 13.4], [-2.9, 14.1], [-1.5, 15.3], [0.0, 16.3], [2.4, 15.9], [-3.0, 16.7], [-1.0, 14.6], [-5.5, 13.8]];

function mapSvg(): string {
  if (!MAPS) return '';
  const M = MAPS;
  const r = rand(5);
  return `<svg class="s7-map" viewBox="0 0 1000 900" aria-hidden="true">
  ${M.MALI_REGIONS.map((g) => `<path d="${g.d}" class="${g.id === 'mopti' || g.id === 'segou' ? 'hot' : ''}"/>`).join('')}
  ${HOT.map(([lon, lat], i) => { const [x, y] = M.project(lon + (r() - 0.5) * 0.4, lat + (r() - 0.5) * 0.3, 'mali'); return `<g class="s7-dot" style="--d:${i}"><circle class="core" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="7"/><circle class="ring" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="7"/></g>`; }).join('')}
</svg>`;
}

export const peaceSlide: SlideDef = {
  id: 'peace',
  title: 'Walki mimo porozumienia 2015-2019',
  transition: 'fold',
  render() {
    return mk(`
<div class="bg s7-bg">${img('bandiagara-cliffs', '', '100vw')}</div>
<div class="scrim s7-scrim"></div>
<div class="slide-inner s7">
  <div class="s7-mapbox">${mapSvg()}</div>
  <div class="s7-doc">
    <p class="mono s7-doc-kicker">Bamako, 15 V i 20 VI 2015</p>
    <h3 class="s7-doc-title">Porozumienie z Algieru</h3>
    <p class="s7-doc-body">Wynegocjowane w Algierze, podpisane w Bamako. Decentralizacja kraju i włączenie byłych rebeliantów do armii. Wdrażano je bardzo powoli.${cite('undispatch-algiers-2015', 'wiki-algiers-accords')}</p>
    <div class="s7-sigs"><span>Rząd Mali</span><span>Platforma</span><span>CMA</span></div>
    <i class="s7-flash" aria-hidden="true"></i>
    <svg class="s7-cracks" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true"><path d="M210 0 L196 60 L224 98 L188 150 L214 205 L192 300"/><path d="M196 60 L140 84 L96 78"/><path d="M188 150 L262 176 L330 168"/><path d="M214 205 L160 238"/></svg>
  </div>
  <div class="s7-text">
    <h2 class="display h2 s7-title">Walki mimo porozumienia</h2>
    <p class="mono s7-range">2015-2019</p>
    <ul class="s7-list">
      <li><b>2017 JNIM</b> Ansar Dine, Katiba Macina, al-Murabitun i część AQIM łączą się w JNIM, gałąź Al-Kaidy. Przywódca: Iyad Ag Ghaly.${cite('csis-jnim', 'aa-jnim-explainer')}</li>
      <li><b>IS Sahel</b> Konkurencyjna grupa Państwa Islamskiego, aktywna wokół Ménaki. Walczy także z JNIM.${cite('csis-isgs', 'africacenter-2026')}</li>
      <li><b>Środek kraju</b> Przemoc przenosi się do regionu Mopti. Konflikty Fulanów z Dogonami i Bambara, milicje myśliwych dozo.${cite('defensepost-ogossagou-2019', 'hrw-segou-2025')}</li>
      <li><b>23 III 2019 Ogossagou</b> Według MINUSMA co najmniej 157 zabitych w fulańskiej wsi. Atak przypisano milicji dozo.${cite('defensepost-ogossagou-2019', 'gulfnews-ogossagou-2019')}</li>
      <li><b>Barkhane i G5 Sahel</b> Od 2014 r. francuska operacja regionalna (ok. 5 500 żołnierzy) i forum pięciu państw Sahelu.${cite('ahram-barkhane-end-2022', 'wiki-g5-sahel')}</li>
      <li><b>Liptako-Gourma</b> Wojna rozlewa się na Burkinę Faso i Niger. Według CFR to dziś region z ponad połową ofiar terroryzmu na świecie.${cite('cfr-sahel-tracker')}</li>
    </ul>
  </div>
</div>`);
  },
  enter({ el, tl }) {
    tl.add(q(el, '.s7-bg'), [{ opacity: 0 }, { opacity: 1 }], { at: 0, dur: 1200 });
    tl.add(q(el, '.s7-doc'), [
      { opacity: 0, transform: 'translate(-30%, 12%) rotate(-14deg)', easing: EASE },
      { opacity: 1, transform: 'rotate(-2deg)', offset: 0.45 },
      { opacity: 1, transform: 'rotate(-2deg)', offset: 0.725 },
      { opacity: 1, transform: 'translate(-7px, 3px) rotate(-3.4deg)', offset: 0.745 },
      { opacity: 1, transform: 'translate(6px, -2px) rotate(-0.6deg)', offset: 0.77 },
      { opacity: 1, transform: 'translate(-4px, 1px) rotate(-2.8deg)', offset: 0.8 },
      { opacity: 1, transform: 'translate(2px, 0px) rotate(-1.5deg)', offset: 0.84 },
      { opacity: 1, transform: 'rotate(-2deg)' }
    ], { at: 100, dur: 2000, ease: 'linear' });
    tl.add(q(el, '.s7-flash'), [{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 0 }], { at: 1550, dur: 700, ease: 'linear' });
    tl.add(q(el, '.s7-doc-kicker'), [{ opacity: 0 }, { opacity: 1 }], { at: 500, dur: 400 });
    tl.add(q(el, '.s7-doc-title'), [{ opacity: 0 }, { opacity: 1 }], { at: 550, dur: 400 });
    tl.add(q(el, '.s7-doc-body'), [{ opacity: 0 }, { opacity: 1 }], { at: 600, dur: 400 });
    qa(el, '.s7-sigs span').forEach((s, i) => stamp(tl, s, 850 + i * 200, i % 2 ? 9 : -9));
    qa<SVGPathElement>(el, '.s7-cracks path').forEach((p, i) => drawPath(tl, p, 1550 + i * 120, 500));
    tl.add(el.querySelector('.s7-map'), [{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { at: 900, dur: 700 });
    qa(el, '.s7-dot').forEach((d, i) => {
      tl.add(d.querySelector('.core'), [{ opacity: 0, transform: 'scale(0)' }, { opacity: 1, transform: 'none' }], { at: 1500 + i * 70, dur: 300, ease: EASE });
      tl.add(d.querySelector('.ring'), [{ opacity: 0.9, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(4)' }], { at: 1500 + i * 70, dur: 900, ease: 'cubic-bezier(.2,.6,.3,1)' });
    });
    tl.add(q(el, '.s7-title'), [{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }], { at: 200, dur: 700 });
    tl.add(q(el, '.s7-range'), [{ opacity: 0 }, { opacity: 1 }], { at: 450, dur: 500 });
    qa(el, '.s7-list li').forEach((li, i) => tl.add(li, [{ opacity: 0, transform: 'translateX(30px)' }, { opacity: 1, transform: 'none' }], { at: 700 + i * 170, dur: 550 }));
  }
};
