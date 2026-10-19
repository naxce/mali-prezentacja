import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(p, 'utf8');

test('slide copy matches the research', () => {
  assert.ok(!read('src/slides/s03-roots.ts').includes('23 lata'));
  assert.ok(read('src/slides/s03-roots.ts').includes('1990-1996'));
  assert.ok(read('src/slides/s05-jihad.ts').includes('Sidi Yahia'));
  assert.ok(!read('src/slides/s07-peace.ts').includes('Algier, 15 V'));
  assert.ok(read('src/slides/s07-peace.ts').includes('Barkhane'));
  assert.ok(!read('src/slides/s10-now.ts').includes("['IX 2025', 'Bamako', `JNIM blokuje dostawy paliwa. Brakuje prądu, szkoły"));
  assert.ok(read('src/slides/s11-cost.ts').includes('w tym samym okresie 2024'));
  assert.ok(!read('src/slides/s12-voices.ts').includes('przejmuje kontrolę nad kopalniami'));
  assert.ok(!/name: 'ECOWAS i AES', flag: 'flag-/.test(read('src/slides/s12-voices.ts')));
});

test('no em or en dashes in page titles and meta', () => {
  for (const f of ['index.html', 'quiz/index.html', 'quiz/test/index.html']) assert.ok(!/[—–]/.test(read(f)), f);
});

test('deck root is not a live region', () => {
  assert.ok(!read('index.html').includes('aria-live'));
});

test('deploy guide gives the run user access to .env', () => {
  assert.ok(read('DEPLOY.md').includes('chown www:www /www/wwwroot/mali-quiz/.env'));
});
