import { test, expect } from '@playwright/test';
import { finishEntrance } from './helpers.ts';

const REPO = 'https://github.com/naxce/mali-prezentacja';

test('footnote jumps to the source and back returns', async ({ page }) => {
  await page.goto('./?lite=0#/2');
  await finishEntrance(page);
  const cite = page.locator('.slide.s-mali .cite').first();
  const href = (await cite.getAttribute('href')) || '';
  const n = /s(\d+)$/.exec(href)![1];
  await cite.click();
  await expect(page).toHaveURL(new RegExp(`#/14/s${n}$`));
  await expect(page.locator(`#src-${n}`)).toHaveClass(/flash/);
  await expect(page.locator('.s14-back')).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/#\/2$/);
});

test('sources list scrolls without changing slide', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('./?lite=0#/14');
  await finishEntrance(page);
  const box = page.locator('.s14-scroll');
  await box.hover();
  await page.mouse.wheel(0, 600);
  await expect.poll(() => box.evaluate((e) => e.scrollTop)).toBeGreaterThan(0);
  await page.mouse.move(640, 500);
  await page.mouse.down();
  await page.mouse.move(640, 300, { steps: 5 });
  await page.mouse.up();
  await expect(page).toHaveURL(/#\/14$/);
});

test('every source has a working number and https url', async ({ page }) => {
  await page.goto('./?lite=0#/14');
  await expect(page.locator('.s14-list a').first()).toBeAttached();
  const urls = await page.locator('.s14-list a').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
  expect(urls.length).toBeGreaterThan(100);
  for (const u of urls) expect(u.startsWith('https://')).toBe(true);
});

test('end slide credits only the author and links the repo', async ({ page }) => {
  await page.goto('./?lite=0#/15');
  await finishEntrance(page);
  await expect(page.locator('.s15-sign')).toHaveAttribute('aria-label', 'Adam Pietrzak 4D');
  await expect(page.locator('.s15-gh')).toHaveAttribute('href', REPO);
});

test('back button is hidden when the sources slide is opened directly', async ({ page }) => {
  await page.goto('./?lite=0#/14/s3');
  await finishEntrance(page);
  await expect(page.locator('.s14-back')).toBeHidden();
});

test('actor cards flip with the keyboard without leaving the slide', async ({ page }) => {
  await page.goto('./?lite=0#/12');
  await finishEntrance(page);
  const card = page.locator('.s12-card').first();
  await card.focus();
  await page.keyboard.press(' ');
  await expect(card).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL(/#\/12$/);
  await page.keyboard.press('Enter');
  await expect(card).toHaveAttribute('aria-pressed', 'false');
  expect(await page.locator('button a').count()).toBe(0);
});

test('tapping actor cards flips them without leaving the slide', async ({ page }) => {
  await page.goto('./?lite=0#/12');
  await finishEntrance(page);
  for (const i of [0, 2, 5]) {
    const card = page.locator('.s12-card').nth(i);
    await card.click({ position: { x: 24, y: 24 } });
    await expect(card).toHaveAttribute('aria-pressed', 'true');
    await card.click({ position: { x: 24, y: 24 } });
    await expect(card).toHaveAttribute('aria-pressed', 'false');
  }
  await page.waitForTimeout(400);
  await expect(page).toHaveURL(/#\/12$/);
});
