import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

class FakeWS {
  static all: FakeWS[] = [];
  readyState = 0;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  url: string;
  constructor(url: string) { this.url = url; FakeWS.all.push(this); }
  send(d: string) { this.sent.push(d); }
  close() { if (this.readyState === 3) return; this.readyState = 3; if (this.onclose) this.onclose(); }
  open() { this.readyState = 1; if (this.onopen) this.onopen(); }
}

const g = globalThis as Record<string, unknown>;
g.WebSocket = FakeWS;
g.document = { hidden: false, addEventListener() {}, removeEventListener() {} };
g.window = { addEventListener() {}, removeEventListener() {} };

test('silent dead socket is detected by heartbeat and replaced', async () => {
  mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] });
  const { connect } = await import('../../src/net/client.ts');
  const statuses: string[] = [];
  connect({ base: 'http://x/', onMsg() {}, onStatus: (s) => statuses.push(s) });
  const first = FakeWS.all[0];
  first.open();
  mock.timers.tick(15000);
  assert.ok(first.sent.some((m) => JSON.parse(m).t === 'ping'), 'heartbeat ping sent');
  mock.timers.tick(4000);
  assert.equal(first.readyState, 3, 'dead socket closed');
  mock.timers.tick(5000);
  assert.ok(FakeWS.all.length >= 2, 'reconnected');
  mock.timers.reset();
});
