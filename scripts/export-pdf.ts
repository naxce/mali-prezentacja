import { spawn, execFileSync } from 'node:child_process';
import { existsSync, readFileSync, mkdirSync, statSync } from 'node:fs';
import { chromium } from '@playwright/test';

const out = 'build/prezentacja-mali.pdf';
const port = 4174;
mkdirSync('build', { recursive: true });
execFileSync('npx', ['vite', 'build'], { stdio: 'inherit' });
const preview = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], { stdio: 'ignore', detached: true });

const questions: string[] = existsSync('data/questions.json')
  ? (JSON.parse(readFileSync('data/questions.json', 'utf8')).questions as { text: string }[]).map((q) => q.text)
  : [];

try {
  const url = `http://localhost:${port}/wos/mali/?print=1`;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(url)).ok) break; } catch { await new Promise((r) => setTimeout(r, 250)); }
  }
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('html[data-print-ready]');
  await page.evaluate((qs) => {
    const ol = document.querySelector('[data-print-questions]');
    if (ol) for (const q of qs) { const li = document.createElement('li'); li.textContent = q; ol.appendChild(li); }
  }, questions);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images).map((img) => (img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; }))));
  });
  await page.pdf({ path: out, width: '1920px', height: '1080px', printBackground: true, preferCSSPageSize: true });
  await browser.close();
  const pdf = readFileSync(out, 'latin1');
  const pages = (pdf.match(/\/Type\s*\/Page[^s]/g) || []).length;
  console.log(`${out}: ${pages} stron, ${(statSync(out).size / 1048576).toFixed(1)} MB`);
} finally {
  if (preview.pid) try { process.kill(-preview.pid); } catch { preview.kill(); }
}
