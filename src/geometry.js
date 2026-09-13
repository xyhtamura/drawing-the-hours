/**
 * Drawing the Hours — Geometry & Pocket Recognition
 * Handles polyline metrics, length bands, self-intersections,
 * polygon extraction (single loop, lasso, figure-eight), and containment tests.
 */

export const LENGTH_BANDS = {
  PETITE: {
    name: 'Petite',
    min: 0,
    max: 450,
    color: '#e28b8b', // blush rose
    cordHue: '#d97777',
    indicator: 'I',
  },
  BALANCED: {
    name: 'Balanced',
    min: 450,
    max: 1100,
    color: '#d46b43', // warm terracotta
    cordHue: '#c85a32',
    indicator: 'II',
  },
  EXTENDED: {
    name: 'Extended',
    min: 1100,
    max: Infinity,
    color: '#6c4b78', // deep plum
    cordHue: '#5a3a66',
    indicator: 'III',
  },
};

export function distance(p1, p2) {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

export function polylineLength(points) {
  if (!points || points.length < 2) return 0;
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += distance(points[i - 1], points[i]);
  }
  return len;
}

export function getLengthBand(length) {
  if (length < LENGTH_BANDS.PETITE.max) return LENGTH_BANDS.PETITE;
  if (length < LENGTH_BANDS.BALANCED.max) return LENGTH_BANDS.BALANCED;
  return LENGTH_BANDS.EXTENDED;
}

/**
 * Line segment intersection between segment (p1, p2) and (p3, p4).
 * Returns { x, y, t, u } if they intersect strictly within (0, 1), else null.
 */
export function segmentIntersection(p1, p2, p3, p4, eps = 1e-3) {
  const dX1 = p2.x - p1.x;
  const dY1 = p2.y - p1.y;
  const dX2 = p4.x - p3.x;
  const dY2 = p4.y - p3.y;

  const denom = dX1 * dY2 - dY1 * dX2;
  if (Math.abs(denom) < 1e-9) return null; // parallel or colinear

  const dX3 = p1.x - p3.x;
  const dY3 = p1.y - p3.y;

  const t = (dX2 * dY3 - dY2 * dX3) / denom;
  const u = (dX1 * dY3 - dY1 * dX3) / denom;

  if (t >= -eps && t <= 1 + eps && u >= -eps && u <= 1 + eps) {
    const clampedT = Math.max(0, Math.min(1, t));
    const clampedU = Math.max(0, Math.min(1, u));
    return {
      x: p1.x + clampedT * dX1,
      y: p1.y + clampedT * dY1,
      t: clampedT,
      u: clampedU,
    };
  }
  return null;
}

/**
 * Shoelace polygon area (positive).
 */
export function polygonArea(points) {
  if (!points || points.length < 3) return 0;
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) * 0.5;
}

/**
 * Centroid of polygon
 */
export function polygonCentroid(points) {
  if (!points || points.length < 3) return { x: 0, y: 0 };
  let cx = 0;
  let cy = 0;
  let a = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const factor = points[i].x * points[j].y - points[j].x * points[i].y;
    cx += (points[i].x + points[j].x) * factor;
    cy += (points[i].y + points[j].y) * factor;
    a += factor;
  }
  a *= 0.5;
  if (Math.abs(a) < 1e-6) {
    // fallback to average
    let sx = 0, sy = 0;
    for (const p of points) { sx += p.x; sy += p.y; }
    return { x: sx / n, y: sy / n };
  }
  return { x: cx / (6 * a), y: cy / (6 * a) };
}

/**
 * Raycasting Point-in-Polygon check.
 */
export function pointInPolygon(point, polygon) {
  if (!polygon || polygon.length < 3) return false;
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Simplify raw drawing points by removing consecutive points that are too close.
 */
export function simplifyPoints(points, minDist = 6) {
  if (!points || points.length < 2) return points ? [...points] : [];
  const result = [points[0]];
  for (let i = 1; i < points.length; i++) {
    if (distance(result[result.length - 1], points[i]) >= minDist) {
      result.push(points[i]);
    }
  }
  const last = points[points.length - 1];
  if (distance(result[result.length - 1], last) > 1) {
    result.push(last);
  }
  return result;
}

/**
 * Extract closed pockets from a continuous stroke.
 * Can detect:
 * 1. Simple closed loop (ends near start)
 * 2. Lasso loop (stroke crosses itself once, creating a loop with a tail)
 * 3. Two-pocket figure-eight (crossing forming two distinct enclosed lobes)
 *
 * Returns array of pocket objects:
 * [{ id: 1, polygon: [...points], area, centroid }]
 */
export function extractPockets(rawPoints, options = {}) {
  const closeDist = options.closeDist ?? 55;
  const minArea = options.minArea ?? 1000;

  const pts = simplifyPoints(rawPoints, 6);
  if (pts.length < 4) return [];

  const segCount = pts.length - 1;
  const intersections = [];

  // Find all candidate segment-segment self-intersections
  for (let i = 0; i < segCount; i++) {
    for (let j = i + 2; j < segCount; j++) {
      if (i === 0 && j === segCount - 1) continue;

      const hit = segmentIntersection(pts[i], pts[i + 1], pts[j], pts[j + 1]);
      if (hit) {
        intersections.push({
          pt: { x: hit.x, y: hit.y },
          segA: i,
          segB: j,
        });
      }
    }
  }

  // 1. Check if any intersection forms a valid Two-Pocket Figure-Eight
  const startEndDist = distance(pts[0], pts[pts.length - 1]);

  for (const ix of intersections) {
    const { pt: X, segA, segB } = ix;

    // Loop 1 (inner cycle between segA and segB)
    const loop1 = [X];
    for (let k = segA + 1; k <= segB; k++) {
      loop1.push(pts[k]);
    }
    loop1.push({ x: X.x, y: X.y });
    const area1 = polygonArea(loop1);

    // Loop 2 (outer cycle from 0..segA, through X, segB+1..end, back to 0)
    const startXDist = distance(pts[0], X);
    const endXDist = distance(pts[pts.length - 1], X);

    const isOuterClosed = (startEndDist <= closeDist) ||
      (startXDist <= closeDist && endXDist <= closeDist);

    if (isOuterClosed) {
      const loop2 = [];
      for (let k = 0; k <= segA; k++) loop2.push(pts[k]);
      loop2.push({ x: X.x, y: X.y });
      for (let k = segB + 1; k < pts.length; k++) loop2.push(pts[k]);
      loop2.push({ x: loop2[0].x, y: loop2[0].y });

      const area2 = polygonArea(loop2);

      if (area1 >= minArea && area2 >= minArea) {
        return [
          {
            id: 1,
            type: 'figure8_lobeA',
            polygon: loop1,
            area: area1,
            centroid: polygonCentroid(loop1),
          },
          {
            id: 2,
            type: 'figure8_lobeB',
            polygon: loop2,
            area: area2,
            centroid: polygonCentroid(loop2),
          },
        ];
      }
    }
  }

  // 2. Check for Lasso (single loop formed by an intersection)
  for (const ix of intersections) {
    const { pt: X, segA, segB } = ix;
    const loop = [X];
    for (let k = segA + 1; k <= segB; k++) {
      loop.push(pts[k]);
    }
    loop.push({ x: X.x, y: X.y });
    const area = polygonArea(loop);
    if (area >= minArea) {
      return [
        {
          id: 1,
          type: 'lasso',
          polygon: loop,
          area,
          centroid: polygonCentroid(loop),
        },
      ];
    }
  }

  // 3. Check for Simple Single Closed Loop (no intersections, ends meet)
  if (startEndDist <= closeDist) {
    const closedPoly = [...pts, { x: pts[0].x, y: pts[0].y }];
    const area = polygonArea(closedPoly);
    if (area >= minArea) {
      return [
        {
          id: 1,
          type: 'single',
          polygon: closedPoly,
          area,
          centroid: polygonCentroid(closedPoly),
        },
      ];
    }
  }

  return [];
}
