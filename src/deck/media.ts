export function syncMedia(slides: Map<number, HTMLElement>, index: number, lite: boolean): void {
  slides.forEach((el, i) => {
    const vids = el.querySelectorAll<HTMLVideoElement>('video[data-src]');
    for (let k = 0; k < vids.length; k++) {
      const v = vids[k];
      const src = v.getAttribute('data-src') || '';
      if (!lite && i === index) {
        if (!v.getAttribute('src')) v.setAttribute('src', src);
        v.muted = true;
        const p = v.play() as Promise<void> | undefined;
        if (p && typeof p.catch === 'function') p.catch(() => undefined);
      } else if (!lite && i === index + 1) {
        v.preload = 'auto';
        if (!v.getAttribute('src')) v.setAttribute('src', src);
        v.pause();
      } else {
        v.pause();
        if (v.getAttribute('src')) {
          v.removeAttribute('src');
          v.load();
        }
      }
    }
  });
}
