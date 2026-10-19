import { createServer, type IncomingMessage } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Config } from './config.ts';
import type { Question } from './game.ts';
import { loadQuestions } from './questions.ts';
import { Registry } from './registry.ts';
import { Handler } from './handler.ts';
import { attachWs } from './transport-ws.ts';
import { createPoll } from './transport-poll.ts';

const BASE = '/wos/mali/';

export async function startServer(cfg: Config, questions?: Question[]): Promise<{ port: number; close(): Promise<void> }> {
  const qs = questions || loadQuestions(cfg.questionsPath);
  const reg = new Registry({ questions: qs, readMs: cfg.readMs, answerMs: cfg.answerMs });
  const handler = new Handler(cfg, reg);
  const ipOf = (req: IncomingMessage): string => {
    const h = req.headers['x-real-ip'];
    if (cfg.trustProxy && typeof h === 'string' && h.length > 0 && h.length <= 45) return h;
    return req.socket.remoteAddress || 'unknown';
  };
  const poll = createPoll({ prefix: `${BASE}api/`, origins: cfg.origins, ipOf, handler });
  const server = createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://local');
    poll.route(req, res, url.pathname, url).then((handled) => {
      if (!handled) { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('not found'); }
    }, () => { if (!res.headersSent) { res.writeHead(500); res.end(); } });
  });
  server.requestTimeout = 0;
  server.headersTimeout = 30000;
  const stopWs = attachWs(server, { path: `${BASE}ws`, origins: cfg.origins, ipOf, handler });
  await new Promise<void>((resolve) => server.listen(cfg.port, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  return {
    port,
    close: () => new Promise<void>((resolve) => {
      stopWs();
      poll.stop();
      reg.stop();
      server.closeAllConnections();
      server.close(() => resolve());
    })
  };
}
