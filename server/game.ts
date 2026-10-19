import { randomBytes, randomInt } from 'node:crypto';
import { nickKey } from '../shared/nickname.ts';
import type { PlayerRow, ServerMsg, Standing } from '../shared/protocol.ts';

export interface Question { text: string; choices: [string, string, string, string]; correct: 0 | 1 | 2 | 3 }
export type Phase = 'lobby' | 'read' | 'answer' | 'reveal' | 'final';

export function score(tMs: number, windowMs: number): number {
  const t = Math.min(Math.max(tMs, 0), windowMs);
  return Math.round(1000 * (1 - 0.5 * t / windowMs));
}

interface Answer { idx: number; points: number }
interface Player { id: string; nick: string; key: string; token: string; score: number; time: number; seq: number; answers: Map<number, Answer> }
interface Shuffle { order: number[]; ids: string[] }

type AddResult = { ok: true; id: string; token: string; nick: string } | { ok: false; code: 'nick-taken' | 'banned' | 'locked' | 'full' };
type AnswerResult = { ok: true } | { ok: false; code: 'not-open' | 'duplicate' | 'bad-choice' | 'wrong-question' };

const rid = (n: number): string => randomBytes(n).toString('base64url');

const DELIVERY_GRACE_MS = 2000;

export class Game {
  readonly pin: string;
  phase: Phase = 'lobby';
  q = 0;
  lastActivity: number;
  private readonly questions: Question[];
  private readonly now: () => number;
  private readonly maxPlayers: number;
  private readonly readMs: number;
  private readonly answerMs: number;
  private readonly roster = new Map<string, Player>();
  private readonly banned = new Set<string>();
  private readonly shuffles = new Map<string, Shuffle>();
  private order: number[] = [0, 1, 2, 3];
  private readonly delivered = new Map<string, number>();
  private seq = 0;
  private phaseStart = 0;

  constructor(o: { pin: string; questions: Question[]; now: () => number; maxPlayers?: number; readMs?: number; answerMs?: number }) {
    this.pin = o.pin;
    this.questions = o.questions;
    this.now = o.now;
    this.maxPlayers = o.maxPlayers ?? 80;
    this.readMs = o.readMs ?? 3000;
    this.answerMs = o.answerMs ?? 20000;
    this.lastActivity = o.now();
  }

  private touch(): void { this.lastActivity = this.now(); }

  addPlayer(nick: string): AddResult {
    const key = nickKey(nick);
    if (this.banned.has(key)) return { ok: false, code: 'banned' };
    if (this.phase !== 'lobby') return { ok: false, code: 'locked' };
    for (const p of this.roster.values()) if (p.key === key) return { ok: false, code: 'nick-taken' };
    if (this.roster.size >= this.maxPlayers) return { ok: false, code: 'full' };
    const p: Player = { id: rid(6), nick, key, token: rid(16), score: 0, time: 0, seq: this.seq++, answers: new Map() };
    this.roster.set(p.id, p);
    this.touch();
    return { ok: true, id: p.id, token: p.token, nick };
  }

  playerByToken(token: string): string | undefined {
    for (const p of this.roster.values()) if (p.token === token) return p.id;
    return undefined;
  }

  hasPlayer(id: string): boolean { return this.roster.has(id); }

  kick(id: string): boolean {
    const p = this.roster.get(id);
    if (!p) return false;
    this.roster.delete(id);
    this.banned.add(p.key);
    this.touch();
    return true;
  }

  start(): { ok: true } | { ok: false; code: 'no-players' } {
    if (this.roster.size === 0) return { ok: false, code: 'no-players' };
    if (this.phase === 'lobby') this.enterRead(0);
    return { ok: true };
  }

  private enterRead(q: number): void {
    this.q = q;
    this.phase = 'read';
    this.phaseStart = this.now();
    this.shuffles.clear();
    this.order = [0, 1, 2, 3];
    for (let i = 3; i > 0; i--) {
      const j = randomInt(i + 1);
      const tmp = this.order[i]; this.order[i] = this.order[j]; this.order[j] = tmp;
    }
    this.delivered.clear();
    this.touch();
  }

  advance(): Phase {
    if (this.phase === 'read') {
      this.phase = 'answer';
      this.phaseStart = this.now();
      this.touch();
    } else if (this.phase === 'answer') {
      for (const p of this.roster.values()) if (!p.answers.has(this.q)) p.time += this.answerMs;
      this.phase = 'reveal';
      this.touch();
    } else if (this.phase === 'reveal') {
      if (this.q + 1 < this.questions.length) this.enterRead(this.q + 1);
      else { this.phase = 'final'; this.touch(); }
    }
    return this.phase;
  }

  deadline(): number | null {
    if (this.phase === 'read') return this.phaseStart + this.readMs;
    if (this.phase === 'answer') return this.phaseStart + this.answerMs;
    return null;
  }

  markDelivered(id: string): void {
    if (this.phase === 'answer' && this.roster.has(id) && !this.delivered.has(id)) this.delivered.set(id, this.now());
  }

  private shuffle(id: string): Shuffle {
    let s = this.shuffles.get(id);
    if (!s) {
      const ids = new Set<string>();
      while (ids.size < 4) ids.add(rid(4));
      s = { order: this.order, ids: [...ids] };
      this.shuffles.set(id, s);
    }
    return s;
  }

  answer(id: string, q: number, choice: string): AnswerResult {
    const p = this.roster.get(id);
    if (q !== this.q) return { ok: false, code: 'wrong-question' };
    const end = this.deadline();
    if (this.phase !== 'answer' || end === null || this.now() > end || !p) return { ok: false, code: 'not-open' };
    if (p.answers.has(q)) return { ok: false, code: 'duplicate' };
    const s = this.shuffle(id);
    const pos = s.ids.indexOf(choice);
    if (pos < 0) return { ok: false, code: 'bad-choice' };
    const idx = s.order[pos];
    const start = Math.min(this.delivered.get(id) ?? this.phaseStart, this.phaseStart + DELIVERY_GRACE_MS);
    const t = Math.max(0, this.now() - start);
    const points = idx === this.questions[q].correct ? score(t, this.answerMs) : 0;
    p.answers.set(q, { idx, points });
    p.score += points;
    p.time += Math.min(t, this.answerMs);
    this.touch();
    return { ok: true };
  }

  allAnswered(): boolean {
    if (this.phase !== 'answer' || this.roster.size === 0) return false;
    for (const p of this.roster.values()) if (!p.answers.has(this.q)) return false;
    return true;
  }

  players(): PlayerRow[] {
    return [...this.roster.values()].sort((a, b) => a.seq - b.seq).map((p) => ({ id: p.id, nick: p.nick }));
  }

  private ranked(): Player[] {
    return [...this.roster.values()].sort((a, b) => b.score - a.score || a.time - b.time || a.seq - b.seq);
  }

  private standings(n?: number): Standing[] {
    const r = this.ranked();
    return (n === undefined ? r : r.slice(0, n)).map((p) => ({ nick: p.nick, score: p.score }));
  }

  private endsIn(): number {
    const d = this.deadline();
    return d === null ? 0 : Math.max(0, d - this.now());
  }

  private answeredCount(): number {
    let n = 0;
    for (const p of this.roster.values()) if (p.answers.has(this.q)) n++;
    return n;
  }

  hostView(): ServerMsg {
    const total = this.questions.length;
    const qq = this.questions[this.q];
    if (this.phase === 'lobby') return { t: 'h.lobby', pin: this.pin, players: this.players() };
    if (this.phase === 'read' || this.phase === 'answer') {
      return { t: 'h.question', q: this.q, total, phase: this.phase, text: qq.text, choices: this.phase === 'answer' ? this.order.map((i) => qq.choices[i]) : [], endsIn: this.endsIn(), answered: this.answeredCount(), of: this.roster.size };
    }
    if (this.phase === 'reveal') {
      const counts = [0, 0, 0, 0];
      for (const p of this.roster.values()) { const a = p.answers.get(this.q); if (a) counts[a.idx]++; }
      return { t: 'h.reveal', q: this.q, total, text: qq.text, choices: this.order.map((i) => qq.choices[i]), correct: this.order.indexOf(qq.correct), counts: this.order.map((i) => counts[i]), top: this.standings(5) };
    }
    return { t: 'h.final', standings: this.standings() };
  }

  playerView(id: string): ServerMsg {
    const p = this.roster.get(id);
    if (!p) return { t: 'error', code: 'expired' };
    const total = this.questions.length;
    const qq = this.questions[this.q];
    if (this.phase === 'lobby') return { t: 'p.lobby', nick: p.nick, count: this.roster.size };
    if (this.phase === 'read') return { t: 'p.question', q: this.q, total, phase: 'read', text: qq.text, choices: [], endsIn: this.endsIn(), locked: null };
    const s = this.shuffle(id);
    const a = p.answers.get(this.q);
    const chosen = a ? s.ids[s.order.indexOf(a.idx)] : null;
    if (this.phase === 'answer') {
      return { t: 'p.question', q: this.q, total, phase: 'answer', text: qq.text, choices: s.order.map((idx, i) => ({ id: s.ids[i], text: qq.choices[idx] })), endsIn: this.endsIn(), locked: chosen };
    }
    const ranked = this.ranked();
    const rank = ranked.indexOf(p) + 1;
    if (this.phase === 'reveal') {
      return { t: 'p.reveal', q: this.q, total, correct: s.ids[s.order.indexOf(qq.correct)], chosen, points: a ? a.points : 0, score: p.score, rank, of: ranked.length };
    }
    return { t: 'p.final', score: p.score, rank, of: ranked.length, podium: this.standings(3) };
  }
}
