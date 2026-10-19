import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Buckets } from '../../server/ratelimit.ts';

test('token bucket drains and refills', () => {
  let t = 0;
  const b = new Buckets(3, 1, () => t);
  assert.equal(b.take('a'), true);
  assert.equal(b.take('a'), true);
  assert.equal(b.take('a'), true);
  assert.equal(b.take('a'), false);
  assert.equal(b.take('b'), true);
  t = 1000;
  assert.equal(b.has('a'), true);
  assert.equal(b.take('a'), true);
  assert.equal(b.take('a'), false);
});
