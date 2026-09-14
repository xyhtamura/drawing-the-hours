import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Insect } from '../src/entities.js';
import { leafAnchors, duskSafeArea, placeLacewing } from '../src/lacewing.js';
import { CampaignManager, CAMPAIGN_LEVELS, PLAYABLE_LEVEL_IDS } from '../src/campaign.js';
import { evaluateDrawing } from '../src/recipes.js';
import { DandelionClock } from '../src/clock.js';

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
campaign.setLevelById('noon-03');
assert.equal(campaign.getNextLevel().id, 'dusk-01');
const level = campaign.setLevelById('dusk-01');
assert.equal(level.transitionText, 'I always find myself walking home through here.');
assert.equal(campaign.getNextLevel(), null);
assert.ok(!PLAYABLE_LEVEL_IDS.has('dusk-02') && !PLAYABLE_LEVEL_IDS.has('dusk-03'));
const pockets = [new Insect(0, 0, 'lacewing'), new Insect(0, 0, 'hoverfly')]
  .map(entity => ({ entities: [entity], area: 4000, centroid: {x:0,y:0} }));
const result = evaluateDrawing(pockets, 600);
assert.ok(result.valid, 'Resting species participates in generic counterpart recipe');
const clock = new DandelionClock(100);
for (let i = 0; i < 5; i++) campaign.processDrawing(result, pockets, clock);
assert.equal(campaign.objectiveProgress.lacewingCounterpart.current, 2);
assert.ok(campaign.isComplete());
assert.equal(clock.remainingSeconds, 115, 'Progress bonus remains capped');
const plan = JSON.parse(fs.readFileSync(new URL('../campaign-plan.json', import.meta.url)));
for (const level of CAMPAIGN_LEVELS.filter(l => l.hour === 'dusk')) {
  const source = plan.levels.find(l => l.id === level.id);
  for (const key of ['population', 'objectives', 'durationSeconds', 'motionScale', 'instruction', 'transitionText']) {
    assert.deepEqual(level[key], source[key], `${level.id}: plan and runtime ${key}`);
  }
}
console.log('PASS: Dusk rest/travel timing, safe bounds, resize, timestep stability, recipes, progression, and plan agreement.');
