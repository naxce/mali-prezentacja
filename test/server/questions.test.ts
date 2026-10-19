import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadQuestions } from '../../server/questions.ts';

const dir = mkdtempSync(join(tmpdir(), 'q-'));
const file = (name: string, data: unknown): string => {
  const p = join(dir, name);
  writeFileSync(p, typeof data === 'string' ? data : JSON.stringify(data));
  return p;
};
const good = { text: 'Stolica Mali?', choices: ['Bamako', 'Gao', 'Kidal', 'Mopti'], correct: 0 };

test('loadQuestions accepts a valid file', () => {
  const qs = loadQuestions(file('ok.json', { questions: [good, { ...good, correct: 3 }] }));
  assert.equal(qs.length, 2);
  assert.equal(qs[1].correct, 3);
});

test('loadQuestions rejects invalid shapes', () => {
  assert.throws(() => loadQuestions(file('a.json', { questions: [] })));
  assert.throws(() => loadQuestions(file('b.json', { questions: [{ ...good, choices: ['a', 'b', 'c'] }] })));
  assert.throws(() => loadQuestions(file('c.json', { questions: [{ ...good, correct: 4 }] })));
  assert.throws(() => loadQuestions(file('d.json', { questions: [{ ...good, text: 'x'.repeat(161) }] })));
  assert.throws(() => loadQuestions(file('e.json', { questions: [{ ...good, choices: ['a', 'b', 'c', 'x'.repeat(81)] }] })));
  assert.throws(() => loadQuestions(file('f.json', 'not json')));
  assert.throws(() => loadQuestions(file('g.json', { questions: Array(21).fill(good) })));
});

test('example questions file is valid', () => {
  assert.ok(loadQuestions('data/questions.example.json').length >= 1);
});
