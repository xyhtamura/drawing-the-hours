// The local edition: the cast of the SOMEWAREZ kiosk build, named and coloured
// for a Philippine garden. Mechanics, kinds, ids, and recipes are unchanged; only
// what a creature is called, a few colours, three drawings, and the clock differ.
//
// Names use the Tagalog word where it is the everyday one (paruparo, tutubi,
// alitaptap) and English otherwise (lacewing, cogon, abaca).
//
// Text is changed where it is shown, not where it is written: localize() runs on
// canvas text (localizeContext), on wrapped card text (wrapText), and on the page
// (localizeDocument). The source strings in campaign.js, game.js, and index.html
// stay as the main build has them.

import { KIOSK } from './build.js';

let local = KIOSK;
export function isLocal() { return local; }
/** Tests switch the edition on without the build flag. */
export function setLocalEdition(on) { local = Boolean(on); memo.clear(); }

/** Full and short names, by SPECIES_CONFIG key. */
export const LOCAL_SPECIES = {
  brimstone: { name: 'Lemon Emigrant', shortName: 'Paruparo' },
  damselfly: { name: 'Tutubing Karayom', shortName: 'Tutubi' },
  // Oleander hawkmoth: green forewings, a pink band, pink-mauve hindwings.
  hawkmoth: {
    name: 'Oleander Hawkmoth', shortName: 'Gamugamo',
    wingColor: '#7dbb52', wingAltColor: '#dc9cc0', wingEdge: '#4f8a3a', markColor: '#f2b9cf',
    bodyColor: '#3f6b35', bodyAccent: '#8fc46b',
  },
  hoverfly: { name: 'Amber Bubuyog', shortName: 'Bubuyog' },
  lacewing: { name: 'Green Lacewing', shortName: 'Lacewing' },
  firefly: { name: 'Alitaptap', shortName: 'Alitaptap' },
  hornet: { name: 'Putakti', shortName: 'Putakti' },
};

/** Palette roles the edition sets in both colour modes (src/theme.js). */
export const LOCAL_COLORS = { hawkmoth: '#7dbb52' };

export function applyLocalCast(speciesConfig) {
  for (const [kind, changes] of Object.entries(LOCAL_SPECIES)) Object.assign(speciesConfig[kind], changes);
}

// Tagalog nouns here take no plural s, and two of the new words begin with a vowel.
const INVARIANT = 'paruparo|tutubi|gamugamo|bubuyog|alitaptap|putakti|kuliglig';
const sentenceStart = (text, index) => index === 0 || /[.!?:]\s+$/.test(text.slice(0, index));
const keepCase = word => match => (match[0] === match[0].toUpperCase() ? word[0].toUpperCase() + word.slice(1) : word);

// Ordered: whole lines, then full names, then the short words they contain.
const RULES = [
  ['The dandelion seeds took flight into the morning breeze.', 'The light has crossed the field.'],
  ['The dandelion seeds scattered across the midday atrium.', 'The sky has covered the atrium.'],
  ['The dandelion seeds drifted off into the evening air.', 'The shadow has crossed the field.'],
  ['The dandelion seeds slipped away into the dark.', 'The night has filled the window.'],
  [/Dandelion Clock/g, 'Time'],
  [/Brimstone Butterfly/g, 'Lemon Emigrant'],
  // "Brimstone" is always capitalised in the source; paruparo is a common noun.
  [/Brimstone butterflies|Brimstones?/g, (match, index, text) => (sentenceStart(text, index) ? 'Paruparo' : 'paruparo')],
  [/Azure Damselfly/g, 'Tutubing Karayom'],
  [/damselfl(?:y|ies)/gi, keepCase('tutubi')],
  [/Roseate Hawkmoth/g, 'Oleander Hawkmoth'],
  [/(?<!Oleander )hawkmoths?/gi, keepCase('gamugamo')],
  [/Amber Hoverfly/g, 'Amber Bubuyog'],
  [/hoverfl(?:y|ies)/gi, keepCase('bubuyog')],
  [/Paper Lacewing/g, 'Green Lacewing'],
  [/Window Firefly/g, 'Alitaptap'],
  [/firefl(?:y|ies)/gi, keepCase('alitaptap')],
  [/Atrium Hornet/g, 'Putakti'],
  [/hornets?/gi, keepCase('putakti')],
  [/cicadas?/gi, keepCase('kuliglig')],
  [/Night Jasmine/g, 'Dama de Noche'],
  [/(?:night )?jasmine/gi, keepCase('dama de noche')],
  [/Flax Flower/g, 'Abaca Flower'],
  [/flax/gi, keepCase('abaca')],
  [/dandelion seed/gi, keepCase('cogon plume')],
  [/dandelion/gi, keepCase('cogon')],
  [/Ground Crawler \(Snail\)/g, 'Giant African Snail'],
  [new RegExp(`\\b(${INVARIANT})s\\b`, 'gi'), '$1'],
  [/\b(a) (alitaptap|abaca)/gi, (match, article, word) => `${article}n ${word}`],
  [/\b(a)n (paruparo|tutubi|gamugamo|bubuyog|putakti|kuliglig|cogon|dama)/gi, '$1 $2'],
];

const memo = new Map();

/** The text as the local edition shows it. Returns it unchanged in every other build. */
export function localize(text) {
  if (!local || typeof text !== 'string' || text.length < 4) return text;
  const known = memo.get(text);
  if (known !== undefined) return known;
  let out = text;
  for (const [pattern, replacement] of RULES) {
    out = typeof pattern === 'string' ? out.split(pattern).join(replacement) : out.replace(pattern, replacement);
  }
  // The clock readout changes every second; keep the table from growing with it.
  if (memo.size > 3000) memo.clear();
  memo.set(text, out);
  return out;
}

/** Canvas text drawn or measured through this context is localized first. */
export function localizeContext(ctx) {
  for (const method of ['fillText', 'strokeText', 'measureText']) {
    const original = ctx[method].bind(ctx);
    ctx[method] = (text, ...rest) => original(localize(text), ...rest);
  }
}

/** Localizes the page's text now and whenever it changes. */
export function localizeDocument(root = document.body) {
  const visit = node => {
    if (node.nodeType === Node.TEXT_NODE) {
      const next = localize(node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
    } else if (node.nodeType === Node.ELEMENT_NODE && !['SCRIPT', 'STYLE'].includes(node.tagName)) {
      node.childNodes.forEach(visit);
    }
  };
  visit(root);
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'characterData') visit(record.target);
      else record.addedNodes.forEach(visit);
    }
  }).observe(root, { childList: true, characterData: true, subtree: true });
}
