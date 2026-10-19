import './fonts.ts';
import './styles/tokens.css';
import './styles/base.css';
import './styles/deck.css';
import { createDeck } from './deck/engine.ts';
import { loadMaps } from './content/map-data.ts';

const root = document.getElementById('deck') as HTMLElement;
const grain = document.createElement('div');
grain.className = 'grain';
root.appendChild(grain);

const printing = /[?&]print=1/.test(location.search);

Promise.all([loadMaps(), import('./slides/index.ts'), printing ? import('./deck/print.ts') : null]).then(([, mod, print]) => {
  if (print) print.printDeck(root, mod.SLIDES);
  else createDeck(root, mod.SLIDES);
});
