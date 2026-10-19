import './s09-alliances.css';
import type { SlideDef } from '../deck/types.ts';
import { mk, q, qa } from './kit.ts';
import { cite } from '../content/sources.ts';
import { img, flag } from '../content/media.ts';
import { EASE, EASE_BACK } from '../anim/timeline.ts';

export const alliancesSlide: SlideDef = {
  id: 'alliances',
  title: 'Zmiana sojuszników 2021-2025',
  transition: 'tilt',
  render() {
    return mk(`
<div class="slide-inner s9">
  <h2 class="display h2 s9-title">Zmiana sojuszników</h2>
  <div class="s9-swap">
    <ul class="s9-out">
      <li><img src="${flag('flag-france')}" alt="Flaga Francji"><p><b>15 VIII 2022</b> Ostatni żołnierze francuskiej operacji „Barkhane” opuszczają Mali.${cite('aljazeera-french-leave-2022')}</p></li>
      <li><img src="${flag('flag-un')}" alt="Flaga ONZ"><p><b>31 XII 2023</b> Koniec MINUSMA, na żądanie władz Mali (rezolucja 2690).${cite('un-press-res-2690', 'minusma-closure')}</p></li>
      <li><img src="${flag('flag-eu')}" alt="Flaga UE"><p><b>2022-2025</b> Mali wychodzi z G5 Sahel (2022) i z ECOWAS (2025), kończy się misja EUTM (2024).${cite('africanews-g5-2022', 'allafrica-ecowas-exit-2025', 'finland-eutm-end')}</p></li>
    </ul>
    <div class="s9-pivot" aria-hidden="true"><i class="s9-beam"></i><b class="s9-fulcrum"></b></div>
    <ul class="s9-in">
      <li><img src="${flag('flag-russia')}" alt="Flaga Rosji"><p><b>XII 2021</b> Przybywa rosyjska Grupa Wagnera. Władze Mali mówią o „rosyjskich szkoleniowcach”.${cite('financialafrik-wagner-2021', 'wion-wagner-denial')}</p></li>
      <li><img src="${flag('flag-russia')}" alt="Flaga Rosji"><p><b>VI 2025</b> Wagnera zastępuje Korpus Afrykański podległy rosyjskiemu Ministerstwu Obrony.${cite('aljazeera-wagner-leaves-2025')}</p></li>
      <li class="s9-aes"><span class="s9-tri"><img src="${flag('flag-mali')}" alt="Flaga Mali"><img src="${flag('flag-burkina-faso')}" alt="Flaga Burkiny Faso"><img src="${flag('flag-niger')}" alt="Flaga Nigru"></span><p><b>16 IX 2023</b> Sojusz Państw Sahelu (AES): Mali, Burkina Faso i Niger. Od 2024 r. konfederacja.${cite('policycenter-aes-2024', 'niamey-declaration-2024')}</p></li>
    </ul>
  </div>
  <div class="s9-views">
    <blockquote class="s9-v gov"><p><b>Władze Mali:</b> Francja i MINUSMA „poniosły porażkę”, a współpraca z Rosją to partnerstwo „państwo-państwo”.${cite('peninsula-diop-2023', 'wion-wagner-denial')}</p></blockquote>
    <blockquote class="s9-v un"><p><b>ONZ o Mourze (III 2022):</b> żołnierze malijscy i „zagraniczny personel wojskowy” zabili ponad 500 osób. Mali odrzuca raport.${cite('ohchr-moura-2023', 'un-news-moura-2023')}</p></blockquote>
    <blockquote class="s9-v fr"><p><b>MINUSMA o Bounti (I 2021):</b> francuski nalot zabił 19 cywilów na weselu. Francja temu zaprzecza.${cite('washtimes-bounti-2021', 'aa-bounti-2021')}</p></blockquote>
  </div>
  <div class="s9-photos">${img('rally-russian-flags-2021', 'Wiec w Bamako z flagami Rosji i Mali, 2021', '18vw')}${img('minusma-last-dutch-patrol', 'Ostatni patrol holenderskich żołnierzy MINUSMA', '18vw')}</div>
</div>`);
  },
  enter({ el, tl }) {
    tl.add(q(el, '.s9-title'), [{ opacity: 0, transform: 'rotate(-3deg) translateY(20px)' }, { opacity: 1, transform: 'none' }], { at: 0, dur: 650, ease: EASE });
    tl.add(q(el, '.s9-beam'), [{ transform: 'rotate(-14deg)' }, { transform: 'rotate(10deg)', offset: 0.65 }, { transform: 'rotate(8deg)' }], { at: 300, dur: 1500, ease: 'cubic-bezier(.5,0,.3,1)' });
    tl.add(q(el, '.s9-fulcrum'), [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], { at: 200, dur: 400 });
    qa(el, '.s9-out li').forEach((li, i) => {
      const at = 400 + i * 150;
      const dur = 2500 - i * 150;
      const k = (t: number) => Math.min(0.99, t / dur);
      tl.add(li, [
        { opacity: 0, transform: 'translateX(60px)' },
        { opacity: 1, transform: 'translateX(-10px)', offset: k(480) },
        { opacity: 1, transform: 'none', offset: k(800) },
        { opacity: 1, transform: 'none', offset: k(1850 - at + i * 120) },
        { opacity: 0.5, transform: 'translateY(10px) scale(.97)' }
      ], { at, dur, ease: 'cubic-bezier(.3,.6,.3,1)' });
    });
    qa(el, '.s9-in li').forEach((li, i) => tl.add(li, [{ opacity: 0, transform: 'translateX(120px)' }, { opacity: 1, transform: 'none' }], { at: 900 + i * 180, dur: 750, ease: EASE }));
    qa(el, '.s9-tri img').forEach((f, i) => tl.add(f, [{ opacity: 0, transform: ['translate(-60px,-40px)', 'translate(60px,-40px)', 'translate(0,60px)'][i] + ' rotate(20deg)' }, { opacity: 1, transform: 'none' }], { at: 1400 + i * 120, dur: 700, ease: EASE_BACK }));
    qa(el, '.s9-v').forEach((v, i) => tl.add(v, [{ opacity: 0, transform: 'translateY(26px)' }, { opacity: 1, transform: 'none' }], { at: 1700 + i * 160, dur: 600 }));
    qa(el, '.s9-photos picture').forEach((p, i) => tl.add(p, [{ opacity: 0, transform: `scale(1.1) translateY(${i ? 20 : -20}px)` }, { opacity: 1, transform: 'none' }], { at: 1500 + i * 140, dur: 700 }));
  }
};
