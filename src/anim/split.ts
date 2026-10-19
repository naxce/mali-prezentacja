function wrapText(el: HTMLElement, perChar: boolean): HTMLElement[] {
  const text = el.textContent || '';
  if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', text.replace(/\s+/g, ' ').trim());
  const out: HTMLElement[] = [];
  const frag = document.createDocumentFragment();
  const parts = text.split(/(\s+)/);
  for (const part of parts) {
    if (!part) continue;
    if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); continue; }
    const word = document.createElement('span');
    word.className = 'w';
    word.setAttribute('aria-hidden', 'true');
    if (perChar) {
      for (const ch of Array.from(part)) {
        const c = document.createElement('span');
        c.className = 'ch';
        c.textContent = ch;
        word.appendChild(c);
        out.push(c);
      }
    } else {
      word.textContent = part;
      out.push(word);
    }
    frag.appendChild(word);
  }
  el.textContent = '';
  el.appendChild(frag);
  return out;
}

export function splitChars(el: HTMLElement): HTMLElement[] {
  return wrapText(el, true);
}

export function splitWords(el: HTMLElement): HTMLElement[] {
  return wrapText(el, false);
}
