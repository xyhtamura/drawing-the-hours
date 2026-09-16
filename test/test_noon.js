/**
 * Tests for Noon IV–VI after the crossing moved to Dusk: loop-only objectives,
 * the cord spool, the patrolling hornet, and the web patches.
 *
 * 1. Noon requires loops only; the plan and the runtime agree
 * 2. The hornet patrols one lane, turns at the edges, and keeps its lane on resize
 * 3. A cord touching the hornet or a web breaks, and says which
 * 4. A loop drawn around a web still scores: a web is terrain, not content
 * 5. A cord run over a spool gains thread, and the spool leaves the field
 * 6. A spool is never threaded as a bead and never pocket content
 * 7. The trio scores at Noon IV
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CAMPAIGN_LEVELS } from '../src/campaign.js';
import { Insect, DandelionSeed, Hornet, WebPatch, CordSpool } from '../src/entities.js';
import { evaluateSinglePocket } from '../src/recipes.js';
import { MAX_CORD_LENGTH } from '../src/string.js';

console.log('--- Running Noon Test Suite (loops, spool, hornet, webs) ---');

const CROSSING_KEYS = ['figure8', 'counterpartPair', 'lacewingCounterpart', 'nursery', 'mixedEcho', 'twinSeedWing'];
const noonLevels = CAMPAIGN_LEVELS.filter(l => l.hour === 'noon');

// 1. Objectives, populations, and plan agreement
{
  const plan = JSON.parse(fs.readFileSync(new URL('../campaign-plan.json', import.meta.url)));
  assert.equal(noonLevels.length, 3, 'Noon has three visits');

  for (const level of noonLevels) {
    for (const key of CROSSING_KEYS) {
      assert.ok(!(key in level.objectives), `${level.id} requires no crossing`);
    }
    assert.equal(level.population.spool, 1, `${level.id} leaves one cord spool`);

    const source = plan.levels.find(l => l.id === level.id);
    assert.deepEqual(source.objectives, level.objectives, `${level.id}: plan objectives agree`);
    assert.deepEqual(source.population, level.population, `${level.id}: plan population agrees`);
    assert.equal(source.instruction, level.instruction, `${level.id}: plan instruction agrees`);
  }

  const [four, five, six] = noonLevels;
  assert.deepEqual(four.objectives, { any: 4, trio: 2 }, 'Noon IV asks for trios');
  assert.equal(four.population.hornet, undefined, 'Noon IV keeps a clear field for the spool lesson');
  assert.deepEqual(five.objectives, { any: 4, seedWing: 2 }, 'Noon V asks for Seed & Wing loops');
  assert.equal(five.population.hornet, 1, 'Noon V introduces the hornet');
  assert.equal(five.population.web, undefined, 'Noon V holds the webs back');
  assert.deepEqual(six.objectives, { any: 4, seedTrio: 2 }, 'Noon VI asks for Seed & Trio loops');
  assert.equal(six.population.web, 2, 'Noon VI strings two webs');
  assert.equal(six.webPatches.length, 2, 'Noon VI authors where the webs hang');
  assert.deepEqual(
    JSON.parse(JSON.stringify(plan.levels.find(l => l.id === six.id).webPatches)),
    six.webPatches,
    'Noon VI: plan and runtime web positions agree'
  );

  // Dusk still teaches the crossing it inherited.
  const duskKeys = CAMPAIGN_LEVELS.filter(l => l.hour === 'dusk')
    .flatMap(l => Object.keys(l.objectives));
  assert.ok(duskKeys.some(k => CROSSING_KEYS.includes(k)), 'Dusk requires the crossing');

  console.log('✔ Noon asks for loops only; plan and runtime agree on cast, goals, and webs.');
}

// 2. The hornet's patrol
{
  const bounds = { width: 960, height: 640 };
  const hornet = new Hornet(200, 0.45, 1);
  hornet.update(0, bounds);
  assert.ok(Math.abs(hornet.y - 640 * 0.45) <= 8, 'The hornet flies its lane');

  const startX = hornet.x;
  for (let i = 0; i < 60; i++) hornet.update(1 / 60, bounds);
  assert.ok(hornet.x > startX, 'The hornet travels along its lane');
  assert.ok(Math.abs((hornet.x - startX) - 54) < 2, 'It covers about 54 px a second, slow enough to read');

  for (let i = 0; i < 60 * 30; i++) hornet.update(1 / 60, bounds);
  assert.ok(hornet.x >= 40 && hornet.x <= bounds.width - 40, 'It turns at the edges instead of leaving');

  const narrow = { width: 390, height: 640 };
  hornet.update(0, narrow);
  assert.ok(Math.abs(hornet.y - 640 * 0.45) <= 8, 'A resize keeps it on the same lane of the field');

  const web = new WebPatch(0.29, 0.31, 30);
  web.update(0, bounds);
  assert.equal(web.x, 960 * 0.29, 'A web hangs where the level put it');
  web.update(0, narrow);
  assert.equal(web.x, 390 * 0.29, 'A web keeps its place in the scene when the canvas resizes');

  console.log('✔ Hornet lane, speed, turns, and web placement verified.');
}

// The remaining checks drive the real page code, so they need the browser stubs.
const listeners = { window: {}, canvas: {} };
const hadWindow = 'window' in globalThis;
const hadDocument = 'document' in globalThis;
globalThis.window = { addEventListener: (type, fn) => { listeners.window[type] = fn; }, devicePixelRatio: 1 };
globalThis.document = {
  querySelector: () => null,
  getElementById: () => null,
  addEventListener: () => {},
  hidden: false,
  documentElement: { dataset: {}, style: { setProperty: () => {}, removeProperty: () => {} } },
};

const { Game } = await import('../src/game.js');

try {
  const ctx = new Proxy({ measureText: () => ({ width: 10 }) }, {
    get: (target, prop) => (prop in target ? target[prop] : () => {}),
  });
  const canvas = {
    width: 960,
    height: 640,
    getContext: () => ctx,
    addEventListener: (type, fn) => { listeners.canvas[type] = fn; },
    setPointerCapture: () => {},
    releasePointerCapture: () => {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 640 }),
  };
  const game = new Game(canvas);
  const pointer = (type, [x, y]) => {
    const event = { pointerId: 1, isPrimary: true, button: 0, clientX: x, clientY: y, preventDefault() {} };
    if (type === 'pointerdown') listeners.canvas.pointerdown(event);
    else listeners.window[type](event);
  };
  const stroke = (points) => {
    pointer('pointerdown', points[0]);
    for (const p of points.slice(1)) pointer('pointermove', p);
    pointer('pointerup', points[points.length - 1]);
  };
  const circle = (cx, cy, r, steps = 40, overshoot = 3) => {
    const pts = [];
    for (let i = 0; i <= steps + overshoot; i++) {
      const a = (i / steps) * Math.PI * 2;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return pts;
  };
  const setup = (id, entities) => {
    game.initLevel(id);
    game.state = 'PLAYING';
    game.entities = entities;
  };

  // 3. A cord touching a hazard breaks and says which
  {
    const hornet = new Hornet(480, 0.5, 1);
    hornet.update(0, { width: 960, height: 640 });
    setup('noon-02', [hornet]);
    stroke([[200, hornet.y], [400, hornet.y], [600, hornet.y]]);
    assert.equal(game.feedbackBanner.text, 'The hornet broke the cord. Watch its lane.',
      'The break names the hornet');
    assert.equal(game.isDrawing, false, 'The stroke ends when the hornet takes it');

    const web = new WebPatch(0.5, 0.5, 30);
    web.update(0, { width: 960, height: 640 });
    setup('noon-03', [web]);
    stroke([[300, 320], [420, 320], [560, 320]]);
    assert.equal(game.feedbackBanner.text, 'The cord stuck in the web. Draw around it.',
      'The break names the web');

    // A pocket holding the hornet fails, as the snail's does.
    const caught = new Hornet(480, 0.5, 1);
    caught.update(0, { width: 960, height: 640 });
    assert.equal(evaluateSinglePocket([new Insect(470, 300, 'brimstone'), caught]).valid, false,
      'A loop holding the hornet is not a combination');

    console.log('✔ Hornet and web break the cord with their own message; the hornet spoils a pocket.');
  }

  // 4. A web inside a loop is terrain, not content
  {
    const web = new WebPatch(0.5, 0.5, 26);
    web.update(0, { width: 960, height: 640 });
    setup('noon-03', [web, new Insect(440, 320, 'brimstone'), new Insect(520, 320, 'brimstone')]);
    stroke(circle(480, 320, 95));
    assert.ok(game.feedbackBanner.text.startsWith('Kindred Pair'),
      `A loop drawn clear of a web still scores (got "${game.feedbackBanner.text}")`);
    assert.ok(game.campaign.objectiveProgress.any.current >= 1, 'The combination counts');

    console.log('✔ A loop around a web scores; the web is never pocket content.');
  }

  // 5. A spool adds thread to the stroke that takes it
  {
    setup('noon-01', [new CordSpool(480, 320)]);
    const limitBefore = game.cordLimit();
    assert.equal(limitBefore, MAX_CORD_LENGTH, 'The visit starts on the shared snap limit');

    pointer('pointerdown', [200, 320]);
    pointer('pointermove', [400, 320]);
    pointer('pointermove', [480, 320]);
    assert.equal(game.stringGesture.maxCordLength, MAX_CORD_LENGTH + 400,
      'Running the cord over a spool adds 400 px to that stroke');
    assert.equal(game.cordLimit(), MAX_CORD_LENGTH + 400, 'The meter follows the raised limit');
    assert.equal(game.entities.some(e => e.type === 'spool'), false, 'The spool leaves the field');
    assert.ok(game.respawnQueue.some(i => i.kind === 'spool' && i.delay > 1),
      'Another spool is left after a delay, so the thread is a resource');
    pointer('pointerup', [520, 320]);
    assert.equal(game.cordLimit(), MAX_CORD_LENGTH, 'The thread lasts for that stroke only');

    console.log('✔ A spool raises the snap limit of its own stroke and then returns to the field.');
  }

  // 6. A spool is neither a bead nor pocket content
  {
    const spool = new CordSpool(480, 320);
    setup('noon-01', [spool, new Insect(450, 380, 'brimstone'), new Insect(510, 380, 'brimstone')]);
    pointer('pointerdown', [300, 320]);
    pointer('pointermove', [480, 320]);
    assert.equal(game.stringGesture.beads.length, 0, 'A spool is not threaded onto the cord');
    pointer('pointerup', [600, 320]);

    setup('noon-01', [new CordSpool(480, 250), new Insect(450, 320, 'brimstone'), new Insect(510, 320, 'brimstone')]);
    stroke(circle(480, 300, 90));
    assert.ok(game.feedbackBanner.text.startsWith('Kindred Pair'),
      `A spool inside the loop does not spoil it (got "${game.feedbackBanner.text}")`);

    console.log('✔ Spools are never beads and never pocket content.');
  }

  // 7. The trio still scores at Noon IV
  {
    setup('noon-01', [
      new Insect(440, 300, 'brimstone'),
      new Insect(500, 300, 'hoverfly'),
      new Insect(470, 350, 'hawkmoth'),
    ]);
    stroke(circle(470, 320, 90));
    assert.ok(game.feedbackBanner.text.startsWith('Trio'),
      `Three kinds in one loop score a Trio (got "${game.feedbackBanner.text}")`);
    assert.equal(game.campaign.objectiveProgress.trio.current, 1, "Noon IV's trio objective advances");

    // And a seed with three kinds still scores the Seed & Trio Noon VI asks for.
    setup('noon-03', [
      new Insect(440, 300, 'brimstone'),
      new Insect(500, 300, 'hoverfly'),
      new Insect(470, 350, 'hawkmoth'),
      new DandelionSeed(470, 290),
    ]);
    stroke(circle(470, 320, 90));
    assert.equal(game.campaign.objectiveProgress.seedTrio.current, 1, "Noon VI's Seed & Trio objective advances");

    console.log('✔ Trio at Noon IV and Seed & Trio at Noon VI both score.');
  }
} finally {
  if (!hadWindow) delete globalThis.window;
  if (!hadDocument) delete globalThis.document;
}

console.log('--- All Noon tests passed! ---');
