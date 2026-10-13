/**
 * Tests for the SOMEWAREZ kiosk build (somewarez/).
 *
 * 1. Memory storage: a completed visit and changed settings leave localStorage untouched
 * 2. The scripted player gathers in every DEMO_VISITS entry, on a landscape and a portrait field
 * 3. multicart-qr.svg was drawn from the URL in somewarez/config.js
 * 4. The page wires the kiosk in only behind the build flag
 *
 * Usage:
 *   node test/test_somewarez.js
 *   node test/test_somewarez.js --all     also print how the player does in every visit
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';

const DT = 1 / 60;

function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const listeners = { window: {}, canvas: {} };
const noop = () => {};
const ctx = new Proxy({}, {
  get: (_, prop) => {
    if (prop === 'measureText') return () => ({ width: 10 });
    if (prop === 'createLinearGradient' || prop === 'createRadialGradient') return () => ({ addColorStop: noop });
    return noop;
  },
  set: () => true,
});
const view = { width: 960, height: 640 };
const stored = new Map();
globalThis.localStorage = {
  getItem: key => stored.get(key) ?? null,
  setItem: (key, value) => { stored.set(key, String(value)); },
  removeItem: key => { stored.delete(key); },
};
globalThis.window = {
  addEventListener: (type, fn) => { listeners.window[type] = fn; },
  devicePixelRatio: 1,
  get innerWidth() { return view.width; },
  get innerHeight() { return view.height; },
};
globalThis.document = {
  querySelector: () => null,
  getElementById: () => null,
  addEventListener: noop,
  hidden: false,
  documentElement: { dataset: {}, style: { setProperty: noop, removeProperty: noop } },
};
const canvas = {
  getContext: () => ctx,
  addEventListener: (type, fn) => { listeners.canvas[type] = fn; },
  removeEventListener: noop,
  setPointerCapture: noop,
  releasePointerCapture: noop,
  getBoundingClientRect: () => ({ left: 0, top: 0, width: view.width, height: view.height }),
};

const { Game } = await import('../src/game.js');
const { CAMPAIGN_LEVELS } = await import('../src/campaign.js');
const { useMemoryStorage, storage } = await import('../src/storage.js');
const { setColorMode, getColorMode } = await import('../src/theme.js');
const { createAutoplay } = await import('../somewarez/autoplay.js');
const { DEMO_VISITS, MULTICART_URL, TIMING } = await import('../somewarez/config.js');

const send = (type, [x, y]) => {
  const event = { pointerId: 1, isPrimary: true, button: 0, clientX: x, clientY: y, preventDefault() {} };
  if (type === 'pointerdown') listeners.canvas.pointerdown(event);
  else listeners.window[type](event);
};

/** Play one visit with the scripted player for `seconds`, the way the demonstration does. */
function playDemo(visitId, seed, seconds = TIMING.demo) {
  Math.random = mulberry32(seed);
  const game = new Game(canvas);
  game.startLevel(visitId);
  game.state = 'PLAYING';
  game.hintsEnabled = false;
  const player = createAutoplay(game, send);
  let t = 0;
  while (t < seconds && game.state === 'PLAYING') {
    player.step(DT);
    game.update(DT);
    t += DT;
  }
  return { ...player.stats, score: game.score, state: game.state, seconds: t };
}

console.log('--- Running SOMEWAREZ kiosk tests ---');

// 1. Memory storage
{
  useMemoryStorage();
  const game = new Game(canvas);
  game.startLevel('dawn-02');
  game.campaign.recordVictory(500);
  game.setHintsEnabled(false);
  setColorMode('light');
  assert.equal(stored.size, 0, 'the kiosk build writes nothing to localStorage');
  assert.deepEqual(game.campaign.saveState.completedLevelIds, ['dawn-02'], 'progress is still held for the session');

  storage.clearMemory();
  setColorMode('default');
  const fresh = new Game(canvas);
  assert.equal(fresh.currentLevel.id, CAMPAIGN_LEVELS[0].id, 'after a clear the game opens at the first visit');
  assert.equal(fresh.campaign.resumedFromSave, false);
  assert.deepEqual(fresh.campaign.saveState.completedLevelIds, []);
  assert.equal(fresh.hintsEnabled, true, 'hints return to on');
  assert.equal(getColorMode(), 'default');
  console.log('✔ Memory storage holds a session and leaves localStorage untouched.');
}

// 2. The scripted player
{
  if (process.argv.includes('--all')) {
    console.log(`  visit        strokes scored  score  (mean of 3 seeds, ${TIMING.demo} s, landscape)`);
    for (const level of CAMPAIGN_LEVELS) {
      const runs = [1, 2, 3].map(seed => playDemo(level.id, seed));
      const mean = key => (runs.reduce((sum, r) => sum + r[key], 0) / runs.length).toFixed(1).padStart(6);
      console.log(`  ${level.id.padEnd(12)} ${mean('strokes')} ${mean('scored')} ${mean('score')}  ${runs.map(r => r.state).join(' ')}`);
    }
  }
  for (const id of DEMO_VISITS) assert.ok(CAMPAIGN_LEVELS.some(l => l.id === id), `${id} is a campaign visit`);
  for (const [width, height] of [[960, 640], [640, 960]]) {
    view.width = width; view.height = height;
    for (const id of DEMO_VISITS) {
      for (const seed of [1, 2, 3, 4, 5]) {
        const run = playDemo(id, seed);
        assert.ok(run.scored >= 2, `${id} seed ${seed} at ${width}x${height}: the player gathered ${run.scored} times in ${run.seconds.toFixed(0)} s`);
      }
    }
  }
  view.width = 960; view.height = 640;
  console.log('✔ The scripted player gathers at least twice in every demonstration visit.');
}

// 3. The QR card
{
  const svg = fs.readFileSync(new URL('../somewarez/multicart-qr.svg', import.meta.url), 'utf8');
  const recorded = svg.match(/data-url="([^"]+)"/)?.[1];
  assert.equal(recorded, MULTICART_URL, 'multicart-qr.svg was drawn from a different URL; rerun scripts/make_qr.py');
  console.log('✔ The QR drawing records the URL in config.js.');
}

// 4. Page wiring
{
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /if \(KIOSK\) \{[^}]*import\('\.\/somewarez\/kiosk\.js'\)/s, 'kiosk.js loads only behind the build flag');
  const entry = fs.readFileSync(new URL('../somewarez/index.html', import.meta.url), 'utf8');
  assert.match(entry, /\.\.\/\?somewarez/, 'somewarez/ forwards to the flagged page');
  console.log('✔ The page loads the kiosk only behind the build flag.');
}

console.log('--- All SOMEWAREZ kiosk tests passed! ---');
