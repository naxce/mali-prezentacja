import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseClientMsg } from '../../shared/protocol.ts';

test('parseClientMsg accepts valid messages', () => {
  assert.deepEqual(parseClientMsg('{"t":"answer","q":2,"choice":"Ab3xYz"}'), { t: 'answer', q: 2, choice: 'Ab3xYz' });
  assert.deepEqual(parseClientMsg('{"t":"join","pin":"123456","nick":"Ola","pow":{"token":"1.ab.cd","nonce":"42"}}'), { t: 'join', pin: '123456', nick: 'Ola', pow: { token: '1.ab.cd', nonce: '42' } });
  assert.deepEqual(parseClientMsg('{"t":"challenge"}'), { t: 'challenge' });
  assert.deepEqual(parseClientMsg('{"t":"host.create","key":"abcdefabcdef"}'), { t: 'host.create', key: 'abcdefabcdef' });
  assert.deepEqual(parseClientMsg('{"t":"host.resume","pin":"654321","hostToken":"tok"}'), { t: 'host.resume', pin: '654321', hostToken: 'tok' });
  assert.deepEqual(parseClientMsg('{"t":"host.kick","playerId":"p1"}'), { t: 'host.kick', playerId: 'p1' });
  assert.deepEqual(parseClientMsg('{"t":"resume","pin":"654321","token":"tok"}'), { t: 'resume', pin: '654321', token: 'tok' });
  assert.deepEqual(parseClientMsg('{"t":"ping","at":5}'), { t: 'ping', at: 5 });
  assert.deepEqual(parseClientMsg('{"t":"host.next","q":3,"phase":"reveal"}'), { t: 'host.next', q: 3, phase: 'reveal' });
  assert.deepEqual(parseClientMsg('{"t":"host.next","q":3,"phase":"bogus"}'), { t: 'host.next' });
});

test('parseClientMsg rejects bad input', () => {
  assert.equal(parseClientMsg('{"t":"join","pin":"12345","nick":"a","pow":{"token":"x","nonce":"1"}}'), null);
  assert.equal(parseClientMsg('{"t":"nope"}'), null);
  assert.equal(parseClientMsg('x'.repeat(1025)), null);
  assert.equal(parseClientMsg('{"t":"answer","q":"2","choice":"a"}'), null);
  assert.equal(parseClientMsg('{"t":"answer","q":2.5,"choice":"a"}'), null);
  assert.equal(parseClientMsg('{"t":"answer","q":99,"choice":"a"}'), null);
  assert.equal(parseClientMsg('not json'), null);
  assert.equal(parseClientMsg('[1,2]'), null);
  assert.equal(parseClientMsg('null'), null);
  assert.equal(parseClientMsg('{"t":"join","pin":"123456","nick":"Ola","pow":{"token":"x","nonce":"abc"}}'), null);
});

test('parseClientMsg strips unknown fields', () => {
  assert.deepEqual(parseClientMsg('{"t":"host.start","evil":1}'), { t: 'host.start' });
});
