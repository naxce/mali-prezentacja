import { readFileSync } from 'node:fs';
import type { Question } from './game.ts';

const isText = (v: unknown, max: number): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

export function loadQuestions(path: string): Question[] {
  const data = JSON.parse(readFileSync(path, 'utf8')) as { questions?: unknown };
  const list = data && Array.isArray(data.questions) ? data.questions : null;
  if (!list || list.length < 1 || list.length > 20) throw new Error('questions: expected 1-20 questions');
  return list.map((raw: unknown, i: number) => {
    const q = raw as { text?: unknown; choices?: unknown; correct?: unknown };
    if (!isText(q.text, 160)) throw new Error(`questions[${i}].text`);
    if (!Array.isArray(q.choices) || q.choices.length !== 4 || !q.choices.every((c) => isText(c, 80))) throw new Error(`questions[${i}].choices`);
    if (typeof q.correct !== 'number' || !Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3) throw new Error(`questions[${i}].correct`);
    return { text: q.text, choices: [q.choices[0], q.choices[1], q.choices[2], q.choices[3]], correct: q.correct as 0 | 1 | 2 | 3 };
  });
}
