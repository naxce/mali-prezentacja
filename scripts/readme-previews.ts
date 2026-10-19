import { spawn, execFileSync, type ChildProcess } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Page } from '@playwright/test';

const OUT = '.github/preview';
const TMP = 'build/preview-tmp';
const PORT = 4175;
const KEY = 'readme-preview-key-123';
mkdirSync(OUT, { recursive: true });
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
const procs: ChildProcess[] = [
  spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore', detached: true }),
  spawn('node', ['build/server/server/main.js'], { stdio: 'ignore', detached: true, env: { ...process.env, HOST_KEY: KEY, ALLOWED_ORIGINS: `http://localhost:${PORT}`, QUESTIONS_PATH: 'data/questions.example.json', POW_BITS: '8' } })
];
const base = `http://localhost:${PORT}/wos/mali/`;

async function settle(page: Page): Promise<void> {
  await page.waitForFunction(() => !!document.querySelector('#deck .slide') && !document.getElementById('deck')!.hasAttribute('data-entering'), null, { timeout: 15000 });
  await page.waitForTimeout(400);
}

async function webp(png: string, out: string, extra: string[] = []): Promise<void> {
  execFileSync('magick', [png, ...extra, '-quality', '82', out]);
}

try {
  for (let i = 0; i < 80; i++) { try { if ((await fetch(base)).ok && (await fetch(`http://127.0.0.1:3210/wos/mali/api/health`)).ok) break; } catch { await new Promise((r) => setTimeout(r, 250)); } }
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await ctx.newPage();
  for (const n of [1, 2, 6, 8, 11, 12]) {
    await page.goto(`${base}?lite=0#/${n}`);
    await page.reload();
    await settle(page);
    await page.mouse.move(5, 5);
    await page.waitForTimeout(2800);
    const png = join(TMP, `s${n}.png`);
    await page.screenshot({ path: png });
    if (n === 1) await webp(png, join(OUT, 'banner.webp'), ['-gravity', 'south', '-crop', '1600x560+0+0', '+repage']);
    else await webp(png, join(OUT, `s${String(n).padStart(2, '0')}.webp`));
  }
  await page.goto(`${base}?lite=0#/13`);
  await settle(page);
  await page.click('.qh-go');
  await page.fill('#qh-key', KEY);
  await page.click('.qh-keyform button');
  await page.waitForSelector('.qh-pin');
  const pin = ((await page.locator('.qh-pin').getAttribute('aria-label')) || '').replace('PIN ', '');
  let lena: Page | null = null;
  for (const nick of ['Kasia', 'Ola', 'Mateusz K', 'Zuzia', 'Igor', 'Lena']) {
    const pc = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const p = await pc.newPage();
    await p.goto(`${base}quiz/?pin=${pin}`);
    await p.fill('#nick', nick);
    await p.click('.pv-btn');
    await p.waitForSelector('.pv-lobby');
    if (nick === 'Lena') lena = p;
  }
  await page.waitForTimeout(1500);
  await page.click('.qh-start');
  await page.waitForSelector('.qh-choices li');
  await page.mouse.move(5, 5);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: join(TMP, 'quiz.png') });
  await webp(join(TMP, 'quiz.png'), join(OUT, 's13.webp'));
  if (lena) {
    await lena.waitForSelector('.pv-ans');
    await lena.waitForTimeout(900);
    await lena.screenshot({ path: join(TMP, 'phone.png') });
    await webp(join(TMP, 'phone.png'), join(OUT, 'phone.webp'));
  }
  const recStart = Date.now();
  const vctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: TMP, size: { width: 1280, height: 720 } } });
  const vp = await vctx.newPage();
  await vp.goto(`${base}?lite=0#/3`);
  await settle(vp);
  await vp.mouse.move(5, 5);
  await vp.waitForTimeout(1200);
  const pressAt = (Date.now() - recStart) / 1000;
  await vp.keyboard.press('ArrowRight');
  await vp.waitForTimeout(4800);
  await vctx.close();
  await browser.close();
  const webm = readdirSync(TMP).find((f) => f.endsWith('.webm'));
  if (webm) {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', Math.max(0, pressAt - 0.15).toFixed(2), '-t', '4.3', '-i', join(TMP, webm), '-vf', 'fps=14,scale=720:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=4', join(OUT, 'sword.gif')]);
  }
  console.log(readdirSync(OUT).join(' '));
} finally {
  for (const p of procs) if (p.pid) try { process.kill(-p.pid); } catch { p.kill(); }
}
