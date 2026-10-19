import './s04-war.css';
import type { SlideDef } from '../deck/types.ts';
import { mk, q, qa } from './kit.ts';
import { cite } from '../content/sources.ts';
import { img, flag } from '../content/media.ts';
import { splitChars } from '../anim/split.ts';
import { EASE, EASE_IN, EASE_INOUT } from '../anim/timeline.ts';

const EVENTS: [string, string][] = [
  ['17 I 2012', `MNLA atakuje koszary w Ménace. Zaczyna się rebelia na północy.${cite('ecfr-mnla', 'wiki-mnla')}`],
  ['I 2012', `Aguelhok: ginie 128-153 żołnierzy malijskich. Rząd Mali mówi o egzekucjach, MNLA zaprzecza (sporne).${cite('aljazeera-aguelhok-2013', 'news24-aguelhok-2012')}`],
  ['22 III 2012', `Zamach stanu w Bamako. Kapitan Amadou Sanogo obala prezydenta Touré.${cite('commondreams-coup-2012', 'stratfor-coup-2012')}`],
  ['6 IV 2012', `MNLA ogłasza niepodległość Azawadu. Unia Afrykańska uznaje deklarację za nieważną.${cite('alarabiya-azawad-2012', 'au-azawad-2012')}`]
];

const SWORD = `<svg class="s4-sword" viewBox="0 0 80 470" aria-hidden="true"><defs><linearGradient id="s4-blade" x1="0" x2="1"><stop offset="0" stop-color="#8d969f"/><stop offset=".48" stop-color="#f3f5f7"/><stop offset=".52" stop-color="#c9cfd5"/><stop offset="1" stop-color="#6f7780"/></linearGradient></defs><circle cx="40" cy="15" r="12" fill="#d4a548"/><rect x="33" y="25" width="14" height="70" rx="3" fill="#4a3320"/><rect x="2" y="92" width="76" height="13" rx="4" fill="#d4a548"/><path d="M27 105 H53 L49 425 L40 466 L31 425 Z" fill="url(#s4-blade)"/><path d="M40 112 V420" stroke="#9aa2ab" stroke-width="1.5"/></svg>`;

function piece(cls: string): string {
  return `<div class="s4-piece ${cls}"><img class="s4-fl az" src="${flag('flag-azawad-mnla')}" alt="" draggable="false"><img class="s4-fl ml" src="${flag('flag-mali')}" alt="" draggable="false"><i class="s4-seam"></i></div>`;
}

export const warSlide: SlideDef = {
  id: 'war',
  title: '2012: Wybuch wojny',
  transition: 'shutter',
  render() {
    return mk(`
<div class="bg s4-photo">${img('mali-soldiers-2012', 'Żołnierze malijscy w 2012 roku', '45vw')}</div>
<div class="scrim s4-scrim"></div>
<div class="slide-inner s4">
  <h2 class="display h1 s4-title">2012: Wybuch wojny</h2>
  <ol class="s4-events">${EVENTS.map(([d, t]) => `<li><time class="mono">${d}</time><p>${t}</p></li>`).join('')}</ol>
  <div class="s4-sides">
    <figure><img src="${flag('flag-mali')}" alt="Flaga Mali"><figcaption><strong>Rząd w Bamako</strong><br>armia malijska</figcaption></figure>
    <span class="s4-vs mono">kontra</span>
    <figure><img src="${flag('flag-azawad-mnla')}" alt="Flaga Azawadu używana przez MNLA"><figcaption><strong>MNLA</strong><br>separatyści tuarescy, „Azawad”</figcaption></figure>
  </div>
  <p class="small s4-note">U boku MNLA walczy początkowo dżihadystyczny Ansar Dine. Ten jednak chce czegoś innego: szariatu w całym Mali.${cite('un-sanctions-ansar-eddine')}</p>
</div>
<div class="s4-stage" aria-hidden="true">
  ${piece('up')}${piece('down')}
  <div class="s4-track"><i class="s4-trail"></i><i class="s4-cut"></i></div>
  <i class="s4-impact"></i>
  <div class="s4-swordbox">${SWORD}</div>
  <i class="s4-flash"></i>
</div>`);
  },
  enter({ el, tl }) {
    const stage = q(el, '.s4-stage');
    const w = stage.clientWidth || window.innerWidth;
    const h = stage.clientHeight || window.innerHeight;
    const diag = Math.sqrt(w * w + h * h);
    const ang = Math.atan2(h, w);
    const deg = (ang * 180) / Math.PI;
    const seam = -deg;
    const track = q(el, '.s4-track');
    track.style.width = `${diag}px`;
    track.style.marginLeft = `${-diag / 2}px`;
    track.style.transform = `rotate(${deg}deg)`;
    qa(el, '.s4-seam').forEach((s) => { s.style.width = `${diag}px`; s.style.marginLeft = `${-diag / 2}px`; s.style.transform = `rotate(${seam}deg)`; });
    qa(el, '.s4-fl.az').forEach((f) => tl.add(f, [{ opacity: 0, transform: 'translate(-9%, -14%) scale(1.04)' }, { opacity: 1, transform: 'none' }], { at: 0, dur: 760, ease: EASE }));
    qa(el, '.s4-fl.ml').forEach((f) => tl.add(f, [{ opacity: 0, transform: 'translate(9%, 14%) scale(1.04)' }, { opacity: 1, transform: 'none' }], { at: 60, dur: 760, ease: EASE }));
    qa(el, '.s4-seam').forEach((s) => tl.add(s, [{ opacity: 0, transform: `rotate(${seam}deg) scaleX(0)` }, { opacity: 1, transform: `rotate(${seam}deg) scaleX(1)` }], { at: 560, dur: 500, ease: EASE_INOUT }));
    const box = q(el, '.s4-swordbox');
    const H = box.offsetHeight || h * 0.8;
    const cx = Math.cos(ang);
    const cy = Math.sin(ang);
    const R = diag * 0.24;
    const R2 = diag * 0.66;
    const tilt = deg - 90;
    const lx = -w * 0.2;
    const ly = h * 0.2 - H / 2;
    tl.add(box, [
      { opacity: 1, transform: `translate(${lx}px, ${-h - H}px) rotate(0deg)`, easing: 'cubic-bezier(.6,0,.9,.4)' },
      { opacity: 1, transform: `translate(${lx}px, ${ly + 14}px) rotate(0deg)`, offset: 0.31, easing: 'ease-out' },
      { opacity: 1, transform: `translate(${lx}px, ${ly}px) rotate(0deg)`, offset: 0.345, easing: 'cubic-bezier(.3,0,.2,1)' },
      { opacity: 1, transform: `translate(${lx}px, ${ly - h * 0.06}px) rotate(-6deg)`, offset: 0.45, easing: 'cubic-bezier(.4,0,.2,1)' },
      { opacity: 1, transform: `translate(${-cx * R}px, ${-cy * R}px) rotate(${tilt - 18}deg)`, offset: 0.69, easing: 'cubic-bezier(.7,0,.25,1)' },
      { opacity: 1, transform: `translate(${cx * R2 * 0.8}px, ${cy * R2 * 0.8}px) rotate(${tilt}deg)`, offset: 0.966 },
      { opacity: 0, transform: `translate(${cx * R2}px, ${cy * R2}px) rotate(${tilt + 2}deg)` }
    ], { at: 700, dur: 1450, ease: 'linear' });
    tl.add(q(el, '.s4-impact'), [{ opacity: 0, transform: 'scale(0.2)' }, { opacity: 0.85, transform: 'scale(0.3)', offset: 0.06 }, { opacity: 0, transform: 'scale(1.8)' }], { at: 1140, dur: 520, ease: EASE });
    tl.add(stage, [{ transform: 'none' }, { transform: 'translate(7px, -5px)', offset: 0.2 }, { transform: 'translate(-6px, 4px)', offset: 0.45 }, { transform: 'translate(3px, -2px)', offset: 0.7 }, { transform: 'none' }], { at: 1150, dur: 300, ease: 'linear' });
    tl.add(q(el, '.s4-trail'), [{ opacity: 0, transform: 'scaleX(0)' }, { opacity: 0.9, transform: 'scaleX(0.55)', offset: 0.5 }, { opacity: 0.6, transform: 'scaleX(1)', offset: 0.8 }, { opacity: 0, transform: 'scaleX(1)' }], { at: 1720, dur: 760, ease: 'cubic-bezier(.55,0,.35,1)' });
    tl.add(q(el, '.s4-cut'), [{ opacity: 1, transform: 'scaleX(0)' }, { opacity: 1, transform: 'scaleX(1)', offset: 0.45 }, { opacity: 0, transform: 'scaleX(1)' }], { at: 1740, dur: 820, ease: 'cubic-bezier(.55,0,.35,1)' });
    tl.add(q(el, '.s4-flash'), [{ opacity: 0 }, { opacity: 0.5, offset: 0.25 }, { opacity: 0 }], { at: 2060, dur: 380, ease: 'linear' });
    const nx = Math.sin(ang);
    const ny = -Math.cos(ang);
    const d = Math.max(w, h) * 0.8;
    tl.add(q(el, '.s4-piece.up'), [{ opacity: 1, transform: 'none' }, { opacity: 1, transform: `translate(${nx * 18}px, ${ny * 18}px)`, offset: 0.18 }, { opacity: 0, transform: `translate(${nx * d}px, ${ny * d}px) rotate(3deg)` }], { at: 2120, dur: 1000, ease: EASE_IN });
    tl.add(q(el, '.s4-piece.down'), [{ opacity: 1, transform: 'none' }, { opacity: 1, transform: `translate(${-nx * 18}px, ${-ny * 18}px)`, offset: 0.18 }, { opacity: 0, transform: `translate(${-nx * d}px, ${-ny * d}px) rotate(-3deg)` }], { at: 2140, dur: 1020, ease: EASE_IN });
    const title = q(el, '.s4-title');
    (title.querySelector('.ch') ? qa(title, '.ch') : splitChars(title)).forEach((c, i) => tl.add(c, [{ opacity: 0, transform: 'translateY(30%) scaleY(1.4)' }, { opacity: 1, transform: 'none' }], { at: 2550 + i * 28, dur: 520 }));
    qa(el, '.s4-events li').forEach((li, i) => {
      tl.add(q(li, 'time'), [{ opacity: 0, transform: 'translateX(-24px)' }, { opacity: 1, transform: 'none' }], { at: 2800 + i * 140, dur: 450 });
      tl.add(q(li, 'p'), [{ opacity: 0, transform: 'translateX(24px)' }, { opacity: 1, transform: 'none' }], { at: 2850 + i * 140, dur: 500 });
    });
    tl.add(q(el, '.s4-photo'), [{ opacity: 0 }, { opacity: 1 }], { at: 2500, dur: 900 });
    qa(el, '.s4-sides figure').forEach((f, i) => tl.add(f, [{ opacity: 0, transform: `translateY(30px) rotate(${i ? 4 : -4}deg)` }, { opacity: 1, transform: 'none' }], { at: 3100 + i * 160, dur: 600, ease: EASE }));
    tl.add(q(el, '.s4-vs'), [{ opacity: 0, transform: 'scale(.5)' }, { opacity: 1, transform: 'none' }], { at: 3200, dur: 400 });
    tl.add(q(el, '.s4-note'), [{ opacity: 0 }, { opacity: 1 }], { at: 3400, dur: 450 });
  }
};
