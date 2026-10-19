import WebSocket from 'ws';
import { solve } from '../shared/pow.ts';
import type { ClientMsg, ServerMsg } from '../shared/protocol.ts';

const base = (process.argv[2] || 'http://127.0.0.1:3210').replace(/\/$/, '');
const hostKey = process.argv[3] || process.env.HOST_KEY || '';
const origin = process.argv[4] || 'http://localhost:5173';
const wsUrl = base.replace(/^http/, 'ws') + '/wos/mali/ws';
const api = base + '/wos/mali/api/';

interface Bot { msgs: ServerMsg[]; send(m: ClientMsg): void; next(pred: (m: ServerMsg) => boolean, ms?: number): Promise<ServerMsg>; close(): void }

function inbox() {
  const msgs: ServerMsg[] = [];
  let cursor = 0;
  const waiters: (() => void)[] = [];
  return {
    msgs,
    push(m: ServerMsg) { msgs.push(m); for (const w of waiters.splice(0)) w(); },
    next(pred: (m: ServerMsg) => boolean, ms = 30000): Promise<ServerMsg> {
      return new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('timeout')), ms);
        const check = () => {
          for (let i = cursor; i < msgs.length; i++) if (pred(msgs[i])) { cursor = i + 1; clearTimeout(t); resolve(msgs[i]); return; }
          waiters.push(check);
        };
        check();
      });
    }
  };
}

function wsBot(ip: string): Promise<Bot> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl, { headers: { origin, 'x-real-ip': ip } });
    const b = inbox();
    ws.on('message', (d) => b.push(JSON.parse(String(d))));
    ws.on('error', reject);
    ws.on('open', () => resolve({ msgs: b.msgs, next: b.next, send: (m) => ws.send(JSON.stringify(m)), close: () => ws.close() }));
  });
}

async function pollBot(ip: string): Promise<Bot> {
  const headers = { origin, 'x-real-ip': ip, 'content-type': 'application/json' };
  const r = await fetch(api + 'open', { method: 'POST', headers, body: '{}' });
  const { sid } = (await r.json()) as { sid: string };
  const b = inbox();
  let open = true;
  let after = 0;
  (async () => {
    while (open) {
      try {
        const res = await fetch(`${api}poll?sid=${sid}&after=${after}`, { headers: { 'x-real-ip': ip } });
        if (res.status !== 200) break;
        const body = (await res.json()) as { msgs: { seq: number; msg: ServerMsg }[]; closed?: boolean };
        for (const m of body.msgs) { after = m.seq; b.push(m.msg); }
        if (body.closed) break;
      } catch { break; }
    }
  })();
  return { msgs: b.msgs, next: b.next, send: (m) => { void fetch(api + 'send', { method: 'POST', headers, body: JSON.stringify({ sid, msg: JSON.stringify(m) }) }); }, close: () => { open = false; } };
}

async function join(b: Bot, pin: string, nick: string): Promise<string> {
  b.send({ t: 'challenge' });
  const ch = await b.next((m) => m.t === 'challenge');
  if (ch.t !== 'challenge') return 'no-challenge';
  b.send({ t: 'join', pin, nick, pow: { token: ch.token, nonce: solve(ch.token, ch.bits) as string } });
  const r = await b.next((m) => m.t === 'joined' || m.t === 'error');
  return r.t === 'error' ? r.code : r.t;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const host = await wsBot('10.200.0.1');
host.send({ t: 'host.create', key: hostKey });
const created = await host.next((m) => m.t === 'host.created' || m.t === 'error');
if (created.t !== 'host.created') { console.log('host.create failed', JSON.stringify(created)); process.exit(1); }
const pin = created.pin;

const bots: Bot[] = [];
for (let i = 0; i < 60; i++) bots.push(i < 40 ? await wsBot(`10.201.${i % 3}.1`) : await pollBot(`10.202.${i}.1`));
const joins = await Promise.all(bots.map((b, i) => join(b, pin, `Bot${i}`)));
const joined = joins.filter((j) => j === 'joined').length;

host.send({ t: 'host.start' });
let answeredAll = true;
let total = 0;
for (let q = 0; ; q++) {
  const first = await host.next((m) => (m.t === 'h.question' && m.phase === 'answer' && m.q === q) || m.t === 'h.final');
  if (first.t === 'h.final') break;
  if (first.t === 'h.question') total = first.total;
  await Promise.all(bots.map(async (b) => {
    const v = await b.next((m) => m.t === 'p.question' && m.phase === 'answer' && m.q === q);
    if (v.t !== 'p.question') return;
    await sleep(200 + Math.random() * 4800);
    b.send({ t: 'answer', q, choice: v.choices[Math.floor(Math.random() * 4)].id });
  }));
  const rev = await host.next((m) => m.t === 'h.reveal' && m.q === q);
  if (rev.t === 'h.reveal' && rev.counts.reduce((a, c) => a + c, 0) !== joined) answeredAll = false;
  host.send({ t: 'host.next' });
  if (q + 1 >= total) { await host.next((m) => m.t === 'h.final'); break; }
}

async function bitsFor(ip: string): Promise<number> {
  const b = await wsBot(ip);
  b.send({ t: 'challenge' });
  const ch = await b.next((m) => m.t === 'challenge');
  b.close();
  return ch.t === 'challenge' ? ch.bits : 0;
}

const wrong = pin === '999999' ? '999998' : '999999';
const bitsBefore = await bitsFor('10.250.0.1');
const wrongCodes: string[] = [];
for (let i = 0; i < 30; i++) {
  const b = await wsBot('10.250.0.1');
  wrongCodes.push(await join(b, wrong, `Zly${i}`));
  b.close();
}
const bitsAfter = await bitsFor('10.250.0.1');
const wrongPinPenalized = bitsAfter > bitsBefore && wrongCodes.every((c) => c === 'bad-pin');

let powRejected = 0;
for (let i = 0; i < 5; i++) {
  const b = await wsBot(`10.251.0.${i}`);
  b.send({ t: 'join', pin, nick: `Fake${i}`, pow: { token: '9999999999999.4.aa.bb', nonce: '1' } });
  const r = await b.next((m) => m.t === 'error');
  if (r.t === 'error' && r.code === 'pow-failed') powRejected++;
  b.close();
}

for (const b of bots) b.close();
host.close();
console.log(`joined=${joined} answeredAll=${answeredAll} wrongPinPenalized=${wrongPinPenalized} (bits ${bitsBefore} -> ${bitsAfter}) powRejected=${powRejected}`);
process.exit(joined === 60 && answeredAll && wrongPinPenalized && powRejected === 5 ? 0 : 1);
