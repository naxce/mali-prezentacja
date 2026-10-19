export type ErrorCode = 'bad-pin' | 'locked' | 'full' | 'nick-taken' | 'nick-invalid' | 'nick-blocked' | 'banned' | 'rate-limited' | 'pow-failed' | 'bad-key' | 'no-players' | 'expired' | 'not-open' | 'duplicate' | 'bad-choice' | 'wrong-question' | 'bad-msg';

export type ClientMsg =
  | { t: 'challenge' }
  | { t: 'host.create'; key: string }
  | { t: 'host.resume'; pin: string; hostToken: string }
  | { t: 'host.start' }
  | { t: 'host.next'; q?: number; phase?: 'read' | 'answer' | 'reveal' }
  | { t: 'host.kick'; playerId: string }
  | { t: 'join'; pin: string; nick: string; pow: { token: string; nonce: string } }
  | { t: 'resume'; pin: string; token: string }
  | { t: 'answer'; q: number; choice: string }
  | { t: 'ping'; at: number };

export interface PlayerRow { id: string; nick: string }
export interface Standing { nick: string; score: number }

export type ServerMsg =
  | { t: 'challenge'; token: string; bits: number }
  | { t: 'error'; code: ErrorCode }
  | { t: 'pong'; at: number }
  | { t: 'host.created'; pin: string; hostToken: string }
  | { t: 'joined'; token: string; playerId: string; nick: string }
  | { t: 'kicked' }
  | { t: 'h.lobby'; pin: string; players: PlayerRow[] }
  | { t: 'h.question'; q: number; total: number; phase: 'read' | 'answer'; text: string; choices: string[]; endsIn: number; answered: number; of: number }
  | { t: 'h.reveal'; q: number; total: number; text: string; choices: string[]; correct: number; counts: number[]; top: Standing[] }
  | { t: 'h.final'; standings: Standing[] }
  | { t: 'p.lobby'; nick: string; count: number }
  | { t: 'p.question'; q: number; total: number; phase: 'read' | 'answer'; text: string; choices: { id: string; text: string }[]; endsIn: number; locked: string | null }
  | { t: 'p.reveal'; q: number; total: number; correct: string; chosen: string | null; points: number; score: number; rank: number; of: number }
  | { t: 'p.final'; score: number; rank: number; of: number; podium: Standing[] };

export const MAX_MSG_BYTES = 1024;

const encoder = new TextEncoder();
const PIN = /^\d{6}$/;
const NONCE = /^\d{1,20}$/;

const str = (v: unknown, max: number): v is string => typeof v === 'string' && v.length > 0 && v.length <= max;

export function parseClientMsg(raw: string): ClientMsg | null {
  if (typeof raw !== 'string' || encoder.encode(raw).length > MAX_MSG_BYTES) return null;
  let o: unknown;
  try { o = JSON.parse(raw); } catch { return null; }
  if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
  const m = o as Record<string, unknown>;
  switch (m.t) {
    case 'challenge': return { t: 'challenge' };
    case 'host.start': return { t: 'host.start' };
    case 'host.next':
      if (typeof m.q === 'number' && Number.isInteger(m.q) && m.q >= 0 && m.q < 50 && (m.phase === 'read' || m.phase === 'answer' || m.phase === 'reveal')) return { t: 'host.next', q: m.q, phase: m.phase };
      return { t: 'host.next' };
    case 'host.create': return str(m.key, 128) ? { t: 'host.create', key: m.key } : null;
    case 'host.resume': return str(m.pin, 6) && PIN.test(m.pin) && str(m.hostToken, 64) ? { t: 'host.resume', pin: m.pin, hostToken: m.hostToken } : null;
    case 'host.kick': return str(m.playerId, 32) ? { t: 'host.kick', playerId: m.playerId } : null;
    case 'resume': return str(m.pin, 6) && PIN.test(m.pin) && str(m.token, 64) ? { t: 'resume', pin: m.pin, token: m.token } : null;
    case 'answer': return typeof m.q === 'number' && Number.isInteger(m.q) && m.q >= 0 && m.q < 50 && str(m.choice, 16) ? { t: 'answer', q: m.q, choice: m.choice } : null;
    case 'ping': return typeof m.at === 'number' && Number.isFinite(m.at) ? { t: 'ping', at: m.at } : null;
    case 'join': {
      const p = m.pow as Record<string, unknown> | null | undefined;
      if (!str(m.pin, 6) || !PIN.test(m.pin) || !str(m.nick, 32) || !p || typeof p !== 'object') return null;
      if (!str(p.token, 128) || !str(p.nonce, 20) || !NONCE.test(p.nonce)) return null;
      return { t: 'join', pin: m.pin, nick: m.nick, pow: { token: p.token, nonce: p.nonce } };
    }
    default: return null;
  }
}
