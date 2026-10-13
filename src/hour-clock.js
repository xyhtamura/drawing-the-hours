// The visit clock as the player sees it: a sheet of coloured paper laid across
// the field: light at Dawn, blue sky at
// Noon, shadow at Dusk, and at Midnight a dark saturated colour whose hue shifts
// from visit to visit. When the sheet covers the field, the visit is over.
//
// The sheet is the hour's own paper: its colour is laid down first and the
// hour's texture is pressed over it, once per visit, the way the floor is made.
// Its leading edge is torn like the sheets on the title screen. It does not
// glide. It holds still, and every STEP_SECONDS it is moved on in a few jerky
// poses, as if shifted by hand between exposures.

import { themeColor, themeKey } from './theme.js';
import { paperBackdrop, paperVersion, PAPER_USE } from './paper.js';

export const STEP_SECONDS = 10;
const TILT = 0.2;        // radians the edge leans off square, like light through a window
// A move is five held poses at eight a second. The fourth overshoots and the fifth settles.
const POSES = [0.28, 0.6, 0.86, 1.05, 1];
const POSE_SECONDS = 1 / 8;

// angle: the direction the sheet travels, in canvas radians (0 = left to right, PI/2 = downward).
// tint: how much of the colour is laid over the hour's wash before the paper is pressed.
export const HOUR_WASH = {
  dawn: { label: 'Light', angle: TILT, tint: 0.5, color: () => [255, 222, 132] },
  noon: { label: 'Sky', angle: Math.PI / 2 - TILT, tint: 0.62, color: () => [56, 158, 255] },
  dusk: { label: 'Shadow', angle: Math.PI - TILT, tint: 0.55, color: () => [40, 28, 64] },
  // Around #6e084a (hue 321). Each of the hour's six visits takes its own hue.
  midnight: { label: 'Night', angle: -Math.PI / 2 + TILT, tint: 0.8, color: level => hslToRgb(midnightHue(level), 0.86, 0.23) },
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

function lcg(seed) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function washFor(level) {
  return HOUR_WASH[level?.hour] || HOUR_WASH.dawn;
}

/** Share of the visit's time that has passed, 0 to 1. Zero while the clock is held or absent. */
export function clockProgress(game) {
  if (game.isUntimed() || game.isClockHeld()) return 0;
  const clock = game.clock;
  return Math.max(0, Math.min(1, 1 - clock.remainingSeconds / clock.totalSeconds));
}

/**
 * The share the sheet shows: clockProgress held back to the last whole step.
 * Time won back by a combination can carry it back a step.
 */
export function steppedProgress(game) {
  const total = game.clock.totalSeconds;
  const progress = clockProgress(game);
  if (progress >= 1) return 1;
  return Math.min(1, Math.floor(progress * total / STEP_SECONDS + 1e-6) * STEP_SECONDS / total);
}

// Per-game drawing state: the pressed sheet and the move in progress.
const states = new WeakMap();
function stateOf(game) {
  if (!states.has(game)) states.set(game, { key: '', sheet: null, levelId: null, shown: 0, from: 0, to: 0, movedAt: -Infinity });
  return states.get(game);
}

/** The hour's wash with the colour laid over it, then the hour's paper pressed on top. */
function pressSheet(game, wash, [r, g, b]) {
  if (typeof globalThis.document?.createElement !== 'function') return null;
  const hour = HOUR_WASH[game.currentLevel?.hour] ? game.currentLevel.hour : 'dawn';
  // One canvas pixel per field unit: the press works at about this size anyway.
  const canvas = document.createElement('canvas');
  canvas.width = game.width;
  canvas.height = game.height;
  const ctx = canvas.getContext('2d');
  const under = ctx.createLinearGradient(0, 0, game.width, game.height);
  under.addColorStop(0, themeColor('top', '#f9eae6'));
  under.addColorStop(PAPER_USE.backdrop[hour].mid, themeColor('middle', '#fcf8e9'));
  under.addColorStop(1, themeColor('bottom', '#e6edd9'));
  ctx.fillStyle = under;
  ctx.fillRect(0, 0, game.width, game.height);
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${wash.tint})`;
  ctx.fillRect(0, 0, game.width, game.height);
  // Passing the settings presses at run time; the baked floor files hold the floor's colours.
  paperBackdrop(canvas, hour, PAPER_USE.backdrop[hour]);
  return canvas;
}

/**
 * Presses the sheet for the current visit if the one held is for another hour,
 * hue, or field size. Pressing takes a few hundred milliseconds, so the game
 * calls this while a visit's card is up, not only once play has begun.
 */
export function prepareHourSheet(game) {
  const level = game.currentLevel;
  const wash = washFor(level);
  const rgb = wash.color(level);
  const state = stateOf(game);
  const key = `${themeKey()}:${paperVersion()}:${game.width}:${game.height}:${wash.label}:${rgb}`;
  if (state.key !== key) {
    state.key = key;
    state.sheet = pressSheet(game, wash, rgb);
  }
  return state;
}

/** The sheet over the field floor, drawn under the creatures. `now` is in milliseconds. */
export function drawHourWash(ctx, game, now = performance.now()) {
  const level = game.currentLevel;
  const wash = washFor(level);
  const rgb = wash.color(level);
  const state = prepareHourSheet(game);

  const target = steppedProgress(game);
  if (state.levelId !== level?.id || target === 0) {
    // A new or restarted visit starts bare, without a move.
    state.levelId = level?.id; state.shown = state.from = state.to = target; state.movedAt = -Infinity;
  } else if (target !== state.to) {
    state.from = state.shown; state.to = target; state.movedAt = now;
  }
  const pose = Math.floor((now - state.movedAt) / 1000 / POSE_SECONDS);
  const moving = pose < POSES.length - 1;
  state.shown = moving ? state.from + (state.to - state.from) * POSES[Math.max(0, pose)] : state.to;
  if (state.shown <= 0) return;

  const dx = Math.cos(wash.angle), dy = Math.sin(wash.angle);
  // Where the field's corners fall along the direction of travel and across it.
  const corners = [[0, 0], [game.width, 0], [0, game.height], [game.width, game.height]];
  const along = corners.map(([x, y]) => x * dx + y * dy);
  const across = corners.map(([x, y]) => -x * dy + y * dx);
  const start = Math.min(...along), end = Math.max(...along);
  const low = Math.min(...across), high = Math.max(...across);
  const margin = 14; // the torn edge's reach; the sheet starts and ends clear of the field by this much
  const front = start - margin + state.shown * (end - start + 2 * margin);

  // The tear is the visit's own. While the sheet is being moved, each pose sits a little differently.
  const tear = lcg(97 + (level?.number || 0) * 131);
  const shake = lcg(moving ? 7 + pose * 53 + Math.round(state.to * 1000) : 1);
  const lean = moving ? (shake() - 0.5) * 0.02 : 0;
  const steps = 30;

  ctx.save();
  ctx.rotate(wash.angle + lean);
  ctx.beginPath();
  for (let s = 0; s <= steps; s++) {
    const y = low - 20 + (s / steps) * (high - low + 40);
    const x = front + (tear() - 0.5) * 18 + (moving ? (shake() - 0.5) * 3 : 0);
    if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.lineTo(start - 60, high + 20);
  ctx.lineTo(start - 60, low - 20);
  ctx.closePath();
  // The sheet lies on the floor: a shadow falls ahead of its edge.
  ctx.shadowColor = 'rgba(30, 24, 20, 0.38)';
  ctx.shadowBlur = 9; ctx.shadowOffsetX = dx * 3; ctx.shadowOffsetY = dy * 3;
  ctx.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  if (state.sheet) {
    ctx.clip();
    ctx.rotate(-(wash.angle + lean));
    ctx.drawImage(state.sheet, 0, 0, game.width, game.height);
  }
  ctx.restore();
}

/** The same reading as a small disc beside the time. */
export function drawHourGauge(ctx, game, x, y, radius) {
  const wash = washFor(game.currentLevel);
  const [r, g, b] = wash.color(game.currentLevel);
  const progress = steppedProgress(game);
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = themeColor('panel', '#fdfbf7');
  ctx.fill();
  ctx.save();
  ctx.clip();
  // A band square to the direction of travel, covering the passed share of the disc.
  ctx.rotate(wash.angle);
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.fillRect(-radius, -radius, 2 * radius * progress, 2 * radius);
  ctx.restore();
  ctx.strokeStyle = themeColor('outline', '#786c5a');
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.restore();
}
