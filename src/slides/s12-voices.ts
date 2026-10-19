import './s12-voices.css';
import type { SlideDef } from '../deck/types.ts';
import { mk, q, qa } from './kit.ts';
import { cite } from '../content/sources.ts';
import { flag, videoTag } from '../content/media.ts';
import { EASE } from '../anim/timeline.ts';

const ACTORS: { name: string; flag: string; front: string; back: string }[] = [
  { name: 'Władze Mali', flag: 'flag-mali', front: 'Bronimy suwerenności przed „terrorystami” i obcym wpływem.', back: `Nazywają też FLA terrorystami. Twierdzą, że Francja i MINUSMA „poniosły porażkę”. Odrzucają raporty ONZ o zbrodniach.${cite('peninsula-diop-2023', 'allafrica-fla-terrorists-2026')}` },
  { name: 'Separatyści (FLA)', flag: 'flag-azawad-mnla', front: 'Północ, czyli „Azawad”, zasługuje na samostanowienie.', back: `Wskazują na dekady marginalizacji. FLA mówi o sobie: ruch „polityczno-wojskowy”, nie terrorystyczny.${cite('ecfr-mnla', 'allafrica-fla-terrorists-2026')}` },
  { name: 'JNIM i IS Sahel', flag: '', front: 'Ugrupowania dżihadystyczne chcą wypchnąć obce siły i narzucić szariat.', back: `Rywalizują ze sobą. ONZ, USA i wiele państw uznają je za terrorystyczne. Według Africa Center IS Sahel jest szczególnie brutalny wobec cywilów.${cite('africacenter-2026', 'un-sanctions-jnim')}` },
  { name: 'Francja', flag: 'flag-france', front: 'Nasza interwencja zapobiegła powstaniu kalifatu.', back: `Zaprzecza wspieraniu terrorystów i odrzuca ustalenia MINUSMA w sprawie Bounti.${cite('aljazeera-french-leave-2022', 'aljazeera-mali-france-2022')}` },
  { name: 'Rosja', flag: 'flag-russia', front: 'Jesteśmy tu na prośbę legalnego rządu.', back: `Ataki z 2026 r. przypisuje Ukrainie i Zachodowi, czego nie potwierdzono niezależnie. Amnesty ostrzega przed bezkarnością Korpusu Afrykańskiego.${cite('wiki-2026-offensives', 'amnesty-africa-corps-2026')}` },
  { name: 'ONZ', flag: 'flag-un', front: 'Trzeba chronić cywilów i rozliczać zbrodnie wszystkich stron.', back: `OHCHR dokumentował m.in. Mourę. Rada Bezpieczeństwa zakończyła MINUSMA na żądanie Mali.${cite('ohchr-moura-2023', 'un-press-res-2690')}` },
  { name: 'ECOWAS i AES', flag: '', front: 'AES: sojusz suwerennych państw Sahelu. ECOWAS: regionalna jedność.', back: `AES nazwał ataki z 2026 r. „spiskiem wrogów Sahelu”. ECOWAS utrzymała swobodny przepływ ludzi po wyjściu trzech państw.${cite('policycenter-aes-2024', 'kolaking-ecowas-2025')}` },
  { name: 'Cywile', flag: '', front: 'Giną z rąk wszystkich stron i najczęściej nie są wysłuchani.', back: `HRW i Amnesty opisują zabójstwa przez dżihadystów, armię, milicje dozo, Wagnera, Korpus Afrykański i siły francuskie.${cite('hrw-wr-2026', 'hrw-segou-2025')}` }
];

const STAKES: [string, string][] = [
  ['Bezpieczeństwo', `Sahel: ok. 41% ofiar przemocy dżihadystycznej w Afryce (2025).${cite('africacenter-2026')}`],
  ['Migracja', `Przez Gao i Agadez wiodą szlaki do Libii i dalej do Europy.${cite('kas-migration-sahel', 'apa-libya-migration-2025')}`],
  ['Złoto', `Główne źródło eksportu. Junta zaostrza kontrolę nad sektorem (kodeks górniczy, spór z Barrick).${cite('trade-gov-mali', 'miningmx-barrick-2025')}`],
  ['Mocarstwa', `Rosja to główny partner wojskowy. Swoją grę prowadzą też USA, Turcja i Algieria.${cite('passblue-us-mali-2026', 'aljazeera-algeria-mali-2026')}`]
];

const FAN = [-18, -12, -6, -2, 2, 6, 12, 18];

export const voicesSlide: SlideDef = {
  id: 'voices',
  title: 'Kto co mówi',
  transition: 'scatter',
  render() {
    const el = mk(`
<div class="bg s12-bg">${videoTag('video-dogon-masks')}</div>
<div class="scrim s12-scrim"></div>
<div class="slide-inner s12">
  <div class="s12-head"><h2 class="display h2 s12-title">Kto co mówi</h2></div>
  <ul class="s12-cards">${ACTORS.map((a) => `<li><i class="s12-sheen" aria-hidden="true"><b></b></i><div class="s12-card" role="button" tabindex="0" aria-pressed="false"><span class="s12-face front">${a.flag ? `<img src="${flag(a.flag)}" alt="" aria-hidden="true">` : '<i class="s12-noflag"></i>'}<b>${a.name}</b><span>${a.front}</span></span><span class="s12-face back"><b>${a.name}</b><span>${a.back}</span></span></div></li>`).join('')}</ul>
  <ul class="s12-stakes">${STAKES.map(([t, d]) => `<li><b class="mono">${t}</b><p>${d}</p></li>`).join('')}</ul>
</div>`);
    const flip = (b: Element) => {
      const on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.classList.toggle('flipped', on);
    };
    el.addEventListener('click', (e) => {
      const b = (e.target as Element).closest('.s12-card');
      if (b && !(e.target as Element).closest('.cite')) flip(b);
    });
    el.addEventListener('keydown', (e) => {
      const b = (e.target as Element).closest('.s12-card');
      if (!b || (e.key !== ' ' && e.key !== 'Enter' && e.key !== 'Spacebar') || (e.target as Element).closest('.cite')) return;
      e.preventDefault();
      flip(b);
    });
    return el;
  },
  enter({ el, tl }) {
    tl.add(q(el, '.s12-bg'), [{ opacity: 0 }, { opacity: 1 }], { at: 0, dur: 1200 });
    tl.add(q(el, '.s12-title'), [{ opacity: 0, transform: 'scale(1.3)' }, { opacity: 1, transform: 'none' }], { at: 0, dur: 600, ease: EASE });
    qa(el, '.s12-cards li').forEach((li, i) => tl.add(li, [
      { opacity: 0, transform: `translate(${(3.5 - i) * 60}%, 70%) rotate(${FAN[i]}deg)` },
      { opacity: 1, transform: `translate(${(3.5 - i) * 40}%, 20%) rotate(${FAN[i]}deg)`, offset: 0.45 },
      { opacity: 1, transform: 'none' }
    ], { at: 200 + i * 70, dur: 1300, ease: EASE }));
    qa(el, '.s12-sheen b').forEach((b, i) => tl.add(b, [{ transform: 'translateX(-120%) skewX(-20deg)' }, { transform: 'translateX(260%) skewX(-20deg)' }], { at: 1450 + i * 70, dur: 900, ease: 'cubic-bezier(.45,0,.35,1)' }));
    qa(el, '.s12-stakes li').forEach((li, i) => tl.add(li, [{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }], { at: 1500 + i * 120, dur: 500 }));
  }
};
