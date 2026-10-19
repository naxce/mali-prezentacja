import { encode } from 'uqr';

const NS = 'http://www.w3.org/2000/svg';

export function qrSvg(text: string): SVGSVGElement {
  const { data, size } = encode(text, { ecc: 'M', border: 2 });
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('shape-rendering', 'crispEdges');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Kod QR: ${text}`);
  svg.setAttribute('class', 'qr');
  const bg = document.createElementNS(NS, 'rect');
  bg.setAttribute('width', String(size));
  bg.setAttribute('height', String(size));
  bg.setAttribute('class', 'qr-bg');
  svg.appendChild(bg);
  data.forEach((row, y) => {
    let d = '';
    row.forEach((on, x) => { if (on) d += `M${x} ${y}h1v1h-1z`; });
    if (!d) return;
    const g = document.createElementNS(NS, 'path');
    g.setAttribute('d', d);
    g.setAttribute('class', 'qr-row');
    svg.appendChild(g);
  });
  return svg;
}
