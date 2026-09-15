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
  constrainToWalls,
  segmentEntersDisk,
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
  const damselfly = new Insect(300, 300, 'damselfly');
  damselfly.speed = 3.2; // fast dart speed: 192 px/s
  damselfly.isHovering = false;
  damselfly.heading = 0; // facing straight right
  damselfly.targetHeading = 0;
  damselfly.behaviorTimer = 10; // keep in dart mode

  const walls = [{ p1: { x: 340, y: 200 }, p2: { x: 340, y: 400 } }];
  const bounds = { width: 960, height: 640 };
  const dt = 1 / 30; // 30 fps timestep (~6.4 px movement per frame)

  let collided = false;
  let maxX = damselfly.x;
  for (let f = 0; f < 15; f++) {
    const from = { x: damselfly.x, y: damselfly.y };
    damselfly.update(dt, bounds);
    collided = constrainToWalls(damselfly, from, walls, bounds, dt) || collided;
    maxX = Math.max(maxX, damselfly.x);
  }
  assert.strictEqual(collided, true, 'Damselfly must detect wall collision');
  assert.ok(maxX <= 340 - damselfly.radius, `Damselfly hit circle must not cross the wall at x=340 (max x=${maxX})`);
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
  const gesture = new StringGesture(cordPoints[0], 1000);
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

  const gesture = new StringGesture(cordPoints[0], 1000);
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
  game.stringGesture = new StringGesture(game.currentStroke[0], 1000);
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
  const gesture = new StringGesture({ x: 0, y: 100 }, 800);

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

// 7. Hit circle collision: insect bounces on its hit circle perimeter
{
  const butterfly = new Insect(40, 100, 'brimstone');
  butterfly.heading = 0; // heading right towards wall at x=80
  const walls = [{ p1: { x: 80, y: 50 }, p2: { x: 80, y: 150 } }];
  const bounds = { width: 960, height: 640 };

  // A step from x=40 to x=70 would put the hit circle (radius ~19.8) across the wall.
  butterfly.x = 70;
  const collided = constrainToWalls(butterfly, { x: 40, y: 100 }, walls, bounds, 1 / 30);
  assert.strictEqual(collided, true, 'Hit circle touches wall');
  const expectedCenterDist = butterfly.radius + 0.4;
  assert.ok(Math.abs(80 - butterfly.x - expectedCenterDist) < 1e-6,
    `Center must stop at radius + 0.4 from wall (actual x=${butterfly.x})`);
  assert.ok(Math.cos(butterfly.heading) < 0, 'Velocity reflected away from wall');

  console.log('✔ Hit circle wall collision verified (perimeter touches, center clears).');
}

// 8. Bead freedom of movement within hit radius without snapping center
{
  const insect = new Insect(100, 112, 'brimstone'); // 12px vertical offset from y=100
  insect.heading = 0; // heading straight along cord tangent (x direction)
  const cordPoints = [{ x: 0, y: 100 }, { x: 300, y: 100 }];
  const gesture = new StringGesture(cordPoints[0], 1300);
  gesture.points = cordPoints;
  gesture.totalLength = 300;

  // Thread insect at arc length s = 100
  gesture.threadBead(insect, 100);

  // Center must NOT snap to line at y=100
  assert.strictEqual(insect.y, 112, 'Entity center must preserve initial offset (no snap to line)');
  assert.strictEqual(gesture.beads[0].offsetY, 12, 'Bead offset recorded');

  // Move along cord
  gesture.updateBeads(0.1);
  assert.strictEqual(insect.y, 112, 'Entity maintains vertical offset while sliding along cord');
  assert.ok(insect.x > 100, 'Entity slides forward along cord tangent');

  // Now turn perpendicular (heading = PI/2) and drive towards radius boundary
  insect.heading = Math.PI / 2;
  for (let i = 0; i < 30; i++) {
    gesture.updateBeads(0.1);
  }
  const offsetDist = Math.hypot(gesture.beads[0].offsetX, gesture.beads[0].offsetY);
  assert.ok(Math.abs(offsetDist - insect.radius) < 1e-4, 'Bead offset clamps exactly at hit circle radius');

  console.log('✔ Bead freedom of movement within hit circle verified.');
}

// 9. Tap places stationary salt grain
{
  const canvas = {
    getContext: () => ({
      clearRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      stroke: () => {},
      fill: () => {},
      save: () => {},
      restore: () => {},
      scale: () => {},
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

  assert.strictEqual(game.saltGrains.length, 0, 'Initially zero salt grains');

  // Trigger tap on ground (press and release <= 250ms, disp <= 14px)
  const tracker = game.tapTracker;
  tracker.onPress({ x: 250, y: 250 }, 1000, game.entities);
  tracker.onMove({ x: 252, y: 251 });
  const tapRes = tracker.onRelease({ x: 252, y: 251 }, 1100);
  assert.strictEqual(tapRes.isTap, true, 'Ground tap registers');

  // Simulate onPointerUp salt grain placement
  game.saltGrains.push({ x: 252, y: 251, rotation: 0, size: 3 });
  assert.strictEqual(game.saltGrains.length, 1, 'Salt grain added to field');
  assert.strictEqual(game.saltGrains[0].x, 252);

  console.log('✔ Tap places stationary salt grain verified.');
}

// 10. Cord snap limit in practice-string is 1300 px
{
  const canvas = {
    getContext: () => ({
      measureText: () => ({ width: 10 }),
      scale: () => {},
    }),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 640 }),
  };
  const game = new Game(canvas);
  game.initLevel('practice-string');
  assert.strictEqual(game.currentLevel.maxCordLength, 1300, 'Practice-string snap limit is 1300 px');

  console.log('✔ Practice-string snap limit is 1300 px (Extended band max).');
}

// 11. Live loop closure detection before release
{
  const canvas = {
    getContext: () => ({
      measureText: () => ({ width: 10 }),
      scale: () => {},
    }),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 640 }),
  };
  const game = new Game(canvas);
  game.initLevel('practice-string');
  game.state = 'PLAYING';

  // Start drawing at (200, 100)
  game.isDrawing = true;
  game.currentStroke = [{ x: 200, y: 100 }];
  game.activePockets = [];

  // Draw semi-circle (open arc, not closed)
  for (let i = 1; i <= 8; i++) {
    const angle = (i / 16) * Math.PI * 2;
    game.samplePointer({ x: 200 + Math.sin(angle) * 70, y: 170 - Math.cos(angle) * 70 }, true);
  }
  assert.strictEqual(game.activePockets.length, 0, 'Open arc must not signal closed loop');

  // Complete circle bringing tip back near start (within closeDist 90px)
  for (let i = 9; i <= 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    game.samplePointer({ x: 200 + Math.sin(angle) * 70, y: 170 - Math.cos(angle) * 70 }, true);
  }
  assert.ok(game.activePockets.length > 0, 'Closed loop must populate activePockets before release');
  assert.strictEqual(game.activePockets[0].type, 'single', 'Detected as single closed loop');
  assert.ok(game.activePockets[0].area >= 900, 'Loop area meets threshold');

  // Cancelling stroke clears live signal
  game.cancelStroke();
  assert.strictEqual(game.activePockets.length, 0, 'Active pockets cleared when stroke ends');

  console.log('✔ Live loop closure signal before release verified.');
}

// 12. A far cord leaves every species' own movement unchanged
{
  const bounds = { width: 960, height: 640 };
  const farWalls = [{ p1: { x: -200, y: -200 }, p2: { x: -150, y: -200 } }];
  const realRandom = Math.random;
  const seeded = seed => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const run = (make, walls) => {
    Math.random = seeded(7);
    const ent = make();
    const path = [];
    for (let f = 0; f < 360; f++) {
      const from = { x: ent.x, y: ent.y };
      ent.update(1 / 60, bounds, 0);
      if (walls.length) constrainToWalls(ent, from, walls, bounds, 1 / 60);
      path.push(ent.x, ent.y);
    }
    return path;
  };
  try {
    const makers = {
      brimstone: () => new Insect(300, 300, 'brimstone'),
      damselfly: () => new Insect(300, 300, 'damselfly'),
      hawkmoth: () => new Insect(300, 300, 'hawkmoth'),
      hoverfly: () => new Insect(300, 300, 'hoverfly'),
      lacewing: () => new Insect(300, 300, 'lacewing'),
      firefly: () => new Insect(300, 300, 'firefly'),
      seed: () => new DandelionSeed(930, 200),
    };
    for (const [name, make] of Object.entries(makers)) {
      assert.deepStrictEqual(run(make, farWalls), run(make, []), `${name} moves identically with a far cord`);
    }
    const seedPath = run(makers.seed, farWalls);
    assert.ok(seedPath.some((v, i) => i % 2 === 0 && v < 100), 'Seed still wraps from the right edge while a cord is held');
  } finally {
    Math.random = realRandom;
  }
  console.log('✔ Far cord leaves all six insect kinds and seed wrapping unchanged.');
}

// 13. A closed cord holds every kind, including hoverfly shifts and lacewing travel
{
  const bounds = { width: 960, height: 640 };
  const square = getWallSegments([
    { x: 390, y: 230 }, { x: 570, y: 230 }, { x: 570, y: 410 }, { x: 390, y: 410 }, { x: 390, y: 230 },
  ]);
  for (const kind of ['brimstone', 'damselfly', 'hawkmoth', 'hoverfly', 'firefly']) {
    const ent = new Insect(480, 320, kind);
    let maxOffset = 0;
    for (let f = 0; f < 600; f++) {
      const from = { x: ent.x, y: ent.y };
      ent.update(1 / 30, bounds);
      constrainToWalls(ent, from, square, bounds, 1 / 30);
      maxOffset = Math.max(maxOffset, Math.abs(ent.x - 480), Math.abs(ent.y - 320));
    }
    assert.ok(maxOffset <= 90 - ent.radius + 1e-6,
      `${kind} stays inside the cord for 20 s (max offset ${maxOffset.toFixed(2)}, limit ${(90 - ent.radius).toFixed(2)})`);
  }

  const seed = new DandelionSeed(480, 320);
  for (let f = 0; f < 600; f++) {
    const from = { x: seed.x, y: seed.y };
    seed.update(1 / 30, bounds, 200);
    constrainToWalls(seed, from, square, bounds, 1 / 30);
  }
  assert.ok(seed.x <= 570 - seed.radius + 1e-6 && seed.y <= 410 - seed.radius + 1e-6,
    `Wind-driven seed slides into the corner and stays inside (x=${seed.x.toFixed(2)}, y=${seed.y.toFixed(2)})`);

  // Lacewing travelling between its first two leaves meets a cord across its route.
  const lacewing = new Insect(0, 0, 'lacewing');
  const wall = getWallSegments([{ x: 480, y: 150 }, { x: 480, y: 330 }]);
  let maxX = 0;
  for (let f = 0; f < 240; f++) {
    const from = { x: lacewing.x, y: lacewing.y };
    lacewing.update(1 / 30, bounds);
    if (f > 0) constrainToWalls(lacewing, from, wall, bounds, 1 / 30);
    maxX = Math.max(maxX, lacewing.x);
  }
  assert.ok(maxX <= 480 - lacewing.radius + 1e-6, `Lacewing is held at the cord (max x=${maxX.toFixed(2)})`);
  const held = { x: lacewing.x, y: lacewing.y };
  lacewing.update(1 / 30, bounds);
  const jump = Math.hypot(lacewing.x - held.x, lacewing.y - held.y);
  assert.ok(jump < lacewing.radius + 12, `Lacewing resumes from the cord after release (jump ${jump.toFixed(1)} px)`);

  console.log('✔ Closed cord holds five flier kinds, a wind-driven seed, and lacewing leaf travel.');
}

// 14. Only pointer movement threads
{
  const insect = new Insect(100, 100, 'brimstone');
  const gesture = new StringGesture({ x: 40, y: 100 }, 1300);
  gesture.sample({ x: 60, y: 100 }, [insect]);
  assert.strictEqual(gesture.beads.length, 0, 'Tip stopping short of the hit circle does not thread');

  // The insect flies onto the still tip, including the forced release sample.
  insect.x = 60;
  gesture.sample({ x: 61, y: 100 }, [insect]);
  gesture.sample({ x: 60, y: 100 }, [insect], true);
  assert.strictEqual(gesture.beads.length, 0, 'Insect under a still pointer is not threaded');

  // Moving out of a circle the tip is already inside does not thread either.
  gesture.sample({ x: 70, y: 100 }, [insect]);
  assert.strictEqual(gesture.beads.length, 0, 'Leaving a hit circle does not thread');

  // Moving into a circle from outside threads.
  const second = new Insect(160, 100, 'damselfly');
  gesture.sample({ x: 170, y: 100 }, [insect, second]);
  assert.strictEqual(gesture.beads.length, 1, 'Tip entering a hit circle threads');
  assert.strictEqual(gesture.beads[0].entity, second);

  // The press target is skipped while the press can still become a tap.
  const target = new Insect(330, 300, 'brimstone');
  const pressed = new StringGesture({ x: 290, y: 300 }, 1300);
  pressed.sample({ x: 340, y: 300 }, [target], false, target);
  assert.strictEqual(pressed.beads.length, 0, 'Excluded tap target is not threaded');

  assert.ok(Math.abs(segmentEntersDisk({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 0 }, 2) - 0.3) < 1e-9,
    'Entry parameter is where the segment first reaches the circle');
  assert.strictEqual(segmentEntersDisk({ x: 5, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 0 }, 2), null,
    'A segment that starts inside the circle has not entered it');
  console.log('✔ Threading requires the pointer tip to move into a hit circle.');
}

console.log('--- All String Sandbox unit tests passed! ---');
