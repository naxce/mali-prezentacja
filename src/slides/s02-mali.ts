import './s02-mali.css';
import type { SlideDef } from '../deck/types.ts';
import { mk, q, qa, pathBox } from './kit.ts';
import { MAPS } from '../content/map-data.ts';
import { videoTag } from '../content/media.ts';
import { cite } from '../content/sources.ts';
import { drawPath, odometer, stamp } from '../anim/fx.ts';
import { EASE, EASE_INOUT } from '../anim/timeline.ts';

const PEOPLES = ['Bambara', 'Fulanie (Peul)', 'Soninke', 'Senufo', 'Malinke', 'Dogonowie', 'Songhajowie', 'Tuaregowie', 'Bozo', 'Arabowie'];

function mapSvg(): string {
  if (!MAPS) return '';
  const mali = MAPS.AFRICA.find((c) => c.id === 'MLI');
  const box = mali ? pathBox(mali.d) : { x: 0, y: 0, w: 1, h: 1, cx: 0, cy: 0 };
  const [, sTop] = MAPS.project(0, 18.5, 'africa');
  const [, sBot] = MAPS.project(0, 11.5, 'africa');
  const [bx, by] = MAPS.project(-8.0, 12.64, 'africa');
  const k = 2.35;
  const tx = 500 - box.cx * k;
  const ty = 470 - box.cy * k;
  return `
<svg class="s2-map" viewBox="0 0 1000 1000" role="img" aria-label="Mapa Afryki z zaznaczonym Mali i pasem Sahelu">
  <defs><linearGradient id="s2-scan-g" x1="0" x2="1"><stop offset="0" stop-color="#ffd27a" stop-opacity="0"/><stop offset=".8" stop-color="#ffd27a" stop-opacity=".5"/><stop offset="1" stop-color="#fff2cf" stop-opacity=".9"/></linearGradient><clipPath id="s2-clip"><path d="${mali ? mali.d : ''}"/></clipPath></defs>
  <g class="s2-cam" data-zoom="translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) scale(${k})" style="transform: translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) scale(${k})">
    <g class="s2-africa">${MAPS.AFRICA.map((c) => `<path d="${c.d}" class="${c.id === 'MLI' ? 'mli' : ''}"/>`).join('')}</g>
    <rect class="s2-sahel" x="0" y="${sTop.toFixed(1)}" width="1000" height="${(sBot - sTop).toFixed(1)}"/>
    <g clip-path="url(#s2-clip)" class="s2-flag">
      <rect class="b1" x="${box.x}" y="${box.y}" width="${box.w / 3 + 1}" height="${box.h}"/>
      <rect class="b2" x="${box.x + box.w / 3}" y="${box.y}" width="${box.w / 3 + 1}" height="${box.h}"/>
      <rect class="b3" x="${box.x + (2 * box.w) / 3}" y="${box.y}" width="${box.w / 3}" height="${box.h}"/>
    </g>
    <rect class="s2-scan" x="-90" y="${sTop.toFixed(1)}" width="90" height="${(sBot - sTop).toFixed(1)}" fill="url(#s2-scan-g)"/>
    <path class="s2-outline" d="${mali ? mali.d : ''}"/>
    <circle class="s2-sonar" cx="${bx}" cy="${by}" r="4"/><circle class="s2-sonar" cx="${bx}" cy="${by}" r="4"/>
    <circle class="s2-capital" cx="${bx}" cy="${by}" r="3.2"/>
    <text class="s2-label" x="${bx + 6}" y="${by + 2}">Bamako</text>
    <text class="s2-sahel-label" x="${box.x + box.w + 8}" y="${(sTop + sBot) / 2 + 3}">SAHEL</text>
  </g>
</svg>`;
}

export const maliSlide: SlideDef = {
  id: 'mali',
  title: 'Mali w pigułce',
  transition: 'zoom',
  render() {
    return mk(`
<div class="bg s2-bg">${videoTag('video-dogon-dance')}</div>
<div class="scrim s2-scrim"></div>
<div class="slide-inner s2">
  <div class="s2-mapbox">${mapSvg()}</div>
  <div class="s2-info">
    <h2 class="display h2 s2-title">Mali w&nbsp;pigułce</h2>
    <dl class="s2-stats">
      <div><dt class="stat"><span class="s2-odo">1 240 192</span><small> km²</small></dt><dd>ok. 4 razy więcej niż Polska${cite('wiki-mali', 'britannica-mali-summary')}</dd></div>
      <div><dt class="stat"><span class="s2-odo">24,5</span><small> mln</small></dt><dd>mieszkańców, prawie połowa ma mniej niż 15 lat${cite('worldbank-pop-fred', 'instat-rgph5')}</dd></div>
      <div><dt class="stat"><span class="s2-odo">13</span></dt><dd>języków urzędowych od 2023 r., francuski jest już tylko roboczy${cite('africanews-french-2023')}</dd></div>
    </dl>
    <ul class="s2-tags" aria-label="Główne narody">${PEOPLES.map((p) => `<li>${p}</li>`).join('')}</ul>
    <p class="body s2-econ"><strong>Złoto</strong> to główny towar eksportowy (od 60 do 88% eksportu, zależnie od źródła), <strong>bawełna</strong> ok. 11%.${cite('gsphub-mali', 'wgc-mali-2026', 'accio-mali-trade')} <strong>Sahel</strong> (arab. „brzeg”) to półsuchy pas na południowym skraju Sahary. Północ Mali leży już na pustyni.${cite('britannica-sahel')}</p>
  </div>
</div>`);
  },
  enter({ el, tl }) {
    tl.add(q(el, '.s2-bg'), [{ opacity: 0 }, { opacity: 1 }], { at: 0, dur: 1400 });
    const africa = q(el, '.s2-africa');
    tl.add(africa, [{ opacity: 0 }, { opacity: 1 }], { at: 0, dur: 700 });
    const outline = el.querySelector<SVGPathElement>('.s2-outline');
    if (outline) drawPath(tl, outline, 150, 1000);
    const cam = el.querySelector<SVGGElement>('.s2-cam');
    if (cam) tl.add(cam, [{ transform: 'translate(0px,0px) scale(1)' }, { transform: cam.getAttribute('data-zoom') || 'none' }], { at: 700, dur: 1100, ease: EASE_INOUT });
    qa(el, '.s2-flag rect').forEach((r, i) => tl.add(r, [{ transform: `translateY(${i % 2 ? 100 : -100}%)` }, { transform: 'none' }], { at: 1300 + i * 120, dur: 600, ease: EASE }));
    tl.add(q(el, '.s2-sahel'), [{ opacity: 0 }, { opacity: 1 }], { at: 1500, dur: 600 });
    tl.add(el.querySelector('.s2-scan'), [{ opacity: 0, transform: 'translateX(0px)' }, { opacity: 1, transform: 'translateX(300px)', offset: 0.3 }, { opacity: 1, transform: 'translateX(800px)', offset: 0.8 }, { opacity: 0, transform: 'translateX(1090px)' }], { at: 1550, dur: 1500, ease: 'cubic-bezier(.45,0,.4,1)' });
    qa(el, '.s2-sonar').forEach((s, i) => tl.add(s, [{ opacity: 0.95, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(9)' }], { at: 1950 + i * 380, dur: 1500, ease: 'cubic-bezier(.2,.6,.3,1)' }));
    tl.add(q(el, '.s2-sahel-label'), [{ opacity: 0 }, { opacity: 1 }], { at: 1700, dur: 500 });
    tl.add(q(el, '.s2-capital'), [{ opacity: 0, transform: 'scale(4)' }, { opacity: 1, transform: 'none' }], { at: 1750, dur: 450, ease: EASE });
    tl.add(q(el, '.s2-label'), [{ opacity: 0 }, { opacity: 1 }], { at: 1850, dur: 400 });
    tl.add(q(el, '.s2-title'), [{ opacity: 0, transform: 'translateX(-30px)' }, { opacity: 1, transform: 'none' }], { at: 100, dur: 700 });
    qa(el, '.s2-stats > div').forEach((d, i) => {
      const o = q(d, '.s2-odo');
      if (!o.classList.contains('odo')) odometer(tl, o, 300 + i * 180, 55);
      else tl.add(o, [{ opacity: 0 }, { opacity: 1 }], { at: 300, dur: 300 });
      tl.add(q(d, 'small'), [{ opacity: 0 }, { opacity: 1 }], { at: 700 + i * 180, dur: 400 });
      tl.add(q(d, 'dd'), [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { at: 800 + i * 180, dur: 500 });
    });
    qa(el, '.s2-tags li').forEach((li, i) => stamp(tl, li, 1150 + i * 70, i % 2 ? 6 : -6));
    tl.add(q(el, '.s2-econ'), [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { at: 1900, dur: 600 });
  }
};
