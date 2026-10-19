import './s14-sources.css';
import type { SlideDef } from '../deck/types.ts';
import { mk, q, qa } from './kit.ts';
import { SOURCES } from '../content/sources.ts';
import { MEDIA } from '../content/media.ts';
import { icon } from '../deck/icons.ts';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const KIND: Record<string, string> = { image: 'zdjęcie', video: 'wideo', flag: 'flaga' };

function list(): string {
  const text = SOURCES.map((s, i) => `<li id="src-${i + 1}" data-n="${i + 1}"><b>${i + 1}</b><span>${esc(s.publisher)}, „${esc(s.title)}”. <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url.replace(/^https?:\/\//, '').replace(/\?.*$/, ''))}</a>, dostęp: ${esc(s.accessed)}</span></li>`).join('');
  const off = SOURCES.length;
  const media = MEDIA.map((m, i) => `<li id="src-${off + i + 1}"><b>${off + i + 1}</b><span>${KIND[m.kind]}: ${esc(m.author || 'autor nieznany')}, „${esc(m.title)}”, ${esc(m.license)}. <a href="${esc(m.sourceUrl)}" target="_blank" rel="noopener">Wikimedia Commons</a></span></li>`).join('');
  const extra = `<li><b>*</b><span>Mapy: Natural Earth (domena publiczna). Kroje pisma: Big Shoulders Display, Libre Franklin i Source Sans 3 (SIL Open Font License). Ikony: Phosphor (MIT).</span></li>`;
  return `<h3 class="mono s14-h">Tekst i dane</h3><ol class="s14-list">${text}</ol><h3 class="mono s14-h">Zdjęcia, wideo i flagi</h3><ol class="s14-list">${media}${extra}</ol>`;
}

export const sourcesSlide: SlideDef = {
  id: 'sources',
  title: 'Źródła',
  transition: 'curtain',
  render() {
    const el = mk(`
<div class="slide-inner s14">
  <header class="s14-head">
    <h2 class="display h2 s14-title">Źródła</h2>
    <i class="s14-rule" aria-hidden="true"></i>
    <p class="small s14-note">Stan na 19 października 2026.</p>
    <button type="button" class="s14-back" hidden>${icon('back')}<span>Wróć do slajdu</span></button>
  </header>
  <div class="s14-scroll" data-noadvance tabindex="0" aria-label="Lista źródeł">${list()}</div>
</div>`);
    q(el, '.s14-back').addEventListener('click', () => history.back());
    return el;
  },
  enter({ el, tl, src, from }) {
    const back = q<HTMLButtonElement>(el, '.s14-back');
    back.hidden = src === null || from === null;
    tl.add(q(el, '.s14-title'), [{ opacity: 0, transform: 'translateY(-50px)' }, { opacity: 1, transform: 'none' }], { at: 0, dur: 600 });
    tl.add(q(el, '.s14-rule'), [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { at: 250, dur: 900, ease: 'cubic-bezier(.65,0,.35,1)' });
    tl.add(q(el, '.s14-note'), [{ opacity: 0 }, { opacity: 1 }], { at: 200, dur: 500 });
    if (!back.hidden) tl.add(back, [{ opacity: 0, transform: 'translateX(20px)' }, { opacity: 1, transform: 'none' }], { at: 200, dur: 400 });
    const scroller = q(el, '.s14-scroll');
    const items = qa(el, '.s14-list li');
    const heads = qa(el, '.s14-h');
    heads.forEach((h, i) => tl.add(h, [{ opacity: 0 }, { opacity: 1 }], { at: 300 + i * 200, dur: 400 }));
    const cols = window.innerWidth > 900 ? 3 : 1;
    items.forEach((li, i) => {
      const col = i % cols;
      tl.add(li, [{ opacity: 0, transform: 'translateY(-14px)' }, { opacity: 1, transform: 'none' }], { at: 350 + col * 160 + Math.min(Math.floor(i / cols), 24) * 22, dur: 380 });
    });
    qa(el, '.flash').forEach((f) => f.classList.remove('flash'));
    if (src !== null) {
      const target = el.querySelector<HTMLElement>(`#src-${src}`);
      if (target) {
        scroller.scrollTop = Math.max(0, target.offsetTop - scroller.offsetTop - 40);
        target.classList.add('flash');
        tl.add(target, [{ transform: 'scale(1)' }, { transform: 'scale(1.04)', offset: 0.3 }, { transform: 'scale(1)' }], { at: 700, dur: 700 });
      }
    } else scroller.scrollTop = 0;
  }
};
