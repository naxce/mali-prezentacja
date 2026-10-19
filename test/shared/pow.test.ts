import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solve, meetsDifficulty, leadingZeroBits } from '../../shared/pow.ts';
import { createChallenge, verifyChallenge } from '../../server/pow.ts';

test('leadingZeroBits', () => {
  assert.equal(leadingZeroBits('ffff'), 0);
  assert.equal(leadingZeroBits('0fff'), 4);
  assert.equal(leadingZeroBits('00ff'), 8);
  assert.equal(leadingZeroBits('1fff'), 3);
});

test('pow solve then verify', () => {
  const seen = new Map<string, number>();
  const tok = createChallenge('s3cret', 1000, 8);
  const nonce = solve(tok, 8) as string;
  assert.ok(meetsDifficulty(tok, nonce, 8));
  assert.equal(verifyChallenge('s3cret', tok, nonce, 8, 2000, seen), 'ok');
  assert.equal(verifyChallenge('s3cret', tok, nonce, 8, 2000, seen), 'reused');
  assert.equal(verifyChallenge('other', tok, nonce, 8, 2000, new Map()), 'bad-mac');
  assert.equal(verifyChallenge('s3cret', tok, nonce, 8, 1000 + 120001, new Map()), 'expired');
  assert.equal(verifyChallenge('s3cret', tok, 'x', 30, 2000, new Map()), 'insufficient');
  assert.equal(verifyChallenge('s3cret', 'garbage', '1', 8, 2000, new Map()), 'bad-mac');
});

test('difficulty is signed into the token', () => {
  const tok = createChallenge('s3cret', 1000, 6);
  assert.equal(tok.split('.')[1], '6');
  const weak = solve(tok, 4) as string;
  const needs6 = verifyChallenge('s3cret', tok, weak, 4, 2000, new Map());
  assert.ok(needs6 === 'ok' || needs6 === 'insufficient');
  const forged = tok.replace('.6.', '.1.');
  assert.equal(verifyChallenge('s3cret', forged, solve(forged, 1) as string, 1, 2000, new Map()), 'bad-mac');
});
