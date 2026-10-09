import {extractClosedPockets, pointInPolygon, polylineLength, polylineTouchesDisk} from '../src/geometry.js';
import {MAX_CORD_LENGTH, sweptCircleSegmentIntersection} from '../src/string.js';
import {LEVELS, recipeSize, SPECIES} from './levels.js';
export {MAX_CORD_LENGTH as CORD_LIMIT};

export function strokeCutsStems(points, stems) {
  for (const stem of stems) {
    if (points.length && polylineTouchesDisk(stem.points, points[0].x, points[0].y, stem.radius)) return true;
    for (let i = 1; i < points.length; i++) for (let j = 1; j < stem.points.length; j++) {
      if (sweptCircleSegmentIntersection(points[i - 1], points[i], stem.radius, stem.points[j - 1], stem.points[j])) return true;
    }
  }
  return false;
}

/** Evaluate species recipes in one or two closed pockets. */
export function judgeStroke(points, fish, hasBeads = false, level = LEVELS[0], stems = []) {
  if (polylineLength(points) > MAX_CORD_LENGTH) return {error: 'The cord snapped. Draw a smaller figure.'};
  if (strokeCutsStems(points, stems)) return {error: 'A stem cut the cord. Draw through clear water.'};
  if (hasBeads) return {error: 'The cord passed through a fish. Draw around the fish.'};
  const pockets = extractClosedPockets(points, {touchDist: 4.5, minArea: 650});
  if (!pockets.length) return {error: 'Cross the cord to close the loop.'};
  if (pockets.length > 2) return {error: 'Use one loop or two pockets.'};
  const groups = pockets.map(p => fish.filter(f => f.state === 'roaming' && pointInPolygon(f, p.polygon)));
  if (groups.every(g => !g.length)) return {error: 'The loop held only water.'};
  if (groups.some(g => new Set(g.map(f => f.kind)).size > 1)) return {error: 'Keep each kind in its own pocket.'};
  for (const group of groups) {
    if (!group.length) return {error: 'Each pocket needs fish.'};
    const kind = group[0].kind, size = recipeSize(level, kind);
    if (group.length !== size) return {error: size === 2 ? 'Each pocket needs exactly two fish.' : `Each ${SPECIES[kind].name.toLowerCase()} pocket needs exactly ${size} fish.`};
  }
  if (level.separateKinds && (groups.length !== 2 || groups[0][0].kind === groups[1][0].kind)) {
    return {error: 'Draw two pockets with a different kind in each.'};
  }
  return {pockets, groups, released: [...new Set(groups.flat())]};
}
