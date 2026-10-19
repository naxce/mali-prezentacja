import { sha256Hex } from './sha256.ts';

export function leadingZeroBits(hex: string): number {
  let bits = 0;
  for (let i = 0; i < hex.length; i++) {
    const v = parseInt(hex[i], 16);
    if (v === 0) { bits += 4; continue; }
    return bits + (v < 2 ? 3 : v < 4 ? 2 : v < 8 ? 1 : 0);
  }
  return bits;
}

export function meetsDifficulty(token: string, nonce: string, bits: number): boolean {
  return leadingZeroBits(sha256Hex(token + ':' + nonce)) >= bits;
}

export function solve(token: string, bits: number, from = 0, limit = Infinity): string | null {
  for (let n = from; n < from + limit; n++) {
    const s = String(n);
    if (meetsDifficulty(token, s, bits)) return s;
  }
  return null;
}
