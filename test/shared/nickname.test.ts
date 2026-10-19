import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkNickname, nickKey } from '../../shared/nickname.ts';

const blocked = ['Adolf H', 'adolf_h', '4d0lf', 'H1tl3r', 'h i t l e r', 'Hiiitler', 'Hitler88', 'heil', 'Sieg', 'nazi', 'SS', 'ss-man', '1488', 'Kuba88', 'kurwa', 'k u r w a', 'Kurw4', 'chuj', 'jebac', 'pierdol', 'skurwiel', 'fuck', 'isis', 'bin laden', 'Iyad Ag Ghaly', 'Goebbels', 'swastyka', 'kkk', 'Stalin', 'Pedał', 'cwel', 'n1gger', 'Himmler', 'Mengele', 'Hit1er', 'Qrwa', 'Hamas', 'Hezbollah', 'KKKK', 'SSS', 'Boko Haram'];
const allowed = ['Kasia', 'Basia', 'Sebastian', 'Assia', 'Michał', 'Dżesika', 'Zuzia_2', 'Ola-B', 'Mateusz K', 'Analiza', 'Klasa4D', 'Kuba', 'Ola2008', 'Adam P', 'Szymon', 'Wiktoria', 'Igor', 'Hubert', 'Ksawery', 'Sasza'];

test('blocks extremist, vulgar and evasive names', () => {
  for (const n of blocked) assert.equal(checkNickname(n).ok, false, n);
});
test('allows ordinary Polish names', () => {
  for (const n of allowed) assert.equal(checkNickname(n).ok, true, n);
});
test('rejects dot form of Adolf H.', () => assert.equal(checkNickname('Adolf H.').ok, false));
test('length and charset', () => {
  assert.deepEqual(checkNickname('A'), { ok: false, reason: 'length' });
  assert.deepEqual(checkNickname('A'.repeat(17)), { ok: false, reason: 'length' });
  assert.deepEqual(checkNickname('<b>x</b>'), { ok: false, reason: 'chars' });
  assert.deepEqual(checkNickname('Кasia'), { ok: false, reason: 'chars' });
});
test('blocked reason is reported', () => assert.deepEqual(checkNickname('Hitler'), { ok: false, reason: 'blocked' }));
test('trims and collapses spaces', () => assert.deepEqual(checkNickname('  Kasia   B '), { ok: true, nick: 'Kasia B' }));
test('nickKey folds case, diacritics and separators', () => {
  assert.equal(nickKey('Michał K'), nickKey('michal_k'));
  assert.equal(nickKey('KASIA'), nickKey('kasia'));
});
