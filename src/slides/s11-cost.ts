import './s11-cost.css';
import type { SlideDef } from '../deck/types.ts';
import { mk, q, qa } from './kit.ts';
import { cite } from '../content/sources.ts';
import { img, videoTag } from '../content/media.ts';
import { odometer } from '../anim/fx.ts';
import { EASE } from '../anim/timeline.ts';

const STATS: [string, string, string][] = [
  ['3 435', 'zabitych w atakach bojowników w I-VII 2026 r., o 35% więcej niż w tym samym okresie 2024 r. (ACLED)', cite('ap-acled-2026')],
  ['400 000', 'osób przesiedlonych wewnątrz kraju (UNHCR, 2026)', cite('unhcr-mali-jan-2026', 'aljazeera-independence-2026')],
  ['335 905', 'uchodźców z Mali za granicą, liczby różnią się zależnie od metody (UNHCR)', cite('unhcr-mali-jan-2026', 'unhcr-mauritania')],
  ['2 444', 'zamkniętych szkół, ponad 733 tys. dzieci bez lekcji (UNICEF)', cite('allafrica-schools-2026')]
];

export const costSlide: SlideDef = {
  id: 'cost',
  title: 'Koszt ludzki',
  transition: 'sink',
  render() {
    return mk(`
<div class="slide-inner s11">
  <div class="s11-head">
    <h2 class="display h2 s11-title">Koszt ludzki</h2>
    <p class="lede s11-lede"><strong>5,1 mln</strong> ludzi potrzebuje pomocy humanitarnej (ONZ, 2026).${cite('ocha-hnrp-2026', 'apa-hnrp-2026')}</p>
  </div>
  <div class="s11-stats">${STATS.map(([v, t, c]) => `<div><p class="stat"><span class="s11-odo">${v}</span></p><p class="small">${t}${c}</p></div>`).join('')}</div>
  <div class="s11-grid-wrap">
    <div class="s11-grid" role="img" aria-label="40 ikon, każda oznacza 10 tysięcy przesiedlonych osób">${Array.from({ length: 40 }, () => '<i></i>').join('')}</div>
    <p class="small s11-key">1 kropka = 10 000 przesiedlonych</p>
  </div>
  <div class="s11-abuse">
    <p class="body"><strong>Cywile giną z rąk wszystkich stron.</strong> Według ACLED w 2025 r. armia i rosyjscy najemnicy zabili 925 cywilów, a JNIM i inne ugrupowania co najmniej 232. Władze Mali odrzucają te oskarżenia, a liczby są prawdopodobnie zaniżone (sporne).${cite('independent-acled-2026', 'africacenter-2026')}</p>
  </div>
  <figure class="s11-heritage">
    <div class="s11-hframe">${videoTag('video-timbuktu-mausoleums', 's11-video')}<div class="s11-ruin">${img('timbuktu-burnt-manuscript', 'Spalony rękopis z Timbuktu', '24vw')}</div></div>
    <figcaption class="small">Timbuktu, 2014: pierwsze gliniane cegły na zburzonych mauzoleach. Odbudowa skończyła się w 2015 r., a w 2016 r. mauzolea znów poświęcono.${cite('un-news-timbuktu-2016')}</figcaption>
  </figure>
  <figure class="s11-photo">${img('menaka-idps-2023', 'Przesiedleni w Ménace, 2023', '24vw')}</figure>
</div>`);
  },
  enter({ el, tl }) {
    tl.add(q(el, '.s11-title'), [{ opacity: 0, transform: 'translateY(-40px)' }, { opacity: 1, transform: 'none' }], { at: 0, dur: 700, ease: EASE });
    tl.add(q(el, '.s11-lede'), [{ opacity: 0 }, { opacity: 1 }], { at: 300, dur: 600 });
    qa(el, '.s11-stats > div').forEach((d, i) => {
      const o = q(d, '.s11-odo');
      if (!o.classList.contains('odo')) odometer(tl, o, 300 + i * 200, 80); else tl.add(o, [{ opacity: 0 }, { opacity: 1 }], { at: 300, dur: 300 });
      tl.add(q(d, '.small'), [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { at: 700 + i * 200, dur: 500 });
    });
    qa(el, '.s11-grid i').forEach((dot, i) => {
      const dx = (4.5 - (i % 10)) * 115;
      const dy = (1.5 - Math.floor(i / 10)) * 115;
      tl.add(dot, [
        { opacity: 0, transform: `translate(${dx}%, ${dy}%) scale(.2)` },
        { opacity: 1, transform: 'translate(0%, 0%) scale(1.25)', offset: 0.7 },
        { opacity: 1, transform: 'none' }
      ], { at: 900 + i * 28, dur: 750, ease: EASE });
    });
    tl.add(q(el, '.s11-key'), [{ opacity: 0 }, { opacity: 1 }], { at: 2000, dur: 400 });
    tl.add(q(el, '.s11-abuse'), [{ opacity: 0, transform: 'translateX(-20px)' }, { opacity: 1, transform: 'none' }], { at: 1400, dur: 600 });
    tl.add(q(el, '.s11-hframe'), [{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }], { at: 1000, dur: 600 });
    tl.add(q(el, '.s11-ruin'), [{ opacity: 1 }, { opacity: 1, offset: 0.35 }, { opacity: 0 }], { at: 1000, dur: 1500 });
    tl.add(q(el, '.s11-heritage figcaption'), [{ opacity: 0 }, { opacity: 1 }], { at: 1900, dur: 500 });
    tl.add(q(el, '.s11-photo'), [{ opacity: 0, transform: 'scale(1.08)' }, { opacity: 1, transform: 'none' }], { at: 600, dur: 900 });
  }
};
