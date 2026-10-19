import { icon } from './icons.ts';
import type { Action } from './types.ts';

export const REPO_URL = 'https://github.com/naxce/mali-prezentacja';

export interface Chrome { update(index: number, lite: boolean): void; toast(msg: string): void }

export function buildChrome(root: HTMLElement, o: { count: number; onAction(a: Action): void }): Chrome {
  const progress = document.createElement('div');
  progress.className = 'progress';
  progress.innerHTML = '<i></i>';
  const nav = document.createElement('nav');
  nav.className = 'controls';
  nav.setAttribute('aria-label', 'Sterowanie prezentacją');
  nav.innerHTML = `
<button type="button" data-act="prev" aria-label="Poprzedni slajd">${icon('arrowLeft')}</button>
<span class="counter" aria-live="off"></span>
<button type="button" data-act="next" aria-label="Następny slajd">${icon('arrowRight')}</button>
<button type="button" data-act="lite" aria-pressed="false" aria-label="Tryb lekki" title="Tryb lekki (L)">${icon('feather')}</button>
<button type="button" data-act="fullscreen" aria-label="Pełny ekran" title="Pełny ekran (F)">${icon('cornersOut')}</button>
<a class="gh" href="${REPO_URL}" target="_blank" rel="noopener" aria-label="Kod źródłowy na GitHubie">${icon('github')}<span>Kod źródłowy</span></a>`;
  const toastEl = document.createElement('div');
  toastEl.className = 'toast';
  toastEl.setAttribute('role', 'status');
  root.appendChild(progress);
  root.appendChild(nav);
  root.appendChild(toastEl);
  nav.addEventListener('click', (e) => {
    const b = (e.target as Element).closest('button[data-act]');
    if (b) o.onAction(b.getAttribute('data-act') as Action);
  });
  const bar = progress.firstChild as HTMLElement;
  const counter = nav.querySelector('.counter') as HTMLElement;
  const liteBtn = nav.querySelector('[data-act="lite"]') as HTMLElement;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  const wake = () => {
    root.classList.remove('idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => root.classList.add('idle'), 2500);
  };
  root.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') wake(); });
  wake();
  let toastTimer: ReturnType<typeof setTimeout> | undefined;
  return {
    update(index, lite) {
      bar.style.transform = `scaleX(${(index + 1) / o.count})`;
      counter.textContent = `${index + 1} / ${o.count}`;
      liteBtn.setAttribute('aria-pressed', lite ? 'true' : 'false');
    },
    toast(msg) {
      toastEl.textContent = msg;
      toastEl.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3000);
    }
  };
}
