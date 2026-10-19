import { EASE, EASE_BACK, type Timeline } from './timeline.ts';
import { splitChars } from './split.ts';

export function drawPath(tl: Timeline, path: SVGGeometryElement, at: number, dur: number, ease?: string): void {
  let len = 1000;
  try { len = Math.ceil(path.getTotalLength()) || 1000; } catch { len = 1000; }
  path.style.strokeDasharray = `${len} ${len}`;
  path.style.strokeDashoffset = '0';
  tl.add(path, [{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { at, dur, ease: ease || 'cubic-bezier(.45,0,.2,1)' });
}

export function stamp(tl: Timeline, el: Element, at: number, rot = -8): void {
  tl.add(el, [
    { opacity: 0, transform: `scale(2.4) rotate(${rot}deg)` },
    { opacity: 1, transform: `scale(0.94) rotate(${rot / 4}deg)`, offset: 0.7 },
    { opacity: 1, transform: 'scale(1) rotate(0deg)' }
  ], { at, dur: 520, ease: 'cubic-bezier(.2,.9,.3,1)' });
}

export function typeOut(tl: Timeline, el: HTMLElement, at: number, msPerChar = 45): number {
  const chars = splitChars(el);
  chars.forEach((c, i) => tl.add(c, [{ opacity: 0 }, { opacity: 1 }], { at: at + i * msPerChar, dur: 90, ease: 'linear' }));
  return at + chars.length * msPerChar;
}

export function flipBoard(tl: Timeline, el: HTMLElement, at: number, step = 55): number {
  const chars = splitChars(el);
  el.classList.add('flipboard');
  chars.forEach((c, i) => tl.add(c, [
    { opacity: 0, transform: 'perspective(400px) rotateX(-95deg)' },
    { opacity: 1, transform: 'perspective(400px) rotateX(18deg)', offset: 0.7 },
    { opacity: 1, transform: 'perspective(400px) rotateX(0deg)' }
  ], { at: at + i * step, dur: 420, ease: EASE }));
  return at + chars.length * step + 420;
}

export function odometer(tl: Timeline, el: HTMLElement, at: number, step = 90): number {
  const value = el.textContent || '';
  el.setAttribute('aria-label', value);
  el.textContent = '';
  el.classList.add('odo');
  let i = 0;
  for (const ch of Array.from(value)) {
    if (/\d/.test(ch)) {
      const win = document.createElement('span');
      win.className = 'odo-win';
      win.setAttribute('aria-hidden', 'true');
      const col = document.createElement('span');
      col.className = 'odo-col';
      for (let d = 0; d <= 9; d++) {
        const s = document.createElement('span');
        s.textContent = String(d);
        col.appendChild(s);
      }
      const n = Number(ch);
      const size = document.createElement('span');
      size.className = 'odo-size';
      size.dataset.d = ch;
      win.appendChild(size);
      col.style.transform = `translateY(${-n * 10}%)`;
      win.appendChild(col);
      el.appendChild(win);
      tl.add(col, [{ transform: 'translateY(0%)' }, { transform: `translateY(${-n * 10}%)` }], { at: at + i * step, dur: 1100 + i * 60, ease: 'cubic-bezier(.2,.8,.2,1)' });
      i++;
    } else {
      const s = document.createElement('span');
      s.className = 'odo-sep';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = ch;
      el.appendChild(s);
      if (ch.trim()) tl.add(s, [{ opacity: 0, transform: 'translateY(40%)' }, { opacity: 1, transform: 'none' }], { at: at + i * step, dur: 500 });
    }
  }
  return at + i * step + 1100;
}

export function countUp(tl: Timeline, el: HTMLElement, to: number, at: number, dur: number, fmt: (n: number) => string = (n) => Math.round(n).toLocaleString('pl-PL')): void {
  const final = fmt(to);
  let stop = false;
  el.textContent = final;
  tl.add(el, [{ opacity: 0 }, { opacity: 1 }], { at, dur: 200 });
  tl.call(at, () => {
    const t0 = performance.now();
    const tick = (t: number) => {
      if (stop) return;
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = fmt(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    el.textContent = fmt(0);
    requestAnimationFrame(tick);
  });
  tl.call(at + dur, () => { stop = true; el.textContent = final; });
}

export function popIn(tl: Timeline, el: Element, at: number, dur = 480): void {
  tl.add(el, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)' }], { at, dur, ease: EASE_BACK });
}
