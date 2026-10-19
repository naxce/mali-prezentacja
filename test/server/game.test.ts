import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, score, type Question } from '../../server/game.ts';

let t = 0;
const now = () => t;
const Q: Question[] = [
  { text: 'Pytanie pierwsze', choices: ['A1', 'B1', 'C1', 'D1'], correct: 1 },
  { text: 'Pytanie drugie', choices: ['W2', 'X2', 'Y2', 'Z2'], correct: 3 }
];

function mk(o: { maxPlayers?: number; questions?: Question[] } = {}): Game {
  t = 0;
  return new Game({ pin: '123456', questions: o.questions || Q, now, maxPlayers: o.maxPlayers });
}
function idOf(r: ReturnType<Game['addPlayer']>): string {
  if (!r.ok) throw new Error(r.code);
  return r.id;
}
function started(): { g: Game; id: string } {
  const g = mk();
  const id = idOf(g.addPlayer('Ola'));
  g.start();
  return { g, id };
}
function correctChoiceId(g: Game, id: string, qs: Question[] = Q): string {
  const v = g.playerView(id);
  if (v.t !== 'p.question') throw new Error('not a question view');
  const want = qs[g.q].choices[qs[g.q].correct];
  const c = v.choices.find((x) => x.text === want);
  if (!c) throw new Error('choice missing');
  return c.id;
}

test('score', () => {
  assert.equal(score(0, 20000), 1000);
  assert.equal(score(10000, 20000), 750);
  assert.equal(score(20000, 20000), 500);
  assert.equal(score(25000, 20000), 500);
  assert.equal(score(-5, 20000), 1000);
});

test('lobby rules', () => {
  const g = mk();
  assert.equal(g.addPlayer('Kasia').ok, true);
  assert.deepEqual(g.addPlayer('KASIA'), { ok: false, code: 'nick-taken' });
  const small = mk({ maxPlayers: 1 });
  small.addPlayer('A1');
  assert.deepEqual(small.addPlayer('B2'), { ok: false, code: 'full' });
});

test('start needs a player, then locks', () => {
  const g = mk();
  assert.deepEqual(g.start(), { ok: false, code: 'no-players' });
  g.addPlayer('Ola');
  assert.deepEqual(g.start(), { ok: true });
  assert.equal(g.phase, 'read');
  assert.deepEqual(g.addPlayer('Late'), { ok: false, code: 'locked' });
});

test('read phase hides choices and never leaks correct', () => {
  const { g, id } = started();
  const v = g.playerView(id);
  assert.equal(v.t, 'p.question');
  if (v.t !== 'p.question') return;
  assert.equal(v.phase, 'read');
  assert.deepEqual(v.choices, []);
  const h = g.hostView();
  assert.equal(h.t, 'h.question');
  if (h.t === 'h.question') assert.deepEqual(h.choices, []);
  g.advance();
  const a = g.playerView(id);
  if (a.t !== 'p.question') throw new Error('expected question');
  assert.equal(a.choices.length, 4);
  assert.ok(!JSON.stringify(a).includes('correct'));
  assert.ok(!JSON.stringify(g.hostView()).includes('correct'));
});

test('board and every phone share one shuffled order, ids stay opaque', () => {
  const g = mk();
  const ids = Array.from({ length: 30 }, (_, i) => idOf(g.addPlayer('Gracz' + i)));
  g.start();
  g.advance();
  const h = g.hostView();
  if (h.t !== 'h.question') throw new Error('expected question');
  const board = h.choices.join('|');
  for (const id of ids) {
    const v = g.playerView(id);
    if (v.t !== 'p.question') throw new Error('expected question');
    assert.equal(v.choices.map((c) => c.text).join('|'), board);
    for (const c of v.choices) assert.ok(!/^[0-3]$/.test(c.id));
    assert.equal(new Set(v.choices.map((c) => c.id)).size, 4);
  }
  const v0 = g.playerView(ids[0]);
  if (v0.t !== 'p.question') throw new Error('expected question');
  const right = v0.choices.findIndex((c) => c.text === 'B1');
  assert.ok(right >= 0);
  g.answer(ids[0], 0, v0.choices[right].id);
  t += 60000; g.advance();
  const r = g.hostView();
  if (r.t !== 'h.reveal') throw new Error('expected reveal');
  assert.equal(r.choices.join('|'), board);
  assert.equal(r.correct, right);
  assert.equal(r.counts[right], 1);
});

test('answer window, timing from delivery, duplicates', () => {
  const { g, id } = started();
  assert.deepEqual(g.answer(id, 0, 'x'), { ok: false, code: 'not-open' });
  t = 3000; g.advance();
  t = 4000; g.markDelivered(id);
  t = 9000;
  const right = correctChoiceId(g, id);
  assert.deepEqual(g.answer(id, 1, right), { ok: false, code: 'wrong-question' });
  assert.deepEqual(g.answer(id, 0, 'zzzzzz'), { ok: false, code: 'bad-choice' });
  assert.deepEqual(g.answer(id, 0, right), { ok: true });
  assert.deepEqual(g.answer(id, 0, right), { ok: false, code: 'duplicate' });
  const locked = g.playerView(id);
  if (locked.t === 'p.question') assert.equal(locked.locked, right);
  assert.equal(g.allAnswered(), true);
  g.advance();
  const r = g.playerView(id);
  if (r.t !== 'p.reveal') throw new Error('expected reveal');
  assert.equal(r.points, 875);
  assert.equal(r.correct, right);
  assert.equal(r.chosen, right);
  assert.equal(r.rank, 1);
  const h = g.hostView();
  if (h.t !== 'h.reveal') throw new Error('expected host reveal');
  assert.equal(h.choices[h.correct], 'B1');
  assert.deepEqual(h.counts, h.choices.map((c) => (c === 'B1' ? 1 : 0)));
});

test('wrong answer scores zero', () => {
  const { g, id } = started();
  g.advance();
  const v = g.playerView(id);
  if (v.t !== 'p.question') throw new Error('expected question');
  const right = correctChoiceId(g, id);
  const wrong = v.choices.find((c) => c.id !== right);
  assert.deepEqual(g.answer(id, 0, wrong!.id), { ok: true });
  g.advance();
  const r = g.playerView(id);
  if (r.t !== 'p.reveal') throw new Error('expected reveal');
  assert.equal(r.points, 0);
  assert.equal(r.score, 0);
});

test('late answer rejected after deadline', () => {
  const { g, id } = started();
  t = 3000; g.advance();
  const right = correctChoiceId(g, id);
  t = 3000 + 20001;
  assert.deepEqual(g.answer(id, 0, right), { ok: false, code: 'not-open' });
});

test('deadline tracks phases', () => {
  const { g } = started();
  assert.equal(g.deadline(), 3000);
  t = 3000; g.advance();
  assert.equal(g.deadline(), 23000);
  g.advance();
  assert.equal(g.deadline(), null);
});

test('kick bans nick and drops from counts', () => {
  const g = mk();
  const a = idOf(g.addPlayer('Ala'));
  g.addPlayer('Ela');
  assert.equal(g.kick(a), true);
  assert.deepEqual(g.addPlayer('ala'), { ok: false, code: 'banned' });
  assert.equal(g.players().length, 1);
  assert.equal(g.hasPlayer(a), false);
});

test('playerByToken finds the player', () => {
  const g = mk();
  const r = g.addPlayer('Ola');
  if (!r.ok) throw new Error('join failed');
  assert.equal(g.playerByToken(r.token), r.id);
  assert.equal(g.playerByToken('nope'), undefined);
});

test('final standings sorted, tie broken by total time', () => {
  const one = [Q[0]];
  const g = mk({ questions: one });
  const a = idOf(g.addPlayer('Adam'));
  const b = idOf(g.addPlayer('Bartek'));
  g.start();
  t = 3000; g.advance();
  t = 8000; assert.deepEqual(g.answer(b, 0, correctChoiceId(g, b, one)), { ok: true });
  t = 8001; assert.deepEqual(g.answer(a, 0, correctChoiceId(g, a, one)), { ok: true });
  g.advance();
  assert.equal(g.advance(), 'final');
  const f = g.hostView();
  if (f.t !== 'h.final') throw new Error('expected final');
  assert.deepEqual(f.standings.map((s) => s.nick), ['Bartek', 'Adam']);
  assert.equal(f.standings[0].score, f.standings[1].score);
  const pa = g.playerView(a);
  if (pa.t !== 'p.final') throw new Error('expected player final');
  assert.equal(pa.rank, 2);
  assert.equal(pa.of, 2);
});

test('host advance during answer reveals early', () => {
  const { g } = started();
  g.advance();
  assert.equal(g.advance(), 'reveal');
});

test('reveal goes to next question in read phase', () => {
  const { g } = started();
  g.advance(); g.advance();
  assert.equal(g.advance(), 'read');
  assert.equal(g.q, 1);
});

test('delivery grace is capped at 2 s after answers open', () => {
  const { g, id } = started();
  t = 3000; g.advance();
  t = 18000; g.markDelivered(id);
  const right = correctChoiceId(g, id);
  assert.deepEqual(g.answer(id, 0, right), { ok: true });
  g.advance();
  const r = g.playerView(id);
  if (r.t !== 'p.reveal') throw new Error('expected reveal');
  assert.equal(r.points, 675);
});
