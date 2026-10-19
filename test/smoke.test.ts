import { test } from 'node:test';
import assert from 'node:assert/strict';

test('typescript runs under node:test', () => {
  const n: number = 1 + 1;
  assert.equal(n, 2);
});
