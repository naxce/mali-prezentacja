import { test, expect, type Page } from '@playwright/test';

async function frames(page: Page, n: number, lite: boolean): Promise<number> {
  await page.goto(`./?lite=${lite ? 1 : 0}#/${n}`);
  await page.waitForFunction(() => !!document.querySelector('#deck .slide'));
  return page.evaluate(() => new Promise<number>((resolve) => {
    const d: number[] = [];
    let last = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      if (last) d.push(t - last);
      last = t;
      if (t - t0 < 2600) requestAnimationFrame(tick);
      else { d.sort((a, b) => a - b); resolve(d[Math.floor(d.length / 2)] || 0); }
    };
    requestAnimationFrame(tick);
  }));
}

test('entrances stay smooth under 6x CPU throttle', async ({ page }) => {
  test.setTimeout(240000);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  const report: string[] = [];
  for (let n = 1; n <= 15; n++) {
    const normal = await frames(page, n, false);
    const lite = await frames(page, n, true);
    report.push(`${n}: ${normal.toFixed(1)} / ${lite.toFixed(1)} ms`);
    expect(normal, `slide ${n} normal median frame`).toBeLessThanOrEqual(50);
    expect(lite, `slide ${n} lite median frame`).toBeLessThanOrEqual(33);
  }
  console.log(report.join('\n'));
});

test('first slide loads under 1.5 MB', async ({ page }) => {
  let bytes = 0;
  page.on('requestfinished', async (r) => { const s = await r.sizes(); bytes += s.responseBodySize + s.responseHeadersSize; });
  await page.goto('./?lite=0#/1');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  console.log(`first load: ${(bytes / 1024).toFixed(0)} KB`);
  expect(bytes).toBeLessThanOrEqual(1.5 * 1024 * 1024);
});
