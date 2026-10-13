/**
 * Tests for the slowing flower: the poppy, or ylang-ylang in the local edition.
 *
 * 1. It grows in six visits, and campaign-plan.json agrees
 * 2. A held cord drawn over it picks it: the field slows for eight seconds and another is queued
 * 3. While slowed, creatures run on 0.4 of the time and the visit clock runs on all of it
 * 4. Picking a flax flower does not slow the field, and picking a poppy does not lengthen a cord
 * 5. It is the flax flower's type, so it is never pocket content, a bead, or a tap target
 * 6. The local edition calls it ylang-ylang
 *
 * Usage:
 *   node test/test_slow.js
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';

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
globalThis.localStorage = { getItem: () => null, setItem: noop, removeItem: noop };
globalThis.window = { addEventListener: (type, fn) => { listeners.window[type] = fn; }, devicePixelRatio: 1, innerWidth: 960, innerHeight: 640 };
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
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 640 }),
};

const { Game } = await import('../src/game.js');
const { CAMPAIGN_LEVELS } = await import('../src/campaign.js');
const { localize, setLocalEdition } = await import('../src/edition.js');

const VISITS = ['noon-04', 'noon-05', 'noon-06', 'dusk-06', 'midnight-03', 'midnight-06'];
const DT = 0.1;

/** A visit in play with the cord held across the flower of the given kind. */
function pickFlower(id, kind) {
  const game = new Game(canvas);
  game.initLevel(id);
  game.state = 'PLAYING';
  const flower = game.entities.find(e => e.kind === kind);
  assert.ok(flower, `${id} grows a ${kind}`);
  game.isDrawing = true;
  const points = [{ x: flower.x - 30, y: flower.y }, { x: flower.x + 30, y: flower.y }];
  assert.equal(game.checkCordBeans(points), true, `the cord picks the ${kind}`);
  game.isDrawing = false;
  return { game, flower };
}

console.log('--- Running slowing flower tests ---');

// 1. Placement
{
  const plan = JSON.parse(fs.readFileSync(new URL('../campaign-plan.json', import.meta.url)));
  const grown = CAMPAIGN_LEVELS.filter(l => l.population.poppy).map(l => l.id);
  assert.deepEqual(grown, VISITS, 'the poppy grows in these six visits and no others');
  for (const level of CAMPAIGN_LEVELS) {
    assert.equal(plan.levels.find(l => l.id === level.id).population.poppy, level.population.poppy, `${level.id}: the plan agrees`);
  }
  assert.match(CAMPAIGN_LEVELS.find(l => l.id === 'noon-04').instruction, /poppy/, 'the visit that introduces it says so');
  for (const id of VISITS) {
    const game = new Game(canvas);
    game.initLevel(id);
    assert.equal(game.entities.filter(e => e.kind === 'poppy').length, 1, `${id}: one on the field`);
  }
  console.log('✔ The poppy grows in six visits, and the plan agrees.');
}

// 2. Picking
{
  const { game, flower } = pickFlower('noon-04', 'poppy');
  assert.equal(game.slowTimer, 8, 'the field is slowed for eight seconds');
  assert.equal(game.entities.includes(flower), false, 'the flower leaves the field');
  assert.deepEqual(game.respawnQueue.filter(item => item.kind === 'poppy').map(item => item.delay), [28], 'another is queued for twenty seconds after the slowing');
  assert.match(game.feedbackBanner.text, /field slows for 8 seconds/);
  assert.equal(game.beanBonus, 0, 'a poppy does not lengthen the next cord');
  console.log('✔ A cord drawn over the poppy picks it and slows the field.');
}

// 3. Slowed creatures, unslowed clock
{
  const { game } = pickFlower('noon-04', 'poppy');
  const steps = [];
  const creature = game.entities.find(e => e.type === 'butterfly' || e.type === 'insect');
  const update = creature.update.bind(creature);
  creature.update = (dt, ...rest) => { steps.push(dt); return update(dt, ...rest); };
  const before = game.clock.remainingSeconds;
  const held = game.isClockHeld();
  for (let i = 0; i < 79; i++) game.update(DT);
  assert.ok(steps.every(dt => Math.abs(dt - DT * 0.4) < 1e-9), 'for 7.9 seconds every step is 0.4 of the time');
  if (!held) assert.ok(Math.abs(before - game.clock.remainingSeconds - 7.9) < 1e-6, 'the clock ran at full speed');
  steps.length = 0;
  for (let i = 0; i < 5; i++) game.update(DT);
  assert.equal(game.slowTimer, 0, 'the slowing is over after eight seconds');
  assert.ok(Math.abs(steps.at(-1) - DT) < 1e-9, 'and creatures are back on full time');
  console.log('✔ Creatures run on 0.4 of the time for eight seconds; the clock does not slow.');
}

// 4. Flax is unchanged
{
  const { game } = pickFlower('noon-04', 'bean');
  assert.equal(game.slowTimer, 0, 'a flax flower does not slow the field');
  assert.ok(game.beanBonus > 0, 'it still lengthens the next cord');
  assert.equal(game.entities.some(e => e.kind === 'poppy'), true, 'and leaves the poppy standing');
  console.log('✔ Picking a flax flower slows nothing.');
}

// 5. Never a target
{
  const game = new Game(canvas);
  game.initLevel('noon-04');
  const poppy = game.entities.find(e => e.kind === 'poppy');
  assert.equal(poppy.type, 'bean', "it carries the flax flower's type, which every target filter excludes");
  const far = game.entities.filter(e => e !== poppy).map(e => Math.hypot(e.x - poppy.x, e.y - poppy.y) - e.radius);
  assert.ok(Math.min(...far) >= 34 - 1e-9, 'it is planted on clear ground');
  console.log('✔ The poppy is a pickup, not a target.');
}

// 6. Local name
{
  setLocalEdition(true);
  assert.equal(localize('Draw over a poppy to slow the field for eight seconds.'), 'Draw over a ylang-ylang to slow the field for eight seconds.');
  assert.equal(localize('Poppy picked: the field slows for 8 seconds.'), 'Ylang-ylang picked: the field slows for 8 seconds.');
  setLocalEdition(false);
  console.log('✔ The local edition calls it ylang-ylang.');
}

console.log('--- All slowing flower tests passed! ---');
