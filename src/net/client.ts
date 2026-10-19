import type { ClientMsg, ServerMsg } from '../../shared/protocol.ts';

export type Status = 'connecting' | 'online' | 'offline';

export interface Link {
  send(m: ClientMsg): void;
  close(): void;
  kind(): 'ws' | 'poll';
}

export function apiBase(): string {
  return `${location.origin}${import.meta.env.BASE_URL}`;
}

export function forcedTransport(): 'ws' | 'poll' | undefined {
  const m = /[?&]transport=(ws|poll)/.exec(location.search);
  return m ? (m[1] as 'ws' | 'poll') : undefined;
}

export function connect(o: { base: string; force?: 'ws' | 'poll'; onMsg(m: ServerMsg): void; onStatus(s: Status): void }): Link {
  let kind: 'ws' | 'poll' = o.force === 'poll' ? 'poll' : 'ws';
  let closed = false;
  let online = false;
  let ws: WebSocket | null = null;
  let sid: string | null = null;
  let after = 0;
  let backoff = 500;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let fails: number[] = [];
  let beat: ReturnType<typeof setInterval> | undefined;
  let pongWait: ReturnType<typeof setTimeout> | undefined;
  let chain: Promise<void> = Promise.resolve();
  const outbox: ClientMsg[] = [];

  const setStatus = (s: Status) => { online = s === 'online'; o.onStatus(s); };
  const deliver = (raw: unknown) => {
    const m = raw as ServerMsg;
    if (m && m.t === 'pong') { clearTimeout(pongWait); return; }
    if (!closed) o.onMsg(m);
  };

  function probe(): void {
    const s = ws;
    if (kind !== 'ws' || !s || s.readyState !== 1) return;
    clearTimeout(pongWait);
    s.send(JSON.stringify({ t: 'ping', at: Date.now() }));
    pongWait = setTimeout(() => { if (ws === s) s.close(); }, 3500);
  }
  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  function retry(fn: () => void): void {
    clearTimeout(retryTimer);
    retryTimer = setTimeout(() => { if (!closed) fn(); }, backoff);
    backoff = Math.min(backoff * 2, 4000);
  }

  function flush(): void {
    while (online && outbox.length) sendNow(outbox.shift() as ClientMsg);
  }

  function sendNow(m: ClientMsg): void {
    const body = JSON.stringify(m);
    if (kind === 'ws' && ws && ws.readyState === 1) { ws.send(body); return; }
    if (kind === 'poll' && sid) {
      const mine = sid;
      chain = chain.then(() => fetch(`${o.base}api/send`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sid: mine, msg: body }) })
        .then((r) => {
          if (r.status === 404 && !closed) { outbox.unshift(m); if (sid === mine) { sid = null; setStatus('offline'); retry(openPoll); } }
          else if (!r.ok) throw new Error(String(r.status));
        })
        .catch(() => { if (closed) return; outbox.unshift(m); setTimeout(() => { if (online) flush(); }, 700); }));
      return;
    }
    outbox.push(m);
  }

  function fallback(): void {
    if (kind === 'poll' || closed) return;
    kind = 'poll';
    if (ws) { const s = ws; ws = null; try { s.close(); } catch { return; } }
    backoff = 500;
    openPoll();
  }

  function openWs(): void {
    if (closed) return;
    setStatus('connecting');
    let opened = false;
    let sock: WebSocket;
    try {
      sock = new WebSocket(`${o.base.replace(/^http/, 'ws')}ws`);
    } catch {
      fallback();
      return;
    }
    ws = sock;
    const guard = setTimeout(() => { if (!opened && ws === sock) fallback(); }, 4000);
    sock.onopen = () => {
      opened = true;
      clearTimeout(guard);
      backoff = 500;
      setStatus('online');
      flush();
      clearInterval(beat);
      beat = setInterval(probe, 15000);
    };
    sock.onmessage = (ev) => { try { deliver(JSON.parse(String(ev.data))); } catch { return; } };
    sock.onclose = () => {
      clearTimeout(guard);
      clearTimeout(pongWait);
      if (ws !== sock) return;
      clearInterval(beat);
      ws = null;
      if (closed) return;
      setStatus('offline');
      const now = Date.now();
      fails = fails.filter((t) => now - t < 30000);
      fails.push(now);
      if (!opened || fails.length >= 3) fallback();
      else retry(openWs);
    };
  }

  async function openPoll(): Promise<void> {
    if (closed) return;
    setStatus('connecting');
    try {
      const r = await fetch(`${o.base}api/open`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
      if (!r.ok) throw new Error(String(r.status));
      const body = (await r.json()) as { sid: string };
      sid = body.sid;
      after = 0;
      backoff = 500;
      setStatus('online');
      flush();
      void loop(body.sid);
    } catch {
      setStatus('offline');
      retry(openPoll);
    }
  }

  async function loop(mine: string): Promise<void> {
    let delay = 500;
    while (!closed && sid === mine) {
      try {
        const r = await fetch(`${o.base}api/poll?sid=${encodeURIComponent(mine)}&after=${after}`, { cache: 'no-store' });
        if (r.status === 404) { if (sid === mine) { sid = null; setStatus('offline'); retry(openPoll); } return; }
        if (!r.ok) throw new Error(String(r.status));
        const body = (await r.json()) as { msgs: { seq: number; msg: unknown }[]; closed?: boolean };
        if (!online) setStatus('online');
        delay = 500;
        for (const m of body.msgs) { after = m.seq; deliver(m.msg); }
        if (body.closed) { if (sid === mine) { sid = null; if (!closed) { setStatus('offline'); retry(openPoll); } } return; }
      } catch {
        if (online) setStatus('offline');
        await sleep(delay);
        delay = Math.min(delay * 2, 4000);
      }
    }
  }

  const wake = () => {
    if (closed || document.hidden) return;
    if (kind === 'ws' && (!ws || ws.readyState > 1)) { clearTimeout(retryTimer); openWs(); }
    else probe();
  };
  document.addEventListener('visibilitychange', wake);
  window.addEventListener('online', wake);

  if (kind === 'ws') openWs(); else void openPoll();

  return {
    send(m) { if (online) sendNow(m); else { outbox.push(m); if (outbox.length > 20) outbox.shift(); } },
    close() {
      closed = true;
      clearTimeout(retryTimer);
      clearInterval(beat);
      clearTimeout(pongWait);
      document.removeEventListener('visibilitychange', wake);
      window.removeEventListener('online', wake);
      if (ws) { const s = ws; ws = null; try { s.close(); } catch { return; } }
      sid = null;
    },
    kind: () => kind
  };
}
