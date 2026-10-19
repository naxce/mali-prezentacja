import { SLIDE_META } from './meta.ts';
import type { SlideDef } from '../deck/types.ts';
import { titleSlide } from './s01-title.ts';
import { maliSlide } from './s02-mali.ts';
import { rootsSlide } from './s03-roots.ts';
import { warSlide } from './s04-war.ts';
import { jihadSlide } from './s05-jihad.ts';
import { interventionSlide } from './s06-intervention.ts';
import { peaceSlide } from './s07-peace.ts';
import { coupsSlide } from './s08-coups.ts';
import { alliancesSlide } from './s09-alliances.ts';
import { nowSlide } from './s10-now.ts';
import { costSlide } from './s11-cost.ts';
import { voicesSlide } from './s12-voices.ts';
import { quizSlide } from './s13-quiz.ts';
import { sourcesSlide } from './s14-sources.ts';
import { endSlide } from './s15-end.ts';

export const SLIDES: SlideDef[] = [titleSlide, maliSlide, rootsSlide, warSlide, jihadSlide, interventionSlide, peaceSlide, coupsSlide, alliancesSlide, nowSlide, costSlide, voicesSlide, quizSlide, sourcesSlide, endSlide];

SLIDES.forEach((s, i) => {
  if (s.id !== SLIDE_META[i].id || s.transition !== SLIDE_META[i].transition) throw new Error(`slide meta mismatch: ${s.id}`);
});
