/**
 * Drawing the Hours — String Rules & Sandbox Verge
 *
 * Implements one-gesture string rules per STRING.md:
 * 1. Cord is a wall while held (swept segment intersection, flier bounce, seed slide)
 * 2. Threading: tip swept contact threads insects as beads on cord
 * 3. Bead motion: sliding along cord tangent, clamped at ends [0, L], order invariant
 * 4. Bead cancellation: figure with beads scores nothing, releases insects
 * 5. Long cord snapping: stroke breaking past maxCordLength
 * 6. Snail hazard: cord touches snail within 19px breaks cord (unchanged)
 * 7. Tap detection: <= 250ms within target.radius + 8px logs, draws no cord
 */

import { distance, polylineLength } from './geometry.js';
import { sweptContact } from './trace.js';

/**
 * Returns array of segments from polyline points: [{ p1, p2 }, ...]
 */
export function getWallSegments(points) {
  if (!points || points.length < 2) return [];
  const segments = [];
  for (let i = 1; i < points.length; i++) {
    segments.push({ p1: points[i - 1], p2: points[i] });
  }
  return segments;
}

/**
 * Swept segment intersection between moving entity path (p0 -> p1)
 * and a static wall segment (w0 -> w1).
 * Returns { t, u, point, normal, tangent } if intersection occurs in t in [0, 1] and u in [0, 1].
 */
export function sweptSegmentIntersection(p0, p1, w0, w1) {
  const dx1 = p1.x - p0.x;
  const dy1 = p1.y - p0.y;
  const dx2 = w1.x - w0.x;
  const dy2 = w1.y - w0.y;

  const denom = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(denom) < 1e-9) return null; // parallel

  const dx3 = p0.x - w0.x;
  const dy3 = p0.y - w0.y;

  const t = (dx2 * dy3 - dy2 * dx3) / denom;
  const u = (dx1 * dy3 - dy1 * dx3) / denom;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    const wLen = Math.hypot(dx2, dy2);
    if (wLen < 1e-6) return null;

    const tx = dx2 / wLen;
    const ty = dy2 / wLen;

    // Normal perpendicular to wall
    let nx = -ty;
    let ny = tx;

    // Make normal face incoming motion p0 -> p1
    if (dx1 * nx + dy1 * ny > 0) {
      nx = -nx;
      ny = -ny;
    }

    return {
      t,
      u,
      point: {
        x: p0.x + t * dx1,
        y: p0.y + t * dy1,
      },
      normal: { x: nx, y: ny },
      tangent: { x: tx, y: ty },
    };
  }
  return null;
}

/**
 * Finds the earliest swept collision of path (p0 -> p1) against a list of wall segments.
 */
export function findEarliestWallCollision(p0, p1, walls) {
  if (!walls || walls.length === 0) return null;

  let earliest = null;
  for (const w of walls) {
    const hit = sweptSegmentIntersection(p0, p1, w.p1, w.p2);
    if (hit) {
      if (!earliest || hit.t < earliest.t) {
        earliest = hit;
      }
    }
  }
  return earliest;
}

/**
 * Stepping an entity with swept wall constraints:
 * - Flier (Brimstone, Damselfly, etc.): bounces off wall, reflects velocity, turns heading
 * - Seed: stops at wall, slides along wall tangent under remaining velocity / wind
 */
export function stepEntityWithWalls(entity, dt, bounds, windVx = 0, walls = []) {
  if (entity.crossesCord || !walls || walls.length === 0 || entity.state !== 'roaming') {
    return false; // Standard movement applies
  }

  const p0 = { x: entity.x, y: entity.y };
  let vx = 0;
  let vy = 0;

  if (entity.type === 'seed') {
    entity.stateTime += dt;
    entity.phase += dt * 2.0;
    const waveY = Math.sin(entity.phase) * 0.4;
    vx = entity.vx * 60 + windVx;
    vy = (entity.vy + waveY) * 60;
  } else if (entity.kind === 'damselfly') {
    entity.flapPhase += entity.config.flutterFreq * dt;
    entity.behaviorTimer -= dt;

    if (entity.behaviorTimer <= 0) {
      if (!entity.isHovering) {
        entity.isHovering = true;
        entity.behaviorTimer = 0.7 + Math.random() * 0.9;
        entity.speed = 0.08;
      } else {
        entity.isHovering = false;
        entity.behaviorTimer = 0.45 + Math.random() * 0.55;
        entity.speed = 3.2; // fast dart
        entity.targetHeading += (Math.random() - 0.5) * 2.2;
      }
    }

    entity.applyBoundarySteering(bounds, 50);
    entity.smoothTurn(8.0 * dt);

    const jitterX = entity.isHovering ? (Math.random() - 0.5) * 0.6 : 0;
    const jitterY = entity.isHovering ? (Math.random() - 0.5) * 0.6 : 0;
    const scale = entity.motionScale || 1.0;

    vx = (Math.cos(entity.heading) * entity.speed * scale + jitterX) * 60;
    vy = (Math.sin(entity.heading) * entity.speed * scale + jitterY) * 60;
  } else {
    // Brimstone / generic butterfly
    entity.flapPhase += entity.config.flutterFreq * dt;
    entity.behaviorTimer -= dt;

    if (entity.behaviorTimer <= 0) {
      if (Math.random() < 0.35) {
        entity.behaviorTimer = 0.8 + Math.random() * 0.9;
        entity.speed = entity.config.speed * 0.65;
      } else {
        entity.behaviorTimer = 1.2 + Math.random() * 1.6;
        entity.speed = entity.config.speed * (0.85 + Math.random() * 0.35);
        entity.targetHeading += (Math.random() - 0.5) * 1.8;
      }
    }

    entity.applyBoundarySteering(bounds, 65);
    entity.smoothTurn(3.5 * dt);

    const scale = entity.motionScale || 1.0;
    vx = Math.cos(entity.heading) * entity.speed * scale * 60;
    vy = Math.sin(entity.heading) * entity.speed * scale * 60;
  }

  const p1 = {
    x: p0.x + vx * dt,
    y: p0.y + vy * dt,
  };

  const hit = findEarliestWallCollision(p0, p1, walls);

  if (hit) {
    if (entity.type === 'seed') {
      // Seed stops at wall and slides along tangent
      const stopX = hit.point.x + hit.normal.x * 0.5;
      const stopY = hit.point.y + hit.normal.y * 0.5;

      // Project remaining velocity onto tangent
      const vTangent = vx * hit.tangent.x + vy * hit.tangent.y;
      const remainingTime = (1 - hit.t) * dt;

      entity.x = stopX + hit.tangent.x * vTangent * remainingTime;
      entity.y = stopY + hit.tangent.y * vTangent * remainingTime;

      // Check if sliding still penetrated any wall; if so clamp to stop point
      const slideHit = findEarliestWallCollision({ x: stopX, y: stopY }, { x: entity.x, y: entity.y }, walls);
      if (slideHit) {
        entity.x = stopX;
        entity.y = stopY;
      }
    } else {
      // Flier stops at wall and turns/reflects away
      entity.x = hit.point.x + hit.normal.x * 0.8;
      entity.y = hit.point.y + hit.normal.y * 0.8;

      // Reflect velocity across wall normal
      const vDotN = vx * hit.normal.x + vy * hit.normal.y;
      const rx = vx - 2 * vDotN * hit.normal.x;
      const ry = vy - 2 * vDotN * hit.normal.y;

      entity.heading = Math.atan2(ry, rx);
      entity.targetHeading = entity.heading;
    }

    // Boundary clamp
    entity.x = Math.max(12, Math.min(bounds.width - 12, entity.x));
    entity.y = Math.max(12, Math.min(bounds.height - 12, entity.y));
    return true;
  }

  // No collision: normal position update
  entity.x = p1.x;
  entity.y = p1.y;

  // Boundary clamp
  entity.x = Math.max(12, Math.min(bounds.width - 12, entity.x));
  entity.y = Math.max(12, Math.min(bounds.height - 12, entity.y));
  return true;
}

/**
 * Finds the coordinates and unit tangent on a polyline at a given arc length s.
 */
export function pointAndTangentAtArcLength(points, targetS) {
  if (!points || points.length === 0) return { point: { x: 0, y: 0 }, tangent: { x: 1, y: 0 } };
  if (points.length === 1) return { point: { ...points[0] }, tangent: { x: 1, y: 0 } };

  let currentDist = 0;
  for (let i = 1; i < points.length; i++) {
    const pA = points[i - 1];
    const pB = points[i];
    const segLen = distance(pA, pB);
    if (currentDist + segLen >= targetS || i === points.length - 1) {
      const segT = segLen > 1e-6 ? Math.max(0, Math.min(1, (targetS - currentDist) / segLen)) : 0;
      const tx = segLen > 1e-6 ? (pB.x - pA.x) / segLen : 1;
      const ty = segLen > 1e-6 ? (pB.y - pA.y) / segLen : 0;
      return {
        point: {
          x: pA.x + segT * (pB.x - pA.x),
          y: pA.y + segT * (pB.y - pA.y),
        },
        tangent: { x: tx, y: ty },
      };
    }
    currentDist += segLen;
  }
  const last = points[points.length - 1];
  return { point: { ...last }, tangent: { x: 1, y: 0 } };
}

/**
 * String Gesture controller managing active stroke, walls, beads, snapping, and taps.
 */
export class StringGesture {
  constructor(startPoint, entities, maxCordLength = 1000) {
    this.points = [{ ...startPoint }];
    this.totalLength = 0;
    this.maxCordLength = maxCordLength;
    this.beads = []; // [{ entity, s }] ordered by first contact
    this.previousTip = { ...startPoint };
    this.previousEntities = new Map(
      entities.filter(e => e.state !== 'harmonizing' && e.state !== 'departing')
        .map(e => [e, { x: e.x, y: e.y, radius: e.radius }])
    );
    this.snapped = false;
  }

  get wallSegments() {
    return getWallSegments(this.points);
  }

  get hasBeads() {
    return this.beads.length > 0;
  }

  /**
   * Samples a new pointer point.
   * Checks tip swept contact to thread new beads, checks cord snap.
   */
  sample(point, entities, force = false) {
    if (this.snapped) return { snapped: true };

    const last = this.points[this.points.length - 1];
    const dist = distance(last, point);

    if (dist >= 4 || force) {
      const prevLength = this.totalLength;
      this.points.push({ ...point });
      this.totalLength += dist;

      // Check long cord snap limit
      if (this.totalLength > this.maxCordLength) {
        this.snapped = true;
        this.releaseBeads();
        return { snapped: true, length: this.totalLength };
      }

      // Check threading contacts against moving pointer tip
      const currentEntities = new Map(
        entities.filter(e => e.state !== 'harmonizing' && e.state !== 'departing' && e.type !== 'hazard')
          .map(e => [e, { x: e.x, y: e.y, radius: e.radius }])
      );

      const hits = [];
      for (const [entity, pos] of currentEntities) {
        if (this.beads.some(b => b.entity === entity)) continue;

        const before = this.previousEntities.get(entity);
        const t = before
          ? sweptContact(this.previousTip, point, before, pos, pos.radius)
          : (distance(point, pos) <= pos.radius ? 1 : null);

        if (t !== null) {
          hits.push({ entity, t });
        }
      }

      hits.sort((a, b) => a.t - b.t);
      for (const hit of hits) {
        this.threadBead(hit.entity, prevLength + hit.t * dist);
      }

      this.previousTip = { ...point };
      this.previousEntities = currentEntities;
    }

    return { snapped: false, length: this.totalLength };
  }

  threadBead(entity, arcLength) {
    if (this.beads.some(b => b.entity === entity)) return;
    entity.isBead = true;
    entity.state = 'bead';
    const s = Math.max(0, Math.min(this.totalLength, arcLength));
    this.beads.push({ entity, s });
    // Keep beads sorted along arc length
    this.beads.sort((a, b) => a.s - b.s);
  }

  /**
   * Updates all beads sliding along the cord.
   * Projects intended entity velocities onto cord tangents, clamps to ends, preserves order.
   */
  updateBeads(dt) {
    if (this.beads.length === 0 || this.points.length < 2) return;

    for (let i = 0; i < this.beads.length; i++) {
      const bead = this.beads[i];
      const ent = bead.entity;

      // Compute intended velocity magnitude & direction
      let intendedSpeed = ent.config?.speed ? ent.config.speed * 60 : 60;
      if (ent.kind === 'damselfly' && ent.isHovering) intendedSpeed = 5;
      else if (ent.kind === 'damselfly' && !ent.isHovering) intendedSpeed = 3.2 * 60;
      else if (ent.type === 'seed') intendedSpeed = (ent.vx || 0.6) * 60;

      const intendedVx = Math.cos(ent.heading || 0) * intendedSpeed;
      const intendedVy = Math.sin(ent.heading || 0) * intendedSpeed;

      const { point, tangent } = pointAndTangentAtArcLength(this.points, bead.s);

      // Project intended velocity onto cord tangent
      const vTangent = intendedVx * tangent.x + intendedVy * tangent.y;
      bead.s += vTangent * dt;
    }

    // Clamp at ends and enforce bead order (cannot pass each other)
    for (let i = 0; i < this.beads.length; i++) {
      const minS = i === 0 ? 0 : this.beads[i - 1].s;
      const maxS = i === this.beads.length - 1 ? this.totalLength : this.beads[i + 1].s;
      this.beads[i].s = Math.max(minS, Math.min(maxS, this.beads[i].s));
    }

    // Update entity coordinates to match position on cord
    for (const bead of this.beads) {
      const { point, tangent } = pointAndTangentAtArcLength(this.points, bead.s);
      bead.entity.x = point.x;
      bead.entity.y = point.y;
    }
  }

  /**
   * Releases all beads back to roaming state at their current cord positions.
   */
  releaseBeads() {
    for (const bead of this.beads) {
      bead.entity.isBead = false;
      if (bead.entity.state === 'bead') {
        bead.entity.state = 'roaming';
      }
    }
    this.beads = [];
  }
}

/**
 * Tap tracking helper.
 * Measures press duration and displacement from press point.
 */
export class TapTracker {
  constructor() {
    this.candidate = null;
  }

  onPress(pos, time, entities) {
    const target = entities.find(
      e => e.state !== 'departing' && e.state !== 'harmonizing' && e.type !== 'hazard'
        && distance(pos, e) <= e.radius
    ) || null;

    this.candidate = {
      startTime: time,
      startPos: { x: pos.x, y: pos.y },
      target,
      maxDisplacement: 0,
      startedOnTarget: target !== null,
    };
  }

  onMove(pos) {
    if (!this.candidate) return;
    const disp = distance(pos, this.candidate.startPos);
    this.candidate.maxDisplacement = Math.max(this.candidate.maxDisplacement, disp);
  }

  onRelease(pos, time) {
    if (!this.candidate) return { isTap: false };

    const duration = time - this.candidate.startTime;
    const maxDisp = this.candidate.maxDisplacement;
    const target = this.candidate.target;

    const isTap = target !== null
      && duration <= 250
      && maxDisp <= (target.radius + 8);

    const result = {
      isTap,
      target,
      duration,
      maxDisplacement: maxDisp,
      startedOnTarget: this.candidate.startedOnTarget,
    };

    if (isTap) {
      console.log(`[Tap logged] Species: ${target.kind}, Duration: ${duration.toFixed(1)}ms, MaxDisp: ${maxDisp.toFixed(1)}px`);
    }

    this.candidate = null;
    return result;
  }

  cancel() {
    this.candidate = null;
  }
}
