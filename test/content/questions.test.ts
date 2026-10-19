import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { loadQuestions } from '../../server/questions.ts';

const path = 'data/questions.json';

test('real quiz has 10 valid questions', { skip: !existsSync(path) }, () => {
  const qs = loadQuestions(path);
  assert.equal(qs.length, 10);
  const counts = [0, 0, 0, 0];
  for (const q of qs) {
    assert.ok(q.text.length <= 160);
    assert.equal(new Set(q.choices).size, 4);
    counts[q.correct]++;
  }
  for (const c of counts) assert.ok(c >= 1, 'correct answers spread over all positions');
});
