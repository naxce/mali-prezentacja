import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import WebSocket from 'ws';
import { startServer } from '../../server/http.ts';
import type { Question } from '../../server/game.ts';
import type { ServerMsg } from '../../shared/protocol.ts';
import { wsClient, pollClient, join, ORIGIN, type Client } from './helpers.ts';

const KEY = 'test-host-key-123';
const QS: Question[] = [
  { text: 'Pierwsze', choices: ['A', 'B', 'C', 'D'], correct: 2 },
  { text: 'Drugie', choices: ['E', 'F', 'G', 'H'], correct: 0 }
];
let srv: { port: number; close(): Promise<void> };
let ipSeq = 0;
const ip = () => `10.9.${Math.floor(++ipSeq / 250)}.${ipSeq % 250}`;

before(async () => {
  srv = await startServer({ hostKey: KEY, port: 0, origins: [ORIGIN], trustProxy: true, questionsPath: '', powBits: 4, readMs: 60, answerMs: 600 }, QS);
});
after(async () => { await srv.close(); });

async function host(): Promise<{ c: Client; pin: string; hostToken: string }> {
  const c = await wsClient(srv.port, ip());
  c.send({ t: 'host.create', key: KEY });
  const m = await c.next((x) => x.t === 'host.created' || x.t === 'error');
  if (m.t !== 'host.created') throw new Error('host failed ' + JSON.stringify(m));
  return { c, pin: m.pin, hostToken: m.hostToken };
}

function rightId(m: ServerMsg): string {
  if (m.t !== 'p.question') throw new Error('not question');
  const want = QS[m.q].choices[QS[m.q].correct];
  return m.choices.find((c) => c.text === want)!.id;
}

const isAnswerQ = (q: number) => (m: ServerMsg) => m.t === 'p.question' && m.phase === 'answer' && m.q === q;

test('health', async () => {
  const r = await fetch(`http://127.0.0.1:${srv.port}/wos/mali/api/health`);
  assert.deepEqual(await r.json(), { ok: true });
});

test('bad host key then rate-limited', async () => {
  const c = await wsClient(srv.port, '10.1.1.1');
  for (let i = 0; i < 5; i++) {
    c.send({ t: 'host.create', key: 'wrong-key-wrong-key' });
    assert.deepEqual(await c.next((m) => m.t === 'error'), { t: 'error', code: 'bad-key' });
  }
  c.send({ t: 'host.create', key: KEY });
  assert.deepEqual(await c.next((m) => m.t === 'error'), { t: 'error', code: 'rate-limited' });
  c.close();
});

async function playGame(second: Client) {
  const h = await host();
  const p1 = await wsClient(srv.port, ip());
  assert.equal((await join(p1, h.pin, 'Kasia')).t, 'joined');
  assert.equal((await join(second, h.pin, 'Ola')).t, 'joined');
  await h.c.next((m) => m.t === 'h.lobby' && m.players.length === 2);
  h.c.send({ t: 'host.start' });
  for (let q = 0; q < QS.length; q++) {
    const r1 = await p1.next((m) => m.t === 'p.question' && m.phase === 'read' && m.q === q);
    if (r1.t === 'p.question') assert.deepEqual(r1.choices, []);
    const a1 = await p1.next(isAnswerQ(q));
    const a2 = await second.next(isAnswerQ(q));
    p1.send({ t: 'answer', q, choice: rightId(a1) });
    second.send({ t: 'answer', q, choice: rightId(a2) });
    const hr = await h.c.next((m) => m.t === 'h.reveal' && m.q === q);
    if (hr.t === 'h.reveal') assert.equal(hr.counts.reduce((a, b) => a + b, 0), 2);
    for (const p of [p1, second]) {
      const pr = await p.next((m) => m.t === 'p.reveal' && m.q === q);
      if (pr.t === 'p.reveal') { assert.ok(pr.points >= 500 && pr.points <= 1000, String(pr.points)); assert.equal(pr.correct, pr.chosen); }
    }
    h.c.send({ t: 'host.next' });
  }
  const hf = await h.c.next((m) => m.t === 'h.final');
  if (hf.t === 'h.final') assert.equal(hf.standings.length, 2);
  assert.equal((await p1.next((m) => m.t === 'p.final')).t, 'p.final');
  assert.equal((await second.next((m) => m.t === 'p.final')).t, 'p.final');
  for (const c of [p1, second, h.c]) {
    for (const m of c.msgs) if (m.t === 'p.question' || m.t === 'h.question') assert.ok(!JSON.stringify(m).includes('correct'));
  }
  p1.close(); second.close(); h.c.close();
}

test('full game over ws', async () => { await playGame(await wsClient(srv.port, ip())); });

test('poll player plays alongside ws player', async () => { await playGame(await pollClient(srv.port, ip())); });

test('bad origin rejected', async () => {
  await assert.rejects(wsClient(srv.port, ip(), 'https://evil.example'));
  const r = await fetch(`http://127.0.0.1:${srv.port}/wos/mali/api/open`, { method: 'POST', headers: { origin: 'https://evil.example' }, body: '{}' });
  assert.equal(r.status, 403);
  const r2 = await fetch(`http://127.0.0.1:${srv.port}/wos/mali/api/open`, { method: 'POST', body: '{}' });
  assert.equal(r2.status, 403);
});

test('oversize message closes connection', async () => {
  const c = await wsClient(srv.port, ip());
  c.send(JSON.stringify({ t: 'ping', at: 1, pad: 'x'.repeat(2000) }));
  await c.closed;
});

test('unknown message closes connection', async () => {
  const c = await wsClient(srv.port, ip());
  c.send('{"t":"nope"}');
  await c.closed;
  assert.deepEqual(c.msgs.pop(), { t: 'error', code: 'bad-msg' });
});

test('school NAT: 40 joins from one IP succeed', async () => {
  const h = await host();
  const results = await Promise.all(Array.from({ length: 40 }, async (_, i) => {
    const c = await wsClient(srv.port, '10.0.0.1');
    const r = await join(c, h.pin, 'Uczen' + i);
    c.close();
    return r.t;
  }));
  assert.deepEqual(results.filter((t) => t === 'joined').length, 40);
  h.c.close();
});

test('wrong PINs raise PoW difficulty instead of locking the class out', async () => {
  const h = await host();
  const wrong = h.pin === '999999' ? '999998' : '999999';
  const probe = await wsClient(srv.port, '10.0.0.2');
  probe.send({ t: 'challenge' });
  const before = await probe.next((m) => m.t === 'challenge');
  probe.close();
  for (let i = 0; i < 12; i++) {
    const c = await wsClient(srv.port, '10.0.0.2');
    assert.deepEqual(await join(c, wrong, 'Zly' + i), { t: 'error', code: 'bad-pin' });
    c.close();
  }
  const bad = await wsClient(srv.port, '10.0.0.2');
  bad.send({ t: 'challenge' });
  const after = await bad.next((m) => m.t === 'challenge');
  if (before.t === 'challenge' && after.t === 'challenge') assert.ok(after.bits > before.bits, `${before.bits} -> ${after.bits}`);
  const classmate = await wsClient(srv.port, '10.0.0.2');
  assert.equal((await join(classmate, h.pin, 'Klasa')).t, 'joined');
  bad.close(); classmate.close(); h.c.close();
});

test('forged PoW floods do not drain the join budget', async () => {
  const h = await host();
  const bot = await wsClient(srv.port, '10.0.0.3');
  for (let i = 0; i < 70; i++) {
    bot.send({ t: 'join', pin: h.pin, nick: 'Bot' + i, pow: { token: '9999999999999.4.aa.bb', nonce: '1' } });
    await bot.next((m) => m.t === 'error');
    if (i % 15 === 14) await new Promise((r) => setTimeout(r, 1600));
  }
  const kid = await wsClient(srv.port, '10.0.0.3');
  assert.equal((await join(kid, h.pin, 'Uczciwy')).t, 'joined');
  bot.close(); kid.close(); h.c.close();
});

test('junk host keys lock only that connection, never resume', async () => {
  const h = await host();
  const prank = await wsClient(srv.port, '10.0.0.9');
  for (let i = 0; i < 6; i++) { prank.send({ t: 'host.create', key: 'zly-klucz-zly-klucz' }); await prank.next((m) => m.t === 'error'); }
  const teacher = await wsClient(srv.port, '10.0.0.9');
  teacher.send({ t: 'host.resume', pin: h.pin, hostToken: h.hostToken });
  assert.equal((await teacher.next((m) => m.t === 'host.created' || m.t === 'error')).t, 'host.created');
  const fresh = await wsClient(srv.port, '10.0.0.9');
  fresh.send({ t: 'host.create', key: KEY });
  assert.equal((await fresh.next((m) => m.t === 'host.created' || m.t === 'error')).t, 'host.created');
  prank.close(); teacher.close(); fresh.close(); h.c.close();
});

test('stale host.next is ignored', async () => {
  const h = await host();
  const p = await wsClient(srv.port, ip());
  await join(p, h.pin, 'Hubert');
  h.c.send({ t: 'host.start' });
  await h.c.next((m) => m.t === 'h.question' && m.phase === 'answer' && m.q === 0);
  h.c.send({ t: 'host.next', q: 0, phase: 'read' });
  await new Promise((r) => setTimeout(r, 150));
  assert.ok(!h.c.msgs.some((m) => m.t === 'h.reveal'), 'stale next must not reveal');
  h.c.send({ t: 'host.next', q: 0, phase: 'answer' });
  assert.equal((await h.c.next((m) => m.t === 'h.reveal')).t, 'h.reveal');
  p.close(); h.c.close();
});

test('poll sessions are capped per IP', async () => {
  const codes: number[] = [];
  for (let i = 0; i < 130; i++) {
    const r = await fetch(`http://127.0.0.1:${srv.port}/wos/mali/api/open`, { method: 'POST', headers: { origin: ORIGIN, 'x-real-ip': '10.77.0.1' }, body: '{}' });
    codes.push(r.status);
  }
  assert.ok(codes.indexOf(429) >= 0, 'expected 429 after many opens');
  const other = await fetch(`http://127.0.0.1:${srv.port}/wos/mali/api/open`, { method: 'POST', headers: { origin: ORIGIN, 'x-real-ip': '10.77.0.2' }, body: '{}' });
  assert.equal(other.status, 200);
});

test('pow required', async () => {
  const h = await host();
  const c = await wsClient(srv.port, ip());
  c.send({ t: 'join', pin: h.pin, nick: 'Bot', pow: { token: '9999999999999.4.aa.bb', nonce: '1' } });
  assert.deepEqual(await c.next((m) => m.t === 'error'), { t: 'error', code: 'pow-failed' });
  c.send({ t: 'challenge' });
  const ch = await c.next((m) => m.t === 'challenge');
  if (ch.t !== 'challenge') throw new Error('no challenge');
  const { solve } = await import('../../shared/pow.ts');
  const nonce = solve(ch.token, ch.bits) as string;
  c.send({ t: 'join', pin: h.pin, nick: 'Pierwszy', pow: { token: ch.token, nonce } });
  assert.equal((await c.next((m) => m.t === 'joined' || m.t === 'error')).t, 'joined');
  const c2 = await wsClient(srv.port, ip());
  c2.send({ t: 'join', pin: h.pin, nick: 'Drugi', pow: { token: ch.token, nonce } });
  assert.deepEqual(await c2.next((m) => m.t === 'error'), { t: 'error', code: 'pow-failed' });
  c.close(); c2.close(); h.c.close();
});

test('blocked nick rejected', async () => {
  const h = await host();
  const c = await wsClient(srv.port, ip());
  assert.deepEqual(await join(c, h.pin, 'Adolf H'), { t: 'error', code: 'nick-blocked' });
  assert.deepEqual(await join(c, h.pin, '<script>'), { t: 'error', code: 'nick-invalid' });
  c.close(); h.c.close();
});

test('resume restores phase view', async () => {
  const h = await host();
  const p = await wsClient(srv.port, ip());
  const other = await wsClient(srv.port, ip());
  const j = await join(p, h.pin, 'Zuzia');
  if (j.t !== 'joined') throw new Error('join failed');
  await join(other, h.pin, 'Druga');
  h.c.send({ t: 'host.start' });
  const a = await p.next(isAnswerQ(0));
  p.send({ t: 'answer', q: 0, choice: rightId(a) });
  await p.next((m) => m.t === 'p.reveal' && m.q === 0, 3000);
  h.c.send({ t: 'host.next' });
  const a2 = await p.next(isAnswerQ(1));
  const wrong = (a2 as Extract<ServerMsg, { t: 'p.question' }>).choices.find((c) => c.id !== rightId(a2))!.id;
  p.send({ t: 'answer', q: 1, choice: wrong });
  await p.next((m) => m.t === 'p.question' && m.locked === wrong);
  p.close();
  await p.closed;
  const p2 = await wsClient(srv.port, ip());
  p2.send({ t: 'resume', pin: h.pin, token: j.token });
  const rj = await p2.next((m) => m.t === 'joined');
  if (rj.t === 'joined') assert.equal(rj.playerId, j.playerId);
  const view = await p2.next((m) => m.t === 'p.question');
  if (view.t === 'p.question') { assert.equal(view.locked, wrong); assert.equal(view.q, 1); }
  const rev = await p2.next((m) => m.t === 'p.reveal', 3000);
  if (rev.t === 'p.reveal') { assert.ok(rev.score >= 500, 'score kept: ' + rev.score); assert.equal(rev.chosen, wrong); assert.equal(rev.points, 0); }
  p2.send({ t: 'resume', pin: h.pin, token: 'not-a-token' });
  assert.deepEqual(await p2.next((m) => m.t === 'error'), { t: 'error', code: 'expired' });
  p2.close(); other.close(); h.c.close();
});

test('host.resume', async () => {
  const h = await host();
  const p = await wsClient(srv.port, ip());
  await join(p, h.pin, 'Lena');
  h.c.close();
  await h.c.closed;
  const h2 = await wsClient(srv.port, ip());
  h2.send({ t: 'host.resume', pin: h.pin, hostToken: 'x'.repeat(22) });
  assert.deepEqual(await h2.next((m) => m.t === 'error'), { t: 'error', code: 'bad-key' });
  h2.send({ t: 'host.resume', pin: h.pin, hostToken: h.hostToken });
  const v = await h2.next((m) => m.t === 'h.lobby');
  if (v.t === 'h.lobby') assert.deepEqual(v.players.map((x) => x.nick), ['Lena']);
  h2.send({ t: 'host.start' });
  assert.equal((await p.next((m) => m.t === 'p.question')).t, 'p.question');
  p.close(); h2.close();
});

test('kick', async () => {
  const h = await host();
  const p = await wsClient(srv.port, ip());
  const j = await join(p, h.pin, 'Ala');
  if (j.t !== 'joined') throw new Error('join failed');
  h.c.send({ t: 'host.kick', playerId: j.playerId });
  assert.equal((await p.next((m) => m.t === 'kicked')).t, 'kicked');
  await p.closed;
  const again = await wsClient(srv.port, ip());
  assert.deepEqual(await join(again, h.pin, 'ala'), { t: 'error', code: 'banned' });
  again.close(); h.c.close();
});

test('player cannot drive host actions', async () => {
  const h = await host();
  const p = await wsClient(srv.port, ip());
  await join(p, h.pin, 'Igor');
  p.send({ t: 'host.start' });
  assert.deepEqual(await p.next((m) => m.t === 'error'), { t: 'error', code: 'bad-key' });
  p.close(); h.c.close();
});

test('start with no players refused, late join locked', async () => {
  const h = await host();
  h.c.send({ t: 'host.start' });
  assert.deepEqual(await h.c.next((m) => m.t === 'error'), { t: 'error', code: 'no-players' });
  const p = await wsClient(srv.port, ip());
  await join(p, h.pin, 'Maja');
  h.c.send({ t: 'host.start' });
  await p.next((m) => m.t === 'p.question');
  const late = await wsClient(srv.port, ip());
  assert.deepEqual(await join(late, h.pin, 'Spoznialski'), { t: 'error', code: 'locked' });
  p.close(); late.close(); h.c.close();
});

test('raw ws without x-real-ip uses socket address when proxy untrusted', async () => {
  const s2 = await startServer({ hostKey: KEY, port: 0, origins: [ORIGIN], trustProxy: false, questionsPath: '', powBits: 4 }, QS);
  const codes: string[] = [];
  for (let i = 0; i < 31; i++) {
    const c = await wsClient(s2.port, '10.50.0.' + i);
    c.send({ t: 'host.create', key: 'nope-nope-nope' });
    const m = await c.next((x) => x.t === 'error');
    codes.push(m.t === 'error' ? m.code : '');
    c.close();
  }
  assert.equal(codes[29], 'bad-key');
  assert.equal(codes[30], 'rate-limited');
  await s2.close();
});

void WebSocket;
