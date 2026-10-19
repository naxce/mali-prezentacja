import './s01-title.css';
import type { SlideDef } from '../deck/types.ts';
import { mk, q, qa, rand } from './kit.ts';
import { img } from '../content/media.ts';
import { splitChars, splitWords } from '../anim/split.ts';
import { typeOut } from '../anim/fx.ts';
import { EASE } from '../anim/timeline.ts';

export const titleSlide: SlideDef = {
  id: 'title',
  title: 'Mali: wojna w sercu Sahelu',
  transition: 'dissolve',
  render() {
    return mk(`
<div class="bg s1-bg">${img('sahel-dusk-acacia', '', '100vw')}</div>
<div class="scrim s1-scrim"></div>
<div class="fx" aria-hidden="true"><i class="s1-glare"></i></div>
<div class="slide-inner s1">
  <p class="mono s1-author">Adam Pietrzak 4D</p>
  <p class="mono s1-kicker">Wiedza o społeczeństwie</p>
  <h1 class="display s1-title"><span class="s1-l1">Mali</span><span class="s1-l2">wojna w sercu Sahelu</span></h1>
  <i class="s1-flagbar" aria-hidden="true"><b></b><b></b><b></b></i>
  <p class="lede s1-sub">Wojna zaczęła się od buntu Tuaregów w 2012 roku i trwa do dziś. Kto w niej walczy i jak żyją przez nią zwykli ludzie?</p>
</div>`);
  },
  enter({ el, tl, lite }) {
    tl.add(q(el, '.s1-bg'), lite
      ? [{ opacity: 0 }, { opacity: 1 }]
      : [{ opacity: 0, transform: 'scale(1.14)' }, { opacity: 1, transform: 'scale(1)' }], { at: 0, dur: 2200, ease: 'cubic-bezier(.2,.6,.2,1)' });
    const l1 = q(el, '.s1-l1');
    const chars = l1.querySelector('.ch') ? qa(l1, '.ch') : splitChars(l1);
    const r = rand(7);
    chars.forEach((c, i) => tl.add(c, [
      { opacity: 0, transform: `translateY(${-30 - r() * 30}%) rotate(${(r() - 0.5) * 14}deg) scale(1.08)` },
      { opacity: 1, transform: 'translateY(3%) rotate(0deg) scale(1)', offset: 0.7 },
      { opacity: 1, transform: 'none' }
    ], { at: 250 + i * 90, dur: 1000, ease: EASE }));
    const l2 = q(el, '.s1-l2');
    (l2.querySelector('.w') ? qa(l2, '.w') : splitWords(l2)).forEach((w, i) => tl.add(w, [{ opacity: 0, transform: 'translateY(55%)' }, { opacity: 1, transform: 'none' }], { at: 750 + i * 80, dur: 700 }));
    qa(el, '.s1-flagbar b').forEach((b, i) => tl.add(b, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { at: 1100 + i * 140, dur: 520, ease: 'cubic-bezier(.65,0,.35,1)' }));
    tl.add(q(el, '.s1-title'), [{ transform: 'none' }, { transform: 'scale(1.03)', offset: 0.3 }, { transform: 'none' }], { at: 1050, dur: 650, ease: 'cubic-bezier(.3,.7,.3,1)' });
    tl.add(q(el, '.s1-glare'), [{ opacity: 0, transform: 'translateX(-60%) skewX(-18deg)' }, { opacity: 1, transform: 'translateX(20%) skewX(-18deg)', offset: 0.45 }, { opacity: 0, transform: 'translateX(140%) skewX(-18deg)' }], { at: 950, dur: 1700, ease: 'cubic-bezier(.45,0,.35,1)' });
    tl.add(q(el, '.s1-sub'), [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }], { at: 1350, dur: 800 });
    const kicker = q(el, '.s1-kicker');
    if (kicker.querySelector('.ch')) tl.add(kicker, [{ opacity: 0 }, { opacity: 1 }], { at: 200, dur: 400 });
    else typeOut(tl, kicker, 150, 32);
    tl.add(q(el, '.s1-author'), [{ opacity: 0, transform: 'translateX(40px)' }, { opacity: 1, transform: 'none' }], { at: 1700, dur: 700 });
  }
};
