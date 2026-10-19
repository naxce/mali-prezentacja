import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHash, formatHash } from '../../src/deck/hash.ts';

test('parseHash', () => {
  assert.deepEqual(parseHash('#/7', 15), { index: 6, src: null });
  assert.deepEqual(parseHash('#/14/s12', 15), { index: 13, src: 12 });
  assert.deepEqual(parseHash('#/99', 15), { index: 14, src: null });
  assert.deepEqual(parseHash('#/0', 15), { index: 0, src: null });
  assert.deepEqual(parseHash('', 15), { index: 0, src: null });
  assert.deepEqual(parseHash('#garbage', 15), { index: 0, src: null });
});

test('formatHash', () => {
  assert.equal(formatHash(13, 12), '#/14/s12');
  assert.equal(formatHash(0), '#/1');
});
