/**
 * Scripted player for the idle demonstration. It is the circle-drawing player of
 * test/measure_string_sandbox.js with a wider loop and a longer pause between
 * strokes, driven through the game's own pointer handlers, so what the screen
 * shows is a cord the game really resolved.
 *
 * Whenever it is free it looks for the smallest clear loop around a Kindred Pair,
 * a flier and a seed, or three different fliers, draws it as a circle a little
 * past its start so the cord crosses itself, then waits before looking again.
 * It does not steer and it does not draw figure-eights or traces.
 */

const MARGIN = 22;      // gap between a target's hit circle and the planned loop
const PATH_CLEAR = 6;   // extra gap kept from bystanders
const OVERSHOOT = 0.5;  // radians drawn past the start so the cord crosses itself
const WOBBLE = 0.03;    // radial wobble of the drawn circle, as a share of its radius
const LIMIT_USE = 0.9;  // plan loops at most this share of the cord limit

const isFlier = e => e.type === 'butterfly' || e.type === 'insect';

function* candidateGroups(game) {
  const live = game.entities.filter(e => e.state === 'roaming');
  const fliers = live.filter(isFlier);
  const seeds = live.filter(e => e.type === 'seed');
  for (let a = 0; a < fliers.length; a++) {
    for (let b = a + 1; b < fliers.length; b++) {
      if (fliers[a].kind === fliers[b].kind) yield [fliers[a], fliers[b]];
      for (let c = b + 1; c < fliers.length; c++) {
        if (new Set([fliers[a].kind, fliers[b].kind, fliers[c].kind]).size === 3) yield [fliers[a], fliers[b], fliers[c]];
      }
    }
    for (const seed of seeds) yield [fliers[a], seed];
  }
}

function planLoop(members, margin) {
  const cx = members.reduce((sum, m) => sum + m.x, 0) / members.length;
  const cy = members.reduce((sum, m) => sum + m.y, 0) / members.length;
  const R = Math.max(...members.map(m => Math.hypot(m.x - cx, m.y - cy) + m.radius)) + margin;
  return { cx, cy, R, length: R * (Math.PI * 2 + OVERSHOOT) * (1 + WOBBLE / 2), members };
}

function isClean(loop, game) {
  const edge = 16;
  if (loop.cx - loop.R < edge || loop.cx + loop.R > game.width - edge) return false;
  if (loop.cy - loop.R < edge || loop.cy + loop.R > game.height - edge) return false;
  for (const e of game.entities) {
    if (loop.members.includes(e) || e.state === 'departing' || e.state === 'harmonizing') continue;
    if (Math.hypot(e.x - loop.cx, e.y - loop.cy) <= loop.R + (e.radius || 0) + PATH_CLEAR + 3) return false;
  }
  return true;
}

function pointOnStroke(stroke) {
  const r = stroke.R * (1 + WOBBLE * Math.sin(3 * stroke.theta + stroke.phase));
  return [stroke.cx + r * Math.cos(stroke.theta), stroke.cy + r * Math.sin(stroke.theta)];
}

/**
 * @param game  the running Game
 * @param send  (type, [x, y]) => void, delivering a pointer event at a field position
 * @param options.speed     pointer speed along the loop, in field px per second
 * @param options.reaction  seconds between the end of one stroke and the next look
 */
export function createAutoplay(game, send, { speed = 700, reaction = 1.1, margin = MARGIN } = {}) {
  let stroke = null;
  let idle = 0;
  const stats = { strokes: 0, scored: 0 };

  return {
    stats,
    /** Advance the player by dt seconds. Call once per frame beside game.update. */
    step(dt) {
      if (game.state !== 'PLAYING' || game.uiSuspended) return;
      if (!stroke) {
        if (game.victoryDelay > 0) return;
        idle += dt;
        if (idle < reaction) return;
        const limit = game.cordLimit() * LIMIT_USE;
        let best = null;
        for (const members of candidateGroups(game)) {
          const loop = planLoop(members, margin);
          if (loop.length > limit || !isClean(loop, game)) continue;
          if (!best || loop.R < best.R) best = loop;
        }
        if (!best) return;
        stroke = { ...best, theta: 0, phase: Math.random() * Math.PI * 2, scoreBefore: game.score };
        stats.strokes++;
        send('pointerdown', pointOnStroke(stroke));
        return;
      }
      const end = Math.PI * 2 + OVERSHOOT;
      stroke.theta = Math.min(end, stroke.theta + (speed / stroke.R) * dt);
      if (game.isDrawing) send('pointermove', pointOnStroke(stroke));
      if (!game.isDrawing || stroke.theta >= end) {
        if (game.isDrawing) send('pointerup', pointOnStroke(stroke));
        if (game.score > stroke.scoreBefore) stats.scored++;
        stroke = null;
        idle = 0;
      }
    },
    /** Drop a stroke in progress without resolving it. */
    stop() {
      if (stroke && game.isDrawing) game.cancelStroke();
      stroke = null;
      idle = 0;
    },
  };
}
