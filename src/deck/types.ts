import type { Timeline } from '../anim/timeline.ts';

export type Action = 'next' | 'prev' | 'first' | 'last' | 'fullscreen' | 'lite' | 'escape';

export type TransitionName = 'dissolve' | 'rise' | 'pan' | 'zoom' | 'iris' | 'shutter' | 'drift' | 'flip' | 'curtain' | 'push' | 'tilt' | 'fold' | 'wipe' | 'scatter' | 'sink';

export interface SlideCtx {
  el: HTMLElement;
  tl: Timeline;
  lite: boolean;
  src: number | null;
  from: number | null;
}

export interface SlideDef {
  id: string;
  title: string;
  transition: TransitionName;
  render(): HTMLElement;
  enter(ctx: SlideCtx): void;
  onAction?(a: Action): boolean;
  leave?(): void;
}
