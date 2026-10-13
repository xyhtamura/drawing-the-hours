// The local edition's visit clock. Time is not a dandelion shedding in the corner
// but something crossing the field: light at Dawn, blue sky at Noon, shadow at
// Dusk, and at Midnight a dark saturated colour whose hue shifts from visit to
// visit. When it has covered the field, the visit is over.

import { themeColor } from './theme.js';

const TILT = 0.2; // radians the front leans off its axis, like light through a window

// angle: the direction the front travels, in canvas radians (0 = left to right, PI/2 = downward).
export const HOUR_WASH = {
  dawn: { label: 'Light', angle: TILT, alpha: 0.34, color: () => [255, 224, 140] },
  noon: { label: 'Sky', angle: Math.PI / 2 - TILT, alpha: 0.34, color: () => [56, 158, 255] },
  dusk: { label: 'Shadow', angle: Math.PI - TILT, alpha: 0.4, color: () => [40, 28, 64] },
  // Around #6e084a (hue 321). Each of the hour's six visits takes its own hue.
  midnight: { label: 'Night', angle: -Math.PI / 2 + TILT, alpha: 0.5, color: level => hslToRgb(midnightHue(level), 0.86, 0.23) },
};
const MIDNIGHT_HUES = [0, 16, -16, 32, -32, 48];

export function midnightHue(level) {
  const index = Number.isFinite(level?.number) ? (level.number - 1) % MIDNIGHT_HUES.length : 0;
  return (321 + MIDNIGHT_HUES[index] + 360) % 360;
}

function hslToRgb(h, s, l) {
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)].map(v => Math.round(v * 255));
}

export function washFor(level) {
  const hour = level?.hour || 'dawn';
  return HOUR_WASH[hour] || HOUR_WASH.dawn;
}

/** Share of the visit's time that has passed, 0 to 1. Zero while the clock is held or absent. */
export function clockProgress(game) {
  if (game.isUntimed() || game.isClockHeld()) return 0;
  const clock = game.clock;
  return Math.max(0, Math.min(1, 1 - clock.remainingSeconds / clock.totalSeconds));
}

/** The wash over the field floor, drawn under the creatures. */
export function drawHourWash(ctx, game) {
  const progress = clockProgress(game);
  if (progress <= 0) return;
  const wash = washFor(game.currentLevel);
  const [r, g, b] = wash.color(game.currentLevel);
  const dx = Math.cos(wash.angle), dy = Math.sin(wash.angle);
  // Where the field's corners fall along the direction of travel.
  const reach = [[0, 0], [game.width, 0], [0, game.height], [game.width, game.height]].map(([x, y]) => x * dx + y * dy);
  const start = Math.min(...reach), end = Math.max(...reach);
  const soft = 90; // width of the front's soft edge, in field px
  const front = start + progress * (end - start + soft);
  const gradient = ctx.createLinearGradient(dx * (front - soft), dy * (front - soft), dx * front, dy * front);
  gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${wash.alpha})`);
  gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${(wash.alpha * 1.15).toFixed(3)})`);
  gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.save();
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, game.width, game.height);
  ctx.restore();
}

/** The same reading as a small disc beside the time, where the dandelion head is in the main build. */
export function drawHourGauge(ctx, game, x, y, radius) {
  const wash = washFor(game.currentLevel);
  const [r, g, b] = wash.color(game.currentLevel);
  const progress = clockProgress(game);
  const dx = Math.cos(wash.angle), dy = Math.sin(wash.angle);
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = themeColor('panel', '#fdfbf7');
  ctx.fill();
  ctx.save();
  ctx.clip();
  // A band square to the direction of travel, covering the passed share of the disc.
  ctx.rotate(Math.atan2(dy, dx));
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.fillRect(-radius, -radius, 2 * radius * progress, 2 * radius);
  ctx.restore();
  ctx.strokeStyle = themeColor('outline', '#786c5a');
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.restore();
}
