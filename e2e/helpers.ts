import { expect, type Page } from '@playwright/test';

export async function visit(page: Page, n: number, o: { lite?: boolean; viewport?: [number, number] } = {}): Promise<void> {
  const [w, h] = o.viewport || [1280, 720];
  await page.setViewportSize({ width: w, height: h });
  await page.goto(`./${o.lite ? '?lite=1' : '?lite=0'}#/${n}`);
  await expect(page.locator(`.slide[aria-label^="${n} z "]`)).toBeVisible();
}

export async function finishEntrance(page: Page): Promise<void> {
  await expect(page.locator('#deck')).not.toHaveAttribute('data-entering', '', { timeout: 8000 });
}

export async function assertAllAnimated(page: Page, n: number): Promise<void> {
  const offenders = await page.evaluate((num) => {
    const slide = document.querySelector(`.slide[aria-label^="${num} z "]`) as HTMLElement;
    const sel = 'h1,h2,h3,p,li,picture,img,svg,figure,button,.stat,.cite,blockquote,dt,dd';
    const out: string[] = [];
    slide.querySelectorAll(sel).forEach((el) => {
      const h = el as HTMLElement;
      if (!h.getClientRects().length) return;
      const covered = (node: Node): boolean => {
        const a = (node.nodeType === 1 ? (node as Element) : node.parentElement)?.closest('[data-anim]');
        return !!a && a !== slide && slide.contains(a);
      };
      if (covered(h)) return;
      const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
      let hasText = false;
      let ok = true;
      for (let t = walker.nextNode(); t; t = walker.nextNode()) {
        if (!(t.textContent || '').trim()) continue;
        hasText = true;
        if (!covered(t)) { ok = false; break; }
      }
      if (!hasText) ok = !!h.querySelector('[data-anim]');
      if (!ok) out.push(h.outerHTML.slice(0, 140));
    });
    return out;
  }, n);
  expect(offenders, `elements without entrance animation on slide ${n}`).toEqual([]);
}

export async function assertNoOverflow(page: Page, n: number): Promise<void> {
  const r = await page.evaluate((num) => {
    const slide = document.querySelector(`.slide[aria-label^="${num} z "]`) as HTMLElement;
    const cs = getComputedStyle(slide);
    return { sw: slide.scrollWidth, cw: slide.clientWidth, dw: document.documentElement.scrollWidth, iw: window.innerWidth, sh: slide.scrollHeight, ch: slide.clientHeight, oy: cs.overflowY };
  }, n);
  if (r.sh > r.ch + 2) expect(['auto', 'scroll'], `slide ${n} clips content vertically`).toContain(r.oy);
  expect(r.sw, `slide ${n} horizontal overflow`).toBeLessThanOrEqual(r.cw + 1);
  expect(r.dw, 'page horizontal overflow').toBeLessThanOrEqual(r.iw + 1);
}

export async function assertImages(page: Page, n: number): Promise<void> {
  const bad = await page.evaluate((num) => {
    const slide = document.querySelector(`.slide[aria-label^="${num} z "]`) as HTMLElement;
    const out: string[] = [];
    if (slide.querySelector('.img-missing')) out.push('missing media');
    slide.querySelectorAll('img').forEach((img) => {
      if (!img.hasAttribute('alt')) out.push('no alt ' + img.src);
      const decorative = img.closest('.bg,.s3-sepia,[aria-hidden="true"]');
      if (!decorative && !img.alt.trim()) out.push('empty alt ' + img.src);
    });
    return out;
  }, n);
  expect(bad).toEqual([]);
}
