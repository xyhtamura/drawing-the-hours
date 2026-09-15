/**
 * Unit Tests for String Sandbox & One-Gesture String Rules (STRING.md)
 *
 * 1. Tunneling at dart speed (swept segment test catches 192 px/s damselfly at 30 fps)
 * 2. Bead order under sliding (beads cannot pass each other)
 * 3. Clamping at the ends (beads clamped at [0, L])
 * 4. One-bead figure scores nothing (Day 1 bead cancellation)
 * 5. Snap exactly at maxCordLength limit
 * 6. Tap thresholds (short press <= 250ms and <= r+8px logs and draws no cord)
 */

import assert from 'node:assert';
import {
  sweptSegmentIntersection,
  findEarliestWallCollision,
  stepEntityWithWalls,
  StringGesture,
  TapTracker,
  getWallSegments,
  pointAndTangentAtArcLength,
} from '../src/string.js';
import { Insect, DandelionSeed, Snail } from '../src/entities.js';
import { Game } from '../src/game.js';

console.log('--- Running String Sandbox Test Suite ---');

// 1. Dart tunneling at 30 fps
{
  const damselfly = new Insect(50, 100, 'damselfly');
  damselfly.speed = 3.2; // fast dart speed: 192 px/s
  damselfly.isHovering = false;
  damselfly.heading = 0; // facing straight right
  damselfly.behaviorTimer = 10; // keep in dart mode

  const wall = { p1: { x: 54, y: 50 }, p2: { x: 54, y: 150 } };
  const walls = [wall];
  const bounds = { width: 960, height: 640 };
  const dt = 1 / 30; // 30 fps timestep (~6.4 px movement per frame)

  // Step towards the wall
  const collided = stepEntityWithWalls(damselfly, dt, bounds, 0, walls);
  assert.strictEqual(collided, true, 'Damselfly must detect wall collision');
  assert.ok(damselfly.x <= 54, `Damselfly must not cross wall at x=54 (actual x=${damselfly.x})`);
  assert.ok(Math.cos(damselfly.heading) < 0, 'Damselfly heading must reflect away from the wall');

  console.log('✔ Dart tunneling at 30 fps caught by swept segment test.');
}

// 2. Bead order under sliding (beads cannot pass each other)
{
  const insectA = new Insect(100, 100, 'brimstone');
  const insectB = new Insect(200, 100, 'damselfly');

  insectA.heading = 0; // heading right (towards B)
  insectB.heading = Math.PI; // heading left (towards A)

  const cordPoints = [
    { x: 0, y: 100 },
    { x: 100, y: 100 },
    { x: 200, y: 100 },
    { x: 400, y: 100 },
  ];
  const gesture = new StringGesture(cordPoints[0], [insectA, insectB], 1000);
  gesture.points = cordPoints;
  gesture.totalLength = 400;

  gesture.threadBead(insectA, 100);
  gesture.threadBead(insectB, 200);

  assert.strictEqual(gesture.beads.length, 2, 'Two beads threaded');
  assert.strictEqual(gesture.beads[0].entity, insectA, 'Insect A is first bead');
  assert.strictEqual(gesture.beads[1].entity, insectB, 'Insect B is second bead');

  // Drive them towards each other for 10 seconds of simulation
  for (let step = 0; step < 100; step++) {
    gesture.updateBeads(0.1);
    assert.ok(gesture.beads[0].s <= gesture.beads[1].s, 'Bead A must never pass Bead B');
  }

  assert.strictEqual(gesture.beads[0].entity, insectA, 'Order remains invariant');
  assert.strictEqual(gesture.beads[1].entity, insectB, 'Order remains invariant');

  console.log('✔ Bead order invariant under opposing sliding motion.');
}

// 3. Clamping at the ends [0, L]
{
  const insect = new Insect(20, 100, 'brimstone');
  insect.heading = Math.PI; // heading left towards start of cord
  const cordPoints = [{ x: 0, y: 100 }, { x: 300, y: 100 }];

  const gesture = new StringGesture(cordPoints[0], [insect], 1000);
  gesture.points = cordPoints;
  gesture.totalLength = 300;
  gesture.threadBead(insect, 20);

  // Push left past start
  for (let i = 0; i < 20; i++) {
    gesture.updateBeads(0.1);
  }
  assert.strictEqual(gesture.beads[0].s, 0, 'Bead must clamp at s=0');
  assert.strictEqual(insect.x, 0, 'Bead entity x must clamp at 0');

  // Reverse heading right past end
  insect.heading = 0;
  for (let i = 0; i < 50; i++) {
    gesture.updateBeads(0.1);
  }
  assert.strictEqual(gesture.beads[0].s, 300, 'Bead must clamp at s=L (300)');
  assert.strictEqual(insect.x, 300, 'Bead entity x must clamp at 300');

  console.log('✔ Bead clamping at both ends verified.');
}

// 4. One-bead figure scores nothing on Day 1
{
  // Create mock canvas
  const canvas = {
    getContext: () => ({
      clearRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      ellipse: () => {},
      quadraticCurveTo: () => {},
      stroke: () => {},
      fill: () => {},
      save: () => {},
      restore: () => {},
      scale: () => {},
      translate: () => {},
      rotate: () => {},
      clip: () => {},
      setLineDash: () => {},
      fillText: () => {},
      measureText: () => ({ width: 10 }),
    }),
    addEventListener: () => {},
    removeEventListener: () => {},
    setPointerCapture: () => {},
    releasePointerCapture: () => {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 640 }),
  };

  const game = new Game(canvas);
  game.initLevel('practice-string');
  game.state = 'PLAYING';

  // Spawn two brimstones that would form a kindred pair
  const b1 = new Insect(180, 200, 'brimstone');
  const b2 = new Insect(220, 200, 'brimstone');
  // Spawn a damselfly
  const d1 = new Insect(200, 150, 'damselfly');
  game.entities = [b1, b2, d1];

  // Draw circular loop around (200, 200)
  game.isDrawing = true;
  game.currentStroke = [];
  const cx = 200, cy = 200, r = 60;
  for (let i = 0; i <= 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    game.currentStroke.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
  }
  game.strokeLength = 2 * Math.PI * r;

  // Initialize string gesture and thread the damselfly as a bead
  game.stringGesture = new StringGesture(game.currentStroke[0], game.entities, 1000);
  game.stringGesture.points = [...game.currentStroke];
  game.stringGesture.totalLength = game.strokeLength;
  game.stringGesture.threadBead(d1, 50);

  assert.strictEqual(game.stringGesture.hasBeads, true, 'Gesture has 1 bead');

  // Resolve stroke
  game.resolveCurrentStroke();

  assert.strictEqual(game.score, 0, 'Score must not increase when bead is threaded');
  assert.strictEqual(game.feedbackBanner.text, 'An insect was threaded on the cord, so the loop does not count.');
  assert.strictEqual(d1.isBead, false, 'Bead must be released');
  assert.strictEqual(b1.state, 'roaming', 'Enclosed insect B1 must remain roaming');
  assert.strictEqual(b2.state, 'roaming', 'Enclosed insect B2 must remain roaming');

  console.log('✔ One-bead figure scores nothing and releases insects.');
}

// 5. Snap exactly at maxCordLength limit
{
  const entities = [new Insect(100, 100, 'brimstone')];
  const gesture = new StringGesture({ x: 0, y: 100 }, entities, 800);

  // Sample to 790 px
  const res1 = gesture.sample({ x: 790, y: 100 }, entities, true);
  assert.strictEqual(res1.snapped, false, 'Should not snap below 800');
  assert.strictEqual(gesture.snapped, false);

  // Sample to 805 px
  const res2 = gesture.sample({ x: 805, y: 100 }, entities, true);
  assert.strictEqual(res2.snapped, true, 'Should snap past 800');
  assert.strictEqual(gesture.snapped, true);

  console.log('✔ Cord snap occurs when strokeLength exceeds maxCordLength.');
}

// 6. Tap thresholds against short stroke
{
  const insect = new Insect(100, 100, 'damselfly');
  insect.radius = 20;
  const tracker = new TapTracker();

  // Case A: Short press on insect, no displacement, 150 ms
  tracker.onPress({ x: 100, y: 100 }, 1000, [insect]);
  tracker.onMove({ x: 102, y: 101 });
  const tapA = tracker.onRelease({ x: 102, y: 101 }, 1150);
  assert.strictEqual(tapA.isTap, true, 'Case A is a valid tap');
  assert.strictEqual(tapA.target, insect);

  // Case B: Drag beyond radius + 8 (displacement 40 px > 28 px)
  tracker.onPress({ x: 100, y: 100 }, 1000, [insect]);
  tracker.onMove({ x: 140, y: 100 });
  const tapB = tracker.onRelease({ x: 140, y: 100 }, 1150);
  assert.strictEqual(tapB.isTap, false, 'Case B is a drag, not a tap');
  assert.strictEqual(tapB.startedOnTarget, true);

  // Case C: Held for 400 ms (> 250 ms) without moving
  tracker.onPress({ x: 100, y: 100 }, 1000, [insect]);
  const tapC = tracker.onRelease({ x: 100, y: 100 }, 1400);
  assert.strictEqual(tapC.isTap, false, 'Case C held > 250ms is not a tap');

  console.log('✔ Tap thresholds verified for short press, drag, and hold.');
}

console.log('--- All String Sandbox unit tests passed! ---');
