import { Timeline, EASE, EASE_IN, EASE_INOUT } from '../anim/timeline.ts';
import type { TransitionName } from './types.ts';

interface Spec { dur: number; out: (s: number) => Keyframe[]; in: (s: number) => Keyframe[]; inAt?: number; outOnTop?: boolean; ease?: string }

const SPECS: Record<TransitionName, Spec> = {
  dissolve: { dur: 700, out: () => [{ opacity: 1 }, { opacity: 0 }], in: () => [{ opacity: 0 }, { opacity: 1 }] },
  zoom: { dur: 750, out: () => [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.18)' }], in: () => [{ opacity: 0, transform: 'scale(.86)' }, { opacity: 1, transform: 'scale(1)' }] },
  pan: { dur: 800, out: (s) => [{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: `translateX(${-30 * s}%)` }], in: (s) => [{ opacity: 0, transform: `translateX(${30 * s}%)` }, { opacity: 1, transform: 'translateX(0)' }] },
  shutter: { dur: 420, inAt: 380, ease: EASE_INOUT, out: () => [{ transform: 'scaleY(1)', opacity: 1 }, { transform: 'scaleY(.004)', opacity: 1, offset: 0.92 }, { transform: 'scaleY(.004)', opacity: 0 }], in: () => [{ transform: 'scaleY(.004)', opacity: 0 }, { transform: 'scaleY(.004)', opacity: 1, offset: 0.08 }, { transform: 'scaleY(1)', opacity: 1 }] },
  drift: { dur: 1000, out: (s) => [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: `translateY(${-6 * s}%)` }], in: (s) => [{ opacity: 0, transform: `translateY(${8 * s}%)` }, { opacity: 1, transform: 'translateY(0)' }] },
  push: { dur: 750, ease: EASE_INOUT, out: (s) => [{ transform: 'translateX(0)' }, { transform: `translateX(${-100 * s}%)` }], in: (s) => [{ transform: `translateX(${100 * s}%)` }, { transform: 'translateX(0)' }] },
  fold: { dur: 850, out: (s) => [{ opacity: 1, transform: 'perspective(1600px) rotateY(0deg)' }, { opacity: 0, transform: `perspective(1600px) rotateY(${-70 * s}deg)` }], in: (s) => [{ opacity: 0, transform: `perspective(1600px) rotateY(${70 * s}deg)` }, { opacity: 1, transform: 'perspective(1600px) rotateY(0deg)' }] },
  flip: { dur: 800, out: (s) => [{ opacity: 1, transform: 'perspective(1400px) rotateX(0deg)' }, { opacity: 0, transform: `perspective(1400px) rotateX(${60 * s}deg)` }], in: (s) => [{ opacity: 0, transform: `perspective(1400px) rotateX(${-60 * s}deg)` }, { opacity: 1, transform: 'perspective(1400px) rotateX(0deg)' }] },
  tilt: { dur: 800, out: (s) => [{ opacity: 1, transform: 'rotate(0deg) translateY(0)' }, { opacity: 0, transform: `rotate(${3 * s}deg) translateY(-6%)` }], in: (s) => [{ opacity: 0, transform: `rotate(${-4 * s}deg) translateY(10%)` }, { opacity: 1, transform: 'rotate(0deg) translateY(0)' }] },
  rise: { dur: 850, out: () => [{ opacity: 1 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], in: (s) => [{ transform: `translateY(${100 * s}%)` }, { transform: 'translateY(0)' }], ease: EASE_INOUT },
  sink: { dur: 900, outOnTop: true, ease: EASE_IN, out: (s) => [{ transform: 'translateY(0) rotate(0deg)', opacity: 1 }, { transform: `translateY(${100 * s}%) rotate(${4 * s}deg)`, opacity: 1 }], in: () => [{ transform: 'scale(.94)', opacity: 0.4 }, { transform: 'scale(1)', opacity: 1 }] },
  scatter: { dur: 750, out: () => [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.7)' }], in: () => [{ opacity: 0, transform: 'scale(1.28)' }, { opacity: 1, transform: 'scale(1)' }] },
  iris: { dur: 800, out: () => [{ opacity: 1 }, { opacity: 0 }], in: () => [{ opacity: 0, transform: 'scale(.25)' }, { opacity: 1, transform: 'scale(1.03)', offset: 0.75 }, { opacity: 1, transform: 'scale(1)' }] },
  curtain: { dur: 800, ease: EASE_INOUT, out: (s) => [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: `translateY(${25 * s}%)` }], in: (s) => [{ transform: `translateY(${-100 * s}%)` }, { transform: 'translateY(0)' }] },
  wipe: { dur: 800, ease: EASE_INOUT, out: (s) => [{ transform: 'translateX(0)', opacity: 1 }, { transform: `translateX(${60 * s}%)`, opacity: 0 }], in: (s) => [{ transform: `translateX(${-100 * s}%)` }, { transform: 'translateX(0)' }] }
};

export function transitionDuration(name: TransitionName): number {
  const s = SPECS[name];
  return (s.inAt || 0) + s.dur;
}

export function runTransition(name: TransitionName, from: HTMLElement | null, to: HTMLElement, dir: 1 | -1, lite: boolean): Timeline {
  const spec = SPECS[name];
  const tl = new Timeline(lite);
  const ease = spec.ease || EASE;
  to.style.zIndex = '2';
  if (from) {
    from.style.zIndex = spec.outOnTop ? '3' : '1';
    tl.add(from, spec.out(dir), { at: 0, dur: spec.inAt ? spec.inAt : spec.dur, ease: spec.inAt ? EASE_IN : ease });
  }
  tl.add(to, from ? spec.in(dir) : [{ opacity: 0 }, { opacity: 1 }], { at: from ? spec.inAt || 0 : 0, dur: from ? spec.dur : 900, ease });
  return tl;
}
