import { themeColor } from './theme.js';
import { paperShape } from './paper.js';
/** Shared geometry for the visible leaves and their resting insects. */
export function duskSafeArea({ width, height }) {
  const margin = Math.min(70, width * 0.18);
  return { left: margin, right: width - margin,
    top: Math.min(height * 0.4, width < 560 ? 170 : 120),
    bottom: height - Math.min(80, height * 0.18) };
}

export function leafAnchors(bounds) {
  const r = duskSafeArea(bounds);
  return [[0.20, 0.28], [0.80, 0.28], [0.50, 0.78]].map(([x, y]) => ({
    x: r.left + x * (r.right - r.left),
    y: r.top + y * (r.bottom - r.top),
  }));
}

export function placeLacewing(insect, bounds, index = 0, elapsed = 0) {
  insect.leafIndex = index % 3;
  insect.lacePhase = 'rest';
  insect.laceElapsed = elapsed;
  updateLacewing(insect, 0, bounds);
}

/** Travel scales with motionScale; the 1.5-second rest uses game time. */
export function updateLacewing(insect, dt, bounds) {
  if (insect.leafIndex === undefined) placeLacewing(insect, bounds);
  const anchors = leafAnchors(bounds);
  let remaining = dt;
  do {
    const duration = insect.lacePhase === 'rest' ? 1.5 : 3 / Math.max(0.01, insect.motionScale);
    const step = Math.min(remaining, duration - insect.laceElapsed);
    insect.laceElapsed += step;
    remaining -= step;
    if (insect.laceElapsed >= duration - 1e-10) {
      insect.laceElapsed = 0;
      if (insect.lacePhase === 'travel') insect.leafIndex = (insect.leafIndex + 1) % 3;
      insect.lacePhase = insect.lacePhase === 'rest' ? 'travel' : 'rest';
    }
  } while (remaining > 1e-10);
  const from = anchors[insect.leafIndex];
  const to = anchors[(insect.leafIndex + 1) % 3];
  const t = insect.lacePhase === 'rest' ? 0 : insect.laceElapsed * Math.max(0.01, insect.motionScale) / 3;
  const ease = t * t * (3 - 2 * t);
  insect.x = from.x + (to.x - from.x) * ease;
  insect.y = from.y + (to.y - from.y) * ease;
  insect.heading = Math.atan2(to.y - from.y, to.x - from.x);
  insect.flapPhase += insect.config.flutterFreq * dt;
}

export function drawLacewing(ctx, insect) {
  const spread = insect.lacePhase === 'rest' ? 0.38 : 0.6 + Math.abs(Math.cos(insect.flapPhase)) * 0.4;
  ctx.save();
  ctx.scale(spread, 1);
  for (const side of [-1, 1]) {
    ctx.save(); ctx.scale(side, 1);
    ctx.fillStyle = themeColor('lacewing', '#e5f4de'); ctx.strokeStyle = themeColor('outline', '#3f7158'); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, -9);
    ctx.bezierCurveTo(25, -12, 26, 19, 8, 24);
    ctx.quadraticCurveTo(2, 10, 0, -9); paperShape(ctx, 'lacewing');
    ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(12, 20);
    for (let y = -3; y <= 15; y += 6) {
      ctx.moveTo((y + 9) * 0.4, y); ctx.lineTo(19, y + 1);
    }
    ctx.stroke(); ctx.restore();
  }
  ctx.restore();
  ctx.strokeStyle = themeColor('body', '#405c49'); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, 20); ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, -10); ctx.quadraticCurveTo(-4, -23, -10, -25);
  ctx.moveTo(0, -10); ctx.quadraticCurveTo(4, -23, 10, -25); ctx.stroke();
}
