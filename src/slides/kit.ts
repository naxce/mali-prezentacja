export function mk(html: string, cls = ''): HTMLElement {
  const el = document.createElement('section');
  if (cls) el.className = cls;
  el.innerHTML = html;
  return el;
}

export function q<T extends Element = HTMLElement>(root: Element, sel: string): T {
  return root.querySelector(sel) as T;
}

export function qa<T extends Element = HTMLElement>(root: Element, sel: string): T[] {
  return Array.prototype.slice.call(root.querySelectorAll(sel)) as T[];
}

export function pathBox(d: string): { x: number; y: number; w: number; h: number; cx: number; cy: number } {
  const nums = (d.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    x0 = Math.min(x0, nums[i]); x1 = Math.max(x1, nums[i]);
    y0 = Math.min(y0, nums[i + 1]); y1 = Math.max(y1, nums[i + 1]);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}

export const rand = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
