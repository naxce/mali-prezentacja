import './s15-end.css';
import type { SlideDef } from '../deck/types.ts';
import { mk, q, qa, rand } from './kit.ts';
import { img } from '../content/media.ts';
import { icon } from '../deck/icons.ts';
import { REPO_URL } from '../deck/chrome.ts';
import { splitChars } from '../anim/split.ts';
import { EASE, EASE_BACK } from '../anim/timeline.ts';

export const endSlide: SlideDef = {
  id: 'end',
  title: 'Dziękuję',
  transition: 'wipe',
  render() {
    const r = rand(23);
    return mk(`
<div class="bg s15-bg">${img('niger-sunset-reflection', '', '100vw')}</div>
<div class="scrim s15-scrim"></div>
<div class="fx" aria-hidden="true"><i class="s15-sun"></i></div>
<div class="s15-sand" aria-hidden="true">${Array.from({ length: 34 }, (_, i) => `<i class="${i >= 12 ? 'heavy' : ''}" style="left:${(r() * 100).toFixed(1)}%;top:${(20 + r() * 60).toFixed(1)}%;width:${(4 + r() * 10).toFixed(0)}px;height:${(4 + r() * 10).toFixed(0)}px"></i>`).join('')}</div>
<div class="slide-inner s15">
  <h2 class="display s15-title">Dziękuję za uwagę</h2>
  <p class="s15-sign">Adam Pietrzak 4D</p>
  <a class="s15-gh" href="${REPO_URL}" target="_blank" rel="noopener">${icon('github')}<span>Kod źródłowy na GitHubie</span></a>
</div>`);
  },
  enter({ el, tl, lite }) {
    tl.add(q(el, '.s15-bg'), [{ opacity: 0 }, { opacity: 1 }], { at: 0, dur: 1200 });
    tl.add(q(el, '.s15-sun'), [{ opacity: 0, transform: 'translateY(30%) scale(.55)' }, { opacity: 1, transform: 'translateY(-4%) scale(1.06)', offset: 0.7 }, { opacity: 0.85, transform: 'none' }], { at: 200, dur: 2800, ease: 'cubic-bezier(.25,.6,.3,1)' });
    qa(el, '.s15-sand i').forEach((s, i) => {
      if (lite && s.classList.contains('heavy')) return;
      tl.add(s, [{ opacity: 0.9, transform: 'translate(0,0)' }, { opacity: 0, transform: `translate(${260 + (i % 7) * 60}px, ${-40 + (i % 5) * 20}px)` }], { at: 100 + (i % 12) * 50, dur: 1400, ease: 'cubic-bezier(.3,0,.6,1)' });
    });
    const t = q(el, '.s15-title');
    (t.querySelector('.ch') ? qa(t, '.ch') : splitChars(t)).forEach((c, i) => tl.add(c, [{ opacity: 0, transform: 'translateX(-30px)' }, { opacity: 1, transform: 'none' }], { at: 300 + i * 45, dur: 700, ease: EASE }));
    const s = q(el, '.s15-sign');
    (s.querySelector('.ch') ? qa(s, '.ch') : splitChars(s)).forEach((c, i) => tl.add(c, [{ opacity: 0, transform: 'translateY(30%) skewX(-12deg)' }, { opacity: 1, transform: 'skewX(-8deg)' }], { at: 1200 + i * 55, dur: 260, ease: 'linear' }));
    tl.add(q(el, '.s15-gh'), [{ opacity: 0, transform: 'scale(.7)' }, { opacity: 1, transform: 'none' }], { at: 1900, dur: 600, ease: EASE_BACK });
  }
};
