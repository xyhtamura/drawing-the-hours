/**
 * String sandbox measurement: plays Dawn visits under the one-gesture string rules
 * with a scripted player and reports how the cord snap limit changes play.
 *
 * The game runs as it does in the browser: `Game` and its pointer handlers, cord
 * walls, threading, closure rule 9, snail breaks, snapping, replacement spawns,
 * objectives, and the visit clock. Only the canvas, `window`, and `document` are
 * stubbed, and nothing is rendered. `Math.random` is seeded per run, so every run
 * is reproducible.
 *
 * The scripted player is a model, not a person. Whenever it is free it looks for
 * the smallest loop around a group an unfinished objective needs (or a Kindred
 * Pair while the Combinations count still has room) that has no other insect or
 * seed inside it or on its path and keeps the snail out of reach. It skips loops
 * longer than 97% of the limit, draws a circle at a steady pointer speed with a
 * 3% wobble, carries on 0.5 rad past its start so the cord crosses itself, and
 * waits 0.4 s before looking again. Insects keep moving while it draws and it does
 * not steer. Read the results as comparisons between limits, not as human timings.
 *
 * Usage:
 *   node test/measure_string_sandbox.js
 *   node test/measure_string_sandbox.js --runs 20 --limits 900,1100,1300,none
 *   node test/measure_string_sandbox.js --visits dawn-05 --speed 900
 *   node test/measure_string_sandbox.js --json > string-measure.json
 */

import os from 'node:os';
import { Game } from '../src/game.js';
import { CAMPAIGN_LEVELS } from '../src/campaign.js';

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};
const RUNS = Number(option('runs', 10));
const LIMITS = option('limits', '800,1000,1150,1300,1600,none')
  .split(',').map(v => (v === 'none' ? Infinity : Number(v)));
const SPEED = Number(option('speed', 700)); // px per second along the loop
const VISITS = option('visits', 'dawn-04,dawn-05').split(',');
const JSON_OUT = args.includes('--json');

const DT = 1 / 60;
const MARGIN = 14;      // gap between a target's hit circle and the planned loop
const PATH_CLEAR = 6;   // extra gap kept from bystanders and the snail's reach
const OVERSHOOT = 0.5;  // radians drawn past the start so the cord crosses itself
const WOBBLE = 0.03;    // radial wobble of the drawn circle, as a share of its radius
const REACTION = 0.4;   // seconds between the end of one stroke and the next look
const LIMIT_USE = 0.97; // the player plans loops at most this share of the limit
const OUTCOMES = ['advanced', 'unchanged', 'contents', 'threaded', 'open', 'snail', 'snapped'];

try {
  os.setPriority(0, os.constants.priority.PRIORITY_BELOW_NORMAL);
} catch {
  // Priority is a courtesy to the desktop; the measurement does not depend on it.
}

function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function installStubs() {
  const listeners = { window: {}, canvas: {} };
  const noop = () => {};
  const ctx = new Proxy({}, {
    get: (_, prop) => {
      if (prop === 'measureText') return () => ({ width: 10 });
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') return () => ({ addColorStop: noop });
      return noop;
    },
    set: () => true,
  });
  globalThis.window = { addEventListener: (type, fn) => { listeners.window[type] = fn; }, devicePixelRatio: 1 };
  // theme.js writes the chapter palette onto the root element when a level starts.
  globalThis.document = {
    querySelector: () => null,
    getElementById: () => null,
    addEventListener: noop,
    hidden: false,
    documentElement: { dataset: {}, style: { setProperty: noop, removeProperty: noop } },
  };
  const canvas = {
    width: 960,
    height: 640,
    getContext: () => ctx,
    addEventListener: (type, fn) => { listeners.canvas[type] = fn; },
    removeEventListener: noop,
    setPointerCapture: noop,
    releasePointerCapture: noop,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 640 }),
  };
  return { canvas, listeners };
}

function pointer(stubs, type, [x, y]) {
  const event = { pointerId: 1, isPrimary: true, button: 0, clientX: x, clientY: y, preventDefault() {} };
  if (type === 'pointerdown') stubs.listeners.canvas.pointerdown(event);
  else stubs.listeners.window[type](event);
}

const isLive = e => e.state === 'roaming';

function* candidateGroups(game) {
  const live = game.entities.filter(isLive);
  const fliers = live.filter(e => e.type === 'butterfly' || e.type === 'insect');
  const seeds = live.filter(e => e.type === 'seed');
  const progress = game.campaign.objectiveProgress;
  const left = key => (progress[key] ? progress[key].target - progress[key].current : 0);
  const specific = left('seedWing') + left('trio');

  if (left('seedWing') > 0) {
    for (const f of fliers) for (const s of seeds) yield [f, s];
  }
  if (left('trio') > 0) {
    for (let a = 0; a < fliers.length; a++) {
      for (let b = a + 1; b < fliers.length; b++) {
        for (let c = b + 1; c < fliers.length; c++) {
          if (new Set([fliers[a].kind, fliers[b].kind, fliers[c].kind]).size === 3) yield [fliers[a], fliers[b], fliers[c]];
        }
      }
    }
  }
  if (left('any') > specific || left('single') > 0 || left('pair') > 0) {
    for (let a = 0; a < fliers.length; a++) {
      for (let b = a + 1; b < fliers.length; b++) {
        if (fliers[a].kind === fliers[b].kind) yield [fliers[a], fliers[b]];
      }
    }
  }
}

function planLoop(members) {
  const cx = members.reduce((sum, m) => sum + m.x, 0) / members.length;
  const cy = members.reduce((sum, m) => sum + m.y, 0) / members.length;
  const R = Math.max(...members.map(m => Math.hypot(m.x - cx, m.y - cy) + m.radius)) + MARGIN;
  return { cx, cy, R, length: R * (Math.PI * 2 + OVERSHOOT) * (1 + WOBBLE / 2), members };
}

function isClean(loop, game) {
  const edge = 16;
  if (loop.cx - loop.R < edge || loop.cx + loop.R > game.width - edge) return false;
  if (loop.cy - loop.R < edge || loop.cy + loop.R > game.height - edge) return false;
  for (const e of game.entities) {
    if (loop.members.includes(e) || e.state === 'departing' || e.state === 'harmonizing') continue;
    const reach = e.type === 'hazard' ? e.radius + 3 : e.radius;
    if (Math.hypot(e.x - loop.cx, e.y - loop.cy) <= loop.R + reach + PATH_CLEAR) return false;
  }
  return true;
}

function pointOnStroke(stroke) {
  const r = stroke.R * (1 + WOBBLE * Math.sin(3 * stroke.theta + stroke.phase));
  return [stroke.cx + r * Math.cos(stroke.theta), stroke.cy + r * Math.sin(stroke.theta)];
}

const progressSum = game => Object.values(game.campaign.objectiveProgress).reduce((sum, o) => sum + o.current, 0);

function classify(game, before) {
  const text = game.feedbackBanner.text || '';
  if (text.startsWith('The cord snapped')) return 'snapped';
  if (text.startsWith('The snail broke')) return 'snail';
  if (text.startsWith('An insect was threaded')) return 'threaded';
  if (text.startsWith('Loop did not close')) return 'open';
  if (progressSum(game) > before.progress) return 'advanced';
  if (game.score > before.score) return 'unchanged';
  return 'contents';
}

function runVisit(stubs, visitId, limit, seed) {
  Math.random = mulberry32(seed);
  const game = new Game(stubs.canvas);
  const base = CAMPAIGN_LEVELS.find(l => l.id === visitId);
  if (!base) throw new Error(`Unknown visit ${visitId}`);
  game.initLevel({ ...base, id: `measure-${visitId}`, stringRules: true, maxCordLength: limit });
  game.state = 'PLAYING';

  const stats = { attempts: 0, outcomes: Object.fromEntries(OUTCOMES.map(k => [k, 0])), lengths: [], waitingTooLong: 0, completedAt: null };
  let t = 0;
  let idle = REACTION;
  let stroke = null;

  while (game.state === 'PLAYING') {
    if (game.victoryDelay > 0 && stats.completedAt === null) stats.completedAt = t;

    if (!stroke && game.victoryDelay <= 0) {
      idle += DT;
      if (idle >= REACTION) {
        let best = null;
        let tooLong = false;
        for (const members of candidateGroups(game)) {
          const loop = planLoop(members);
          if (!isClean(loop, game)) continue;
          if (loop.length > limit * LIMIT_USE) { tooLong = true; continue; }
          if (!best || loop.R < best.R) best = loop;
        }
        if (best) {
          stroke = { ...best, theta: 0, phase: Math.random() * Math.PI * 2, before: { score: game.score, progress: progressSum(game) } };
          game.feedbackBanner.text = '';
          stats.attempts++;
          stats.lengths.push(best.length);
          pointer(stubs, 'pointerdown', pointOnStroke(stroke));
        } else if (tooLong) {
          stats.waitingTooLong += DT;
        }
      }
    } else if (stroke) {
      const end = Math.PI * 2 + OVERSHOOT;
      stroke.theta = Math.min(end, stroke.theta + (SPEED / stroke.R) * DT);
      if (game.isDrawing) pointer(stubs, 'pointermove', pointOnStroke(stroke));
      if (!game.isDrawing || stroke.theta >= end) {
        if (game.isDrawing) pointer(stubs, 'pointerup', pointOnStroke(stroke));
        stats.outcomes[classify(game, stroke.before)]++;
        stroke = null;
        idle = 0;
      }
    }

    game.update(DT);
    t += DT;
  }
  stats.duration = base.durationSeconds;
  return stats;
}

const percentile = (values, p) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
};

const stubs = installStubs();
const startedAt = Date.now();
const report = { runs: RUNS, speed: SPEED, limits: LIMITS.map(l => (Number.isFinite(l) ? l : 'none')), visits: {} };

for (const visitId of VISITS) {
  report.visits[visitId] = [];
  for (const limit of LIMITS) {
    const runs = [];
    for (let seed = 1; seed <= RUNS; seed++) runs.push(runVisit(stubs, visitId, limit, seed));
    const completed = runs.filter(r => r.completedAt !== null);
    const attempts = runs.reduce((sum, r) => sum + r.attempts, 0);
    const outcomes = Object.fromEntries(OUTCOMES.map(k => [k, runs.reduce((sum, r) => sum + r.outcomes[k], 0)]));
    const lengths = runs.flatMap(r => r.lengths);
    report.visits[visitId].push({
      limit: Number.isFinite(limit) ? limit : 'none',
      completed: completed.length,
      medianCompletionSeconds: percentile(completed.map(r => r.completedAt), 0.5),
      attemptsPerVisit: attempts / runs.length,
      outcomeShare: Object.fromEntries(OUTCOMES.map(k => [k, attempts ? outcomes[k] / attempts : 0])),
      waitingForShorterLoopSeconds: runs.reduce((sum, r) => sum + r.waitingTooLong, 0) / runs.length,
      plannedLoopLengthP50: percentile(lengths, 0.5),
      plannedLoopLengthP90: percentile(lengths, 0.9),
      clockSeconds: runs[0].duration,
    });
  }
}
report.wallSeconds = (Date.now() - startedAt) / 1000;

if (JSON_OUT) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const pct = v => `${(v * 100).toFixed(0)}%`.padStart(4);
  const num = (v, d = 1) => (v === null ? '  -' : v.toFixed(d));
  console.log(`String sandbox measurement: ${RUNS} seeded runs per row, pointer ${SPEED} px/s, ${report.wallSeconds.toFixed(1)} s wall time`);
  for (const [visitId, rows] of Object.entries(report.visits)) {
    console.log(`\n${visitId} (${rows[0].clockSeconds} s clock), string rules`);
    console.log('limit  done  median s  tries  advanced unchanged contents threaded open snail snapped  wait s  loop p50/p90 px');
    for (const r of rows) {
      const o = r.outcomeShare;
      console.log(`${String(r.limit).padStart(5)}  ${String(r.completed).padStart(2)}/${RUNS}  ${num(r.medianCompletionSeconds).padStart(8)}  ${r.attemptsPerVisit.toFixed(1).padStart(5)}` +
        `  ${pct(o.advanced).padStart(8)} ${pct(o.unchanged).padStart(9)} ${pct(o.contents).padStart(8)} ${pct(o.threaded).padStart(8)}` +
        ` ${pct(o.open)} ${pct(o.snail).padStart(5)} ${pct(o.snapped).padStart(7)}  ${r.waitingForShorterLoopSeconds.toFixed(1).padStart(6)}` +
        `  ${num(r.plannedLoopLengthP50, 0)}/${num(r.plannedLoopLengthP90, 0)}`);
    }
  }
}
