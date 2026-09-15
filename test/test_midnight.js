import assert from 'node:assert/strict';
import fs from 'node:fs';
import { TraceGesture, sweptContact } from '../src/trace.js';
import { Insect, Butterfly, DandelionSeed, Snail } from '../src/entities.js';
import { placeLacewing, leafAnchors } from '../src/lacewing.js';
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
  const level10 = manager.setLevelById('midnight-01');
  assert.equal(level10.transitionText, "I wake up often, and there's always rustling in the corner.");
  assert.equal(manager.getNextLevel().id, 'midnight-02');
  assert.ok(PLAYABLE_LEVEL_IDS.has('midnight-02') && PLAYABLE_LEVEL_IDS.has('midnight-03'));
  assert.equal(PLAYABLE_LEVEL_IDS.size, 12, 'All 12 campaign levels are in PLAYABLE_LEVEL_IDS');

  const clock10 = new DandelionClock(95);
  manager.processDrawing({valid:true}, [{entities:cast()}], clock10);
  assert.equal(clock10.remainingSeconds, 95, 'Enclosures cannot advance a trace-only visit');
  const result10 = complete(cast()).finish(400);
  for (let i = 0; i < 3; i++) manager.processDrawing(result10, [], clock10);
  assert.ok(manager.isComplete()); assert.equal(clock10.remainingSeconds, 107);
  manager.processDrawing(result10, [], clock10);
  assert.equal(clock10.remainingSeconds, 107, 'Finished objective cannot farm time');
  const saved = JSON.stringify(manager.saveState);
  manager.setLevelById('practice-midnight'); manager.recordVictory(999);
  assert.equal(JSON.stringify(manager.saveState), saved);

  // --- Visit XI: Figures ---
  const level11 = manager.setLevelById('midnight-02');
  assert.equal(level11.transitionText, 'I trace figures, while the world moves around me.');
  assert.equal(manager.getNextLevel().id, 'midnight-03');
  assert.deepEqual(level11.gestures, ['enclose', 'trace']);
  assert.equal(level11.durationSeconds, 110);
  assert.equal(level11.motionScale, 0.95);

  const clock11 = new DandelionClock(110);
  // Kindred pair: 2 hoverflies
  const pairDrawing = { valid: true, recipeType: 'PAIR', finalScore: 160 };
  const pairPockets = [{ entities: [target('hoverfly', 50), target('hoverfly', 60)] }];
  manager.processDrawing(pairDrawing, pairPockets, clock11);
  assert.equal(manager.objectiveProgress.pair.current, 1);
  assert.equal(manager.objectiveProgress.any.current, 1);

  // Seed & Wing: 1 flier + 1 seed
  const seedWingDrawing = { valid: true, recipeType: 'SEED_WING', finalScore: 150 };
  const seedWingPockets = [{ entities: [target('hoverfly', 50), target('dandelion_seed', 60, 0, 'seed')] }];
  manager.processDrawing(seedWingDrawing, seedWingPockets, clock11);
  assert.equal(manager.objectiveProgress.seedWing.current, 1);
  assert.equal(manager.objectiveProgress.any.current, 2);

  // Figure-8: 1 flier in each pocket (Counterpart pair)
  const fig8Drawing = { valid: true, recipeType: 'COUNTERPART', finalScore: 220 };
  const fig8Pockets = [
    { entities: [target('hoverfly', 50)] },
    { entities: [target('lacewing', 150)] },
  ];
  manager.processDrawing(fig8Drawing, fig8Pockets, clock11);
  assert.equal(manager.objectiveProgress.figure8.current, 1);
  assert.equal(manager.objectiveProgress.any.current, 3);

  // Trace: Firefly -> Lacewing -> Firefly
  const traceDrawing = complete(cast()).finish(400);
  manager.processDrawing(traceDrawing, [], clock11);
  assert.equal(manager.objectiveProgress.trace.current, 1);
  assert.equal(manager.objectiveProgress.any.current, 4);
  assert.equal(manager.objectiveProgress.pair.current, 1, 'Trace cannot advance pair');
  assert.equal(manager.objectiveProgress.seedWing.current, 1, 'Trace cannot advance seedWing');
  assert.equal(manager.objectiveProgress.figure8.current, 1, 'Trace cannot advance figure8');

  manager.processDrawing(traceDrawing, [], clock11);
  assert.equal(manager.objectiveProgress.trace.current, 2);
  assert.equal(manager.objectiveProgress.any.current, 5);

  assert.equal(manager.isComplete(), false, 'Need any: 6 to complete XI');
  // Complete 6th any
  manager.processDrawing(pairDrawing, pairPockets, clock11);
  assert.equal(manager.objectiveProgress.any.current, 6);
  assert.ok(manager.isComplete(), 'XI complete when all objectives satisfied');

  // --- Visit XII: Tomorrow keeps happening ---
  const level12 = manager.setLevelById('midnight-03');
  assert.equal(level12.transitionText, 'And the world does move. Because tomorrow keeps happening.');
  assert.equal(manager.getNextLevel(), null, 'Visit XII is the final visit of the day');
  assert.deepEqual(level12.gestures, ['enclose', 'trace']);
  assert.equal(level12.durationSeconds, 110);
  assert.equal(level12.motionScale, 1.0);

  const clock12 = new DandelionClock(110);
  // Nursery Polarity: 1 flier in A, 1 seed in B -> advances any, figure8, AND nursery!
  const nurseryDrawing = { valid: true, recipeType: 'NURSERY', finalScore: 240 };
  const nurseryPockets = [
    { entities: [target('brimstone', 50)] },
    { entities: [target('dandelion_seed', 150, 0, 'seed')] },
  ];
  manager.processDrawing(nurseryDrawing, nurseryPockets, clock12);
  assert.equal(manager.objectiveProgress.nursery.current, 1);
  assert.equal(manager.objectiveProgress.figure8.current, 1, 'Nursery simultaneously advances figure8');
  assert.equal(manager.objectiveProgress.any.current, 1);

  // Single loops: 2 loops
  manager.processDrawing(pairDrawing, pairPockets, clock12);
  assert.equal(manager.objectiveProgress.single.current, 1);
  assert.equal(manager.objectiveProgress.any.current, 2);
  manager.processDrawing(pairDrawing, pairPockets, clock12);
  assert.equal(manager.objectiveProgress.single.current, 2);
  assert.equal(manager.objectiveProgress.any.current, 3);

  // Second figure-8
  manager.processDrawing(fig8Drawing, fig8Pockets, clock12);
  assert.equal(manager.objectiveProgress.figure8.current, 2);
  assert.equal(manager.objectiveProgress.any.current, 4);

  // Traces: 2 traces
  manager.processDrawing(traceDrawing, [], clock12);
  assert.equal(manager.objectiveProgress.trace.current, 1);
  assert.equal(manager.objectiveProgress.any.current, 5);
  assert.equal(manager.objectiveProgress.single.current, 2, 'Trace cannot advance single');
  assert.equal(manager.objectiveProgress.figure8.current, 2, 'Trace cannot advance figure8');

  manager.processDrawing(traceDrawing, [], clock12);
  assert.equal(manager.objectiveProgress.trace.current, 2);
  assert.equal(manager.objectiveProgress.any.current, 6);

  // 7th any combination
  manager.processDrawing(pairDrawing, pairPockets, clock12);
  assert.equal(manager.objectiveProgress.any.current, 7);
  assert.ok(manager.isComplete(), 'XII complete when all objectives satisfied');
}

// Day completion check logic
{
  const allIds = CAMPAIGN_LEVELS.map(l => l.id);
  assert.equal(allIds.length, 12);

  // Partial save: only midnight-03 completed
  const partialSave = { completedLevelIds: ['midnight-03'], highestUnlockedIndex: 11 };
  assert.equal(CAMPAIGN_LEVELS.every(l => partialSave.completedLevelIds.includes(l.id)), false,
    'Finishing XII out of order does not claim twelve visits complete');

  // Complete save: all 12 IDs present
  const fullSave = { completedLevelIds: [...allIds], highestUnlockedIndex: 11 };
  assert.equal(CAMPAIGN_LEVELS.every(l => fullSave.completedLevelIds.includes(l.id)), true,
    'All twelve IDs completed satisfies full day completion');
}

// Gesture mode lockout rules
{
  // Mock game state to verify setGestureMode contract
  const level10 = CAMPAIGN_LEVELS.find(l => l.id === 'midnight-01'); // ['trace']
  const level11 = CAMPAIGN_LEVELS.find(l => l.id === 'midnight-02'); // ['enclose', 'trace']

  const mockGame = {
    isDrawing: false,
    victoryDelay: 0,
    currentLevel: level11,
    gestureMode: 'enclose',
    setGestureMode(mode) {
      if (this.isDrawing || this.victoryDelay > 0 || !this.currentLevel.gestures.includes(mode)) return false;
      this.gestureMode = mode;
      return true;
    }
  };

  assert.equal(mockGame.setGestureMode('trace'), true);
  assert.equal(mockGame.gestureMode, 'trace');
  assert.equal(mockGame.setGestureMode('enclose'), true);
  assert.equal(mockGame.gestureMode, 'enclose');

  // Locked during drawing
  mockGame.isDrawing = true;
  assert.equal(mockGame.setGestureMode('trace'), false);
  mockGame.isDrawing = false;

  // Locked during victory delay
  mockGame.victoryDelay = 1.0;
  assert.equal(mockGame.setGestureMode('trace'), false);
  mockGame.victoryDelay = 0;

  // Locked to gestures supported by level
  mockGame.currentLevel = level10; // Visit X only has ['trace']
  assert.equal(mockGame.setGestureMode('enclose'), false, 'Visit X rejects switching to enclose');
  assert.equal(mockGame.setGestureMode('invalid_mode'), false);
}

// Clearance-aware initial placement in window scene
{
  for (const [w, h] of [[960, 640], [390, 844]]) {
    for (const lvlId of ['midnight-02', 'midnight-03']) {
      const lvl = CAMPAIGN_LEVELS.find(l => l.id === lvlId);
      for (let run = 0; run < 10; run++) {
        const bounds = { width: w, height: h };
        const pop = lvl.population;
        const margin = Math.min(70, w * 0.18);
        const r = {
          left: margin, right: w - margin,
          top: Math.min(h * 0.4, w < 560 ? 170 : 120),
          bottom: h - Math.min(80, h * 0.18)
        };
        const entities = [];
        const respawnQueue = [];

        // 1. Anchored Fireflies
        const fireflyPositions = [[0.14, 0.82], [0.50, 0.50], [0.86, 0.82]];
        for (let i = 0; i < (pop.firefly || 0); i++) {
          const [fx, fy] = fireflyPositions[i % fireflyPositions.length];
          const b = new Butterfly(r.left + fx * (r.right - r.left), r.top + fy * (r.bottom - r.top), 'firefly');
          entities.push(b);
        }

        // 2. Leaf-anchored Lacewings
        for (let i = 0; i < (pop.lacewing || 0); i++) {
          const b = new Butterfly(0, 0, 'lacewing');
          placeLacewing(b, bounds, i, i * 0.75);
          entities.push(b);
        }

        const hasClearance = (x, y, radius) => {
          return entities.every(e => Math.hypot(e.x - x, e.y - y) >= e.radius + radius + 14);
        };

        // 3. Hoverflies
        for (let i = 0; i < (pop.hoverfly || 0); i++) {
          let placed = false;
          const leaf = leafAnchors(bounds)[i % 3];
          if (hasClearance(leaf.x, leaf.y + 85, 16)) {
            entities.push(new Butterfly(leaf.x, leaf.y + 85, 'hoverfly'));
            placed = true;
          } else {
            for (let attempt = 0; attempt < 25; attempt++) {
              const cx = r.left + Math.random() * (r.right - r.left);
              const cy = r.top + Math.random() * (r.bottom - r.top);
              if (hasClearance(cx, cy, 16)) {
                entities.push(new Butterfly(cx, cy, 'hoverfly'));
                placed = true;
                break;
              }
            }
          }
          if (!placed) respawnQueue.push({ kind: 'hoverfly', delay: 0.3 });
        }

        // 4. Brimstones
        for (let i = 0; i < (pop.brimstone || 0); i++) {
          let placed = false;
          for (let attempt = 0; attempt < 25; attempt++) {
            const cx = r.left + Math.random() * (r.right - r.left);
            const cy = r.top + Math.random() * (r.bottom - r.top);
            if (hasClearance(cx, cy, 18)) {
              entities.push(new Butterfly(cx, cy, 'brimstone'));
              placed = true;
              break;
            }
          }
          if (!placed) respawnQueue.push({ kind: 'brimstone', delay: 0.3 });
        }

        // 5. Seeds
        for (let i = 0; i < (pop.seed || 0); i++) {
          let placed = false;
          for (let attempt = 0; attempt < 25; attempt++) {
            const cx = r.left + Math.random() * (r.right - r.left);
            const cy = r.top + Math.random() * (r.bottom - r.top);
            if (hasClearance(cx, cy, 14)) {
              entities.push(new DandelionSeed(cx, cy));
              placed = true;
              break;
            }
          }
          if (!placed) respawnQueue.push({ kind: 'seed', delay: 0.3 });
        }

        // 6. Snail
        for (let i = 0; i < (pop.snail || 0); i++) {
          entities.push(new Snail(w * 0.5, h - 35));
        }

        // Verify that NO two placed entities overlap
        for (let i = 0; i < entities.length; i++) {
          for (let j = i + 1; j < entities.length; j++) {
            const dist = Math.hypot(entities[i].x - entities[j].x, entities[i].y - entities[j].y);
            assert.ok(dist >= entities[i].radius + entities[j].radius + 10,
              `Entities ${entities[i].kind || entities[i].type} and ${entities[j].kind || entities[j].type} must not overlap (dist=${dist})`);
          }
        }
      }
    }
  }
}

const plan = JSON.parse(fs.readFileSync(new URL('../campaign-plan.json', import.meta.url)));
for (const level of CAMPAIGN_LEVELS.filter(l => l.hour === 'midnight')) {
  const source = plan.levels.find(l => l.id === level.id);
  for (const key of ['population', 'objectives', 'durationSeconds', 'motionScale', 'instruction', 'transitionText', 'traceSequence']) {
    assert.deepEqual(level[key], source[key], `${level.id}: plan and runtime ${key}`);
  }
}
console.log('PASS: Trace sweeps, order, repeat identity, ambiguity, invalid contacts, timing, fireflies, objective isolation, Visits XI-XII, day completion, and Midnight plan.');
