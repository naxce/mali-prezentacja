import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialLite, shouldDowngrade } from '../../src/deck/lite.ts';

const base = { query: '', reducedMotion: false, saveData: false, stored: null };

test('initialLite sources', () => {
  assert.equal(initialLite(base), false);
  assert.equal(initialLite({ ...base, query: '?lite=1' }), true);
  assert.equal(initialLite({ ...base, query: '?x=2&lite=1' }), true);
  assert.equal(initialLite({ ...base, reducedMotion: true }), true);
  assert.equal(initialLite({ ...base, saveData: true }), true);
  assert.equal(initialLite({ ...base, stored: '1' }), true);
  assert.equal(initialLite({ ...base, stored: '0' }), false);
  assert.equal(initialLite({ ...base, stored: '0', reducedMotion: true }), false);
  assert.equal(initialLite({ ...base, query: '?lite=0', reducedMotion: true }), false);
});

test('shouldDowngrade on sustained slow frames', () => {
  assert.equal(shouldDowngrade(Array(60).fill(16)), false);
  assert.equal(shouldDowngrade(Array(60).fill(35)), true);
  assert.equal(shouldDowngrade(Array(59).fill(80)), false);
  assert.equal(shouldDowngrade([...Array(40).fill(16), ...Array(20).fill(90)]), false);
});
