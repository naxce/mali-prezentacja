import '../fonts.ts';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/quiz.css';
import { apiBase } from '../net/client.ts';

const base = apiBase();
const app = document.getElementById('app') as HTMLElement;
document.body.classList.add('player');
app.innerHTML = `
<section class="pv pv-test">
  <header class="pv-head"><span class="mono">Quiz Mali</span><h1 class="display">Test połączenia</h1></header>
  <ul class="nt">
    <li data-k="http"><span>Serwer (HTTP)</span><b>Sprawdzam…</b></li>
    <li data-k="ws"><span>Na żywo (WebSocket)</span><b>Sprawdzam…</b></li>
    <li data-k="poll"><span>Tryb zapasowy</span><b>Sprawdzam…</b></li>
  </ul>
  <p class="pv-hint" data-sum></p>
  <button type="button" class="pv-btn" data-again>Sprawdź ponownie</button>
</section>`;

const rows: Record<string, boolean> = {};

function set(k: string, ok: boolean, text: string): void {
  rows[k] = ok;
  const li = app.querySelector(`[data-k="${k}"]`) as HTMLElement;
  li.className = ok ? 'ok' : 'bad';
  (li.querySelector('b') as HTMLElement).textContent = text;
  if (typeof li.animate === 'function') li.animate([{ transform: 'translateX(-12px)', opacity: 0.4 }, { transform: 'none', opacity: 1 }], { duration: 400, easing: 'cubic-bezier(.16,1,.3,1)' });
  if (Object.keys(rows).length === 3) {
    const sum = app.querySelector('[data-sum]') as HTMLElement;
    sum.textContent = rows.ws ? 'Wszystko gotowe do quizu.' : rows.poll ? 'Quiz zadziała w trybie zapasowym (trochę wolniej).' : rows.http ? 'Serwer odpowiada, ale quiz może nie działać w tej sieci. Użyj danych komórkowych.' : 'Brak połączenia z serwerem. Użyj danych komórkowych lub hotspotu.';
  }
}

const timeout = <T>(p: Promise<T>, ms: number): Promise<T> => new Promise((res, rej) => { const t = setTimeout(() => rej(new Error('timeout')), ms); p.then((v) => { clearTimeout(t); res(v); }, (e) => { clearTimeout(t); rej(e); }); });

async function http(): Promise<void> {
  const t0 = performance.now();
  try {
    const r = await timeout(fetch(`${base}api/health`, { cache: 'no-store' }), 6000);
    if (!r.ok) throw new Error(String(r.status));
    set('http', true, `OK, ${Math.round(performance.now() - t0)} ms`);
  } catch { set('http', false, 'Błąd'); }
}

function ws(): Promise<void> {
  return new Promise((resolve) => {
    const t0 = performance.now();
    let done = false;
    const finish = (ok: boolean, text: string) => { if (done) return; done = true; set('ws', ok, text); try { sock.close(); } catch { resolve(); } resolve(); };
    const sock = new WebSocket(`${base.replace(/^http/, 'ws')}ws`);
    const t = setTimeout(() => finish(false, 'Błąd (zablokowany?)'), 6000);
    sock.onopen = () => sock.send(JSON.stringify({ t: 'ping', at: Date.now() }));
    sock.onmessage = () => { clearTimeout(t); finish(true, `OK, ${Math.round(performance.now() - t0)} ms`); };
    sock.onerror = () => { clearTimeout(t); finish(false, 'Błąd (zablokowany?)'); };
  });
}

async function poll(): Promise<void> {
  const t0 = performance.now();
  try {
    const o = await timeout(fetch(`${base}api/open`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }), 6000);
    const { sid } = (await o.json()) as { sid: string };
    await fetch(`${base}api/send`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sid, msg: JSON.stringify({ t: 'ping', at: 1 }) }) });
    const r = await timeout(fetch(`${base}api/poll?sid=${encodeURIComponent(sid)}&after=0`, { cache: 'no-store' }), 8000);
    const body = (await r.json()) as { msgs: unknown[] };
    if (!body.msgs.length) throw new Error('empty');
    set('poll', true, `OK, ${Math.round(performance.now() - t0)} ms`);
  } catch { set('poll', false, 'Błąd'); }
}

function runAll(): void {
  for (const k of Object.keys(rows)) delete rows[k];
  app.querySelectorAll('.nt li').forEach((li) => { li.className = ''; (li.querySelector('b') as HTMLElement).textContent = 'Sprawdzam…'; });
  (app.querySelector('[data-sum]') as HTMLElement).textContent = '';
  void http(); void ws(); void poll();
}

(app.querySelector('[data-again]') as HTMLElement).addEventListener('click', runAll);
runAll();
