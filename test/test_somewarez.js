/**
 * Tests for the SOMEWAREZ kiosk build (somewarez/).
 *
 * 1. Memory storage: a completed visit and changed settings leave localStorage untouched
 * 2. The scripted player gathers in every DEMO_VISITS entry, on a landscape and a portrait field
 * 3. multicart-qr.svg was drawn from the URL in somewarez/config.js
 * 4. The page wires the kiosk in only behind the build flag
 * 6. Every attract clip names a multicart work and is an MP4 on disk
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
const { DEMO_VISITS, MULTICART_URL, MULTICART_GAMES, TIMING, ATTRACT_CLIPS } = await import('../somewarez/config.js');

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
  setColorMode('light');
  assert.equal(stored.size, 0, 'the kiosk build writes nothing to localStorage');
  assert.deepEqual(game.campaign.saveState.completedLevelIds, ['dawn-02'], 'progress is still held for the session');

  storage.clearMemory();
  setColorMode('default');
  const fresh = new Game(canvas);
  assert.equal(fresh.currentLevel.id, CAMPAIGN_LEVELS[0].id, 'after a clear the game opens at the first visit');
  assert.equal(fresh.campaign.resumedFromSave, false);
  assert.deepEqual(fresh.campaign.saveState.completedLevelIds, []);
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

// 5. The local edition's names
{
  const { localize, setLocalEdition, isLocal, LOCAL_SPECIES } = await import('../src/edition.js');
  const { PRACTICE_LEVELS, OBJECTIVE_LABELS } = await import('../src/campaign.js');
  const { SPECIES_CONFIG } = await import('../src/entities.js');
  const { midnightHue, clockProgress, HOUR_WASH } = await import('../src/hour-clock.js');

  assert.equal(isLocal(), false, 'the edition is off without the build flag');
  assert.equal(localize('Thread a firefly.'), 'Thread a firefly.', 'and text is left alone');
  assert.equal(SPECIES_CONFIG.brimstone.name, 'Brimstone Butterfly', 'as are the species names');

  setLocalEdition(true);
  const cases = [
    ['Thread a firefly, then a lacewing, then a different firefly in one stroke.', 'Thread an alitaptap, then a lacewing, then a different alitaptap in one stroke.'],
    ['Brimstones and the snail return.', 'Paruparo and the snail return.'],
    ['There are as many damselflies as Brimstones now: pick the match.', 'There are as many tutubi as paruparo now: pick the match.'],
    ['Pick a flax flower. The next cord is longer.', 'Pick an abaca flower. The next cord is longer.'],
    ['Roseate Hawkmoth', 'Oleander Hawkmoth'],
    ['2 hawkmoths, 2 hoverflies', '2 gamugamo, 2 bubuyog'],
    ['The hornet cut the cord.', 'The putakti cut the cord.'],
    ['Begin a thread inside the jasmine.', 'Begin a thread inside the dama de noche.'],
    ['an airborne dandelion seed', 'an airborne cogon plume'],
    ['Seed & Wing', 'Seed & Wing'],
  ];
  for (const [source, expected] of cases) assert.equal(localize(source), expected);

  // Every string a visit carries: nothing of the old cast is left, the result is
  // stable when localized again, and no article disagrees with its new noun.
  const old = /brimstone|damselfl|hoverfl|firefl|hornet|cicada|jasmine|flax|dandelion|roseate|(?<!oleander )hawkmoth/i;
  const strings = [];
  const collect = value => {
    if (typeof value === 'string') strings.push(value);
    else if (value && typeof value === 'object') Object.entries(value).forEach(([key, v]) => { if (!['id', 'hour', 'scene', 'kind', 'practiceOf', 'snailRoute'].includes(key)) collect(v); });
  };
  collect([CAMPAIGN_LEVELS.map(({ population, objectives, traceSequence, traceSequences, gestures, ...shown }) => shown), PRACTICE_LEVELS.map(({ population, objectives, traceSequence, traceSequences, gestures, ...shown }) => shown), OBJECTIVE_LABELS]);
  assert.ok(strings.length > 100, 'the visits were read');
  for (const source of strings) {
    const shown = localize(source);
    assert.ok(!old.test(shown), `still names the old cast: ${shown}`);
    assert.equal(localize(shown), shown, `not stable: ${shown}`);
    assert.ok(!/\ban? (?:alitaptap|abaca)/i.test(shown.replace(/\ban (?:alitaptap|abaca)/gi, '')), `wrong article: ${shown}`);
    assert.ok(!/\ban (?:paruparo|tutubi|gamugamo|bubuyog|putakti|kuliglig|cogon)/i.test(shown), `wrong article: ${shown}`);
  }
  for (const kind of Object.keys(LOCAL_SPECIES)) assert.ok(SPECIES_CONFIG[kind], `${kind} is a species`);

  // The clock: six Midnight hues near 321, and progress that follows the visit clock.
  const hues = CAMPAIGN_LEVELS.filter(l => l.hour === 'midnight').map(midnightHue);
  assert.equal(new Set(hues).size, 6, 'each Midnight visit has its own hue');
  for (const hue of hues) assert.ok(Math.min(Math.abs(hue - 321), 360 - Math.abs(hue - 321)) <= 48);
  assert.deepEqual(Object.keys(HOUR_WASH), ['dawn', 'noon', 'dusk', 'midnight']);
  const game = new Game(canvas);
  game.startLevel('noon-02'); game.state = 'PLAYING';
  game.clock.remainingSeconds = game.clock.totalSeconds / 4;
  assert.equal(game.isClockHeld() ? 0 : clockProgress(game), game.isClockHeld() ? 0 : 0.75);
  const { drawHourWash, drawHourGauge } = await import('../src/hour-clock.js');
  // The sheet moves in whole ten-second steps and covers the field only at the end.
  const { steppedProgress } = await import('../src/hour-clock.js');
  game.startLevel('noon-02'); game.state = 'PLAYING';
  const total = game.clock.totalSeconds;
  const shownAt = elapsed => { game.clock.remainingSeconds = total - elapsed; return steppedProgress(game); };
  if (!game.isClockHeld()) {
    assert.equal(shownAt(9.9), 0, 'nothing before the first ten seconds');
    assert.equal(shownAt(10), 10 / total);
    assert.equal(shownAt(19.9), 10 / total, 'it holds still between steps');
    assert.equal(shownAt(27), 20 / total);
    assert.ok(shownAt(total - 0.5) < 1, 'not covered while time remains');
    assert.equal(shownAt(total), 1, 'covered when time is up');
  }
  for (const id of ['dawn-02', 'noon-02', 'dusk-02', 'midnight-02']) {
    game.startLevel(id); game.state = 'PLAYING'; game.clock.remainingSeconds = 1;
    drawHourWash(ctx, game); drawHourGauge(ctx, game, 40, 40, 20); // neither throws
  }
  setLocalEdition(false);
  console.log('✔ The local edition renames the whole cast and keeps the rest of the text.');
}

// 6. Attract clips
{
  const titles = MULTICART_GAMES.map(([title]) => title);
  assert.ok(ATTRACT_CLIPS.length > 0, 'there are clips to play');
  for (const [title, path] of ATTRACT_CLIPS) {
    assert.ok(titles.includes(title), `${title} is not on the multicart list in config.js`);
    assert.notEqual(title, 'Drawing the Hours', 'this game plays itself; its clip would repeat the demonstration');
    const file = new URL(`../somewarez/${path}`, import.meta.url);
    assert.ok(fs.existsSync(file), `${path} is missing`);
    // An MP4 opens with a box whose type is 'ftyp'.
    assert.equal(fs.readFileSync(file).subarray(4, 8).toString('latin1'), 'ftyp', `${path} is not an MP4`);
  }
  console.log('✔ Every attract clip names a multicart work and is an MP4 on disk.');
}

// Screensaver gestures still draw when no group can be enclosed.
{
  const game = new Game(canvas);
  game.startLevel(DEMO_VISITS[0]); game.state = 'PLAYING'; game.entities = [];
  const sent = [];
  const player = createAutoplay(game, (type, point) => sent.push([type, point]), { screensaver: true });
  player.step(2);
  assert.equal(sent[0][0], 'pointerdown');
  assert.ok(sent[0][1].every(Number.isFinite));
  player.stop();
}

// The idle schedule visits every hour once, with complete reading time.
{
  const { IDLE_SCENES, STATEMENTS, TIMING, captionSeconds } = await import('../somewarez/config.js');
  assert.equal(TIMING.title, 60);
  assert.equal(TIMING.interlude, 30);
  assert.deepEqual(IDLE_SCENES.map(s => s.scene), ['demo', 'title', 'demo', 'title', 'demo', 'title', 'demo', 'ad', 'title']);
  assert.deepEqual(IDLE_SCENES.filter(s => s.scene === 'demo').map(s => s.hour), [0, 1, 2, 3]);
  assert.equal(STATEMENTS.length, 4);
  for (const lines of STATEMENTS) {
    assert.ok(lines.length > 0);
    for (const line of lines) assert.ok(captionSeconds(line) >= Math.max(7, line.split(/\s+/).length / 3));
  }
  const paragraphs = fs.readFileSync(new URL('../ARTIST-STATEMENT.md', import.meta.url), 'utf8').split('## Draft')[1].trim().split(/\r?\n\r?\n/);
  assert.deepEqual(STATEMENTS.map(lines => lines.join(' ')), paragraphs.slice(0, 4).map(p => p.replace(/\*([^*]+)\*/g, '$1').trim()));
  console.log('✔ Idle schedule and captions match the first four statement paragraphs.');
}

console.log('--- All SOMEWAREZ kiosk tests passed! ---');
