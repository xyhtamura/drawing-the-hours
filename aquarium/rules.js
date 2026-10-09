import {extractClosedPockets, pointInPolygon, polylineLength} from '../src/geometry.js';
import {MAX_CORD_LENGTH} from '../src/string.js';
export {MAX_CORD_LENGTH as CORD_LIMIT};

/** Evaluate matching pairs in one or two closed pockets. */
export function judgeStroke(points, fish, hasBeads = false) {
  if (polylineLength(points) > MAX_CORD_LENGTH) return {error: 'The cord snapped. Draw a smaller figure.'};
  if (hasBeads) return {error: 'The cord passed through a fish. Draw around the fish.'};
  const pockets = extractClosedPockets(points, {touchDist: 4.5, minArea: 650});
  if (!pockets.length) return {error: 'Cross the cord to close the loop.'};
  if (pockets.length > 2) return {error: 'Use one loop or two pockets.'};
  const groups = pockets.map(p => fish.filter(f => f.state === 'roaming' && pointInPolygon(f, p.polygon)));
  if (groups.every(g => !g.length)) return {error: 'The loop held only water.'};
  if (groups.some(g => g.length !== 2)) return {error: 'Each pocket needs exactly two fish.'};
  if (groups.some(g => g[0].kind !== g[1].kind)) return {error: 'Keep each kind in its own pocket.'};
  return {pockets, groups, released: [...new Set(groups.flat())]};
}
