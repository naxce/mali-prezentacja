import { Timeline } from '../anim/timeline.ts';
import type { SlideDef } from './types.ts';

export function printDeck(root: HTMLElement, slides: SlideDef[]): void {
  document.documentElement.classList.add('print-mode', 'lite');
  slides.forEach((def, i) => {
    const el = def.render();
    el.classList.add('slide', `s-${def.id}`);
    el.setAttribute('aria-label', `${i + 1} z ${slides.length}: ${def.title}`);
    root.appendChild(el);
    el.querySelectorAll('video').forEach((v) => { v.removeAttribute('data-src'); v.removeAttribute('src'); });
    const tl = new Timeline(true);
    def.enter({ el, tl, lite: true, src: null, from: null });
    tl.play();
    tl.finish();
  });
  document.documentElement.setAttribute('data-print-ready', '');
}
