import { test, expect } from '@playwright/test';
import { finishEntrance, assertAllAnimated, assertNoOverflow } from './helpers.ts';

test('sword cut reveals the text within 4 s', async ({ page }) => {
  await page.goto('./?lite=0#/4');
  await page.waitForSelector('.slide.s-war');
  const t0 = Date.now();
  await finishEntrance(page);
  expect(Date.now() - t0).toBeLessThan(4000 + 800);
  await expect(page.locator('.s4-title')).toBeVisible();
  const halves = await page.locator('.s4-piece').evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity));
  for (const o of halves) expect(Number(o)).toBe(0);
});

test('sword is on screen during the strike', async ({ page }) => {
  await page.goto('./?lite=0#/4');
  await page.waitForSelector('.slide.s-war');
  await page.waitForTimeout(1500);
  const box = await page.locator('.s4-sword').boundingBox();
  const op = await page.locator('.s4-sword').evaluate((e) => Number(getComputedStyle(e).opacity));
  expect(op).toBeGreaterThan(0.5);
  expect(box && box.y + box.height > 0 && box.y < 720).toBe(true);
});

test('resize during sword keeps the final state visible', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('./?lite=0#/4');
  await page.waitForSelector('.slide.s-war');
  await page.waitForTimeout(800);
  await page.setViewportSize({ width: 390, height: 844 });
  await finishEntrance(page);
  await assertNoOverflow(page, 4);
  const b = await page.locator('.s4-title').boundingBox();
  expect(b && b.x >= 0 && b.x + b.width <= 391).toBe(true);
});

test('lite still animates the sword slide', async ({ page }) => {
  await page.goto('./?lite=1#/4');
  await expect(page.locator('#deck')).toHaveAttribute('data-entering', '');
  await finishEntrance(page);
  await assertAllAnimated(page, 4);
});
