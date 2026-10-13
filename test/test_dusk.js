import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Insect } from '../src/entities.js';
import { leafAnchors, duskSafeArea, placeLacewing } from '../src/lacewing.js';
import { CampaignManager, CAMPAIGN_LEVELS, PLAYABLE_LEVEL_IDS } from '../src/campaign.js';
import { evaluateDrawing } from '../src/recipes.js';
import { VisitClock } from '../src/clock.js';

const wide = { width: 960, height: 640 }, narrow = { width: 340, height: 620 };
const a = new Insect(0, 0, 'lacewing');
placeLacewing(a, wide);
a.motionScale = 0.5;
const first = leafAnchors(wide)[0];
a.update(1.49, wide);
assert.deepEqual([a.x, a.y], [first.x, first.y]);
a.update(0.01, wide);
assert.equal(a.lacePhase, 'travel', 'Rest ends at 1.5 seconds even at half speed');
a.update(3, wide);
const second = leafAnchors(wide)[1];
assert.ok(Math.abs(a.x - (first.x + second.x) / 2) < 1e-8, 'Half-speed travel takes six seconds');
a.update(3, wide);
assert.equal(a.lacePhase, 'rest');
assert.equal(a.leafIndex, 1);
a.update(0, narrow);
assert.deepEqual([a.x, a.y], Object.values(leafAnchors(narrow)[1]), 'Resize maps resting insect to its leaf');
for (const bounds of [wide, narrow, { width: 320, height: 300 }]) {
  const safe = duskSafeArea(bounds);
  for (let i = 0; i < 1000; i++) {
    a.update(0.03, bounds);
    assert.ok(a.x >= safe.left && a.x <= safe.right && a.y >= safe.top && a.y <= safe.bottom);
  }
}
const big = new Insect(0, 0, 'lacewing'), small = new Insect(0, 0, 'lacewing');
placeLacewing(big, wide); placeLacewing(small, wide);
big.update(18, wide);
for (let i = 0; i < 1800; i++) small.update(0.01, wide);
assert.ok(Math.hypot(big.x - small.x, big.y - small.y) < 1e-6, 'Large and small timesteps agree');

const campaign = new CampaignManager();
campaign.setLevelById('noon-06');
assert.equal(campaign.getNextLevel().id, 'dusk-01');

// Dusk 1 (Visit XIII: The way through)
const level = campaign.setLevelById('dusk-01');
assert.equal(level.transitionText, 'I always find myself walking home through here.');
assert.equal(campaign.getNextLevel().id, 'dusk-02');
for (const n of [2, 3, 4, 5, 6]) assert.ok(PLAYABLE_LEVEL_IDS.has(`dusk-0${n}`));
const pockets = [new Insect(0, 0, 'lacewing'), new Insect(0, 0, 'hoverfly')]
  .map(entity => ({ entities: [entity], area: 4000, centroid: {x:0,y:0} }));
const result = evaluateDrawing(pockets, 600);
assert.ok(result.valid, 'Resting species participates in generic counterpart recipe');
const clock = new VisitClock(100);
for (let i = 0; i < 5; i++) campaign.processDrawing(result, pockets, clock);
assert.equal(campaign.objectiveProgress.lacewingCounterpart.current, 2);
assert.ok(campaign.isComplete());
assert.equal(clock.remainingSeconds, 115, 'Progress bonus remains capped');

// Dusk 4 (Visit XVI: Almost nominal): the Nursery field with the snail and flax back
const dusk2 = campaign.setLevelById('dusk-04');
assert.equal(dusk2.transitionText, 'Some health coverages are almost nominal.');
assert.deepEqual(dusk2.objectives, { any: 5, nursery: 1, lacewingCounterpart: 1 });
assert.equal(dusk2.durationSeconds, 95);
assert.equal(campaign.getNextLevel().id, 'dusk-05');

// Nursery in Dusk: 1 lacewing in A, 1 seed in B
const nurseryPockets = [
  { entities: [new Insect(0, 0, 'lacewing')], area: 4000, centroid: {x:0, y:0} },
  { entities: [{ type: 'seed', kind: 'dandelion_seed', x: 100, y: 100 }], area: 4000, centroid: {x:100, y:100} },
];
const nurseryEval = evaluateDrawing(nurseryPockets, 800);
assert.ok(nurseryEval.valid, 'Nursery with lacewing and 1 seed is valid');
const nurseryClock = new VisitClock(95);
campaign.processDrawing(nurseryEval, nurseryPockets, nurseryClock);
assert.equal(campaign.objectiveProgress.nursery.current, 1);
assert.equal(campaign.objectiveProgress.any.current, 1);

// Disqualification test: >1 seed disqualifies
const crowdedNursery = [
  { entities: [new Insect(0, 0, 'lacewing')], area: 4000, centroid: {x:0, y:0} },
  { entities: [{ type: 'seed', kind: 'dandelion_seed', x: 100, y: 100 }, { type: 'seed', kind: 'dandelion_seed', x: 110, y: 100 }], area: 4000, centroid: {x:105, y:100} },
];
const crowdedEval = evaluateDrawing(crowdedNursery, 800);
assert.equal(crowdedEval.valid, false);
assert.equal(crowdedEval.faultType, 'CROWDED_NURSERY');

// Lacewing Counterpart: 1 lacewing in A, 1 hoverfly in B
const cpPockets = [
  { entities: [new Insect(0, 0, 'lacewing')], area: 4000, centroid: {x:0, y:0} },
  { entities: [new Insect(100, 100, 'hoverfly')], area: 4000, centroid: {x:100, y:100} },
];
const cpEval = evaluateDrawing(cpPockets, 800);
assert.ok(cpEval.valid);
campaign.processDrawing(cpEval, cpPockets, nurseryClock);
assert.equal(campaign.objectiveProgress.lacewingCounterpart.current, 1);
assert.equal(campaign.objectiveProgress.any.current, 2);

// 3 more any combinations to complete Dusk 2
for (let i = 0; i < 3; i++) campaign.processDrawing(cpEval, cpPockets, nurseryClock);
assert.ok(campaign.isComplete(), 'Dusk 2 completed');

// Dusk 6 (Visit XVIII: What places absorb)
const dusk3 = campaign.setLevelById('dusk-06');
assert.equal(dusk3.transitionText, 'Some places absorb what developments expel.');
assert.deepEqual(dusk3.objectives, { any: 6, single: 3, figure8: 2 });
assert.equal(dusk3.durationSeconds, 100);
assert.equal(campaign.getNextLevel().id, 'midnight-01');

// Single loops (e.g. kindred pair)
const singlePairPocket = [{ entities: [new Insect(0, 0, 'brimstone'), new Insect(10, 0, 'brimstone')], area: 4000, centroid: {x:5, y:0} }];
const singlePairEval = evaluateDrawing(singlePairPocket, 600);
assert.ok(singlePairEval.valid);
const dusk3Clock = new VisitClock(100);
for (let i = 0; i < 3; i++) campaign.processDrawing(singlePairEval, singlePairPocket, dusk3Clock);
assert.equal(campaign.objectiveProgress.single.current, 3);
assert.equal(campaign.objectiveProgress.any.current, 3);

// Figure-eights (counterpart pair)
const f8Pockets = [
  { entities: [new Insect(0, 0, 'brimstone')], area: 4000, centroid: {x:0, y:0} },
  { entities: [new Insect(100, 100, 'hawkmoth')], area: 4000, centroid: {x:100, y:100} },
];
const f8Eval = evaluateDrawing(f8Pockets, 800);
assert.ok(f8Eval.valid);
for (let i = 0; i < 2; i++) campaign.processDrawing(f8Eval, f8Pockets, dusk3Clock);
assert.equal(campaign.objectiveProgress.figure8.current, 2);
assert.equal(campaign.objectiveProgress.any.current, 5);

// One more combination to reach any: 6
campaign.processDrawing(f8Eval, f8Pockets, dusk3Clock);
assert.equal(campaign.objectiveProgress.any.current, 6);
assert.ok(campaign.isComplete(), 'Dusk 3 completed');

const plan = JSON.parse(fs.readFileSync(new URL('../campaign-plan.json', import.meta.url)));
for (const level of CAMPAIGN_LEVELS.filter(l => l.hour === 'dusk')) {
  const source = plan.levels.find(l => l.id === level.id);
  for (const key of ['population', 'objectives', 'durationSeconds', 'motionScale', 'instruction', 'transitionText']) {
    assert.deepEqual(level[key], source[key], `${level.id}: plan and runtime ${key}`);
  }
}
console.log('PASS: Dusk rest/travel timing, safe bounds, resize, timestep stability, recipes, progression (VII->VIII->IX), and plan agreement.');
