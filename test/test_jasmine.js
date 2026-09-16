/**
 * Tests for the night jasmine at Midnight XI–XII and the gesture relations it
 * reads (STRING.md rule 10).
 *
 * 1. gestureRoles names thread starter, threaded, and thread ended
 * 2. A thread begun in the jasmine settles the first insect it crosses
 * 3. The take scores nothing and advances no objective
 * 4. A settled insect holds still at the flower and is still a target
 * 5. A spent bloom takes no one else; it closes after the stay and regrows
 * 6. A guest used in a drawing frees its flower early
 * 7. The jasmine is never threaded, never pocket content
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CAMPAIGN_LEVELS } from '../src/campaign.js';
import { Insect, NightJasmine } from '../src/entities.js';
import { gestureRoles } from '../src/string.js';

console.log('--- Running Night Jasmine Test Suite ---');

const JASMINE_STAY = 24;

// 1. The three relations
{
  const target = { x: 100, y: 100, radius: 20 };

  const started = gestureRoles([{ x: 105, y: 100 }, { x: 200, y: 100 }], target);
  assert.equal(started.startsIn, true, 'A stroke beginning inside is a thread starter');
  assert.equal(started.threaded, false, 'A thread starter is not "threaded"');
  assert.equal(started.endsIn, false, 'It does not end inside');

  const crossed = gestureRoles([{ x: 20, y: 100 }, { x: 200, y: 100 }], target);
  assert.equal(crossed.startsIn, false, 'It began outside');
  assert.equal(crossed.crosses, true, 'It crossed the disk');
  assert.equal(crossed.threaded, true, 'Beginning outside and crossing is "threaded"');

  const ended = gestureRoles([{ x: 20, y: 100 }, { x: 98, y: 100 }], target);
  assert.equal(ended.endsIn, true, 'A stroke ending inside is a thread ending');

  const missed = gestureRoles([{ x: 20, y: 300 }, { x: 200, y: 300 }], target);
  assert.deepEqual(
    { s: missed.startsIn, c: missed.crosses, e: missed.endsIn },
    { s: false, c: false, e: false },
    'A stroke that stays clear has no relation to the entity'
  );

  assert.equal(gestureRoles([], target).threaded, false, 'An empty stroke is safe to classify');

  console.log('✔ Thread starter, threaded, and thread ended are told apart.');
}

// 2. The last visit carries one, and the plan agrees
{
  const plan = JSON.parse(fs.readFileSync(new URL('../campaign-plan.json', import.meta.url)));
  const twelve = CAMPAIGN_LEVELS.find(l => l.id === 'midnight-03');
  assert.equal(twelve.population.jasmine, 1, 'Midnight XII grows one jasmine');
  assert.equal(twelve.jasminePlaces.length, 1, 'Midnight XII says where it stands');
  const source = plan.levels.find(l => l.id === 'midnight-03');
  assert.equal(source.population.jasmine, 1, 'The plan agrees on the jasmine');
  assert.deepEqual(JSON.parse(JSON.stringify(source.jasminePlaces)), twelve.jasminePlaces,
    'The plan agrees on where it stands');

  // Xyh played XI through without it, so only the last visit has one.
  for (const id of ['midnight-01', 'midnight-02']) {
    const level = CAMPAIGN_LEVELS.find(l => l.id === id);
    assert.equal(level.population.jasmine, undefined, `${id} grows no jasmine`);
    assert.equal(level.jasminePlaces, undefined, `${id} places none`);
    assert.equal(plan.levels.find(l => l.id === id).population.jasmine, undefined,
      `${id}: the plan agrees there is none`);
  }

  console.log('✔ The jasmine is authored into Midnight XII alone.');
}

// The rest drives the real page code.
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
  const placeJasmine = () => {
    const jasmine = new NightJasmine(0.5, 0.5, 26);
    jasmine.update(0, { width: 960, height: 640 });
    return jasmine;
  };
  /** A stroke that starts inside the flower and runs out through one insect. */
  const takeFrom = (jasmine, insect) => {
    pointer('pointerdown', [jasmine.x, jasmine.y]);
    pointer('pointermove', [jasmine.x + 40, jasmine.y]);
    pointer('pointermove', [insect.x, insect.y]);
    pointer('pointermove', [insect.x + 60, insect.y]);
    pointer('pointerup', [insect.x + 90, insect.y]);
  };

  // 3. The take: the cord ends, the insect settles, nothing is scored
  {
    game.initLevel('midnight-03');
    game.state = 'PLAYING';
    const jasmine = placeJasmine();
    const lacewing = new Insect(jasmine.x + 140, jasmine.y, 'lacewing');
    lacewing.state = 'roaming';
    const firefly = new Insect(jasmine.x + 300, jasmine.y, 'firefly');
    game.entities = [jasmine, lacewing, firefly];
    const scoreBefore = game.score;

    takeFrom(jasmine, lacewing);

    assert.equal(game.isDrawing, false, 'The cord ends when the flower takes its guest');
    assert.equal(jasmine.guest, lacewing, 'The insect the thread crossed is the guest');
    assert.equal(jasmine.isOpen, false, 'A flower with a guest is spent');
    assert.equal(Math.round(jasmine.stayTimer), JASMINE_STAY, 'The stay is 24 seconds');
    assert.ok(lacewing.parkTarget, 'The guest is sent to the flower');
    assert.equal(game.score, scoreBefore, 'The take scores nothing');
    assert.equal(game.campaign.objectiveProgress.any.current, 0, 'The take advances no objective');
    assert.equal(lacewing.state, 'roaming', 'The guest is still a live target, not a bead');
    assert.match(game.feedbackBanner.text, /jasmine/i, 'The banner says what happened');

    // 4. It flies over and then holds still, and can be drawn around.
    for (let i = 0; i < 60; i++) game.update(1 / 30);
    assert.ok(Math.hypot(lacewing.x - jasmine.x, lacewing.y - jasmine.y) < 3, 'The guest arrives at the flower');
    const restX = lacewing.x;
    const restY = lacewing.y;
    for (let i = 0; i < 60; i++) game.update(1 / 30);
    assert.equal(lacewing.x, restX, 'The guest holds still while it stays');
    assert.equal(lacewing.y, restY, 'The guest holds still while it stays');

    // 5. A spent bloom takes no one else: the thread behaves as an ordinary one.
    const secondFirefly = new Insect(jasmine.x + 140, jasmine.y + 60, 'firefly');
    game.entities.push(secondFirefly);
    takeFrom(jasmine, secondFirefly);
    assert.equal(jasmine.guest, lacewing, 'The flower keeps the guest it has');
    assert.equal(secondFirefly.parkTarget, undefined, 'A spent flower takes no second insect');

    // The stay ends: the guest is freed, the bloom closes, another grows.
    for (let i = 0; i < 30 * 26; i++) game.update(1 / 30);
    assert.equal(lacewing.parkTarget, undefined, 'The guest is released when the stay ends');
    assert.equal(game.entities.includes(jasmine), false, 'The spent bloom closes');
    assert.ok(
      game.respawnQueue.some(i => i.kind === 'jasmine') || game.entities.some(e => e.kind === 'jasmine'),
      'Another jasmine is on its way'
    );

    console.log('✔ A thread begun in the flower settles one insect, scores nothing, and the bloom is spent.');
  }

  // 6. A guest used in a drawing frees its flower early
  {
    game.initLevel('midnight-03');
    game.state = 'PLAYING';
    const jasmine = placeJasmine();
    const hoverfly = new Insect(jasmine.x + 140, jasmine.y, 'hoverfly');
    game.entities = [jasmine, hoverfly];
    takeFrom(jasmine, hoverfly);
    assert.equal(jasmine.guest, hoverfly, 'The hoverfly is the guest');

    hoverfly.state = 'harmonizing';
    game.update(1 / 30);
    assert.equal(jasmine.guest, null, 'A guest gathered into a drawing frees the flower');
    assert.equal(game.entities.includes(jasmine), false, 'The bloom closes behind it');

    console.log('✔ A guest gathered into a drawing frees its flower early.');
  }

  // 7. The flower itself is scenery
  {
    game.initLevel('midnight-03');
    game.state = 'PLAYING';
    const jasmine = placeJasmine();
    const a = new Insect(jasmine.x - 60, jasmine.y + 80, 'firefly');
    const b = new Insect(jasmine.x + 60, jasmine.y + 80, 'firefly');
    game.entities = [jasmine, a, b];

    // A stroke that begins outside and runs across the flower threads nothing.
    pointer('pointerdown', [jasmine.x - 200, jasmine.y]);
    pointer('pointermove', [jasmine.x, jasmine.y]);
    assert.equal(game.stringGesture.beads.length, 0, 'The flower is never threaded as a bead');
    pointer('pointerup', [jasmine.x + 200, jasmine.y]);
    assert.equal(jasmine.guest, null, 'Crossing the flower from outside takes nobody');

    // A loop around the flower and two fireflies still scores the pair.
    const ring = [];
    for (let i = 0; i <= 43; i++) {
      const t = (i / 40) * Math.PI * 2;
      ring.push([jasmine.x + 130 * Math.cos(t), jasmine.y + 40 + 110 * Math.sin(t)]);
    }
    pointer('pointerdown', ring[0]);
    for (const p of ring.slice(1)) pointer('pointermove', p);
    pointer('pointerup', ring[ring.length - 1]);
    assert.ok(game.feedbackBanner.text.startsWith('Kindred Pair'),
      `A loop holding the flower and two fireflies still scores (got "${game.feedbackBanner.text}")`);

    console.log('✔ The jasmine is never a bead and never pocket content.');
  }
} finally {
  if (!hadWindow) delete globalThis.window;
  if (!hadDocument) delete globalThis.document;
}

console.log('--- All night jasmine tests passed! ---');
