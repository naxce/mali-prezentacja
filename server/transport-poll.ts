import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomBytes } from 'node:crypto';
import type { Handler } from './handler.ts';
import type { Conn } from './registry.ts';
import type { ServerMsg } from '../shared/protocol.ts';
import { Buckets } from './ratelimit.ts';

interface Session {
  conn: Conn;
  queue: { seq: number; msg: ServerMsg }[];
  seq: number;
  waiter: (() => void) | null;
  lastPoll: number;
  closing: boolean;
}

const HOLD_MS = 25000;
const IDLE_MS = 60000;
const MAX_BODY = 2048;

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string | null> {
  return new Promise((resolve) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) { resolve(null); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', () => resolve(null));
  });
}

export function createPoll(o: { prefix: string; origins: string[]; ipOf(req: IncomingMessage): string; handler: Handler }) {
  const sessions = new Map<string, Session>();
  const opens = new Buckets(100, 2);

  const drop = (sid: string) => {
    const s = sessions.get(sid);
    if (!s) return;
    sessions.delete(sid);
    o.handler.closed(s.conn);
  };

  const sweeper = setInterval(() => {
    const limit = Date.now() - IDLE_MS;
    for (const [sid, s] of sessions) if (!s.waiter && s.lastPoll < limit) drop(sid);
  }, 10000);
  sweeper.unref();

  const originOk = (req: IncomingMessage) => o.origins.includes(String(req.headers.origin || ''));

  async function route(req: IncomingMessage, res: ServerResponse, path: string, url: URL): Promise<boolean> {
    if (path === `${o.prefix}health` && req.method === 'GET') { json(res, 200, { ok: true }); return true; }
    if (path === `${o.prefix}open` && req.method === 'POST') {
      if (!originOk(req)) { json(res, 403, { error: 'origin' }); return true; }
      if (!opens.take(o.ipOf(req))) { json(res, 429, { error: 'rate' }); return true; }
      const sid = randomBytes(16).toString('base64url');
      const s: Session = { conn: null as unknown as Conn, queue: [], seq: 0, waiter: null, lastPoll: Date.now(), closing: false };
      s.conn = {
        id: sid,
        ip: o.ipOf(req),
        send: (msg) => {
          if (s.closing) return;
          s.queue.push({ seq: ++s.seq, msg });
          if (s.queue.length > 200) s.queue.shift();
          if (s.waiter) s.waiter();
        },
        close: () => { s.closing = true; if (s.waiter) s.waiter(); }
      };
      sessions.set(sid, s);
      json(res, 200, { sid });
      return true;
    }
    if (path === `${o.prefix}send` && req.method === 'POST') {
      if (!originOk(req)) { json(res, 403, { error: 'origin' }); return true; }
      const body = await readBody(req);
      if (body === null) { json(res, 413, { error: 'size' }); return true; }
      let data: { sid?: unknown; msg?: unknown };
      try { data = JSON.parse(body); } catch { json(res, 400, { error: 'json' }); return true; }
      const s = typeof data.sid === 'string' ? sessions.get(data.sid) : undefined;
      if (!s || s.closing) { json(res, 404, { error: 'expired' }); return true; }
      if (typeof data.msg !== 'string') { json(res, 400, { error: 'msg' }); return true; }
      o.handler.handle(s.conn, data.msg);
      json(res, 200, { ok: true });
      return true;
    }
    if (path === `${o.prefix}poll` && req.method === 'GET') {
      const sid = url.searchParams.get('sid') || '';
      const s = sessions.get(sid);
      if (!s) { json(res, 404, { error: 'expired' }); return true; }
      const after = Number(url.searchParams.get('after') || 0);
      s.lastPoll = Date.now();
      let timer: ReturnType<typeof setTimeout> | undefined;
      const flush = () => {
        if (s.waiter === flush) s.waiter = null;
        clearTimeout(timer);
        s.queue = s.queue.filter((m) => m.seq > after);
        s.lastPoll = Date.now();
        if (!res.writableEnded) json(res, 200, { msgs: s.queue, closed: s.closing || undefined });
        if (s.closing) drop(sid);
      };
      s.queue = s.queue.filter((m) => m.seq > after);
      if (s.queue.length || s.closing) { flush(); return true; }
      if (s.waiter) s.waiter();
      timer = setTimeout(flush, HOLD_MS);
      s.waiter = flush;
      req.on('close', () => { clearTimeout(timer); if (s.waiter === flush) s.waiter = null; });
      return true;
    }
    return false;
  }

  function stop(): void {
    clearInterval(sweeper);
    for (const s of sessions.values()) if (s.waiter) s.waiter();
    sessions.clear();
  }

  return { route, stop };
}
