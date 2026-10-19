import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { meetsDifficulty } from '../shared/pow.ts';

const TTL = 120000;

const mac = (secret: string, body: string): string => createHmac('sha256', secret).update(body).digest('hex');

export function createChallenge(secret: string, now: number, bits: number): string {
  const body = `${now + TTL}.${bits}.${randomBytes(12).toString('hex')}`;
  return `${body}.${mac(secret, body)}`;
}

export type PowVerdict = 'ok' | 'expired' | 'bad-mac' | 'insufficient' | 'reused';

export function verifyChallenge(secret: string, token: string, nonce: string, bits: number, now: number, seen: Map<string, number>): PowVerdict {
  for (const [k, exp] of seen) if (exp < now) seen.delete(k);
  const parts = token.split('.');
  if (parts.length !== 4) return 'bad-mac';
  const body = `${parts[0]}.${parts[1]}.${parts[2]}`;
  const want = Buffer.from(mac(secret, body), 'hex');
  const got = Buffer.from(parts[3], 'hex');
  if (got.length !== want.length || !timingSafeEqual(got, want)) return 'bad-mac';
  const exp = Number(parts[0]);
  if (!Number.isFinite(exp) || exp < now) return 'expired';
  if (seen.has(token)) return 'reused';
  if (!meetsDifficulty(token, nonce, Math.max(bits, Number(parts[1]) || 0))) return 'insufficient';
  seen.set(token, exp);
  return 'ok';
}
