import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keyToAction, swipeToAction } from '../../src/deck/input.ts';

const k = (key: string, extra: Partial<{ repeat: boolean; ctrlKey: boolean; metaKey: boolean; altKey: boolean }> = {}) => keyToAction({ key, repeat: false, ...extra });

test('keyToAction maps presenter keys', () => {
  for (const key of ['ArrowRight', 'ArrowDown', ' ', 'PageDown']) assert.equal(k(key), 'next', key);
  for (const key of ['ArrowLeft', 'ArrowUp', 'PageUp']) assert.equal(k(key), 'prev', key);
  assert.equal(k('Home'), 'first');
  assert.equal(k('End'), 'last');
  assert.equal(k('f'), 'fullscreen');
  assert.equal(k('F'), 'fullscreen');
  assert.equal(k('l'), 'lite');
  assert.equal(k('L'), 'lite');
  assert.equal(k('Escape'), 'escape');
  assert.equal(k('x'), null);
});

test('keyToAction ignores repeat', () => {
  assert.equal(k('ArrowRight', { repeat: true }), null);
  assert.equal(k('PageDown', { repeat: true }), null);
});

test('keyToAction ignores modifier combos', () => {
  assert.equal(k('ArrowRight', { ctrlKey: true }), null);
  assert.equal(k('l', { metaKey: true }), null);
  assert.equal(k('f', { altKey: true }), null);
});

test('swipeToAction thresholds', () => {
  assert.equal(swipeToAction(-80, 10, 300), 'next');
  assert.equal(swipeToAction(80, 10, 300), 'prev');
  assert.equal(swipeToAction(30, 0, 300), null);
  assert.equal(swipeToAction(-80, 100, 300), null);
  assert.equal(swipeToAction(-80, 0, 900), null);
});
