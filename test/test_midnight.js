import assert from 'node:assert/strict';
import fs from 'node:fs';
import { TraceGesture, sweptContact } from '../src/trace.js';
import { Insect } from '../src/entities.js';
import { evaluateDrawing } from '../src/recipes.js';
import { CampaignManager, CAMPAIGN_LEVELS, PLAYABLE_LEVEL_IDS, deriveObjectiveTags } from '../src/campaign.js';
import { DandelionClock } from '../src/clock.js';

const target = (kind, x, y = 0, type = 'butterfly') => ({kind, x, y, radius: 10, type, state: 'roaming'});
const cast = () => [target('firefly', 100), target('lacewing', 200), target('firefly', 300)];
const start = {x:0,y:0}, end = {x:400,y:0};
const complete = entities => {
  const trace = new TraceGesture(start, entities);
  trace.sample(end, entities);
  return trace;
};

assert.equal(sweptContact(start, {x:100,y:0}, {x:100,y:0}, start, 10), 0.45);
assert.equal(sweptContact(start, start, {x:50,y:0}, {x:-50,y:0}, 5), 0.45);
assert.equal(sweptContact(start, {x:100,y:0}, {x:50,y:10}, {x:50,y:10}, 10), 0.5, 'Tangency touches the ring');
assert.equal(sweptContact(start, {x:100,y:0}, {x:50,y:11}, {x:50,y:11}, 10), null);
assert.equal(sweptContact(start, start, {x:50,y:0}, {x:50,y:0}, 10), null);

{
  const entities = cast();
  const trace = complete(entities);
  assert.deepEqual(trace.contacts, entities, 'A single fast sample preserves contact order');
  assert.ok(trace.finish(400).valid);
  assert.ok(entities.every(e => e.state === 'roaming'), 'Collecting a trace must not mutate entities');
  assert.deepEqual(deriveObjectiveTags(trace.finish(400), []), ['any', 'trace']);
  for (const [length, expected] of [[400, 240], [450, 300], [1100, 360]]) {
    assert.equal(trace.finish(length).finalScore, expected, 'Trace uses existing length multiplier');
  }
  trace.sample(start, entities);
  assert.equal(trace.contacts.length, 3, 'Returning along the line ignores repeated identities');
  assert.ok(trace.finish(800).valid, 'Closing the line does not switch the gesture to enclosure');
}
{
  const entities = cast();
  const trace = new TraceGesture(start, entities);
  for (let x = 1; x <= 400; x++) trace.sample({x,y:0}, entities);
  assert.deepEqual(trace.contacts, complete(entities).contacts, 'Dense and sparse stationary-target samples agree');
}
{
  const entities = cast();
  const trace = new TraceGesture({x:100,y:0}, entities);
  assert.match(trace.fault, /Start in empty space/);
  trace.sample(end, entities);
  assert.equal(trace.finish(500).valid, false);
}
for (const bad of [
  [target('lacewing', 100), target('firefly', 200), target('firefly', 300)],
  [...cast(), target('firefly', 350)],
  [target('firefly', 100), target('snail', 150, 0, 'hazard'), target('lacewing', 200), target('firefly', 300)],
  [target('firefly', 100), target('dandelion_seed', 150, 0, 'seed'), target('lacewing', 200), target('firefly', 300)],
]) {
  const trace = complete(bad);
  assert.ok(trace.fault);
  assert.equal(trace.finish(400).valid, false);
  assert.deepEqual(deriveObjectiveTags(trace.finish(400), []), []);
  assert.ok(bad.every(e => e.state === 'roaming'));
}
{
  const entities = [target('firefly', 100), target('lacewing', 100), target('firefly', 300)];
  for (const input of [entities, [...entities].reverse()]) assert.match(complete(input).fault, /overlap/);
}
{
  const entities = cast().slice(0, 2);
  const trace = complete(entities);
  trace.sample(start, entities);
  assert.equal(trace.contacts.length, 2, 'The first firefly cannot supply the final one');
  assert.equal(trace.finish(800).valid, false);
}
{
  const entities = [target('firefly', 50)];
  const trace = new TraceGesture(start, entities);
  entities[0].x = -50;
  trace.sample(start, entities);
  assert.equal(trace.contacts.length, 1, 'Moving insect crossing a stationary pointer is detected');
}
{
  const entities = cast();
  const trace = new TraceGesture(start, entities);
  const entrant = target('lacewing', 50);
  trace.sample({x:80,y:0}, [...entities, entrant]);
  assert.equal(trace.contacts.length, 0, 'New entrants have no retroactive path');
  assert.equal(trace.fault, null);
}
{
  const entities = cast();
  const ignored = target('lacewing', 50); ignored.state = 'harmonizing';
  assert.ok(complete([ignored, ...entities]).finish(400).valid, 'Already accepted insects cannot be captured again');
  ignored.state = 'departing';
  assert.ok(complete([ignored, ...entities]).finish(400).valid);
}
{
  const fly = new Insect(300, 300, 'firefly');
  fly.heading = fly.targetHeading = 0; fly.glowOffset = 0; fly.motionScale = 1;
  const radius = fly.radius;
  fly.update(1 / 60, {width:960,height:640});
  assert.ok(Math.abs(Math.hypot(fly.x - 300, fly.y - 300) - 1.1 * 0.65) < 1e-9);
  for (let i = 0; i < 360; i++) fly.update(1 / 60, {width:960,height:640});
  assert.equal(fly.radius, radius); assert.equal(fly.alpha, 1, 'Glow never hides the insect');
  const pair = [{entities:[fly, new Insect(0,0,'firefly')], area:4000, centroid:{x:0,y:0}}];
  assert.ok(evaluateDrawing(pair, 400).valid, 'Fireflies use existing enclosure rules in future mixed visits');
}
{
  const manager = new CampaignManager();
  manager.setLevelById('dusk-03'); assert.equal(manager.getNextLevel().id, 'midnight-01');
  const level = manager.setLevelById('midnight-01');
  assert.equal(level.transitionText, "I wake up often, and there's always rustling in the corner.");
  assert.equal(manager.getNextLevel(), null);
  assert.ok(!PLAYABLE_LEVEL_IDS.has('midnight-02') && !PLAYABLE_LEVEL_IDS.has('midnight-03'));
  const clock = new DandelionClock(95);
  manager.processDrawing({valid:true}, [{entities:cast()}], clock);
  assert.equal(clock.remainingSeconds, 95, 'Enclosures cannot advance a trace-only visit');
  const result = complete(cast()).finish(400);
  for (let i = 0; i < 3; i++) manager.processDrawing(result, [], clock);
  assert.ok(manager.isComplete()); assert.equal(clock.remainingSeconds, 107);
  manager.processDrawing(result, [], clock);
  assert.equal(clock.remainingSeconds, 107, 'Finished objective cannot farm time');
  const saved = JSON.stringify(manager.saveState);
  manager.setLevelById('practice-midnight'); manager.recordVictory(999);
  assert.equal(JSON.stringify(manager.saveState), saved);
}
const plan = JSON.parse(fs.readFileSync(new URL('../campaign-plan.json', import.meta.url)));
for (const level of CAMPAIGN_LEVELS.filter(l => l.hour === 'midnight')) {
  const source = plan.levels.find(l => l.id === level.id);
  for (const key of ['population', 'objectives', 'durationSeconds', 'motionScale', 'instruction', 'transitionText', 'traceSequence']) {
    assert.deepEqual(level[key], source[key], `${level.id}: plan and runtime ${key}`);
  }
}
console.log('PASS: Trace sweeps, order, repeat identity, ambiguity, invalid contacts, timing, fireflies, objective isolation, and Midnight plan.');
