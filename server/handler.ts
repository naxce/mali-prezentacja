import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { parseClientMsg, type ClientMsg, type ErrorCode } from '../shared/protocol.ts';
import { checkNickname } from '../shared/nickname.ts';
import { createChallenge, verifyChallenge } from './pow.ts';
import { Buckets } from './ratelimit.ts';
import type { Config } from './config.ts';
import type { Conn, Entry, Registry } from './registry.ts';

interface Session { role: 'none' | 'host' | 'player'; pin?: string; playerId?: string }

const digest = (s: string): Buffer => createHash('sha256').update(s).digest();

const safeEqual = (a: string, b: string): boolean => timingSafeEqual(digest(a), digest(b));

export class Handler {
  private readonly sessions = new WeakMap<Conn, Session>();
  private readonly msgBuckets = new WeakMap<Conn, Buckets>();
  private readonly joins = new Buckets(60, 1);
  private readonly wrongPins = new Map<string, { n: number; at: number }>();
  private readonly hostAttempts = new Buckets(30, 0.5);
  private readonly hostConn = new WeakMap<Conn, Buckets>();
  private readonly powSecret = randomBytes(32).toString('hex');
  private readonly seen = new Map<string, number>();
  private readonly hostKey: string;
  private readonly powBits: number;
  private readonly reg: Registry;

  constructor(cfg: Config, reg: Registry) {
    this.hostKey = cfg.hostKey;
    this.powBits = cfg.powBits;
    this.reg = reg;
  }

  private session(c: Conn): Session {
    let s = this.sessions.get(c);
    if (!s) { s = { role: 'none' }; this.sessions.set(c, s); }
    return s;
  }

  private err(c: Conn, code: ErrorCode): void {
    c.send({ t: 'error', code });
  }

  private hostTake(c: Conn): boolean {
    let b = this.hostConn.get(c);
    if (!b) { b = new Buckets(5, 1 / 12); this.hostConn.set(c, b); }
    return b.take('h');
  }

  private wrongCount(ip: string): number {
    const w = this.wrongPins.get(ip);
    if (!w) return 0;
    const n = Math.max(0, w.n - Math.floor((Date.now() - w.at) / 15000));
    if (n === 0) this.wrongPins.delete(ip);
    return n;
  }

  private bitsFor(ip: string): number {
    return this.powBits + Math.min(8, Math.floor(this.wrongCount(ip) / 4));
  }

  closed(c: Conn): void {
    this.reg.detach(c);
  }

  handle(c: Conn, raw: string): void {
    let bucket = this.msgBuckets.get(c);
    if (!bucket) { bucket = new Buckets(20, 10); this.msgBuckets.set(c, bucket); }
    if (!bucket.take('m')) { c.close(); return; }
    const m = parseClientMsg(raw);
    if (!m) { this.err(c, 'bad-msg'); c.close(); return; }
    try {
      this.dispatch(c, m);
    } catch (e) {
      console.error('handler', e);
      this.err(c, 'bad-msg');
    }
  }

  private hostEntry(c: Conn): Entry | null {
    const s = this.session(c);
    if (s.role !== 'host' || !s.pin) { this.err(c, 'bad-key'); return null; }
    const e = this.reg.get(s.pin);
    if (!e) { this.err(c, 'expired'); return null; }
    return e;
  }

  private dispatch(c: Conn, m: ClientMsg): void {
    const s = this.session(c);
    switch (m.t) {
      case 'ping':
        c.send({ t: 'pong', at: m.at });
        return;
      case 'challenge':
        { const bits = this.bitsFor(c.ip); c.send({ t: 'challenge', token: createChallenge(this.powSecret, Date.now(), bits), bits }); }
        return;
      case 'host.create': {
        if (!this.hostTake(c) || !this.hostAttempts.take(c.ip)) return this.err(c, 'rate-limited');
        if (!safeEqual(m.key, this.hostKey)) return this.err(c, 'bad-key');
        const e = this.reg.create();
        this.reg.detach(c);
        e.hosts.add(c);
        Object.assign(s, { role: 'host', pin: e.game.pin, playerId: undefined });
        c.send({ t: 'host.created', pin: e.game.pin, hostToken: e.hostToken });
        this.reg.sendHosts(e);
        return;
      }
      case 'host.resume': {
        if (!this.hostTake(c)) return this.err(c, 'rate-limited');
        const e = this.reg.get(m.pin);
        if (!e || !safeEqual(m.hostToken, e.hostToken)) return this.err(c, 'bad-key');
        this.reg.detach(c);
        e.hosts.add(c);
        Object.assign(s, { role: 'host', pin: e.game.pin, playerId: undefined });
        c.send({ t: 'host.created', pin: e.game.pin, hostToken: e.hostToken });
        this.reg.sendHosts(e);
        return;
      }
      case 'host.start': {
        const e = this.hostEntry(c);
        if (!e) return;
        if (e.game.phase !== 'lobby') return this.reg.sendHosts(e);
        const r = e.game.start();
        if (!r.ok) return this.err(c, r.code);
        this.reg.phaseChanged(e);
        return;
      }
      case 'host.next': {
        const e = this.hostEntry(c);
        if (!e) return;
        if (e.game.phase === 'lobby' || e.game.phase === 'final') return this.reg.sendHosts(e);
        if (m.q !== undefined && (m.q !== e.game.q || m.phase !== e.game.phase)) return this.reg.sendHosts(e);
        e.game.advance();
        this.reg.phaseChanged(e);
        return;
      }
      case 'host.kick': {
        const e = this.hostEntry(c);
        if (e) this.reg.kick(e, m.playerId);
        return;
      }
      case 'join': {
        if (verifyChallenge(this.powSecret, m.pow.token, m.pow.nonce, this.powBits, Date.now(), this.seen) !== 'ok') return this.err(c, 'pow-failed');
        if (!this.joins.take(c.ip)) return this.err(c, 'rate-limited');
        const e = this.reg.get(m.pin);
        if (!e) {
          this.wrongPins.set(c.ip, { n: this.wrongCount(c.ip) + 1, at: Date.now() });
          return this.err(c, 'bad-pin');
        }
        const nick = checkNickname(m.nick);
        if (!nick.ok) return this.err(c, nick.reason === 'blocked' ? 'nick-blocked' : 'nick-invalid');
        const r = e.game.addPlayer(nick.nick);
        if (!r.ok) return this.err(c, r.code);
        this.reg.detach(c);
        this.reg.attachPlayer(e, r.id, c);
        Object.assign(s, { role: 'player', pin: e.game.pin, playerId: r.id });
        c.send({ t: 'joined', token: r.token, playerId: r.id, nick: r.nick });
        this.reg.broadcast(e);
        return;
      }
      case 'resume': {
        const e = this.reg.get(m.pin);
        const id = e ? e.game.playerByToken(m.token) : undefined;
        if (!e || !id) return this.err(c, 'expired');
        this.reg.detach(c);
        this.reg.attachPlayer(e, id, c);
        Object.assign(s, { role: 'player', pin: e.game.pin, playerId: id });
        c.send({ t: 'joined', token: m.token, playerId: id, nick: e.game.players().find((p) => p.id === id)?.nick || '' });
        this.reg.sendPlayer(e, id);
        return;
      }
      case 'answer': {
        const e = s.role === 'player' && s.pin ? this.reg.get(s.pin) : undefined;
        if (!e || !s.playerId || !e.game.hasPlayer(s.playerId)) return this.err(c, 'expired');
        const r = e.game.answer(s.playerId, m.q, m.choice);
        if (!r.ok) return this.err(c, r.code);
        if (e.game.allAnswered()) { e.game.advance(); this.reg.phaseChanged(e); return; }
        this.reg.sendPlayer(e, s.playerId);
        this.reg.sendHosts(e);
        return;
      }
    }
  }
}
