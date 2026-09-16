/**
 * Tests for Noon IV–VI after the crossing moved to Dusk: loop-only objectives,
 * the string bean, the wandering hornet, and the web patches.
 *
 * 1. Noon requires loops only; the plan and the runtime agree
 * 2. The hornet flies like an insect; only the web keeps a fixed place
 * 3. A cord touching the hornet or a web is cut, and says which; the snail is not a cutter
 * 4. A loop drawn around a web still scores: a web is terrain, not content
 * 5. A picked bean lengthens the NEXT cord, keeps for a while, then dries out
 * 6. A bean is never threaded as a bead and never pocket content
 * 7. The trio scores at Noon IV
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CAMPAIGN_LEVELS } from '../src/campaign.js';
import { Insect, DandelionSeed, Snail, Hornet, WebPatch, FlaxFlower } from '../src/entities.js';
import { evaluateSinglePocket } from '../src/recipes.js';
import { MAX_CORD_LENGTH } from '../src/string.js';

console.log('--- Running Noon Test Suite (loops, bean, hornet, webs) ---');

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
    assert.equal(level.population.bean, 1, `${level.id} hangs one string bean`);
    assert.equal(level.hornetLanes, undefined, `${level.id} gives the hornet no fixed lane`);

    const source = plan.levels.find(l => l.id === level.id);
    assert.deepEqual(source.objectives, level.objectives, `${level.id}: plan objectives agree`);
    assert.deepEqual(source.population, level.population, `${level.id}: plan population agrees`);
    assert.equal(source.instruction, level.instruction, `${level.id}: plan instruction agrees`);
  }

  const [four, five, six] = noonLevels;
  assert.deepEqual(four.objectives, { any: 6, trio: 2 }, 'Noon IV asks for trios');
  assert.equal(four.population.hornet, undefined, 'Noon IV keeps a clear field for the bean lesson');
  assert.deepEqual(five.objectives, { any: 6, seedWing: 3 }, 'Noon V asks for Seed & Wing loops');
  assert.equal(five.population.hornet, 1, 'Noon V introduces the hornet');
  assert.equal(five.population.web, undefined, 'Noon V holds the webs back');
  assert.deepEqual(six.objectives, { any: 6, seedTrio: 2 }, 'Noon VI asks for Seed & Trio loops');

  // Noon's pressure is the count, not the shape: more drawings than Dawn asks
  // for, in the same order of time (Xyh, 2026-09-16).
  for (const level of noonLevels) {
    assert.ok(level.objectives.any >= 6, `${level.id} asks for at least six combinations`);
  }
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

// 2. The hornet flies; only the web holds a place
{
  const bounds = { width: 960, height: 640 };
  const hornet = new Hornet(300, 300);
  assert.equal(hornet.type, 'hazard', 'The hornet is a hazard');
  assert.equal(hornet.cutsCord, true, 'The hornet cuts a cord it touches');
  assert.equal(hornet.laneRatio, undefined, 'The hornet keeps no lane');

  // It wanders: over half a minute it turns, and it leaves the line it started on.
  const startHeading = hornet.heading;
  const startY = hornet.y;
  let turned = false;
  let leftTheLine = false;
  for (let i = 0; i < 60 * 30; i++) {
    hornet.update(1 / 60, bounds);
    if (Math.abs(hornet.heading - startHeading) > 0.3) turned = true;
    if (Math.abs(hornet.y - startY) > 40) leftTheLine = true;
    assert.ok(hornet.x >= 10 && hornet.x <= bounds.width - 10, 'It stays on the field');
    assert.ok(hornet.y >= 10 && hornet.y <= bounds.height - 10, 'It stays on the field');
  }
  assert.ok(turned, 'The hornet changes heading as an insect does');
  assert.ok(leftTheLine, 'The hornet does not hold one horizontal line');

  // The snail is the counterpart: a creature that no longer cuts.
  assert.equal(new Snail(100, 0).cutsCord, false, 'The snail spoils a pocket instead of cutting');

  const narrow = { width: 390, height: 640 };
  const web = new WebPatch(0.29, 0.31, 30);
  web.update(0, bounds);
  assert.equal(web.cutsCord, true, 'The web cuts a cord it touches');
  assert.equal(web.x, 960 * 0.29, 'A web hangs where the level put it');
  web.update(0, narrow);
  assert.equal(web.x, 390 * 0.29, 'A web keeps its place in the scene when the canvas resizes');

  console.log('✔ The hornet wanders and cuts; the snail does not cut; only the web holds a place.');
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

  // 3. A cord touching a hazard is cut, and says which
  {
    const hornet = new Hornet(480, 320);
    setup('noon-02', [hornet]);
    stroke([[200, hornet.y], [400, hornet.y], [600, hornet.y]]);
    assert.equal(game.feedbackBanner.text, 'The hornet cut the cord.',
      'The break names the hornet');
    assert.equal(game.isDrawing, false, 'The stroke ends when the hornet takes it');

    const web = new WebPatch(0.5, 0.5, 30);
    web.update(0, { width: 960, height: 640 });
    setup('noon-03', [web]);
    stroke([[300, 320], [420, 320], [560, 320]]);
    assert.equal(game.feedbackBanner.text, 'The cord stuck in the web. Draw around it.',
      'The break names the web');

    // A pocket holding the hornet fails, as the snail's does: under the purity
    // rule an uninvited entity is a dud ingredient whether or not it cuts.
    assert.equal(evaluateSinglePocket([new Insect(470, 300, 'brimstone'), new Hornet(480, 320)]).valid, false,
      'A loop holding the hornet is not a combination');
    assert.equal(evaluateSinglePocket([new Insect(470, 300, 'brimstone'), new Snail(480, 320)]).valid, false,
      'A loop holding the snail is not a combination');

    console.log('✔ Hornet and web cut the cord with their own message; both hazards spoil a pocket.');
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

  // 5. A picked bean lengthens the next cord
  {
    setup('noon-01', [new FlaxFlower(480, 320)]);
    assert.equal(game.cordLimit(), MAX_CORD_LENGTH, 'The visit starts on the shared snap limit');

    pointer('pointerdown', [200, 320]);
    pointer('pointermove', [400, 320]);
    pointer('pointermove', [480, 320]);
    assert.equal(game.stringGesture.maxCordLength, MAX_CORD_LENGTH,
      'The cord that picks the bean is not itself lengthened');
    assert.equal(game.entities.some(e => e.type === 'bean'), false, 'The bean leaves the field');
    assert.ok(game.respawnQueue.some(i => i.kind === 'bean' && i.delay > 1),
      'Another bean grows after a delay, so the length is a resource');
    pointer('pointerup', [520, 320]);
    assert.equal(game.cordLimit(), MAX_CORD_LENGTH + 400, 'The kept bean shows on the meter before the next cord');

    pointer('pointerdown', [200, 400]);
    assert.equal(game.stringGesture.maxCordLength, MAX_CORD_LENGTH + 400, 'The next cord runs 400 px longer');
    pointer('pointerup', [260, 400]);
    assert.equal(game.cordLimit(), MAX_CORD_LENGTH, 'The bean is spent on that one cord');

    // Kept beans dry out when they are not used.
    setup('noon-01', [new FlaxFlower(480, 320)]);
    stroke([[200, 320], [400, 320], [480, 320], [560, 320]]);
    assert.equal(game.cordLimit(), MAX_CORD_LENGTH + 400, 'The bean is kept after the cord that picked it');
    for (let i = 0; i < 130; i++) game.update(0.1); // thirteen seconds
    assert.equal(game.cordLimit(), MAX_CORD_LENGTH, 'An unused bean dries out');

    console.log('✔ A picked bean lengthens the next cord only, and dries out if it is not used.');
  }

  // 6. A bean is neither a bead nor pocket content
  {
    setup('noon-01', [new FlaxFlower(480, 320), new Insect(450, 380, 'brimstone'), new Insect(510, 380, 'brimstone')]);
    pointer('pointerdown', [300, 320]);
    pointer('pointermove', [480, 320]);
    assert.equal(game.stringGesture.beads.length, 0, 'A bean is not threaded onto the cord');
    pointer('pointerup', [600, 320]);

    setup('noon-01', [new FlaxFlower(480, 250), new Insect(450, 320, 'brimstone'), new Insect(510, 320, 'brimstone')]);
    stroke(circle(480, 300, 90));
    assert.ok(game.feedbackBanner.text.startsWith('Kindred Pair'),
      `A bean inside the loop does not spoil it (got "${game.feedbackBanner.text}")`);

    console.log('✔ Beans are never beads and never pocket content.');
  }

  // 8. The visit card can be reopened during play
  {
    setup('noon-01', [new Insect(450, 320, 'brimstone')]);
    game.clock.remainingSeconds = 42;
    assert.equal(game.toggleVisitCard(), true, 'The card opens during play');
    assert.equal(game.state, 'CARD', 'The visit card state is its own');
    assert.equal(game.clock.isPaused, true, 'The clock stops while the card is open');
    for (let i = 0; i < 20; i++) game.update(0.1);
    assert.equal(Math.round(game.clock.remainingSeconds), 42, 'Two seconds of card time cost nothing');
    game.advance();
    assert.equal(game.state, 'PLAYING', 'Advancing from the card returns to the visit');
    assert.equal(game.clock.isPaused, false, 'The clock runs again');
    assert.equal(game.campaign.objectiveProgress.any.target, 6, 'The visit was not restarted');

    console.log('✔ The visit card reopens mid-visit, stops the clock, and does not restart the visit.');
  }

  // 7. The trio still scores at Noon IV, at the new count
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
  // Later-hour returns keep the same pickup contract with slower regrowth.
  for (const id of ['dusk-02', 'midnight-03']) {
    game.initLevel(id);
    assert.equal(game.currentLevel.population.bean, 1);
    assert.equal(game.entities.filter(e => e.type === 'bean').length + game.respawnQueue.filter(e => e.kind === 'bean').length, 1, `${id}: one flower, live or queued`);
    setup(id, [new FlaxFlower(480, 320)]);
    pointer('pointerdown', [300, 320]); pointer('pointermove', [480, 320]);
    assert.equal(game.stringGesture.maxCordLength, MAX_CORD_LENGTH);
    assert.equal(game.beanBonus, 400);
    assert.equal(game.respawnQueue.find(e => e.kind === 'bean').delay, 24);
    pointer('pointerup', [480, 320]);
    game.entities = [];
    game.respawnQueue = [{kind: 'bean', delay: 24}];
    game.maintainPopulation(23);
    assert.equal(game.entities.filter(e => e.type === 'bean').length, 0);
    game.entities = []; // Keep spawn clearance deterministic for this assertion.
    game.maintainPopulation(1);
    assert.equal(game.entities.filter(e => e.type === 'bean').length, 1);
  }
  console.log('PASS: flax returns in Dusk VIII and Midnight XII, with 24-second regrowth.');
} finally {
  if (!hadWindow) delete globalThis.window;
  if (!hadDocument) delete globalThis.document;
}

console.log('--- All Noon tests passed! ---');
