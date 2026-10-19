import WebSocket from 'ws';
import type { ClientMsg, ServerMsg } from '../../shared/protocol.ts';
import { solve } from '../../shared/pow.ts';

export const ORIGIN = 'http://t';

export interface Client {
  msgs: ServerMsg[];
  send(m: ClientMsg | string): void;
  next(pred: (m: ServerMsg) => boolean, ms?: number): Promise<ServerMsg>;
  close(): void;
  closed: Promise<void>;
}

function makeWaiter() {
  const msgs: ServerMsg[] = [];
  let cursor = 0;
  const waiters: (() => void)[] = [];
  return {
    msgs,
    push(m: ServerMsg) { msgs.push(m); for (const w of waiters.splice(0)) w(); },
    next(pred: (m: ServerMsg) => boolean, ms = 3000): Promise<ServerMsg> {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout waiting; got ' + JSON.stringify(msgs.slice(cursor)))), ms);
        const check = () => {
          for (let i = cursor; i < msgs.length; i++) {
            if (pred(msgs[i])) { cursor = i + 1; clearTimeout(timer); resolve(msgs[i]); return; }
          }
          waiters.push(check);
        };
        check();
      });
    }
  };
}

export function wsClient(port: number, ip: string, origin = ORIGIN): Promise<Client> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/wos/mali/ws`, { headers: { origin, 'x-real-ip': ip } });
    const w = makeWaiter();
    const closed = new Promise<void>((r) => ws.on('close', () => r()));
    ws.on('message', (d) => w.push(JSON.parse(String(d))));
    ws.on('error', reject);
    ws.on('open', () => resolve({
      msgs: w.msgs,
      send: (m) => ws.send(typeof m === 'string' ? m : JSON.stringify(m)),
      next: w.next,
      close: () => ws.close(),
      closed
    }));
  });
}

export async function pollClient(port: number, ip: string): Promise<Client> {
  const base = `http://127.0.0.1:${port}/wos/mali/api`;
  const headers = { origin: ORIGIN, 'x-real-ip': ip, 'content-type': 'application/json' };
  const r = await fetch(`${base}/open`, { method: 'POST', headers, body: '{}' });
  const { sid } = await r.json() as { sid: string };
  const w = makeWaiter();
  let after = 0;
  let open = true;
  let done!: () => void;
  const closed = new Promise<void>((res) => { done = res; });
  (async () => {
    while (open) {
      try {
        const res = await fetch(`${base}/poll?sid=${sid}&after=${after}`, { headers: { 'x-real-ip': ip } });
        if (res.status !== 200) break;
        const body = await res.json() as { msgs: { seq: number; msg: ServerMsg }[]; closed?: boolean };
        for (const m of body.msgs) { after = m.seq; w.push(m.msg); }
        if (body.closed) break;
      } catch { break; }
    }
    open = false;
    done();
  })();
  return {
    msgs: w.msgs,
    send: (m) => { void fetch(`${base}/send`, { method: 'POST', headers, body: JSON.stringify({ sid, msg: typeof m === 'string' ? m : JSON.stringify(m) }) }); },
    next: w.next,
    close: () => { open = false; },
    closed
  };
}

export async function join(c: Client, pin: string, nick: string): Promise<ServerMsg> {
  c.send({ t: 'challenge' });
  const ch = await c.next((m) => m.t === 'challenge');
  if (ch.t !== 'challenge') throw new Error('no challenge');
  const nonce = solve(ch.token, ch.bits) as string;
  c.send({ t: 'join', pin, nick, pow: { token: ch.token, nonce } });
  return c.next((m) => m.t === 'joined' || m.t === 'error');
}
