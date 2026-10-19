import { test, expect, type Page, type Browser } from '@playwright/test';

const KEY = 'test-host-key-123';
const KICKED = 'Prowadzący usunął cię z gry.';

async function openHost(page: Page): Promise<string> {
  await page.goto('./#/13');
  await expect(page.locator('#deck')).not.toHaveAttribute('data-entering', '', { timeout: 8000 });
  await page.click('.qh-go');
  await page.fill('#qh-key', KEY);
  await page.click('.qh-keyform button');
  const pinEl = page.locator('.qh-pin');
  await expect(pinEl).toBeVisible();
  await expect(page.locator('.qh-qr svg')).toBeVisible();
  const label = (await pinEl.getAttribute('aria-label')) || '';
  const pin = label.replace('PIN ', '');
  expect(pin).toMatch(/^\d{6}$/);
  return pin;
}

async function player(browser: Browser, pin: string, nick: string, extra = ''): Promise<Page> {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  await p.goto(`quiz/?pin=${pin}${extra}`);
  await expect(p.locator('#nick')).toBeVisible();
  await p.fill('#nick', nick);
  await p.click('.pv-btn');
  await expect(p.locator('.pv-lobby')).toBeVisible({ timeout: 15000 });
  return p;
}

async function answerFirst(p: Page): Promise<void> {
  await expect(p.locator('.pv-qtext')).toBeVisible();
  await expect(p.locator('.pv-ans')).toHaveCount(4, { timeout: 8000 });
  await p.locator('.pv-ans').first().click();
  await expect(p.locator('.pv-ans.chosen')).toHaveCount(1);
}

test('full game', async ({ page, browser }) => {
  const pin = await openHost(page);
  const kasia = await player(browser, pin, 'Kasia');
  const ola = await player(browser, pin, 'Ola', '&transport=poll');
  await expect(page.locator('.qh-list li')).toHaveCount(2);
  await page.click('.qh-start');
  for (let q = 0; q < 2; q++) {
    await answerFirst(kasia);
    await answerFirst(ola);
    await expect(page.locator('.qh-reveal')).toBeVisible({ timeout: 8000 });
    for (const p of [kasia, ola]) await expect(p.locator('.pv-reveal h1')).toHaveText(/Poprawna odpowiedź!|Niestety, źle\./);
    await page.keyboard.press('ArrowRight');
  }
  await expect(page.locator('.qh-final')).toBeVisible();
  await expect(page.locator('.qh-step')).toHaveCount(2);
  for (const p of [kasia, ola]) await expect(p.locator('.pv-final')).toBeVisible();
});

test('blocked nick shows the error', async ({ page, browser }) => {
  const pin = await openHost(page);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  await p.goto(`quiz/?pin=${pin}`);
  await p.fill('#nick', 'Adolf H');
  await p.click('.pv-btn');
  await expect(p.locator('.pv-err')).toHaveText('Ten nick jest niedozwolony. Wybierz inny.');
});

test('player reconnects and keeps the locked answer', async ({ page, browser }) => {
  const pin = await openHost(page);
  const a = await player(browser, pin, 'Zuzia');
  await player(browser, pin, 'Igor');
  await page.click('.qh-start');
  await answerFirst(a);
  await a.context().setOffline(true);
  await a.waitForTimeout(2500);
  await a.context().setOffline(false);
  await expect(a.locator('.net-status')).toHaveClass(/online/, { timeout: 15000 });
  await expect(a.locator('.pv-ans.chosen')).toHaveCount(1);
});

test('host reload resumes the same game', async ({ page, browser }) => {
  const pin = await openHost(page);
  await player(browser, pin, 'Lena');
  await page.reload();
  await expect(page.locator('.qh-pin')).toHaveAttribute('aria-label', `PIN ${pin}`, { timeout: 10000 });
  await expect(page.locator('.qh-list li')).toHaveCount(1);
});

test('kick removes the player', async ({ page, browser }) => {
  const pin = await openHost(page);
  const ola = await player(browser, pin, 'Ola');
  await page.click('.qh-list button[aria-label="Usuń Ola"]');
  await expect(ola.locator('.pv-final h1')).toHaveText(KICKED);
  await expect(page.locator('.qh-list li')).toHaveCount(0);
});

test('network test page is green', async ({ page }) => {
  await page.goto('quiz/test/');
  await expect(page.locator('.nt li.ok')).toHaveCount(3, { timeout: 20000 });
});

test('lost poll answer is retried and counted', async ({ page, browser }) => {
  const pin = await openHost(page);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  let dropped = false;
  await p.route('**/api/send', async (route) => {
    const body = route.request().postData() || '';
    if (!dropped && body.includes('answer')) { dropped = true; await route.abort(); return; }
    await route.continue();
  });
  await p.goto(`quiz/?pin=${pin}&transport=poll`);
  await p.fill('#nick', 'Poll');
  await p.click('.pv-btn');
  await expect(p.locator('.pv-lobby')).toBeVisible({ timeout: 15000 });
  await page.click('.qh-start');
  await answerFirst(p);
  await expect(page.locator('.qh-reveal')).toBeVisible({ timeout: 12000 });
  expect(dropped).toBe(true);
  await expect(p.locator('.pv-reveal h1')).not.toHaveText('Brak odpowiedzi');
});

test('closed tab rejoins the same game', async ({ page, browser }) => {
  const pin = await openHost(page);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  await p.goto(`quiz/?pin=${pin}`);
  await p.fill('#nick', 'Wraca');
  await p.click('.pv-btn');
  await expect(p.locator('.pv-lobby')).toBeVisible({ timeout: 15000 });
  await p.close();
  const again = await ctx.newPage();
  await again.goto(`quiz/?pin=${pin}`);
  await expect(again.locator('.pv-lobby h1')).toHaveText('Wraca', { timeout: 10000 });
  await expect(page.locator('.qh-list li')).toHaveCount(1);
});

test('one stray press in the lobby does not start the quiz', async ({ page, browser }) => {
  const pin = await openHost(page);
  await player(browser, pin, 'Ala');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(600);
  await expect(page.locator('.qh-lobby')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.qh-question')).toBeVisible({ timeout: 6000 });
});
