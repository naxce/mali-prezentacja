import '../fonts.ts';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/quiz.css';
import { connect, apiBase, forcedTransport, type Status } from '../net/client.ts';
import { checkNickname } from '../../shared/nickname.ts';
import { solve } from '../../shared/pow.ts';
import type { ServerMsg, ErrorCode } from '../../shared/protocol.ts';
import { ERR, KICKED, plural, store } from './copy.ts';
import checkIcon from '@phosphor-icons/core/assets/bold/check-bold.svg?raw';
import xIcon from '@phosphor-icons/core/assets/bold/x-bold.svg?raw';
import { shape } from './shapes.ts';

interface Session { pin: string; token: string; nick: string }

const app = document.getElementById('app') as HTMLElement;
document.body.classList.add('player');
const statusEl = document.createElement('div');
statusEl.className = 'net-status';
statusEl.setAttribute('role', 'status');
document.body.appendChild(statusEl);

const pinFromUrl = (/[?&]pin=(\d{6})/.exec(location.search) || [])[1] || '';
let session = store('quiz-player', undefined, true) as Session | null;
if (session && pinFromUrl && session.pin !== pinFromUrl) { store('quiz-player', null, true); session = null; }
let pending: { pin: string; nick: string } | null = null;
let pinDraft = pinFromUrl;
let lastQ = -1;
let lastPhase = '';
let screen = '';
let myAnswer: { q: number; id: string; resent: boolean } | null = null;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function anim(el: Element | null, frames: Keyframe[], delay: number, dur: number, easing = 'cubic-bezier(.16,1,.3,1)'): void {
  if (el && typeof (el as HTMLElement).animate === 'function') (el as HTMLElement).animate(frames, { delay, duration: dur, easing, fill: 'both' });
}

function view(name: string, html: string): HTMLElement {
  screen = name;
  app.innerHTML = `<section class="pv pv-s-${name}">${html}</section>`;
  return app.firstElementChild as HTMLElement;
}

const link = connect({ base: apiBase(), force: forcedTransport(), onMsg, onStatus });

function onStatus(s: Status): void {
  statusEl.textContent = s === 'online' ? '' : s === 'connecting' ? 'Łączenie…' : 'Brak połączenia, ponawiam…';
  statusEl.className = `net-status ${s}`;
  if (s === 'online' && session) link.send({ t: 'resume', pin: session.pin, token: session.token });
  else if (s === 'online' && pending) link.send({ t: 'challenge' });
}

function showPin(err = ''): void {
  const v = view('pin', `
<header class="pv-head"><span class="mono">Quiz</span><h1 class="display">Mali i Sahel</h1></header>
<form class="pv-form" novalidate>
  <label for="pin" class="mono">PIN gry</label>
  <input id="pin" name="pin" inputmode="numeric" autocomplete="off" pattern="[0-9]*" maxlength="6" value="${esc(pinDraft)}" aria-describedby="pin-err" required>
  <p id="pin-err" class="pv-err" role="alert">${esc(err)}</p>
  <button type="submit" class="pv-btn">Dalej</button>
</form>`);
  const input = v.querySelector('input') as HTMLInputElement;
  anim(v.querySelector('.pv-head'), [{ opacity: 0, transform: 'translateY(-24px)' }, { opacity: 1, transform: 'none' }], 0, 700);
  anim(input, [{ opacity: 0, transform: 'scaleX(.4)' }, { opacity: 1, transform: 'none' }], 150, 650);
  anim(v.querySelector('.pv-btn'), [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], 300, 600);
  input.addEventListener('input', () => { input.value = input.value.replace(/\D/g, '').slice(0, 6); pinDraft = input.value; });
  (v.querySelector('form') as HTMLFormElement).addEventListener('submit', (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(input.value)) { showPin('PIN ma 6 cyfr. Znajdziesz go na tablicy.'); return; }
    pinDraft = input.value;
    showNick();
  });
  if (!pinDraft) input.focus();
}

function showNick(err = '', value = ''): void {
  const v = view('nick', `
<header class="pv-head"><span class="mono">PIN ${esc(pinDraft)}</span><h1 class="display">Jak się nazywasz?</h1></header>
<form class="pv-form" novalidate>
  <label for="nick" class="mono">Twój nick</label>
  <input id="nick" name="nick" autocomplete="off" autocapitalize="words" maxlength="16" value="${esc(value)}" aria-describedby="nick-hint nick-err" required>
  <p id="nick-hint" class="pv-hint">Od 2 do 16 znaków.</p>
  <p id="nick-err" class="pv-err" role="alert">${esc(err)}</p>
  <button type="submit" class="pv-btn">Dołącz</button>
  <button type="button" class="pv-link" data-back>Zmień PIN</button>
</form>`);
  const input = v.querySelector('input') as HTMLInputElement;
  anim(v.querySelector('.pv-head'), [{ opacity: 0, transform: 'translateX(40px)' }, { opacity: 1, transform: 'none' }], 0, 650);
  anim(v.querySelector('.pv-form'), [{ opacity: 0, transform: 'translateX(60px)' }, { opacity: 1, transform: 'none' }], 120, 650);
  (v.querySelector('[data-back]') as HTMLElement).addEventListener('click', () => showPin());
  (v.querySelector('form') as HTMLFormElement).addEventListener('submit', (e) => {
    e.preventDefault();
    const r = checkNickname(input.value);
    if (!r.ok) { showNick(r.reason === 'blocked' ? ERR['nick-blocked'] : ERR['nick-invalid'], input.value); return; }
    pending = { pin: pinDraft, nick: r.nick };
    showBusy('Weryfikacja urządzenia…');
    link.send({ t: 'challenge' });
  });
  input.focus();
}

function showBusy(text: string): void {
  const v = view('busy', `<div class="pv-busy"><span class="pv-bar"><i></i></span><p class="mono">${esc(text)}</p></div>`);
  anim(v.querySelector('.pv-busy'), [{ opacity: 0 }, { opacity: 1 }], 0, 300);
}

function solveAsync(token: string, bits: number): Promise<string> {
  return new Promise((resolve) => {
    let from = 0;
    const step = () => {
      const r = solve(token, bits, from, 2500);
      if (r !== null) resolve(r);
      else { from += 2500; setTimeout(step, 0); }
    };
    setTimeout(step, 30);
  });
}

function routeError(code: ErrorCode): void {
  const msg = ERR[code];
  if (code === 'expired') { store('quiz-player', null, true); session = null; showPin(msg); return; }
  if (pending) {
    const p = pending;
    pending = null;
    if (code === 'nick-taken' || code === 'nick-invalid' || code === 'nick-blocked' || code === 'banned') showNick(msg, p.nick);
    else showPin(msg);
    return;
  }
  const errEl = app.querySelector('.pv-err');
  if (errEl) errEl.textContent = msg;
}

function countdown(bar: HTMLElement | null, ms: number): void {
  if (bar && typeof bar.animate === 'function') bar.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: Math.max(ms, 1), easing: 'linear', fill: 'forwards' });
}

function showLobby(nick: string, count: number): void {
  if (screen === 'lobby') {
    const c = app.querySelector('[data-count]');
    if (c) c.textContent = `${count} ${plural(count, 'osoba', 'osoby', 'osób')} w grze`;
    return;
  }
  const v = view('lobby', `
<div class="pv-lobby">
  <span class="pv-pulse" aria-hidden="true"></span>
  <p class="mono">Jesteś w grze</p>
  <h1 class="display">${esc(nick)}</h1>
  <p class="pv-hint" data-count>${count} ${plural(count, 'osoba', 'osoby', 'osób')} w grze</p>
  <p class="pv-hint">Patrz na tablicę. Quiz zaraz się zacznie.</p>
</div>`);
  anim(v.querySelector('h1'), [{ opacity: 0, transform: 'scale(.7) rotate(-3deg)' }, { opacity: 1, transform: 'none' }], 100, 700, 'cubic-bezier(.34,1.56,.64,1)');
  anim(v.querySelector('.pv-pulse'), [{ opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'none' }], 0, 600);
}

function showQuestion(m: Extract<ServerMsg, { t: 'p.question' }>): void {
  const same = lastQ === m.q && lastPhase === m.phase && screen === 'question';
  lastQ = m.q;
  lastPhase = m.phase;
  if (same) {
    if (!m.locked && myAnswer && myAnswer.q === m.q && !myAnswer.resent) {
      myAnswer.resent = true;
      link.send({ t: 'answer', q: m.q, choice: myAnswer.id });
      return;
    }
    markLocked(m.locked);
    return;
  }
  const answers = m.phase === 'answer'
    ? `<div class="pv-answers">${m.choices.map((c, i) => `<button type="button" class="pv-ans ans-${i}" data-id="${esc(c.id)}">${shape(i)}<span>${esc(c.text)}</span></button>`).join('')}</div>`
    : '';
  const v = view('question', `
<div class="pv-q">
  <div class="pv-qhead"><span class="mono">Pytanie ${m.q + 1} z ${m.total}</span><span class="pv-timer"><i></i></span></div>
  <h1 class="pv-qtext"></h1>
  ${answers}
  <p class="pv-err" role="alert"></p>
</div>`);
  (v.querySelector('.pv-qtext') as HTMLElement).textContent = m.text;
  countdown(v.querySelector('.pv-timer i'), m.endsIn);
  if (m.phase === 'read') {
    anim(v.querySelector('.pv-qtext'), [{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }], 0, 600);
    return;
  }
  const from = ['translate(-40px,-30px)', 'translate(40px,-30px)', 'translate(-40px,30px)', 'translate(40px,30px)'];
  v.querySelectorAll('.pv-ans').forEach((b, i) => anim(b, [{ opacity: 0, transform: `${from[i]} scale(.9)` }, { opacity: 1, transform: 'none' }], i * 60, 450));
  v.querySelectorAll<HTMLButtonElement>('.pv-ans').forEach((b) => b.addEventListener('click', () => {
    if (app.querySelector('.pv-ans.chosen')) return;
    myAnswer = { q: m.q, id: b.getAttribute('data-id') || '', resent: false };
    link.send({ t: 'answer', q: m.q, choice: myAnswer.id });
    markLocked(b.getAttribute('data-id'));
  }));
  markLocked(m.locked);
}

function markLocked(id: string | null): void {
  if (!id) return;
  const all = app.querySelectorAll<HTMLButtonElement>('.pv-ans');
  all.forEach((b) => {
    b.disabled = true;
    const on = b.getAttribute('data-id') === id;
    b.classList.toggle('chosen', on);
    b.classList.toggle('dim', !on);
  });
  const err = app.querySelector('.pv-err');
  if (err && !err.textContent) err.textContent = 'Odpowiedź zapisana.';
}

function showReveal(m: Extract<ServerMsg, { t: 'p.reveal' }>): void {
  lastPhase = 'reveal';
  const ok = m.chosen !== null && m.chosen === m.correct;
  const head = m.chosen === null ? 'Brak odpowiedzi' : ok ? 'Poprawna odpowiedź!' : 'Niestety, źle.';
  const v = view('reveal', `
<div class="pv-reveal ${ok ? 'good' : 'bad'}">
  <span class="pv-mark" aria-hidden="true">${ok ? checkIcon : xIcon}</span>
  <h1 class="display">${head}</h1>
  <p class="stat">+${m.points}<span class="mono"> pkt</span></p>
  <p class="pv-hint">Razem ${m.score} pkt<br>Miejsce ${m.rank} z ${m.of}</p>
</div>`);
  anim(v.querySelector('.pv-mark'), [{ opacity: 0, transform: 'scale(2.6) rotate(-20deg)' }, { opacity: 1, transform: 'none' }], 0, 600, 'cubic-bezier(.34,1.56,.64,1)');
  anim(v.querySelector('h1'), [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], 200, 500);
  anim(v.querySelector('.stat'), [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'none' }], 380, 500, 'cubic-bezier(.34,1.56,.64,1)');
}

function showFinal(m: Extract<ServerMsg, { t: 'p.final' }>): void {
  const v = view('final', `
<div class="pv-final">
  <p class="mono">Koniec quizu</p>
  <h1 class="display">Miejsce <span>${m.rank}</span> z ${m.of}</h1>
  <p class="stat">${m.score}<span class="mono"> pkt</span></p>
  <ol class="pv-podium">${m.podium.map((p, i) => `<li><b>${i + 1}</b><span></span><em>${p.score}</em></li>`).join('')}</ol>
  <p class="pv-hint">Dzięki za grę!</p>
</div>`);
  v.querySelectorAll('.pv-podium span').forEach((s, i) => { s.textContent = m.podium[i].nick; });
  anim(v.querySelector('h1 span'), [{ opacity: 0, transform: 'scale(3)' }, { opacity: 1, transform: 'none' }], 150, 650, 'cubic-bezier(.2,.9,.3,1)');
  v.querySelectorAll('.pv-podium li').forEach((li, i) => anim(li, [{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }], 500 + i * 120, 500));
  store('quiz-player', null, true);
}

function onMsg(m: ServerMsg): void {
  switch (m.t) {
    case 'challenge':
      if (!pending) return;
      void solveAsync(m.token, m.bits).then((nonce) => {
        if (pending) link.send({ t: 'join', pin: pending.pin, nick: pending.nick, pow: { token: m.token, nonce } });
      });
      return;
    case 'joined': {
      const pin = pending ? pending.pin : session ? session.pin : pinDraft;
      if (!/^\d{6}$/.test(pin)) return;
      session = { pin, token: m.token, nick: m.nick };
      store('quiz-player', session, true);
      pending = null;
      return;
    }
    case 'p.lobby': showLobby(m.nick, m.count); return;
    case 'p.question': showQuestion(m); return;
    case 'p.reveal': showReveal(m); return;
    case 'p.final': showFinal(m); return;
    case 'kicked': {
      store('quiz-player', null, true);
      session = null;
      link.close();
      const v = view('kicked', `<div class="pv-final"><h1 class="display">${KICKED}</h1></div>`);
      anim(v.querySelector('h1'), [{ opacity: 0, transform: 'translateY(-30px)' }, { opacity: 1, transform: 'none' }], 0, 600);
      return;
    }
    case 'error': routeError(m.code); return;
    default: return;
  }
}

if (session) showBusy('Wracam do gry…'); else if (pinFromUrl) showNick(); else showPin();
