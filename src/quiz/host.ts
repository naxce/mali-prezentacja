import { connect, apiBase, forcedTransport, type Link, type Status } from '../net/client.ts';
import type { ServerMsg, Standing, PlayerRow } from '../../shared/protocol.ts';
import { ERR, JOIN_HOST, plural, store } from './copy.ts';
import { qrSvg } from './qr.ts';
import { icon } from '../deck/icons.ts';
import { shape } from './shapes.ts';
import type { Action } from '../deck/types.ts';

interface HostSession { pin: string; hostToken: string }
type State = 'idle' | 'key' | 'lobby' | 'question' | 'reveal' | 'final';

const EASE = 'cubic-bezier(.16,1,.3,1)';
const BACK = 'cubic-bezier(.34,1.56,.64,1)';

function anim(el: Element | null, frames: Keyframe[], delay: number, dur: number, easing = EASE): void {
  if (el && typeof (el as HTMLElement).animate === 'function') (el as HTMLElement).animate(frames, { delay, duration: dur, easing, fill: 'both' });
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface Host { onAction(a: Action): boolean; resume(): void; showIdle(): void }

export function createHost(box: HTMLElement, isLite: () => boolean): Host {
  let state: State = 'idle';
  let link: Link | null = null;
  let session = store('quiz-host') as HostSession | null;
  let players: PlayerRow[] = [];
  let lastQ = -1;
  let lastPhase = '';
  let prevTop: string[] = [];
  let armed = 0;
  const status = document.createElement('p');
  status.className = 'qh-status mono';
  status.setAttribute('role', 'status');

  function mount(cls: string, html: string): HTMLElement {
    const slide = box.closest('.slide');
    if (slide) slide.classList.toggle('quiz-live', cls !== 'idle' && cls !== 'key');
    box.innerHTML = `<div class="qh qh-${cls}">${html}</div>`;
    box.appendChild(status);
    return box.firstElementChild as HTMLElement;
  }

  function onStatus(s: Status): void {
    status.textContent = s === 'online' ? '' : s === 'connecting' ? 'Łączenie z serwerem…' : 'Brak połączenia, ponawiam…';
    if (s !== 'online' || !link) return;
    if (session) link.send({ t: 'host.resume', pin: session.pin, hostToken: session.hostToken });
    else {
      const key = store('quiz-key') as string | null;
      if (key) link.send({ t: 'host.create', key });
      else showKey();
    }
  }

  function ensureLink(): void {
    if (!link) link = connect({ base: apiBase(), force: forcedTransport(), onMsg, onStatus });
  }

  function send(m: Parameters<Link['send']>[0]): void {
    if (link) link.send(m);
  }

  function showIdle(): void {
    state = 'idle';
    const v = mount('idle', `<button type="button" class="qh-go">${icon('play')}<span>Uruchom quiz</span></button>`);
    v.querySelector('.qh-go')!.addEventListener('click', () => {
      const key = store('quiz-key') as string | null;
      if (!key) { showKey(); return; }
      status.textContent = 'Łączenie z serwerem…';
      if (!link) { ensureLink(); return; }
      if (session) send({ t: 'host.resume', pin: session.pin, hostToken: session.hostToken });
      else send({ t: 'host.create', key });
    });
  }

  function showKey(err = ''): void {
    state = 'key';
    const v = mount('key', `
<form class="qh-keyform" novalidate>
  <label for="qh-key" class="mono">Klucz prowadzącego</label>
  <input id="qh-key" type="password" autocomplete="current-password" required aria-describedby="qh-key-err">
  <button type="submit">Dalej</button>
  <p id="qh-key-err" class="qh-err" role="alert">${esc(err)}</p>
</form>`);
    const input = v.querySelector('input') as HTMLInputElement;
    anim(v.querySelector('form'), [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], 0, 500);
    v.querySelector('form')!.addEventListener('submit', (e) => {
      e.preventDefault();
      if (input.value.length < 12) { showKey('Klucz ma co najmniej 12 znaków.'); return; }
      store('quiz-key', input.value);
      if (link) send({ t: 'host.create', key: input.value }); else ensureLink();
    });
    setTimeout(() => input.focus(), 50);
  }

  function joinUrl(pin: string): string {
    return `${location.origin}${import.meta.env.BASE_URL}quiz/?pin=${pin}`;
  }

  function showLobby(pin: string, list: PlayerRow[]): void {
    const fresh = state !== 'lobby';
    state = 'lobby';
    players = list;
    if (!fresh) { renderPlayers(true); return; }
    const v = mount('lobby', `
<div class="qh-join">
  <div class="qh-qr"></div>
  <div class="qh-how">
    <p class="mono qh-label">Wejdź na</p>
    <p class="qh-url">${JOIN_HOST.split('/').join('/<wbr>')}</p>
    <p class="mono qh-label">PIN gry</p>
    <p class="qh-pin" aria-label="PIN ${pin}">${pin.split('').map((d) => `<span class="qh-digit"><span class="qh-reel">${'0123456789'.split('').map((x) => `<i>${x}</i>`).join('')}</span></span>`).join('')}</p>
  </div>
</div>
<div class="qh-people">
  <p class="qh-count mono" aria-live="polite"></p>
  <ul class="qh-list"></ul>
  <div class="qh-actions"><button type="button" class="qh-start">Start</button><p class="qh-err" role="alert"></p></div>
</div>`);
    const qr = qrSvg(joinUrl(pin));
    v.querySelector('.qh-qr')!.appendChild(qr);
    const rows = qr.querySelectorAll('.qr-row');
    rows.forEach((r, i) => anim(r, [{ opacity: 0, transform: 'translateX(-6px)' }, { opacity: 1, transform: 'none' }], i * 18, 260));
    v.querySelectorAll<HTMLElement>('.qh-reel').forEach((reel, i) => {
      const d = Number(pin[i]);
      reel.style.transform = `translateY(${-d * 10}%)`;
      anim(reel, [{ transform: 'translateY(0%)' }, { transform: `translateY(${-d * 10}%)` }], 300 + i * 120, 1200 + i * 80, 'cubic-bezier(.2,.8,.2,1)');
    });
    anim(v.querySelector('.qh-url'), [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], 200, 600);
    anim(v.querySelector('.qh-start'), [{ opacity: 0, transform: 'scale(.8)' }, { opacity: 1, transform: 'none' }], 700, 500, BACK);
    v.querySelector('.qh-start')!.addEventListener('click', start);
    v.querySelector('.qh-list')!.addEventListener('click', (e) => {
      const b = (e.target as Element).closest('button[data-kick]');
      if (b) send({ t: 'host.kick', playerId: b.getAttribute('data-kick') || '' });
    });
    renderPlayers(false);
  }

  function renderPlayers(animateNew: boolean): void {
    const list = box.querySelector('.qh-list');
    const count = box.querySelector('.qh-count');
    if (!list || !count) return;
    count.textContent = players.length ? `${players.length} ${plural(players.length, 'osoba', 'osoby', 'osób')} w grze` : 'Nikt jeszcze nie dołączył';
    const existing = new Set(Array.from(list.children).map((c) => c.getAttribute('data-id')));
    const keep = new Set(players.map((p) => p.id));
    Array.from(list.children).forEach((c) => { if (!keep.has(c.getAttribute('data-id') || '')) c.remove(); });
    for (const p of players) {
      if (existing.has(p.id)) continue;
      const li = document.createElement('li');
      li.setAttribute('data-id', p.id);
      const name = document.createElement('span');
      name.textContent = p.nick;
      const kick = document.createElement('button');
      kick.type = 'button';
      kick.setAttribute('data-kick', p.id);
      kick.setAttribute('aria-label', `Usuń ${p.nick}`);
      kick.innerHTML = icon('x');
      li.appendChild(name);
      li.appendChild(kick);
      list.appendChild(li);
      if (animateNew) anim(li, [{ opacity: 0, transform: 'scale(.4) translateY(10px)' }, { opacity: 1, transform: 'none' }], 0, 480, BACK);
    }
    const startBtn = box.querySelector('.qh-start') as HTMLButtonElement | null;
    if (startBtn) startBtn.disabled = players.length === 0;
  }

  function armOrStart(): void {
    const now = Date.now();
    if (now - armed < 2500) { armed = 0; start(); return; }
    armed = now;
    const e = box.querySelector('.qh-err');
    if (e) e.textContent = 'Naciśnij jeszcze raz, aby rozpocząć quiz.';
  }

  function start(): void {
    if (state !== 'lobby') return;
    if (!players.length) { const e = box.querySelector('.qh-err'); if (e) e.textContent = ERR['no-players']; return; }
    send({ t: 'host.start' });
  }

  function ring(ms: number): string {
    return `<svg class="qh-ring" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" class="qh-ring-bg"/><circle cx="50" cy="50" r="44" class="qh-ring-fg" data-ms="${ms}"/></svg><span class="qh-secs mono"></span>`;
  }

  function runRing(v: HTMLElement, ms: number): void {
    const fg = v.querySelector('.qh-ring-fg') as SVGCircleElement | null;
    const secs = v.querySelector('.qh-secs') as HTMLElement | null;
    if (fg) anim(fg, [{ strokeDashoffset: 0 }, { strokeDashoffset: 276.5 }], 0, Math.max(ms, 1), 'linear');
    if (secs) {
      const end = performance.now() + ms;
      const tick = () => {
        if (!secs.isConnected) return;
        const left = Math.max(0, Math.ceil((end - performance.now()) / 1000));
        secs.textContent = String(left);
        if (left > 0) setTimeout(tick, 200);
      };
      tick();
    }
  }

  function showQuestion(m: Extract<ServerMsg, { t: 'h.question' }>): void {
    if (state === 'question' && lastQ === m.q && lastPhase === m.phase) {
      const a = box.querySelector('.qh-answered');
      if (a) a.textContent = `Odpowiedzi: ${m.answered} / ${m.of}`;
      return;
    }
    const sameQ = lastQ === m.q && state === 'question';
    state = 'question';
    lastQ = m.q;
    lastPhase = m.phase;
    const v = mount('question', `
<div class="qh-top"><p class="mono">Pytanie ${m.q + 1} z ${m.total}</p><div class="qh-clock">${ring(m.endsIn)}</div><p class="mono qh-answered">${m.phase === 'answer' ? `Odpowiedzi: ${m.answered} / ${m.of}` : ''}</p></div>
<h2 class="qh-text"></h2>
<ol class="qh-choices">${m.choices.map((_, i) => `<li class="ans-${i}">${shape(i)}<span class="qh-ctext"></span></li>`).join('')}</ol>`);
    (v.querySelector('.qh-text') as HTMLElement).textContent = m.text;
    v.querySelectorAll('.qh-ctext').forEach((el, i) => { el.textContent = m.choices[i]; });
    runRing(v, m.endsIn);
    if (!sameQ) anim(v.querySelector('.qh-text'), [{ opacity: 0, transform: 'translateY(40px) scale(.97)' }, { opacity: 1, transform: 'none' }], 0, 700);
    const from = ['translate(-60px,-40px)', 'translate(60px,-40px)', 'translate(-60px,40px)', 'translate(60px,40px)'];
    v.querySelectorAll('.qh-choices li').forEach((li, i) => anim(li, [{ opacity: 0, transform: from[i] }, { opacity: 1, transform: 'none' }], 80 + i * 90, 600));
  }

  function showReveal(m: Extract<ServerMsg, { t: 'h.reveal' }>): void {
    state = 'reveal';
    lastPhase = 'reveal';
    lastQ = m.q;
    const total = Math.max(1, m.counts.reduce((a, b) => a + b, 0));
    const v = mount('reveal', `
<div class="qh-top"><p class="mono">Pytanie ${m.q + 1} z ${m.total}</p></div>
<h2 class="qh-text qh-text-sm"></h2>
<div class="qh-split">
  <ol class="qh-choices qh-result">${m.choices.map((_, i) => `<li class="ans-${i} ${i === m.correct ? 'right' : 'wrong'}"><i class="qh-fill"></i>${shape(i)}<span class="qh-ctext"></span><b class="mono">${m.counts[i]}</b></li>`).join('')}</ol>
  <ol class="qh-top5"></ol>
</div>`);
    (v.querySelector('.qh-text') as HTMLElement).textContent = m.text;
    v.querySelectorAll('.qh-ctext').forEach((el, i) => { el.textContent = m.choices[i]; });
    v.querySelectorAll<HTMLElement>('.qh-fill').forEach((f, i) => {
      const s = m.counts[i] / total;
      f.style.transform = `scaleX(${s})`;
      anim(f, [{ transform: 'scaleX(0)' }, { transform: `scaleX(${s})` }], 300 + i * 80, 900);
    });
    v.querySelectorAll('.qh-result li.wrong').forEach((li) => anim(li, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0.45, transform: 'scale(.96)' }], 200, 500));
    const right = v.querySelector('.qh-result li.right');
    anim(right, [{ transform: 'scale(1)' }, { transform: 'scale(1.04)', offset: 0.4 }, { transform: 'scale(1)' }], 250, 700, BACK);
    renderTop(v.querySelector('.qh-top5') as HTMLElement, m.top);
  }

  function renderTop(list: HTMLElement, top: Standing[]): void {
    top.forEach((s, i) => {
      const li = document.createElement('li');
      li.innerHTML = '<b class="mono"></b><span></span><em class="mono"></em>';
      (li.children[0] as HTMLElement).textContent = String(i + 1);
      (li.children[1] as HTMLElement).textContent = s.nick;
      (li.children[2] as HTMLElement).textContent = String(s.score);
      list.appendChild(li);
    });
    const rows = Array.from(list.children) as HTMLElement[];
    const h = rows[0] ? rows[0].offsetHeight || 48 : 48;
    rows.forEach((li, i) => {
      const was = prevTop.indexOf(top[i].nick);
      const fromY = was >= 0 ? (was - i) * h : (rows.length - i) * h * 0.5;
      anim(li, [{ transform: `translateY(${fromY}px)`, opacity: was >= 0 ? 1 : 0 }, { transform: 'none', opacity: 1 }], 500 + i * 60, 800);
    });
    prevTop = top.map((s) => s.nick);
  }

  function showFinal(m: Extract<ServerMsg, { t: 'h.final' }>): void {
    state = 'final';
    const order = [1, 0, 2].filter((i) => m.standings[i]);
    const v = mount('final', `
<h2 class="display qh-final-title">Wyniki</h2>
<div class="qh-podium">${order.map((i) => `<div class="qh-step p${i + 1}"><span class="qh-pname"></span><span class="qh-pscore mono"></span><div class="qh-block"><b>${i + 1}</b></div></div>`).join('')}</div>
<ol class="qh-rest" start="4"></ol>
<button type="button" class="qh-again">Nowa gra</button>`);
    v.querySelectorAll('.qh-step').forEach((st, k) => {
      const s = m.standings[order[k]];
      (st.querySelector('.qh-pname') as HTMLElement).textContent = s.nick;
      (st.querySelector('.qh-pscore') as HTMLElement).textContent = `${s.score} pkt`;
      const delay = order[k] === 0 ? 900 : order[k] === 1 ? 450 : 0;
      anim(st.querySelector('.qh-block'), [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], delay, 800, BACK);
      anim(st.querySelector('.qh-pname'), [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], delay + 600, 500);
      anim(st.querySelector('.qh-pscore'), [{ opacity: 0 }, { opacity: 1 }], delay + 750, 400);
    });
    const rest = v.querySelector('.qh-rest') as HTMLElement;
    m.standings.slice(3, 15).forEach((s, i) => {
      const li = document.createElement('li');
      li.textContent = `${s.nick} · ${s.score}`;
      rest.appendChild(li);
      anim(li, [{ opacity: 0 }, { opacity: 1 }], 1400 + i * 40, 400);
    });
    v.querySelector('.qh-again')!.addEventListener('click', () => {
      session = null;
      store('quiz-host', null);
      prevTop = [];
      const key = store('quiz-key') as string | null;
      if (key && link) send({ t: 'host.create', key }); else showKey();
    });
    confetti(v);
  }

  function confetti(v: HTMLElement): void {
    const n = isLite() ? 14 : 38;
    const colors = ['#14b53a', '#fcd116', '#ce1126', '#efe3cc', '#e3a43a'];
    const layer = document.createElement('div');
    layer.className = 'qh-confetti';
    layer.setAttribute('aria-hidden', 'true');
    v.appendChild(layer);
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i');
      p.style.left = `${Math.random() * 100}%`;
      p.style.background = colors[i % colors.length];
      layer.appendChild(p);
      const x = (Math.random() - 0.5) * 240;
      const r = Math.random() * 720 - 360;
      anim(p, [{ transform: 'translate(0,-10vh) rotate(0deg)', opacity: 1 }, { transform: `translate(${x}px,105vh) rotate(${r}deg)`, opacity: 0.9 }], 900 + Math.random() * 900, 2400 + Math.random() * 1600, 'cubic-bezier(.25,.6,.45,1)');
    }
    setTimeout(() => layer.remove(), 6000);
  }

  function onMsg(m: ServerMsg): void {
    switch (m.t) {
      case 'host.created':
        session = { pin: m.pin, hostToken: m.hostToken };
        store('quiz-host', session);
        return;
      case 'h.lobby': showLobby(m.pin, m.players); return;
      case 'h.question': showQuestion(m); return;
      case 'h.reveal': showReveal(m); return;
      case 'h.final': showFinal(m); return;
      case 'error':
        if (m.code === 'bad-key' && session) { session = null; store('quiz-host', null); const key = store('quiz-key') as string | null; if (key) { send({ t: 'host.create', key }); return; } }
        if (m.code === 'bad-key') { store('quiz-key', null); showKey(ERR['bad-key']); return; }
        if (m.code === 'expired') { session = null; store('quiz-host', null); showIdle(); return; }
        { const e = box.querySelector('.qh-err'); if (e) e.textContent = ERR[m.code]; else status.textContent = ERR[m.code]; }
        return;
      default: return;
    }
  }

  return {
    onAction(a) {
      if (a !== 'next') return false;
      if (state === 'lobby') { armOrStart(); return true; }
      if (state === 'question' || state === 'reveal') { send({ t: 'host.next', q: lastQ, phase: lastPhase as 'read' | 'answer' | 'reveal' }); return true; }
      return false;
    },
    resume() {
      if (session && !link) ensureLink();
    },
    showIdle
  };
}
