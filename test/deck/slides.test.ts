import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SLIDE_META } from '../../src/slides/meta.ts';

test('15 slides with unique ids', () => {
  assert.equal(SLIDE_META.length, 15);
  assert.equal(new Set(SLIDE_META.map((s) => s.id)).size, 15);
});

test('consecutive slides use different transitions', () => {
  for (let i = 0; i + 1 < SLIDE_META.length; i++) assert.notEqual(SLIDE_META[i].transition, SLIDE_META[i + 1].transition, String(i));
});
