import './s03-roots.css';
import type { SlideDef } from '../deck/types.ts';
import { mk, q, qa } from './kit.ts';
import { MAPS } from '../content/map-data.ts';
import { cite } from '../content/sources.ts';
import { img } from '../content/media.ts';
import { drawPath, stamp } from '../anim/fx.ts';
import { EASE } from '../anim/timeline.ts';

const EVENTS: [string, string][] = [
  ['1960', `22 IX: niepodległa Republika Mali, pierwszy prezydent Modibo Keïta${cite('apa-22-sept-1960', 'cvce-mali-federation')}`],
  ['1963', `Pierwsze powstanie Tuaregów w regionie Kidal, stłumione siłą. Kolejne: 1990-1996 i 2006-2009${cite('clingendael-roots-2015', 'ufl-ba-tuareg-nationalism')}`],
  ['1968', `Zamach stanu. Moussa Traoré rządzi przez 22 lata${cite('africanews-traore-2020')}`],
  ['1973', `Wielkie susze zabijają stada. Młodzi Tuaregowie emigrują do Libii i Algierii${cite('culturalsurvival-tuareg', 'climate-diplomacy-tuareg')}`],
  ['1991', `Obalenie Traorégo. Od 1992 r. wybory i system wielopartyjny${cite('wiki-1991-coup', 'wiki-1992-election')}`],
  ['2007', `Algierska GSPC zmienia nazwę na Al-Kaida Islamskiego Maghrebu (AQIM)${cite('csis-aqim')}`],
  ['2011', `Upadek Kaddafiego: uzbrojeni bojownicy wracają z Libii, w październiku powstaje MNLA${cite('ecfr-mnla')}`]
];

const PHOTOS: [string, string][] = [
  ['era-mopti-1972', 'Mopti, 1972'],
  ['era-tuareg-camp-1993', 'Obóz Tuaregów, 1993'],
  ['era-mbera-1996', 'Uchodźcy z Mali w obozie M’bera, Mauretania, 1996']
];

function miniMap(): string {
  if (!MAPS) return '';
  const keep = ['MLI', 'LBY', 'DZA', 'NER', 'MRT', 'TCD', 'BFA', 'TUN', 'EGY', 'MAR', 'SAH', 'SDN', 'NGA', 'SEN', 'GIN', 'CIV'];
  const [x0, y0] = MAPS.project(-13, 34, 'africa');
  const [x1, y1] = MAPS.project(26, 9, 'africa');
  const [lx, ly] = MAPS.project(14.5, 27.5, 'africa');
  const [kx, ky] = MAPS.project(1.4, 18.4, 'africa');
  const mx = (lx + kx) / 2;
  const my = Math.min(ly, ky) - 40;
  return `<svg class="s3-map" viewBox="${x0.toFixed(0)} ${y0.toFixed(0)} ${(x1 - x0).toFixed(0)} ${(y1 - y0).toFixed(0)}" role="img" aria-label="Mapa: droga bojowników i broni z Libii do północnego Mali">
  ${MAPS.AFRICA.filter((c) => keep.indexOf(c.id) >= 0).map((c) => `<path d="${c.d}" class="c ${c.id === 'MLI' ? 'mli' : c.id === 'LBY' ? 'lby' : ''}"/>`).join('')}
  <path class="s3-arrow" d="M${lx.toFixed(1)} ${ly.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${kx.toFixed(1)} ${ky.toFixed(1)}"/>
  <circle class="s3-dot" cx="${kx.toFixed(1)}" cy="${ky.toFixed(1)}" r="5"/>
  <text class="s3-t" x="${(lx - 18).toFixed(1)}" y="${(ly + 22).toFixed(1)}">LIBIA</text>
  <text class="s3-t" x="${(kx - 46).toFixed(1)}" y="${(ky + 26).toFixed(1)}">MALI</text>
</svg>`;
}

export const rootsSlide: SlideDef = {
  id: 'roots',
  title: 'Korzenie konfliktu 1960-2011',
  transition: 'pan',
  render() {
    return mk(`
<div class="slide-inner s3">
  <header class="s3-head"><h2 class="display h2">Korzenie konfliktu</h2><p class="mono s3-range">1960-2011</p></header>
  <div class="s3-line" aria-hidden="true"><i></i><b class="s3-spark"><em></em></b></div>
  <ol class="s3-events">${EVENTS.map(([y, t]) => `<li><b class="s3-year">${y}</b><p>${t}</p></li>`).join('')}</ol>
  <div class="s3-bottom">
    <div class="s3-photos">${PHOTOS.map(([k, c]) => `<figure><div class="s3-frame">${img(k, c, '22vw')}<div class="s3-sepia">${img(k, '', '22vw', 'sepia')}</div></div><figcaption class="mono">${c}</figcaption></figure>`).join('')}</div>
    <div class="s3-libya">${miniMap()}<p class="body s3-cap">Na północ Mali trafiają broń z libijskich arsenałów i doświadczeni bojownicy. Państwo ma tam niewielu żołnierzy i urzędników${cite('ecfr-mnla', 'mapping-militants-mnla', 'clingendael-roots-2015')}</p></div>
  </div>
</div>`);
  },
  enter({ el, tl }) {
    tl.add(q(el, '.s3-head h2'), [{ opacity: 0, transform: 'translateY(-24px)' }, { opacity: 1, transform: 'none' }], { at: 0, dur: 600 });
    tl.add(q(el, '.s3-range'), [{ opacity: 0, letterSpacing: '0.6em' }, { opacity: 1, letterSpacing: '0.02em' }], { at: 200, dur: 900 });
    tl.add(q(el, '.s3-line i'), [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { at: 200, dur: 1300, ease: 'cubic-bezier(.45,0,.2,1)' });
    tl.add(q(el, '.s3-spark'), [{ transform: 'translateX(-100%)' }, { transform: 'translateX(0%)' }], { at: 200, dur: 1300, ease: 'cubic-bezier(.45,0,.2,1)' });
    tl.add(q(el, '.s3-spark em'), [{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'scale(1)', offset: 0.1 }, { opacity: 1, transform: 'scale(1)', offset: 0.75 }, { opacity: 0, transform: 'scale(2.6)' }], { at: 200, dur: 1700, ease: 'linear' });
    qa(el, '.s3-events li').forEach((li, i) => {
      stamp(tl, q(li, '.s3-year'), 350 + i * 170, i % 2 ? 7 : -7);
      tl.add(q(li, 'p'), [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { at: 520 + i * 170, dur: 500 });
    });
    qa(el, '.s3-photos figure').forEach((f, i) => {
      tl.add(q(f, '.s3-frame'), [{ opacity: 0, transform: 'translateY(40px) rotate(-1.5deg)' }, { opacity: 1, transform: 'none' }], { at: 700 + i * 160, dur: 700, ease: EASE });
      tl.add(q(f, '.s3-sepia'), [{ opacity: 1 }, { opacity: 1, offset: 0.3 }, { opacity: 0 }], { at: 700 + i * 160, dur: 1700 });
      tl.add(q(f, 'figcaption'), [{ opacity: 0 }, { opacity: 1 }], { at: 1200 + i * 160, dur: 400 });
    });
    tl.add(el.querySelector('.s3-map'), [{ opacity: 0 }, { opacity: 1 }], { at: 900, dur: 500 });
    tl.add(el.querySelector('.s3-map .lby'), [{ opacity: 0.2 }, { opacity: 1 }], { at: 1200, dur: 500 });
    const arrow = el.querySelector<SVGPathElement>('.s3-arrow');
    if (arrow) drawPath(tl, arrow, 1350, 900);
    tl.add(el.querySelector('.s3-dot'), [{ opacity: 0, transform: 'scale(3)' }, { opacity: 1, transform: 'none' }], { at: 2150, dur: 350, ease: EASE });
    tl.add(q(el, '.s3-cap'), [{ opacity: 0, transform: 'translateX(20px)' }, { opacity: 1, transform: 'none' }], { at: 1600, dur: 600 });
  }
};
