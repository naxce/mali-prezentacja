import { splitChars, splitWords } from '../anim/split.ts';
import { EASE, EASE_BACK } from '../anim/timeline.ts';
import type { SlideDef } from '../deck/types.ts';
import { createHost, type Host } from '../quiz/host.ts';
import { shape } from '../quiz/shapes.ts';
import './s13-quiz.css';

let host: Host | null = null;

export const quizSlide: SlideDef = {
  id: 'quiz',
  title: 'Quiz',
  transition: 'iris',
  render() {
    const el = document.createElement('section');
    el.innerHTML = `
<div class="slide-inner q13">
  <div class="q13-intro">
    <h2 class="display q13-title">Quiz</h2>
    <div class="q13-shapes" aria-hidden="true">${[0, 1, 2, 3].map((i) => `<i class="ans-${i}">${shape(i)}</i>`).join('')}</div>
    <p class="lede q13-lede">Test wiedzy o prezentacji.</p>
    <ul class="q13-facts">
      <li><b class="stat">10</b><span>pytań</span></li>
      <li><b class="stat">20</b><span>sekund na odpowiedź</span></li>
    </ul>
  </div>
  <div class="q13-host" data-noadvance></div>
  <div class="q13-print"><p class="body">Quiz odbywa się na żywo: uczniowie skanują kod QR lub wpisują PIN na stronie prezentacje.fatum.cc/wos/mali/quiz. Pytania (bez odpowiedzi):</p><ol data-print-questions></ol></div>
</div>`;
    host = createHost(el.querySelector('.q13-host') as HTMLElement, () => document.documentElement.classList.contains('lite'));
    host.showIdle();
    return el;
  },
  enter({ el, tl }) {
    const title = el.querySelector('.q13-title') as HTMLElement;
    if (!title.querySelector('.ch')) splitChars(title);
    title.querySelectorAll('.ch').forEach((c, i) => tl.add(c, [
      { opacity: 0, transform: 'translateY(-140%) rotate(-12deg)' },
      { opacity: 1, transform: 'translateY(8%) rotate(2deg)', offset: 0.75 },
      { opacity: 1, transform: 'none' }
    ], { at: i * 110, dur: 700, ease: EASE }));
    const from = ['translate(-260%, -340%) rotate(-200deg)', 'translate(320%, -280%) rotate(220deg)', 'translate(-200%, 300%) rotate(-160deg)', 'translate(380%, 260%) rotate(240deg)'];
    el.querySelectorAll('.q13-shapes > i').forEach((s, i) => tl.add(s, [
      { opacity: 0, transform: `${from[i]} scale(.4)` },
      { opacity: 1, transform: 'translate(0, 0) rotate(0deg) scale(1.2)', offset: 0.72 },
      { opacity: 1, transform: 'none' }
    ], { at: 380 + i * 120, dur: 1000, ease: EASE }));
    const lede = el.querySelector('.q13-lede') as HTMLElement;
    if (!lede.querySelector('.w')) splitWords(lede);
    lede.querySelectorAll('.w').forEach((w, i) => tl.add(w, [{ opacity: 0, transform: 'translateY(.6em)' }, { opacity: 1, transform: 'none' }], { at: 450 + i * 35, dur: 500 }));
    el.querySelectorAll('.q13-facts li').forEach((li, i) => {
      tl.add(li.querySelector('.stat'), [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'none' }], { at: 900 + i * 160, dur: 600, ease: EASE_BACK });
      tl.add(li.querySelector('span'), [{ opacity: 0, transform: 'translateX(-16px)' }, { opacity: 1, transform: 'none' }], { at: 1000 + i * 160, dur: 500 });
    });
    tl.add(el.querySelector('.q13-host'), [{ opacity: 0, transform: 'scale(.82)' }, { opacity: 1, transform: 'none' }], { at: 600, dur: 900, ease: EASE_BACK });
    if (host) host.resume();
  },
  onAction(a) {
    return host ? host.onAction(a) : false;
  }
};
