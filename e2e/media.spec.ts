import { test, expect } from '@playwright/test';
import { finishEntrance } from './helpers.ts';

test('background video plays muted and looped, lite shows the poster', async ({ page }) => {
  await page.goto('./?lite=0#/2');
  await finishEntrance(page);
  const v = page.locator('.slide.s-mali video');
  await expect(v).toHaveAttribute('aria-hidden', 'true');
  await expect(v).toHaveAttribute('playsinline', '');
  await expect(v).toHaveAttribute('loop', '');
  await expect.poll(() => v.evaluate((el: HTMLVideoElement) => el.muted && !!el.getAttribute('src'))).toBe(true);
  await page.keyboard.press('l');
  await expect.poll(() => v.evaluate((el: HTMLVideoElement) => el.paused && !el.getAttribute('src'))).toBe(true);
});

test('sandstorm particle budget', async ({ page }) => {
  await page.goto('./?lite=0#/5');
  await finishEntrance(page);
  expect(await page.locator('.s5-dust circle[data-anim]').count()).toBeLessThanOrEqual(36);
  await page.goto('./?lite=1#/5');
  await page.reload();
  await finishEntrance(page);
  expect(await page.locator('.s5-dust circle[data-anim]').count()).toBeLessThanOrEqual(12);
});
