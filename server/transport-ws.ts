import type { IncomingMessage, Server } from 'node:http';
import { randomBytes } from 'node:crypto';
import { WebSocketServer, type WebSocket } from 'ws';
import type { Handler } from './handler.ts';
import type { Conn } from './registry.ts';
import { MAX_MSG_BYTES } from '../shared/protocol.ts';

export function attachWs(server: Server, o: { path: string; origins: string[]; ipOf(req: IncomingMessage): string; handler: Handler }): () => void {
  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_MSG_BYTES });
  const alive = new WeakMap<WebSocket, boolean>();
  server.on('upgrade', (req, socket, head) => {
    socket.on('error', () => socket.destroy());
    const path = (req.url || '').split('?')[0];
    if (path !== o.path || !o.origins.includes(String(req.headers.origin || ''))) {
      socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      const conn: Conn = {
        id: randomBytes(8).toString('hex'),
        ip: o.ipOf(req),
        send: (m) => { if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(m)); },
        close: () => ws.close()
      };
      alive.set(ws, true);
      ws.on('pong', () => alive.set(ws, true));
      ws.on('message', (data, isBinary) => {
        if (isBinary) { ws.close(); return; }
        o.handler.handle(conn, String(data));
      });
      ws.on('close', () => o.handler.closed(conn));
      ws.on('error', () => ws.terminate());
    });
  });
  const ping = setInterval(() => {
    for (const ws of wss.clients) {
      if (!alive.get(ws)) { ws.terminate(); continue; }
      alive.set(ws, false);
      ws.ping();
    }
  }, 30000);
  ping.unref();
  return () => {
    clearInterval(ping);
    for (const ws of wss.clients) ws.terminate();
    wss.close();
  };
}
