import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomInt } from 'node:crypto';
import { sha256Hex } from '../../shared/sha256.ts';

const ALPHA = 'aąbcćdeęfghijklłmnńoópqrsśtuvwxyzźż0123456789 _-:.ŻÓŁĆ€😀';
function randomString(n: number): string {
  let s = '';
  const chars = Array.from(ALPHA);
  for (let i = 0; i < n; i++) s += chars[randomInt(chars.length)];
  return s;
}

test('sha256 vectors', () => {
  assert.equal(sha256Hex(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  assert.equal(sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'), '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
});

test('sha256 matches node:crypto on random UTF-8', () => {
  for (let i = 0; i < 200; i++) {
    const s = randomString(i);
    assert.equal(sha256Hex(s), createHash('sha256').update(s, 'utf8').digest('hex'));
  }
});
