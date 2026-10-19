import { test, expect, type Page } from '@playwright/test';

async function open(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page.waitForFunction(() => !!(window as any).__deck && !!document.querySelector('#deck .slide'));
}

const REPO = 'https://github.com/naxce/mali-prezentacja';

test('keyboard navigation updates the hash', async ({ page }) => {
  await open(page, './');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/#\/2$/);
});

test('clicker keys PageDown and PageUp', async ({ page }) => {
  await open(page, './#/3');
  await page.evaluate(() => (window as any).__deck.settle());
  await page.keyboard.press('PageDown');
  await page.evaluate(() => (window as any).__deck.settle());
  await expect(page).toHaveURL(/#\/4$/);
  await page.keyboard.press('PageUp');
  await page.evaluate(() => (window as any).__deck.settle());
  await expect(page).toHaveURL(/#\/3$/);
});

test('reload keeps the slide', async ({ page }) => {
  await open(page, './#/5');
  await page.reload();
  await expect(page.locator('.slide.s-jihad')).toBeVisible();
});

test('mouse drag swipes to next slide', async ({ page }) => {
  await open(page, './#/2');
  await page.evaluate(() => (window as any).__deck.settle());
  await page.mouse.move(800, 400);
  await page.mouse.down();
  await page.mouse.move(740, 402);
  await page.mouse.move(660, 404);
  await page.mouse.up();
  await expect(page).toHaveURL(/#\/3$/);
});

test('first press fast-forwards the entrance, second advances', async ({ page }) => {
  await open(page, './#/2');
  await page.evaluate(() => (window as any).__deck.settle());
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#deck')).toHaveAttribute('data-entering', '');
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/#\/3$/);
  await expect(page.locator('#deck')).not.toHaveAttribute('data-entering', '');
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/#\/4$/);
});

test('held key auto-repeat does not skip slides', async ({ page }) => {
  await open(page, './#/2');
  await page.evaluate(() => (window as any).__deck.settle());
  await page.keyboard.down('ArrowRight');
  await page.keyboard.down('ArrowRight');
  await page.keyboard.down('ArrowRight');
  await page.keyboard.up('ArrowRight');
  await expect(page).toHaveURL(/#\/3$/);
});

test('L toggles lite mode', async ({ page }) => {
  await open(page, './');
  await page.keyboard.press('l');
  await expect(page.locator('html')).toHaveClass(/lite/);
  await page.keyboard.press('l');
  await expect(page.locator('html')).not.toHaveClass(/lite/);
});

test('GitHub link points to the repo', async ({ page }) => {
  await open(page, './');
  await expect(page.locator('.controls a.gh')).toHaveAttribute('href', REPO);
});

test('reduced motion turns lite on but keeps animations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, './#/2');
  await expect(page.locator('html')).toHaveClass(/lite/);
  await expect(page.locator('.slide.s-mali [data-anim]').first()).toBeAttached();
});
