/**
 * Automated Verification for Drawing the Hours
 * Tests polyline metrics, loop and figure-eight extraction, and recipe validation.
 */

import assert from 'node:assert';
import {
  distance,
  polylineLength,
  getLengthBand,
  extractPockets,
  pointInPolygon,
  segmentIntersection,
  polygonArea,
} from '../src/geometry.js';
import { evaluateDrawing, RECIPE_TYPES } from '../src/recipes.js';
import {
  deriveObjectiveTags,
  CampaignManager,
  CAMPAIGN_LEVELS,
  PRACTICE_LEVELS,
} from '../src/campaign.js';
import { DandelionClock } from '../src/clock.js';

console.log('--- Running Drawing the Hours Test Suite ---');

// 1. Distance and Length
{
  const p1 = { x: 0, y: 0 };
  const p2 = { x: 300, y: 400 };
  assert.strictEqual(distance(p1, p2), 500);

  const polyline = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ];
  assert.strictEqual(polylineLength(polyline), 300);

  assert.strictEqual(getLengthBand(350).name, 'Petite');
  assert.strictEqual(getLengthBand(750).name, 'Balanced');
  assert.strictEqual(getLengthBand(1300).name, 'Extended');
  console.log('✔ Distance, polyline length, and length bands verified.');
}

// 2. Segment Intersection
{
  const s1a = { x: 0, y: 50 }, s1b = { x: 100, y: 50 };
  const s2a = { x: 50, y: 0 }, s2b = { x: 50, y: 100 };
  const hit = segmentIntersection(s1a, s1b, s2a, s2b);
  assert.ok(hit !== null);
  assert.strictEqual(Math.round(hit.x), 50);
  assert.strictEqual(Math.round(hit.y), 50);

  // Parallel segments
  const hitParallel = segmentIntersection({ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 0, y: 10 }, { x: 100, y: 10 });
  assert.strictEqual(hitParallel, null);
  console.log('✔ Segment intersection calculation verified.');
}

// 3. Polygon Area & Point in Polygon
{
  const box = [
    { x: 100, y: 100 },
    { x: 200, y: 100 },
    { x: 200, y: 200 },
    { x: 100, y: 200 },
  ];
  assert.strictEqual(polygonArea(box), 10000);

  assert.strictEqual(pointInPolygon({ x: 150, y: 150 }, box), true);
  assert.strictEqual(pointInPolygon({ x: 50, y: 50 }, box), false);
  assert.strictEqual(pointInPolygon({ x: 250, y: 150 }, box), false);
  console.log('✔ Polygon area & point-in-polygon containment verified.');
}

// 4. Single Loop Pocket Extraction (ends close to start)
{
  const circlePoints = [];
  const cx = 300, cy = 300, r = 100;
  for (let a = 0; a <= Math.PI * 2; a += 0.2) {
    circlePoints.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  const pockets = extractPockets(circlePoints, { closeDist: 40, minArea: 1000 });
  assert.strictEqual(pockets.length, 1);
  assert.ok(pockets[0].area > 25000);
  console.log('✔ Single loop pocket extraction verified.');
}

// 5. Figure-Eight Pocket Extraction (Two Lobes)
{
  const f8Points = [];
  const cx = 300, cy = 300, rx = 140, ry = 90;
  for (let t = 0; t <= Math.PI * 2; t += 0.08) {
    f8Points.push({
      x: cx + rx * Math.sin(t),
      y: cy + ry * Math.sin(2 * t),
    });
  }

  const pockets = extractPockets(f8Points, { closeDist: 50, minArea: 800 });
  assert.strictEqual(pockets.length, 2, `Expected 2 pockets for figure-eight, got ${pockets.length}`);
  assert.ok(pockets[0].area > 5000);
  assert.ok(pockets[1].area > 5000);
  console.log('✔ Two-pocket figure-eight extraction verified.');
}

// 6. Recipe Validation Tests
{
  // Kindred Pair: 2 brimstones
  const pairA = [
    { type: 'butterfly', kind: 'brimstone', x: 100, y: 100 },
    { type: 'butterfly', kind: 'brimstone', x: 120, y: 110 },
  ];
  const pocket1 = [{ id: 1, polygon: [], area: 4000, centroid: { x: 110, y: 105 }, entities: pairA }];
  const evalPair = evaluateDrawing(pocket1, 600);
  assert.strictEqual(evalPair.valid, true);
  assert.strictEqual(evalPair.recipeType, RECIPE_TYPES.KINDRED_PAIR);
  assert.strictEqual(evalPair.finalScore, Math.round(120 * 1.25)); // Balanced band multiplier

  // Mismatched pair: 1 brimstone + 1 azure
  const mismatched = [
    { type: 'butterfly', kind: 'brimstone', x: 100, y: 100 },
    { type: 'butterfly', kind: 'azure', x: 120, y: 110 },
  ];
  const pocketMismatch = [{ id: 1, polygon: [], area: 4000, centroid: { x: 110, y: 105 }, entities: mismatched }];
  const evalMismatch = evaluateDrawing(pocketMismatch, 600);
  assert.strictEqual(evalMismatch.valid, false);

  // Trio of Flight: 1 brimstone, 1 azure, 1 roseate
  const trio = [
    { type: 'butterfly', kind: 'brimstone', x: 100, y: 100 },
    { type: 'butterfly', kind: 'azure', x: 120, y: 110 },
    { type: 'butterfly', kind: 'roseate', x: 140, y: 110 },
  ];
  const pocketTrio = [{ id: 1, polygon: [], area: 6000, centroid: { x: 120, y: 105 }, entities: trio }];
  const evalTrio = evaluateDrawing(pocketTrio, 800);
  assert.strictEqual(evalTrio.valid, true);
  assert.strictEqual(evalTrio.recipeType, RECIPE_TYPES.TRIO_OF_FLIGHT);

  // Seed & Wing: 1 azure + 1 seed
  const seedWing = [
    { type: 'butterfly', kind: 'azure', x: 100, y: 100 },
    { type: 'seed', kind: 'dandelion_seed', x: 110, y: 120 },
  ];
  const pocketSeedWing = [{ id: 1, polygon: [], area: 4000, centroid: { x: 105, y: 110 }, entities: seedWing }];
  const evalSeedWing = evaluateDrawing(pocketSeedWing, 400);
  assert.strictEqual(evalSeedWing.valid, true);
  assert.strictEqual(evalSeedWing.recipeType, RECIPE_TYPES.SEED_AND_WING);

  // Seed & Trio: 3 distinct fliers + 1 seed
  const seedTrio = [
    { type: 'butterfly', kind: 'brimstone', x: 100, y: 100 },
    { type: 'butterfly', kind: 'azure', x: 120, y: 110 },
    { type: 'butterfly', kind: 'roseate', x: 140, y: 110 },
    { type: 'seed', kind: 'dandelion_seed', x: 120, y: 130 },
  ];
  const pocketSeedTrio = [{ id: 1, polygon: [], area: 6000, centroid: { x: 120, y: 115 }, entities: seedTrio }];
  const evalSeedTrio = evaluateDrawing(pocketSeedTrio, 800);
  assert.strictEqual(evalSeedTrio.valid, true);
  assert.strictEqual(evalSeedTrio.recipeType, RECIPE_TYPES.SEED_AND_TRIO);
  assert.strictEqual(evalSeedTrio.finalScore, Math.round(360 * 1.25));

  // Seed & Trio mismatch: duplicate flier species with seed
  const seedTrioMismatch = [
    { type: 'butterfly', kind: 'brimstone', x: 100, y: 100 },
    { type: 'butterfly', kind: 'brimstone', x: 120, y: 110 },
    { type: 'butterfly', kind: 'roseate', x: 140, y: 110 },
    { type: 'seed', kind: 'dandelion_seed', x: 120, y: 130 },
  ];
  const pocketSeedTrioMismatch = [{ id: 1, polygon: [], area: 6000, centroid: { x: 120, y: 115 }, entities: seedTrioMismatch }];
  const evalSeedTrioMismatch = evaluateDrawing(pocketSeedTrioMismatch, 800);
  assert.strictEqual(evalSeedTrioMismatch.valid, false);
  assert.strictEqual(evalSeedTrioMismatch.faultType, 'MISMATCH');

  // Hazard Fault: Snail enclosed with butterfly
  const hazardGroup = [
    { type: 'butterfly', kind: 'brimstone', x: 100, y: 100 },
    { type: 'hazard', kind: 'snail', x: 110, y: 120 },
  ];
  const pocketHazard = [{ id: 1, polygon: [], area: 4000, centroid: { x: 105, y: 110 }, entities: hazardGroup }];
  const evalHazard = evaluateDrawing(pocketHazard, 400);
  assert.strictEqual(evalHazard.valid, false);
  assert.strictEqual(evalHazard.faultType, 'HAZARD');

  // Two-Pocket: Cross-Meadow Correspondence
  const lobeA = [
    { type: 'butterfly', kind: 'brimstone', x: 100, y: 100 },
    { type: 'butterfly', kind: 'brimstone', x: 110, y: 100 },
  ];
  const lobeB = [
    { type: 'butterfly', kind: 'azure', x: 300, y: 100 },
    { type: 'butterfly', kind: 'azure', x: 310, y: 100 },
  ];
  const twoPockets = [
    { id: 1, polygon: [], area: 4000, centroid: { x: 105, y: 100 }, entities: lobeA },
    { id: 2, polygon: [], area: 4000, centroid: { x: 305, y: 100 }, entities: lobeB },
  ];
  const evalTwoPockets = evaluateDrawing(twoPockets, 1200); // Extended band
  assert.strictEqual(evalTwoPockets.valid, true);
  assert.strictEqual(evalTwoPockets.recipeType, RECIPE_TYPES.CROSS_MEADOW_CORRESPONDENCE);
  assert.strictEqual(evalTwoPockets.finalScore, Math.round(550 * 1.5));

  // Two-Pocket: Nursery Polarity
  const nurseryLobeA = [
    { type: 'butterfly', kind: 'roseate', x: 100, y: 100 },
    { type: 'butterfly', kind: 'azure', x: 110, y: 100 },
  ];
  const nurseryLobeB = [
    { type: 'seed', kind: 'dandelion_seed', x: 300, y: 100 },
    { type: 'seed', kind: 'dandelion_seed', x: 310, y: 100 },
  ];
  const nurseryPockets = [
    { id: 1, polygon: [], area: 4000, centroid: { x: 105, y: 100 }, entities: nurseryLobeA },
    { id: 2, polygon: [], area: 4000, centroid: { x: 305, y: 100 }, entities: nurseryLobeB },
  ];
  const evalNursery = evaluateDrawing(nurseryPockets, 800);
  assert.strictEqual(evalNursery.valid, true);
  assert.strictEqual(evalNursery.recipeType, RECIPE_TYPES.NURSERY_POLARITY);

  // Two-Pocket: Symmetric Correspondence (Twin Echoes Experiment)
  // Pocket A: 1 Damselfly + 1 Hawkmoth (would fail alone)
  // Pocket B: 1 Damselfly + 1 Hawkmoth (matches A exactly!)
  const echoLobeA = [
    { type: 'butterfly', kind: 'damselfly', x: 100, y: 100 },
    { type: 'butterfly', kind: 'hawkmoth', x: 110, y: 100 },
  ];
  const echoLobeB = [
    { type: 'butterfly', kind: 'damselfly', x: 300, y: 100 },
    { type: 'butterfly', kind: 'hawkmoth', x: 310, y: 100 },
  ];
  const echoPockets = [
    { id: 1, polygon: [], area: 4000, centroid: { x: 105, y: 100 }, entities: echoLobeA },
    { id: 2, polygon: [], area: 4000, centroid: { x: 305, y: 100 }, entities: echoLobeB },
  ];
  const evalEcho = evaluateDrawing(echoPockets, 800);
  assert.strictEqual(evalEcho.valid, true);
  assert.strictEqual(evalEcho.recipeType, RECIPE_TYPES.SYMMETRIC_CORRESPONDENCE);
  // Two-Pocket: Counterpart Pair (Two dissimilar species across figure-eight)
  // Pocket A: 1 Damselfly (fails alone as underfull)
  // Pocket B: 1 Hawkmoth (fails alone as underfull; fails together in single loop as mismatch)
  const counterpartLobeA = [
    { type: 'butterfly', kind: 'damselfly', x: 100, y: 100 },
  ];
  const counterpartLobeB = [
    { type: 'butterfly', kind: 'hawkmoth', x: 300, y: 100 },
  ];
  const counterpartPockets = [
    { id: 1, polygon: [], area: 4000, centroid: { x: 100, y: 100 }, entities: counterpartLobeA },
    { id: 2, polygon: [], area: 4000, centroid: { x: 300, y: 100 }, entities: counterpartLobeB },
  ];
  const evalCounterpart = evaluateDrawing(counterpartPockets, 800);
  assert.strictEqual(evalCounterpart.valid, true);
  assert.strictEqual(evalCounterpart.recipeType, RECIPE_TYPES.COUNTERPART_PAIR);
  assert.strictEqual(evalCounterpart.title, 'Counterpart Pair');
  assert.strictEqual(evalCounterpart.finalScore, Math.round(320 * 1.25));

  // Two-Pocket: Counterpart Dialogue (1 of kind X in A, 2 of kind Y in B)
  const dialogueLobeA = [
    { type: 'butterfly', kind: 'brimstone', x: 100, y: 100 },
  ];
  const dialogueLobeB = [
    { type: 'butterfly', kind: 'damselfly', x: 300, y: 100 },
    { type: 'butterfly', kind: 'damselfly', x: 310, y: 100 },
  ];
  const dialoguePockets = [
    { id: 1, polygon: [], area: 4000, centroid: { x: 100, y: 100 }, entities: dialogueLobeA },
    { id: 2, polygon: [], area: 4000, centroid: { x: 305, y: 100 }, entities: dialogueLobeB },
  ];
  const evalDialogue = evaluateDrawing(dialoguePockets, 800);
  assert.strictEqual(evalDialogue.valid, true);
  assert.strictEqual(evalDialogue.recipeType, RECIPE_TYPES.COUNTERPART_PAIR);
  assert.strictEqual(evalDialogue.title, 'Counterpart Dialogue');
  assert.strictEqual(evalDialogue.finalScore, Math.round((300 + 3 * 40) * 1.25));

  // Two-Pocket: Reject Similar Fliers divided across figure-eight (Divided Kindred)
  // Pocket A: 1 Brimstone; Pocket B: 1 Brimstone (must fail — belong in single loop)
  const dividedPairA = [{ type: 'butterfly', kind: 'brimstone', x: 100, y: 100 }];
  const dividedPairB = [{ type: 'butterfly', kind: 'brimstone', x: 300, y: 100 }];
  const dividedPairPockets = [
    { id: 1, polygon: [], area: 4000, centroid: { x: 100, y: 100 }, entities: dividedPairA },
    { id: 2, polygon: [], area: 4000, centroid: { x: 300, y: 100 }, entities: dividedPairB },
  ];
  const evalDividedPair = evaluateDrawing(dividedPairPockets, 800);
  assert.strictEqual(evalDividedPair.valid, false);
  assert.strictEqual(evalDividedPair.faultType, 'DIVIDED_KINDRED');

  // Pocket A: 2 Brimstones; Pocket B: 2 Brimstones (must fail as kindred fliers)
  const dividedQuadA = [
    { type: 'butterfly', kind: 'brimstone', x: 100, y: 100 },
    { type: 'butterfly', kind: 'brimstone', x: 110, y: 100 },
  ];
  const dividedQuadB = [
    { type: 'butterfly', kind: 'brimstone', x: 300, y: 100 },
    { type: 'butterfly', kind: 'brimstone', x: 310, y: 100 },
  ];
  const dividedQuadPockets = [
    { id: 1, polygon: [], area: 4000, centroid: { x: 105, y: 100 }, entities: dividedQuadA },
    { id: 2, polygon: [], area: 4000, centroid: { x: 305, y: 100 }, entities: dividedQuadB },
  ];
  const evalDividedQuad = evaluateDrawing(dividedQuadPockets, 800);
  assert.strictEqual(evalDividedQuad.valid, false);
  assert.strictEqual(evalDividedQuad.faultType, 'DIVIDED_KINDRED');

  console.log('✔ All recipe evaluation scenarios passed successfully.');
}

// 7. Objective Tag Derivation Tests (CAMPAIGN.md §5)
{
  // 7a. Single Loop - Kindred Pair
  const pairA = [
    { type: 'butterfly', kind: 'brimstone', x: 100, y: 100 },
    { type: 'butterfly', kind: 'brimstone', x: 120, y: 110 },
  ];
  const pocketPair = [{ id: 1, polygon: [], area: 4000, centroid: { x: 110, y: 105 }, entities: pairA }];
  const evalPair = evaluateDrawing(pocketPair, 600);
  const tagsPair = deriveObjectiveTags(evalPair, pocketPair);
  assert.ok(tagsPair.includes('any'));
  assert.ok(tagsPair.includes('single'));
  assert.ok(tagsPair.includes('pair'));
  assert.ok(!tagsPair.includes('figure8'));

  // 7b. Single Loop - Trio of Flight
  const trio = [
    { type: 'butterfly', kind: 'brimstone', x: 100, y: 100 },
    { type: 'butterfly', kind: 'azure', x: 120, y: 110 },
    { type: 'butterfly', kind: 'roseate', x: 140, y: 110 },
  ];
  const pocketTrio = [{ id: 1, polygon: [], area: 6000, centroid: { x: 120, y: 105 }, entities: trio }];
  const evalTrio = evaluateDrawing(pocketTrio, 800);
  const tagsTrio = deriveObjectiveTags(evalTrio, pocketTrio);
  assert.ok(tagsTrio.includes('any'));
  assert.ok(tagsTrio.includes('single'));
  assert.ok(tagsTrio.includes('trio'));
  assert.ok(!tagsTrio.includes('pair'));

  // 7c. Single Loop - Seed & Wing
  const seedWing = [
    { type: 'butterfly', kind: 'azure', x: 100, y: 100 },
    { type: 'seed', kind: 'dandelion_seed', x: 110, y: 120 },
  ];
  const pocketSeedWing = [{ id: 1, polygon: [], area: 4000, centroid: { x: 105, y: 110 }, entities: seedWing }];
  const evalSeedWing = evaluateDrawing(pocketSeedWing, 400);
  const tagsSeedWing = deriveObjectiveTags(evalSeedWing, pocketSeedWing);
  assert.ok(tagsSeedWing.includes('any'));
  assert.ok(tagsSeedWing.includes('single'));
  assert.ok(tagsSeedWing.includes('seedWing'));

  // 7c-2. Single Loop - Seed & Trio
  const stEntities = [
    { type: 'butterfly', kind: 'brimstone', x: 100, y: 100 },
    { type: 'butterfly', kind: 'azure', x: 120, y: 110 },
    { type: 'butterfly', kind: 'roseate', x: 140, y: 110 },
    { type: 'seed', kind: 'dandelion_seed', x: 120, y: 130 },
  ];
  const pocketST = [{ id: 1, polygon: [], area: 6000, centroid: { x: 120, y: 115 }, entities: stEntities }];
  const evalST = evaluateDrawing(pocketST, 800);
  const tagsST = deriveObjectiveTags(evalST, pocketST);
  assert.ok(tagsST.includes('any'));
  assert.ok(tagsST.includes('single'));
  assert.ok(tagsST.includes('seedTrio'));
  assert.ok(!tagsST.includes('trio'));
  assert.ok(!tagsST.includes('seedWing'));

  // 7d. Figure-Eight - Counterpart Pair
  const cpLobeA = [{ type: 'butterfly', kind: 'damselfly', x: 100, y: 100 }];
  const cpLobeB = [{ type: 'butterfly', kind: 'hawkmoth', x: 300, y: 100 }];
  const cpPockets = [
    { id: 1, polygon: [], area: 4000, centroid: { x: 100, y: 100 }, entities: cpLobeA },
    { id: 2, polygon: [], area: 4000, centroid: { x: 300, y: 100 }, entities: cpLobeB },
  ];
  const evalCp = evaluateDrawing(cpPockets, 800);
  const tagsCp = deriveObjectiveTags(evalCp, cpPockets);
  assert.ok(tagsCp.includes('any'));
  assert.ok(tagsCp.includes('figure8'));
  assert.ok(tagsCp.includes('counterpartPair'));

  // 7e. Figure-Eight - Nursery Polarity
  const nLobeA = [{ type: 'butterfly', kind: 'brimstone', x: 100, y: 100 }];
  const nLobeB = [{ type: 'seed', kind: 'dandelion_seed', x: 300, y: 100 }];
  const nPockets = [
    { id: 1, polygon: [], area: 4000, centroid: { x: 100, y: 100 }, entities: nLobeA },
    { id: 2, polygon: [], area: 4000, centroid: { x: 300, y: 100 }, entities: nLobeB },
  ];
  const evalNursery = evaluateDrawing(nPockets, 800);
  const tagsNursery = deriveObjectiveTags(evalNursery, nPockets);
  assert.ok(tagsNursery.includes('any'));
  assert.ok(tagsNursery.includes('figure8'));
  assert.ok(tagsNursery.includes('nursery'));

  // 7f. Figure-Eight - Mixed Echo (Symmetric Correspondence)
  const echoLobeA = [
    { type: 'butterfly', kind: 'damselfly', x: 100, y: 100 },
    { type: 'butterfly', kind: 'hawkmoth', x: 110, y: 100 },
  ];
  const echoLobeB = [
    { type: 'butterfly', kind: 'damselfly', x: 300, y: 100 },
    { type: 'butterfly', kind: 'hawkmoth', x: 310, y: 100 },
  ];
  const echoPockets = [
    { id: 1, polygon: [], area: 4000, centroid: { x: 105, y: 100 }, entities: echoLobeA },
    { id: 2, polygon: [], area: 4000, centroid: { x: 305, y: 100 }, entities: echoLobeB },
  ];
  const evalEcho = evaluateDrawing(echoPockets, 800);
  const tagsEcho = deriveObjectiveTags(evalEcho, echoPockets);
  assert.ok(tagsEcho.includes('any'));
  assert.ok(tagsEcho.includes('figure8'));
  assert.ok(tagsEcho.includes('mixedEcho'));

  // 7g. Invalid evaluation returns empty tags
  const tagsInvalid = deriveObjectiveTags({ valid: false }, pocketPair);
  assert.deepStrictEqual(tagsInvalid, []);

  console.log('✔ Objective tag derivation verified for all primary gesture archetypes.');
}

// 8. Campaign Progression, Completion & Time Bonus Logic
{
  const campaign = new CampaignManager();
  // Level 1: Dawn 1 (requires 4 single loops)
  const lvl1 = campaign.setLevelById('dawn-01');
  assert.strictEqual(lvl1.id, 'dawn-01');
  assert.strictEqual(lvl1.durationSeconds, 75);

  const clock = new DandelionClock(lvl1.durationSeconds, 12);
  const initialTime = clock.remainingSeconds;

  // Mock drawing result
  const mockSinglePair = {
    valid: true,
    recipeType: RECIPE_TYPES.KINDRED_PAIR,
    pockets: [{ id: 1, polygon: [], area: 4000, centroid: { x: 100, y: 100 }, entities: [
      { type: 'butterfly', kind: 'brimstone', x: 100, y: 100 },
      { type: 'butterfly', kind: 'brimstone', x: 120, y: 100 },
    ]}],
  };

  // 1st single loop
  const res1 = campaign.processDrawing(mockSinglePair, mockSinglePair.pockets, clock);
  assert.strictEqual(res1.advancedObjective, true);
  assert.strictEqual(res1.allComplete, false);
  assert.strictEqual(campaign.objectiveProgress.single.current, 1);
  assert.strictEqual(clock.remainingSeconds, Math.min(initialTime + 4, lvl1.durationSeconds + 15));

  // 2nd single loop
  const res2 = campaign.processDrawing(mockSinglePair, mockSinglePair.pockets, clock);
  assert.strictEqual(res2.advancedObjective, true);
  assert.strictEqual(campaign.objectiveProgress.single.current, 2);

  // 3rd single loop
  const res3 = campaign.processDrawing(mockSinglePair, mockSinglePair.pockets, clock);
  assert.strictEqual(res3.advancedObjective, true);
  assert.strictEqual(campaign.objectiveProgress.single.current, 3);

  // 4th single loop completes the level!
  const res4 = campaign.processDrawing(mockSinglePair, mockSinglePair.pockets, clock);
  assert.strictEqual(res4.advancedObjective, true);
  assert.strictEqual(res4.allComplete, true);
  assert.strictEqual(campaign.objectiveProgress.single.current, 4);

  // 5th drawing after level completion: should NOT advance
  const res5 = campaign.processDrawing(mockSinglePair, mockSinglePair.pockets, clock);
  assert.strictEqual(res5.advancedObjective, false);

  // Record victory and check unlock of Level 2
  campaign.recordVictory(250);
  assert.ok(campaign.saveState.completedLevelIds.includes('dawn-01'));
  assert.ok(campaign.saveState.highestUnlockedIndex >= 1);
  assert.strictEqual(campaign.saveState.bestScores['dawn-01'], 250);

  const nextLvl = campaign.getNextLevel();
  assert.strictEqual(nextLvl.id, 'dawn-02');

  console.log('✔ Campaign progression, victory latching, and bonus restriction verified.');
}

// 9. Campaign Registry and Hour I Verbatim Text Integrity
{
  assert.strictEqual(CAMPAIGN_LEVELS.length, 12, '12 campaign levels authored');
  assert.strictEqual(PRACTICE_LEVELS.length, 3, 'Dawn practice plus Noon preview');

  // Verify Dawn levels verbatim transition texts per first12levels.md
  const dawn1 = CAMPAIGN_LEVELS[0];
  const dawn2 = CAMPAIGN_LEVELS[1];
  const dawn3 = CAMPAIGN_LEVELS[2];

  assert.strictEqual(dawn1.transitionText, 'Another morning of standing, waiting for the bus.');
  assert.strictEqual(dawn2.transitionText, 'I like to watch the insects here, in this patch by the curbside.');
  assert.strictEqual(dawn3.transitionText, 'Maybe I have an overactive imagination.');

  // Verify non-empty populations and positive durations for all 12 levels
  for (const lvl of CAMPAIGN_LEVELS) {
    assert.ok(lvl.id && lvl.title && lvl.hour && lvl.scene, `Level ${lvl.id} has all required fields`);
    assert.ok(lvl.durationSeconds >= 60, `Level ${lvl.id} has adequate duration`);
    assert.ok(Object.keys(lvl.objectives).length > 0, `Level ${lvl.id} has objectives`);
    assert.ok(lvl.population, `Level ${lvl.id} has population`);
  }

  console.log('✔ Campaign registry and Hour I verbatim texts verified.');
}

console.log('--- All tests passed! ---');

// Noon complete chapter progression, objectives, and practice isolation.
{
  const campaign = new CampaignManager();
  campaign.setLevelById('dawn-03');
  assert.strictEqual(campaign.getNextLevel().id, 'noon-01');

  // Noon 1 (Visit IV)
  const noon1 = campaign.setLevelById('noon-01');
  assert.strictEqual(noon1.transitionText, 'Today, for lunch, I bought myself a sandwich.');
  assert.deepStrictEqual(noon1.objectives, { any: 4, counterpartPair: 3 });
  assert.strictEqual(campaign.getNextLevel().id, 'noon-02');

  // Noon 2 (Visit V)
  const noon2 = campaign.setLevelById('noon-02');
  assert.strictEqual(noon2.transitionText, "I don't know how much longer my job will exist.");
  assert.deepStrictEqual(noon2.objectives, { figure8: 4, nursery: 2 });
  assert.strictEqual(noon2.durationSeconds, 110);
  assert.strictEqual(noon2.wind.periodSeconds, 12);
  assert.strictEqual(noon2.wind.warningSeconds, 2);
  assert.strictEqual(noon2.wind.gustSeconds, 2);
  assert.strictEqual(noon2.wind.seedSpeedPlayWidthsPerSecond, 0.08);
  assert.strictEqual(campaign.getNextLevel().id, 'noon-03');

  // Noon 3 (Visit VI)
  const noon3 = campaign.setLevelById('noon-03');
  assert.strictEqual(noon3.transitionText, 'This atrium makes me feel calmer.');
  assert.deepStrictEqual(noon3.objectives, { any: 4, seedTrio: 2 });
  assert.strictEqual(noon3.durationSeconds, 100);
  assert.strictEqual(noon3.wind.periodSeconds, 12);
  assert.strictEqual(campaign.getNextLevel(), null, 'Dusk remains locked pending next chapter');

  // Practice isolation
  const before = JSON.stringify(campaign.saveState);
  campaign.setLevelById('practice-noon');
  campaign.recordVictory(500);
  assert.strictEqual(JSON.stringify(campaign.saveState), before);
  assert.strictEqual(campaign.getNextLevel(), null);
  console.log('✔ Complete Noon chapter progression, verbatim texts, and practice isolation verified.');
}

// Atrium wind mechanics and seed acceleration
{
  const { DandelionSeed, Insect } = await import('../src/entities.js');
  const bounds = { width: 1000, height: 600 };
  const seed = new DandelionSeed(200, 300);
  seed.vx = 0.5; // default vx * 60 = 30 px/s

  // Calm condition: windVx = 0
  const xBefore = seed.x;
  seed.update(1.0, bounds, 0);
  const calmDist = seed.x - xBefore;
  assert.ok(Math.abs(calmDist - 30) < 0.001, `Expected ~30px drift, got ${calmDist}`);

  // Gust condition: windVx = 0.08 * 1000 = 80 px/s
  const gustVx = 0.08 * bounds.width;
  const xBeforeGust = seed.x;
  seed.update(1.0, bounds, gustVx);
  const gustDist = seed.x - xBeforeGust;
  assert.ok(Math.abs(gustDist - 110) < 0.001, `Expected ~110px displacement during gust, got ${gustDist}`);

  // Flier unaffected by wind
  const fly = new Insect(200, 200, 'hoverfly');
  fly.hoverRemaining = 5.0; // in hold phase
  fly.update(1.0, bounds, gustVx);
  assert.deepStrictEqual([fly.x, fly.y], [200, 200], 'Insects must not be affected by wind force');

  console.log('✔ Atrium wind acceleration on seeds and flier immunity verified.');
}

// Nursery Polarity and Mixed Echo objective derivation
{
  const { Insect, DandelionSeed } = await import('../src/entities.js');
  const { evaluateDrawing } = await import('../src/recipes.js');

  // Nursery Polarity: Insects in Lobe A, Seeds in Lobe B
  const nurseryPockets = [
    {
      id: 1,
      polygon: [],
      entities: [new Insect(100, 100, 'brimstone'), new Insect(120, 100, 'hoverfly')],
    },
    {
      id: 2,
      polygon: [],
      entities: [new DandelionSeed(300, 300), new DandelionSeed(320, 300)],
    },
  ];
  const evalNursery = evaluateDrawing(nurseryPockets, 800);
  assert.strictEqual(evalNursery.valid, true);
  assert.strictEqual(evalNursery.recipeType, 'NURSERY_POLARITY');
  const nurseryTags = deriveObjectiveTags(evalNursery, nurseryPockets);
  assert.ok(nurseryTags.includes('figure8'));
  assert.ok(nurseryTags.includes('nursery'));

  // Mixed Echo: Symmetrical mixed composition across lobes
  // Lobe A: 1 Brimstone + 1 Hoverfly, Lobe B: 1 Brimstone + 1 Hoverfly
  const echoPockets = [
    {
      id: 1,
      polygon: [],
      entities: [new Insect(100, 100, 'brimstone'), new Insect(120, 100, 'hoverfly')],
    },
    {
      id: 2,
      polygon: [],
      entities: [new Insect(300, 300, 'brimstone'), new Insect(320, 300, 'hoverfly')],
    },
  ];
  const evalEcho = evaluateDrawing(echoPockets, 800);
  assert.strictEqual(evalEcho.valid, true);
  assert.strictEqual(evalEcho.recipeType, 'SYMMETRIC_CORRESPONDENCE');
  const echoTags = deriveObjectiveTags(evalEcho, echoPockets);
  assert.ok(echoTags.includes('figure8'));
  assert.ok(echoTags.includes('mixedEcho'));

  console.log('✔ Nursery Polarity and Mixed Echo evaluations and tags verified.');
}

// Hoverfly pauses, warns by turning, and travels a bounded short shift.
{
 const { Insect } = await import('../src/entities.js');
 const fly = new Insect(200, 200, 'hoverfly');
 const bounds = { width: 600, height: 500 };
 fly.hoverRemaining = 1.4;
 fly.update(1, bounds);
 assert.deepStrictEqual([fly.x, fly.y], [200, 200]);
 fly.update(0.41, bounds);
 assert.strictEqual(fly.hoverPhase, 'turn');
 assert.deepStrictEqual([fly.x, fly.y], [200, 200]);
 fly.update(0.8, bounds);
 assert.strictEqual(fly.hoverPhase, 'hold');
 assert.ok(Math.abs(Math.hypot(fly.x - 200, fly.y - 200) - 47.5) < 0.001);
 for (let i = 0; i < 600; i++) fly.update(0.1, bounds);
 assert.ok(fly.x >= 12 && fly.x <= 588 && fly.y >= 12 && fly.y <= 488);
 const { evaluateSinglePocket } = await import('../src/recipes.js');
 assert.ok(evaluateSinglePocket([fly, new Insect(210, 200, 'hoverfly')]).valid);
 const pockets = [{entities: [fly]}, {entities: [new Insect(240, 200, 'brimstone')]}];
 assert.ok(deriveObjectiveTags({ valid: true }, pockets).includes('counterpartPair'));
 for (const level of CAMPAIGN_LEVELS.filter(l => l.hour === 'noon')) {
   assert.ok(level.population.hoverfly > 0);
   assert.strictEqual(level.population.damselfly, 0);
 }
 console.log('✔ Hoverfly hold, turn, shift, bounds, recipes, and Noon populations verified.');
}
