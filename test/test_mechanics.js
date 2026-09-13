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

  console.log('✔ All recipe evaluation scenarios passed successfully.');
}

console.log('--- All tests passed! ---');
