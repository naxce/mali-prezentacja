export const EASE = 'cubic-bezier(.16,1,.3,1)';
export const EASE_IN = 'cubic-bezier(.7,0,.84,0)';
export const EASE_INOUT = 'cubic-bezier(.65,0,.35,1)';
export const EASE_BACK = 'cubic-bezier(.34,1.56,.64,1)';

interface Item { el: Element; frames: Keyframe[]; at: number; dur: number; ease: string }
interface Call { at: number; fn: () => void; done: boolean }

export class Timeline {
  readonly lite: boolean;
  readonly offset: number;
  readonly targets = new Set<Element>();
  running = false;
  private items: Item[] = [];
  private calls: Call[] = [];
  private anims: Animation[] = [];
  private timers: ReturnType<typeof setTimeout>[] = [];
  private end = 0;
  private onDone: (() => void) | null = null;

  constructor(lite: boolean, offset = 0) {
    this.lite = lite;
    this.offset = offset;
  }

  get duration(): number {
    return this.end;
  }

  add(el: Element | null | undefined, frames: Keyframe[], o: { at: number; dur: number; ease?: string }): this {
    if (!el) return this;
    const at = o.at + this.offset;
    this.items.push({ el, frames, at, dur: o.dur, ease: o.ease || EASE });
    this.targets.add(el);
    this.end = Math.max(this.end, at + o.dur);
    return this;
  }

  call(at: number, fn: () => void): this {
    const t = at + this.offset;
    this.calls.push({ at: t, fn, done: false });
    this.end = Math.max(this.end, t);
    return this;
  }

  play(onDone?: () => void): void {
    this.onDone = onDone || null;
    this.running = true;
    const canAnimate = typeof (Element.prototype as { animate?: unknown }).animate === 'function';
    if (canAnimate) {
      for (const it of this.items) {
        try {
          this.anims.push(it.el.animate(it.frames, { duration: Math.max(1, it.dur), delay: it.at, easing: it.ease, fill: 'both' }));
        } catch {
          continue;
        }
      }
    }
    for (const c of this.calls) {
      this.timers.push(setTimeout(() => { if (!c.done) { c.done = true; c.fn(); } }, c.at));
    }
    this.timers.push(setTimeout(() => this.complete(), canAnimate ? this.end + 30 : 0));
  }

  private complete(): void {
    if (!this.running) return;
    this.running = false;
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
    for (const c of this.calls) if (!c.done) { c.done = true; c.fn(); }
    const cb = this.onDone;
    this.onDone = null;
    if (cb) cb();
  }

  finish(): void {
    if (!this.running) return;
    for (const a of this.anims) {
      try { a.finish(); } catch { a.cancel(); }
    }
    this.complete();
  }

  cancel(): void {
    this.running = false;
    this.onDone = null;
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
    for (const a of this.anims) a.cancel();
    this.anims = [];
  }
}
