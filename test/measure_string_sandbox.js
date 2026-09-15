/**
 * Measurement Script for String Sandbox (STRING.md Build Order Step 3)
 *
 * Measures:
 * - Time to a pair and to a trio / seed-wing
 * - Accidental thread rate (pointer tip crossing insect hit circles)
 * - Snap rate at limits of 800 px, 1,000 px, and 1,200 px
 */

import { Insect, DandelionSeed, Snail } from '../src/entities.js';
import { StringGesture } from '../src/string.js';
import { distance, curbSeamY, polylineTouchesDisk } from '../src/geometry.js';

function runMeasurement(limit, durationSeconds = 60, dt = 1 / 30) {
  const bounds = { width: 960, height: 640 };

  // Dawn II population: 2 brimstone, 2 damselfly, 3 seed, 1 snail
  // Plus 1 hawkmoth to measure trio opportunities alongside pair and seed-wing
  const entities = [
    new Insect(150, 150, 'brimstone'),
    new Insect(300, 200, 'brimstone'),
    new Insect(200, 350, 'damselfly'),
    new Insect(400, 300, 'damselfly'),
    new Insect(500, 250, 'hawkmoth'),
    new DandelionSeed(100, 200),
    new DandelionSeed(350, 150),
    new DandelionSeed(600, 400),
    new Snail(480, curbSeamY(480, 960, 640), 'seam'),
  ];

  let pairAttempts = 0;
  let pairSuccesses = 0;
  let pairSnaps = 0;
  let pairThreads = 0;
  let firstPairTime = null;

  let trioAttempts = 0;
  let trioSuccesses = 0;
  let trioSnaps = 0;
  let trioThreads = 0;
  let firstTrioTime = null;

  let totalSimTime = 0;
  let sampleTimer = 0;

  const totalSteps = Math.floor(durationSeconds / dt);

  for (let step = 0; step < totalSteps; step++) {
    totalSimTime += dt;
    sampleTimer += dt;

    // Step entities
    for (const ent of entities) {
      ent.update(dt, bounds, 0, []);
    }

    // Every 0.5 seconds, sample candidate groupings
    if (sampleTimer >= 0.5) {
      sampleTimer = 0;

      // 1. Check Pair opportunities (two of same flier species)
      const fliers = entities.filter(e => e.type === 'butterfly' && e.state === 'roaming');
      const brimstones = fliers.filter(e => e.kind === 'brimstone');
      const damselflies = fliers.filter(e => e.kind === 'damselfly');

      const pairCandidates = [];
      if (brimstones.length >= 2) pairCandidates.push([brimstones[0], brimstones[1]]);
      if (damselflies.length >= 2) pairCandidates.push([damselflies[0], damselflies[1]]);

      for (const [a, b] of pairCandidates) {
        pairAttempts++;
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const r = distance(a, b) / 2 + Math.max(a.radius, b.radius) + 14;
        const circum = 2 * Math.PI * r;

        // Generate circular polyline
        const stroke = [];
        const segs = 24;
        for (let i = 0; i <= segs; i++) {
          const th = (i / segs) * Math.PI * 2;
          stroke.push({ x: mx + Math.cos(th) * r, y: my + Math.sin(th) * r });
        }

        // Check cord snap
        if (circum > limit) {
          pairSnaps++;
          continue;
        }

        // Check snail hazard
        const snail = entities.find(e => e.type === 'hazard');
        if (snail && polylineTouchesDisk(stroke, snail.x, snail.y, snail.radius + 3)) {
          continue;
        }

        // Check accidental threading (tip crossing other entities)
        const others = entities.filter(e => e !== a && e !== b && e.type !== 'hazard');
        let threaded = false;
        for (let i = 1; i < stroke.length; i++) {
          for (const other of others) {
            if (polylineTouchesDisk([stroke[i - 1], stroke[i]], other.x, other.y, other.radius)) {
              threaded = true;
              break;
            }
          }
          if (threaded) break;
        }

        if (threaded) {
          pairThreads++;
        } else {
          pairSuccesses++;
          if (firstPairTime === null) firstPairTime = totalSimTime;
        }
      }

      // 2. Check Trio opportunities (3 distinct species)
      const hawkmoths = fliers.filter(e => e.kind === 'hawkmoth');
      if (brimstones.length >= 1 && damselflies.length >= 1 && hawkmoths.length >= 1) {
        trioAttempts++;
        const tA = brimstones[0], tB = damselflies[0], tC = hawkmoths[0];
        const tmx = (tA.x + tB.x + tC.x) / 3;
        const tmy = (tA.y + tB.y + tC.y) / 3;
        const maxDist = Math.max(distance({ x: tmx, y: tmy }, tA), distance({ x: tmx, y: tmy }, tB), distance({ x: tmx, y: tmy }, tC));
        const tr = maxDist + 22;
        const tcircum = 2 * Math.PI * tr;

        if (tcircum > limit) {
          trioSnaps++;
        } else {
          const tstroke = [];
          const tsegs = 28;
          for (let i = 0; i <= tsegs; i++) {
            const th = (i / tsegs) * Math.PI * 2;
            tstroke.push({ x: tmx + Math.cos(th) * tr, y: tmy + Math.sin(th) * tr });
          }

          const snail = entities.find(e => e.type === 'hazard');
          if (!snail || !polylineTouchesDisk(tstroke, snail.x, snail.y, snail.radius + 3)) {
            const tothers = entities.filter(e => e !== tA && e !== tB && e !== tC && e.type !== 'hazard');
            let tThreaded = false;
            for (let i = 1; i < tstroke.length; i++) {
              for (const other of tothers) {
                if (polylineTouchesDisk([tstroke[i - 1], tstroke[i]], other.x, other.y, other.radius)) {
                  tThreaded = true;
                  break;
                }
              }
              if (tThreaded) break;
            }

            if (tThreaded) {
              trioThreads++;
            } else {
              trioSuccesses++;
              if (firstTrioTime === null) firstTrioTime = totalSimTime;
            }
          }
        }
      }
    }
  }

  return {
    limit,
    firstPairTime,
    pairSuccessRate: (pairSuccesses / Math.max(1, pairAttempts)),
    pairSnapRate: (pairSnaps / Math.max(1, pairAttempts)),
    pairThreadRate: (pairThreads / Math.max(1, pairAttempts)),
    firstTrioTime,
    trioSuccessRate: (trioSuccesses / Math.max(1, trioAttempts)),
    trioSnapRate: (trioSnaps / Math.max(1, trioAttempts)),
    trioThreadRate: (trioThreads / Math.max(1, trioAttempts)),
  };
}

console.log('=== String Sandbox Measurement Report ===\n');

for (const limit of [800, 1000, 1200, 1300]) {
  const runs = [];
  for (let r = 0; r < 3; r++) {
    runs.push(runMeasurement(limit, 60));
  }

  const avgFirstPair = runs.map(r => r.firstPairTime).filter(t => t !== null);
  const avgFirstTrio = runs.map(r => r.firstTrioTime).filter(t => t !== null);

  const meanPairTime = avgFirstPair.length ? (avgFirstPair.reduce((a, b) => a + b, 0) / avgFirstPair.length).toFixed(2) + 's' : 'N/A';
  const meanTrioTime = avgFirstTrio.length ? (avgFirstTrio.reduce((a, b) => a + b, 0) / avgFirstTrio.length).toFixed(2) + 's' : 'N/A';

  const avgPairSnap = (runs.reduce((a, b) => a + b.pairSnapRate, 0) / runs.length * 100).toFixed(1) + '%';
  const avgPairThread = (runs.reduce((a, b) => a + b.pairThreadRate, 0) / runs.length * 100).toFixed(1) + '%';
  const avgPairSuccess = (runs.reduce((a, b) => a + b.pairSuccessRate, 0) / runs.length * 100).toFixed(1) + '%';

  const avgTrioSnap = (runs.reduce((a, b) => a + b.trioSnapRate, 0) / runs.length * 100).toFixed(1) + '%';
  const avgTrioThread = (runs.reduce((a, b) => a + b.trioThreadRate, 0) / runs.length * 100).toFixed(1) + '%';
  const avgTrioSuccess = (runs.reduce((a, b) => a + b.trioSuccessRate, 0) / runs.length * 100).toFixed(1) + '%';

  console.log(`Limit: ${limit} px:`);
  console.log(`  Pair: First=${meanPairTime}, Success=${avgPairSuccess}, Snap=${avgPairSnap}, Thread=${avgPairThread}`);
  console.log(`  Trio: First=${meanTrioTime}, Success=${avgTrioSuccess}, Snap=${avgTrioSnap}, Thread=${avgTrioThread}`);
  console.log('');
}
