interface Bucket { tokens: number; at: number }

export class Buckets {
  private readonly map = new Map<string, Bucket>();
  private readonly capacity: number;
  private readonly refillPerMs: number;
  private readonly now: () => number;

  constructor(capacity: number, refillPerSec: number, now: () => number = Date.now) {
    this.capacity = capacity;
    this.refillPerMs = refillPerSec / 1000;
    this.now = now;
  }

  private get(key: string): Bucket {
    const t = this.now();
    let b = this.map.get(key);
    if (!b) {
      if (this.map.size > 50000) this.prune(t);
      b = { tokens: this.capacity, at: t };
      this.map.set(key, b);
    }
    b.tokens = Math.min(this.capacity, b.tokens + (t - b.at) * this.refillPerMs);
    b.at = t;
    return b;
  }

  private prune(t: number): void {
    for (const [k, b] of this.map) if (b.tokens + (t - b.at) * this.refillPerMs >= this.capacity) this.map.delete(k);
  }

  has(key: string): boolean {
    return this.get(key).tokens >= 1;
  }

  take(key: string): boolean {
    const b = this.get(key);
    if (b.tokens < 1) return false;
    b.tokens -= 1;
    return true;
  }

  forget(key: string): void {
    this.map.delete(key);
  }
}
