import type { TransitionName } from '../deck/types.ts';

export const SLIDE_META: { id: string; transition: TransitionName }[] = [
  { id: 'title', transition: 'dissolve' },
  { id: 'mali', transition: 'zoom' },
  { id: 'roots', transition: 'pan' },
  { id: 'war', transition: 'shutter' },
  { id: 'jihad', transition: 'drift' },
  { id: 'intervention', transition: 'push' },
  { id: 'peace', transition: 'fold' },
  { id: 'coups', transition: 'flip' },
  { id: 'alliances', transition: 'tilt' },
  { id: 'now', transition: 'rise' },
  { id: 'cost', transition: 'sink' },
  { id: 'voices', transition: 'scatter' },
  { id: 'quiz', transition: 'iris' },
  { id: 'sources', transition: 'curtain' },
  { id: 'end', transition: 'wipe' }
];
