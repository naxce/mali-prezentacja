import { randomBytes, randomInt } from 'node:crypto';
import { Game, type Question } from './game.ts';
import type { ServerMsg } from '../shared/protocol.ts';

export interface Conn { id: string; ip: string; send(m: ServerMsg): void; close(): void }

export interface Entry {
  game: Game;
  hostToken: string;
  hosts: Set<Conn>;
  players: Map<string, Set<Conn>>;
  timer: ReturnType<typeof setTimeout> | null;
}

const IDLE_MS = 2 * 60 * 60 * 1000;

export class Registry {
  private readonly games = new Map<string, Entry>();
  private readonly sweeper: ReturnType<typeof setInterval>;
  private readonly questions: Question[];
  private readonly readMs?: number;
  private readonly answerMs?: number;
  private readonly now: () => number;

  constructor(o: { questions: Question[]; readMs?: number; answerMs?: number; now?: () => number }) {
    this.questions = o.questions;
    this.readMs = o.readMs;
    this.answerMs = o.answerMs;
    this.now = o.now || Date.now;
    this.sweeper = setInterval(() => this.sweep(), 60000);
    this.sweeper.unref();
  }

  create(): Entry {
    let pin = '';
    do pin = String(randomInt(100000, 1000000)); while (this.games.has(pin));
    const entry: Entry = {
      game: new Game({ pin, questions: this.questions, now: this.now, readMs: this.readMs, answerMs: this.answerMs }),
      hostToken: randomBytes(16).toString('base64url'),
      hosts: new Set(),
      players: new Map(),
      timer: null
    };
    this.games.set(pin, entry);
    return entry;
  }

  get(pin: string): Entry | undefined {
    return this.games.get(pin);
  }

  attachPlayer(e: Entry, id: string, c: Conn): void {
    let set = e.players.get(id);
    if (!set) { set = new Set(); e.players.set(id, set); }
    set.add(c);
  }

  detach(c: Conn): void {
    for (const e of this.games.values()) {
      e.hosts.delete(c);
      for (const set of e.players.values()) set.delete(c);
    }
  }

  sendPlayer(e: Entry, id: string): void {
    const set = e.players.get(id);
    if (!set || set.size === 0) return;
    e.game.markDelivered(id);
    const v = e.game.playerView(id);
    for (const c of set) c.send(v);
  }

  sendHosts(e: Entry): void {
    const v = e.game.hostView();
    for (const c of e.hosts) c.send(v);
  }

  broadcast(e: Entry): void {
    this.sendHosts(e);
    for (const id of e.players.keys()) this.sendPlayer(e, id);
  }

  phaseChanged(e: Entry): void {
    if (e.timer) { clearTimeout(e.timer); e.timer = null; }
    const d = e.game.deadline();
    if (d !== null) {
      e.timer = setTimeout(() => {
        e.timer = null;
        e.game.advance();
        this.phaseChanged(e);
      }, Math.max(0, d - this.now()));
    }
    this.broadcast(e);
  }

  kick(e: Entry, id: string): void {
    if (!e.game.kick(id)) return;
    const set = e.players.get(id);
    e.players.delete(id);
    if (set) for (const c of set) { c.send({ t: 'kicked' }); c.close(); }
    if (e.game.allAnswered()) { e.game.advance(); this.phaseChanged(e); } else this.broadcast(e);
  }

  sweep(): void {
    const limit = this.now() - IDLE_MS;
    for (const [pin, e] of this.games) {
      if (e.game.lastActivity < limit) {
        if (e.timer) clearTimeout(e.timer);
        this.games.delete(pin);
      }
    }
  }

  stop(): void {
    clearInterval(this.sweeper);
    for (const e of this.games.values()) if (e.timer) clearTimeout(e.timer);
    this.games.clear();
  }
}
