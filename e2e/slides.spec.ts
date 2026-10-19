import { test } from '@playwright/test';
import { visit, finishEntrance, assertAllAnimated, assertNoOverflow, assertImages } from './helpers.ts';

const DONE = process.env.SLIDES ? process.env.SLIDES.split(',').map(Number) : Array.from({ length: 15 }, (_, i) => i + 1);
const VIEWS: { v: [number, number]; lite: boolean }[] = [
  { v: [1920, 1080], lite: false },
  { v: [1280, 720], lite: false },
  { v: [1280, 720], lite: true },
  { v: [390, 844], lite: false },
  { v: [844, 390], lite: false },
  { v: [1024, 768], lite: false }
];

for (const n of DONE) {
  for (const { v, lite } of VIEWS) {
    test(`slide ${n} @${v[0]}x${v[1]}${lite ? ' lite' : ''}`, async ({ page }) => {
      await visit(page, n, { lite, viewport: v });
      await finishEntrance(page);
      await page.waitForTimeout(150);
      await assertAllAnimated(page, n);
      await assertNoOverflow(page, n);
      await assertImages(page, n);
      await page.screenshot({ path: `build/shots/s${String(n).padStart(2, '0')}-${v[0]}${lite ? '-lite' : ''}.png` });
    });
  }
}
