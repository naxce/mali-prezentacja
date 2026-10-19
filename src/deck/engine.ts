import { Timeline } from '../anim/timeline.ts';
import { runTransition, transitionDuration } from './transitions.ts';
import { keyToAction, swipeToAction } from './input.ts';
import { parseHash, formatHash } from './hash.ts';
import { initialLite, watchFps } from './lite.ts';
import { buildChrome, type Chrome } from './chrome.ts';
import { syncMedia } from './media.ts';
import type { Action, SlideDef } from './types.ts';

export interface Deck {
  readonly index: number;
  readonly lite: boolean;
  go(i: number, src?: number | null): void;
  next(): void;
  prev(): void;
  setLite(v: boolean, msg?: string): void;
  settle(): boolean;
  chrome: Chrome;
}

const store = {
  get(k: string): string | null { try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string): void { try { sessionStorage.setItem(k, v); } catch { return; } }
};

const INTERACTIVE = 'a,button,input,textarea,select,label,summary,[role=button],[data-noadvance]';

function editable(t: EventTarget | null, key: string): boolean {
  const el = t as HTMLElement | null;
  if (!el || !el.tagName) return false;
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable) return true;
  const pressable = el.tagName === 'BUTTON' || el.tagName === 'A' || el.getAttribute('role') === 'button';
  return pressable && (key === ' ' || key === 'Enter' || key === 'Spacebar');
}

export function createDeck(root: HTMLElement, slides: SlideDef[]): Deck {
  const html = document.documentElement;
  const n = slides.length;
  const stage = document.createElement('div');
  stage.className = 'stage';
  root.appendChild(stage);
  const cache = new Map<number, HTMLElement>();
  let index = -1;
  let current: HTMLElement | null = null;
  let entrance: Timeline | null = null;
  let transition: Timeline | null = null;
  let lastHash = '';
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  let lite = initialLite({
    query: location.search,
    reducedMotion: 'matchMedia' in window && matchMedia('(prefers-reduced-motion: reduce)').matches,
    saveData: !!(conn && conn.saveData),
    stored: store.get('lite')
  });
  html.classList.toggle('lite', lite);

  const setVh = () => html.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  setVh();
  window.addEventListener('resize', setVh);

  const chrome = buildChrome(root, { count: n, onAction: act });

  function render(i: number): HTMLElement {
    let el = cache.get(i);
    if (!el) {
      el = slides[i].render();
      el.classList.add('slide', `s-${slides[i].id}`);
      el.setAttribute('role', 'group');
      el.setAttribute('aria-roledescription', 'slajd');
      el.setAttribute('aria-label', `${i + 1} z ${n}: ${slides[i].title}`);
      cache.set(i, el);
    }
    return el;
  }

  function settle(): boolean {
    let did = false;
    if (transition && transition.running) { transition.finish(); did = true; }
    if (entrance && entrance.running) { entrance.finish(); did = true; }
    return did;
  }

  function startEntrance(el: HTMLElement, def: SlideDef, offset: number, src: number | null, from: number | null): void {
    entrance = new Timeline(lite, offset);
    root.setAttribute('data-entering', '');
    def.enter({ el, tl: entrance, lite, src, from });
    if (import.meta.env.DEV) entrance.targets.forEach((t) => (t as HTMLElement).setAttribute('data-anim', ''));
    const en = entrance;
    en.play(() => { if (entrance === en) root.removeAttribute('data-entering'); });
  }

  function writeHash(i: number, src: number | null): void {
    const hash = formatHash(i, src || undefined);
    lastHash = hash;
    if (location.hash !== hash) history.replaceState(null, '', hash);
  }

  function go(target: number, src: number | null = null): void {
    const i = Math.min(Math.max(target, 0), n - 1);
    if (transition && transition.running) transition.finish();
    const def = slides[i];
    if (i === index && current) {
      if (entrance) entrance.cancel();
      startEntrance(current, def, 0, src, null);
      writeHash(i, src);
      return;
    }
    const prevEl = current;
    const prevIndex = index;
    const oldEntrance = entrance;
    if (prevIndex >= 0) { const pd = slides[prevIndex]; if (pd.leave) pd.leave(); }
    const el = render(i);
    el.removeAttribute('aria-hidden');
    if (el.parentNode !== stage) stage.appendChild(el);
    index = i;
    current = el;
    const tr = runTransition(def.transition, prevEl, el, i >= prevIndex ? 1 : -1, lite);
    transition = tr;
    tr.play(() => {
      if (prevEl && prevEl !== current) {
        prevEl.setAttribute('aria-hidden', 'true');
        if (prevEl.parentNode) prevEl.parentNode.removeChild(prevEl);
      }
      if (oldEntrance) oldEntrance.cancel();
      tr.cancel();
      el.style.zIndex = '';
      if (prevEl) prevEl.style.zIndex = '';
      if (transition === tr) transition = null;
    });
    startEntrance(el, def, Math.round(transitionDuration(def.transition) * (prevEl ? 0.45 : 0.15)), src, prevIndex >= 0 ? prevIndex : null);
    writeHash(i, src);
    chrome.update(i, lite);
    if (i + 1 < n) render(i + 1);
    syncMedia(cache, i, lite);
  }

  function setLite(v: boolean, msg?: string): void {
    lite = v;
    html.classList.toggle('lite', v);
    store.set('lite', v ? '1' : '0');
    chrome.update(index, lite);
    syncMedia(cache, index, lite);
    chrome.toast(msg || (v ? 'Tryb lekki włączony' : 'Tryb lekki wyłączony'));
  }

  function toggleFullscreen(): void {
    const d = document as Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void };
    const r = html as HTMLElement & { webkitRequestFullscreen?: () => void };
    if (d.fullscreenElement || d.webkitFullscreenElement) {
      if (d.exitFullscreen) d.exitFullscreen().catch(() => undefined); else if (d.webkitExitFullscreen) d.webkitExitFullscreen();
    } else if (r.requestFullscreen) r.requestFullscreen().catch(() => undefined);
    else if (r.webkitRequestFullscreen) r.webkitRequestFullscreen();
  }

  function act(a: Action): void {
    const def = slides[index];
    if (def && def.onAction && def.onAction(a)) return;
    switch (a) {
      case 'next': if (!settle()) go(index + 1); break;
      case 'prev': if (!settle()) go(index - 1); break;
      case 'first': settle(); go(0); break;
      case 'last': settle(); go(n - 1); break;
      case 'fullscreen': toggleFullscreen(); break;
      case 'lite': setLite(!lite); break;
      case 'escape': break;
    }
  }

  window.addEventListener('keydown', (e) => {
    if (editable(e.target, e.key)) return;
    const a = keyToAction(e);
    if (!a) return;
    e.preventDefault();
    act(a);
  });

  let start: { x: number; y: number; t: number; target: EventTarget | null } | null = null;
  stage.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    start = { x: e.clientX, y: e.clientY, t: e.timeStamp, target: e.target };
  });
  stage.addEventListener('pointercancel', () => { start = null; });
  stage.addEventListener('pointerup', (e) => {
    const s = start;
    start = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    const sw = swipeToAction(dx, dy, e.timeStamp - s.t);
    const target = s.target as Element | null;
    const inside = !!(target && target.closest && target.closest(INTERACTIVE));
    if (sw) { if (!inside || !target || !target.closest('[data-noadvance]')) act(sw); return; }
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && !inside) act('next');
  });

  window.addEventListener('hashchange', () => {
    if (location.hash === lastHash) return;
    const p = parseHash(location.hash, n);
    lastHash = location.hash;
    go(p.index, p.src);
  });

  const deck: Deck = {
    get index() { return index; },
    get lite() { return lite; },
    go, settle, setLite, chrome,
    next: () => act('next'),
    prev: () => act('prev')
  };

  const first = parseHash(location.hash, n);
  go(first.index, first.src);

  if (!lite && store.get('lite') === null && !/[?&]lite=/.test(location.search)) {
    watchFps(4000, (slow) => { if (slow && !lite) setLite(true, 'Włączono tryb lekki (L, aby wyłączyć)'); });
  }

  if (import.meta.env.DEV) (window as unknown as { __deck: Deck }).__deck = deck;
  return deck;
}
