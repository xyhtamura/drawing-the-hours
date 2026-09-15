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
 * Swept circle vs static segment intersection.
 * Checks whether a moving circle (center p0 -> p1, radius) collides with segment (w0 -> w1).
 * Returns { t, wallPoint, normal, tangent } if collision occurs in t in [0, 1].
 */
export function sweptCircleSegmentIntersection(p0, p1, radius, w0, w1) {
  const r = radius || 0;
  if (r <= 0) {
    const segHit = sweptSegmentIntersection(p0, p1, w0, w1);
    if (!segHit) return null;
    return {
      t: segHit.t,
      wallPoint: segHit.point,
      normal: segHit.normal,
      tangent: segHit.tangent,
    };
  }

  const wx = w1.x - w0.x;
  const wy = w1.y - w0.y;
  const vx = p1.x - p0.x;
  const vy = p1.y - p0.y;
  const Lw2 = wx * wx + wy * wy;

  if (Lw2 < 1e-12) {
    const dx = p0.x - w0.x;
    const dy = p0.y - w0.y;
    const d0Sq = dx * dx + dy * dy;
    if (d0Sq <= r * r) {
      if (vx * dx + vy * dy < 0) {
        const d0 = Math.sqrt(d0Sq) || 1;
        const nx = dx / d0, ny = dy / d0;
        let tx = -ny, ty = nx;
        if (vx * tx + vy * ty < 0) { tx = -tx; ty = -ty; }
        return { t: 0, wallPoint: { x: w0.x, y: w0.y }, normal: { x: nx, y: ny }, tangent: { x: tx, y: ty } };
      }
      return null;
    }
    const a = vx * vx + vy * vy;
    if (a < 1e-12) return null;
    const b = 2 * (dx * vx + dy * vy);
    const c = dx * dx + dy * dy - r * r;
    const disc = b * b - 4 * a * c;
    if (disc < 0) return null;
    const t = (-b - Math.sqrt(disc)) / (2 * a);
    if (t >= 0 && t <= 1) {
      const ptX = p0.x + t * vx;
      const ptY = p0.y + t * vy;
      const nx = (ptX - w0.x) / r;
      const ny = (ptY - w0.y) / r;
      let tx = -ny, ty = nx;
      if (vx * tx + vy * ty < 0) { tx = -tx; ty = -ty; }
      return { t, wallPoint: { x: w0.x, y: w0.y }, normal: { x: nx, y: ny }, tangent: { x: tx, y: ty } };
    }
    return null;
  }

  const Lw = Math.sqrt(Lw2);
  const twx = wx / Lw;
  const twy = wy / Lw;
  const nwx = -twy;
  const nwy = twx;

  // Check if p0 starts inside or touching the capsule around w0->w1
  const u0 = ((p0.x - w0.x) * wx + (p0.y - w0.y) * wy) / Lw2;
  const uClamp = Math.max(0, Math.min(1, u0));
  const q0x = w0.x + uClamp * wx;
  const q0y = w0.y + uClamp * wy;
  const diffX = p0.x - q0x;
  const diffY = p0.y - q0y;
  const distSq = diffX * diffX + diffY * diffY;

  if (distSq <= r * r) {
    let nx = 0, ny = 0;
    if (distSq > 1e-8) {
      const d = Math.sqrt(distSq);
      nx = diffX / d;
      ny = diffY / d;
    } else {
      nx = nwx;
      ny = nwy;
      if (vx * nx + vy * ny > 0) {
        nx = -nx;
        ny = -ny;
      }
    }
    if (vx * nx + vy * ny < 0) {
      let tx = -ny, ty = nx;
      if (vx * tx + vy * ty < 0) { tx = -tx; ty = -ty; }
      return {
        t: 0,
        wallPoint: { x: q0x, y: q0y },
        normal: { x: nx, y: ny },
        tangent: { x: tx, y: ty },
      };
    }
    return null;
  }

  let best = null;
  function registerHit(t, u, wallPt, nx, ny) {
    if (t < 0 || t > 1) return;
    let finalNx = nx, finalNy = ny;
    if (vx * finalNx + vy * finalNy > 0) {
      finalNx = -finalNx;
      finalNy = -finalNy;
    }
    let tx = -finalNy, ty = finalNx;
    if (vx * tx + vy * ty < 0) { tx = -tx; ty = -ty; }
    if (!best || t < best.t) {
      best = {
        t,
        wallPoint: wallPt,
        normal: { x: finalNx, y: finalNy },
        tangent: { x: tx, y: ty },
      };
    }
  }

  const denom = vx * wy - vy * wx;
  if (Math.abs(denom) > 1e-9) {
    const A0x = w0.x + r * nwx;
    const A0y = w0.y + r * nwy;
    const dx1 = p0.x - A0x;
    const dy1 = p0.y - A0y;
    const t1 = (wx * dy1 - wy * dx1) / denom;
    const u1 = (vx * dy1 - vy * dx1) / denom;
    if (t1 >= 0 && t1 <= 1 && u1 >= 0 && u1 <= 1) {
      registerHit(t1, u1, { x: w0.x + u1 * wx, y: w0.y + u1 * wy }, nwx, nwy);
    }

    const B0x = w0.x - r * nwx;
    const B0y = w0.y - r * nwy;
    const dx2 = p0.x - B0x;
    const dy2 = p0.y - B0y;
    const t2 = (wx * dy2 - wy * dx2) / denom;
    const u2 = (vx * dy2 - vy * dx2) / denom;
    if (t2 >= 0 && t2 <= 1 && u2 >= 0 && u2 <= 1) {
      registerHit(t2, u2, { x: w0.x + u2 * wx, y: w0.y + u2 * wy }, -nwx, -nwy);
    }
  }

  const a = vx * vx + vy * vy;
  if (a > 1e-12) {
    const dx0 = p0.x - w0.x;
    const dy0 = p0.y - w0.y;
    const b0 = 2 * (dx0 * vx + dy0 * vy);
    const c0 = dx0 * dx0 + dy0 * dy0 - r * r;
    const disc0 = b0 * b0 - 4 * a * c0;
    if (disc0 >= 0) {
      const tCap0 = (-b0 - Math.sqrt(disc0)) / (2 * a);
      if (tCap0 >= 0 && tCap0 <= 1) {
        const ptX = p0.x + tCap0 * vx;
        const ptY = p0.y + tCap0 * vy;
        if ((ptX - w0.x) * twx + (ptY - w0.y) * twy <= 0) {
          registerHit(tCap0, 0, { x: w0.x, y: w0.y }, (ptX - w0.x) / r, (ptY - w0.y) / r);
        }
      }
    }

    const dx1 = p0.x - w1.x;
    const dy1 = p0.y - w1.y;
    const b1 = 2 * (dx1 * vx + dy1 * vy);
    const c1 = dx1 * dx1 + dy1 * dy1 - r * r;
    const disc1 = b1 * b1 - 4 * a * c1;
    if (disc1 >= 0) {
      const tCap1 = (-b1 - Math.sqrt(disc1)) / (2 * a);
      if (tCap1 >= 0 && tCap1 <= 1) {
        const ptX = p0.x + tCap1 * vx;
        const ptY = p0.y + tCap1 * vy;
        if ((ptX - w1.x) * twx + (ptY - w1.y) * twy >= 0) {
          registerHit(tCap1, 1, { x: w1.x, y: w1.y }, (ptX - w1.x) / r, (ptY - w1.y) / r);
        }
      }
    }
  }

  return best;
}

/**
 * Finds the earliest swept collision of path (p0 -> p1) against a list of wall segments.
 * Supports optional radius for swept circle collision (colliding on hit circle).
 */
export function findEarliestWallCollision(p0, p1, radiusOrWalls, maybeWalls) {
  const radius = Array.isArray(radiusOrWalls) ? 0 : (radiusOrWalls || 0);
  const walls = Array.isArray(radiusOrWalls) ? radiusOrWalls : (maybeWalls || []);
  if (!walls || walls.length === 0) return null;

  let earliest = null;
  for (const w of walls) {
    const hit = radius > 0
      ? sweptCircleSegmentIntersection(p0, p1, radius, w.p1, w.p2)
      : sweptSegmentIntersection(p0, p1, w.p1, w.p2);
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

  const hit = findEarliestWallCollision(p0, p1, entity.radius, walls);

  if (hit) {
    if (entity.type === 'seed') {
      // Seed stops at wall (hit circle touches wall) and slides along tangent
      const stopX = hit.wallPoint.x + hit.normal.x * (entity.radius + 0.2);
      const stopY = hit.wallPoint.y + hit.normal.y * (entity.radius + 0.2);

      // Project remaining velocity onto tangent
      const vTangent = vx * hit.tangent.x + vy * hit.tangent.y;
      const remainingTime = (1 - hit.t) * dt;

      entity.x = stopX + hit.tangent.x * vTangent * remainingTime;
      entity.y = stopY + hit.tangent.y * vTangent * remainingTime;

      // Check if sliding still penetrated any wall; if so clamp to stop point
      const slideHit = findEarliestWallCollision({ x: stopX, y: stopY }, { x: entity.x, y: entity.y }, entity.radius, walls);
      if (slideHit) {
        entity.x = stopX;
        entity.y = stopY;
      }
    } else {
      // Flier stops at wall (hit circle touches wall) and turns/reflects away
      entity.x = hit.wallPoint.x + hit.normal.x * (entity.radius + 0.4);
      entity.y = hit.wallPoint.y + hit.normal.y * (entity.radius + 0.4);

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
  constructor(startPoint, entities, maxCordLength = 1300) {
    this.points = [{ ...startPoint }];
    this.totalLength = 0;
    this.maxCordLength = maxCordLength;
    this.beads = []; // [{ entity, s, offsetX, offsetY, prevX, prevY }]
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
    const { point } = pointAndTangentAtArcLength(this.points, s);

    // Maintain entity's current position: calculate offset from cord point
    let ox = entity.x - point.x;
    let oy = entity.y - point.y;
    const r = entity.radius || 15;
    const d = Math.hypot(ox, oy);
    if (d > r) {
      ox = (ox / d) * r;
      oy = (oy / d) * r;
    }

    this.beads.push({
      entity,
      s,
      offsetX: ox,
      offsetY: oy,
      prevX: entity.x,
      prevY: entity.y,
    });
    // Keep beads sorted along arc length
    this.beads.sort((a, b) => a.s - b.s);
  }

  /**
   * Updates all beads sliding along the cord while allowing freedom of movement within hit radius.
   * Projects intended entity velocities onto cord tangents, clamps to ends, preserves order.
   */
  updateBeads(dt, bounds) {
    if (this.beads.length === 0 || this.points.length < 2) return;

    for (let i = 0; i < this.beads.length; i++) {
      const bead = this.beads[i];
      const ent = bead.entity;

      // Extract entity's movement step from ent.update or velocity
      let moveX = 0;
      let moveY = 0;
      if (bead.prevX !== undefined && bead.prevY !== undefined) {
        moveX = ent.x - bead.prevX;
        moveY = ent.y - bead.prevY;
      }
      if (Math.hypot(moveX, moveY) < 1e-4) {
        let speed = ent.config?.speed ? ent.config.speed * 60 : 60;
        if (ent.kind === 'damselfly' && ent.isHovering) speed = 5;
        else if (ent.kind === 'damselfly' && !ent.isHovering) speed = 3.2 * 60;
        else if (ent.type === 'seed') speed = (ent.vx || 0.6) * 60;
        moveX = Math.cos(ent.heading || 0) * speed * dt;
        moveY = Math.sin(ent.heading || 0) * speed * dt;
      }

      const { point, tangent } = pointAndTangentAtArcLength(this.points, bead.s);

      // Tangential component slides along the cord
      const deltaS = moveX * tangent.x + moveY * tangent.y;
      bead.s += deltaS;

      // Normal / lateral component updates offset within bead radius
      const normalX = -tangent.y;
      const normalY = tangent.x;
      const deltaNorm = moveX * normalX + moveY * normalY;
      bead.offsetX += normalX * deltaNorm;
      bead.offsetY += normalY * deltaNorm;
    }

    // Clamp at ends and enforce bead order (cannot pass each other)
    for (let i = 0; i < this.beads.length; i++) {
      const minS = i === 0 ? 0 : this.beads[i - 1].s;
      const maxS = i === this.beads.length - 1 ? this.totalLength : this.beads[i + 1].s;
      this.beads[i].s = Math.max(minS, Math.min(maxS, this.beads[i].s));
    }

    // Clamp offset to entity hit radius so bead stays within its hit circle of the line
    for (const bead of this.beads) {
      const ent = bead.entity;
      const r = ent.radius || 15;
      const distOffset = Math.hypot(bead.offsetX, bead.offsetY);
      if (distOffset > r) {
        bead.offsetX = (bead.offsetX / distOffset) * r;
        bead.offsetY = (bead.offsetY / distOffset) * r;
      }

      const { point } = pointAndTangentAtArcLength(this.points, bead.s);
      ent.x = point.x + bead.offsetX;
      ent.y = point.y + bead.offsetY;

      if (bounds) {
        ent.x = Math.max(12, Math.min(bounds.width - 12, ent.x));
        ent.y = Math.max(12, Math.min(bounds.height - 12, ent.y));
      }

      bead.prevX = ent.x;
      bead.prevY = ent.y;
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

  onPress(pos, time, entities = []) {
    const target = (entities || []).find(
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

    // A tap can be on an entity (displacement <= target.radius + 8) or on the ground (displacement <= 14px)
    const maxAllowedDisp = target ? (target.radius + 8) : 14;
    const isTap = duration <= 250 && maxDisp <= maxAllowedDisp;

    const result = {
      isTap,
      target,
      pos: { x: pos.x, y: pos.y },
      duration,
      maxDisplacement: maxDisp,
      startedOnTarget: this.candidate.startedOnTarget,
    };

    if (isTap) {
      const label = target ? target.kind : 'ground';
      console.log(`[Tap logged] Target: ${label}, Duration: ${duration.toFixed(1)}ms, MaxDisp: ${maxDisp.toFixed(1)}px`);
    }

    this.candidate = null;
    return result;
  }

  cancel() {
    this.candidate = null;
  }
}
