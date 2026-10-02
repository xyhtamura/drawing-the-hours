/**
 * Drawing the Hours — Combination diagrams
 * Small canvas pictures of the figures the visits ask for: the cord shape
 * (one loop, a figure-eight, or an open trace) with the creatures that belong
 * in each pocket. The visit card and the Field Book both draw from this table,
 * so a figure looks the same wherever it is listed.
 *
 * Creatures are drawn by the game's own entity code, so a Brimstone here is the
 * Brimstone on the field.
 */

import { Insect, DandelionSeed } from './entities.js';
import { themeColor } from './theme.js';

// Loop: one pocket. Eight: two pockets crossed at the waist. Trace: open line.
// 'ghost' is any creature; the figure does not care which.
const LOOP = (...pocket) => ({ shape: 'loop', pockets: [pocket] });
const EIGHT = (a, b) => ({ shape: 'eight', pockets: [a, b] });

export const COMBO_DIAGRAMS = {
  any: { shape: 'both', parts: [LOOP('ghost', 'ghost'), EIGHT(['ghost'], ['ghost'])] },
  single: LOOP('ghost', 'ghost'),
  figure8: EIGHT(['ghost'], ['ghost']),
  pair: LOOP('brimstone', 'brimstone'),
  trio: LOOP('brimstone', 'damselfly', 'hawkmoth'),
  seedWing: LOOP('brimstone', 'seed'),
  seedTrio: LOOP('brimstone', 'damselfly', 'hawkmoth', 'seed'),
  nursery: EIGHT(['brimstone'], ['seed']),
  counterpartPair: EIGHT(['damselfly'], ['hawkmoth']),
  lacewingCounterpart: EIGHT(['lacewing'], ['damselfly']),
  twinSeedWing: EIGHT(['brimstone', 'seed'], ['brimstone', 'seed']),
  mixedEcho: EIGHT(['damselfly', 'hawkmoth'], ['damselfly', 'hawkmoth']),
  // Field Book only: two kindred pairs, one in each pocket.
  crossMeadow: EIGHT(['brimstone', 'brimstone'], ['damselfly', 'damselfly']),
  trace: { shape: 'trace', sequence: ['firefly', 'lacewing', 'firefly'] },
};

const HEADINGS = [-1.95, -1.25, -1.6, -1.1];
const CREATURE_REACH = 46; // body length the entity art occupies at scale 1

function drawCreature(ctx, token, x, y, size, index) {
  if (token === 'ghost') {
    ctx.save();
    ctx.fillStyle = themeColor('edge', '#d8ccb6');
    ctx.strokeStyle = themeColor('muted', '#8a7f70');
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath(); ctx.arc(x, y, size * 0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / CREATURE_REACH, size / CREATURE_REACH);
  if (token === 'seed') {
    const seed = new DandelionSeed(0, 0);
    seed.phase = 0; seed.tilt = 0.25; seed.alpha = 1;
    seed.draw(ctx);
  } else {
    const insect = new Insect(0, 0, token);
    insect.heading = HEADINGS[index % HEADINGS.length];
    insect.flapPhase = 0; // wings fully open
    insect.glowOffset = 1.5; // firefly between glows
    insect.lacePhase = 'rest'; // lacewing folded
    insect.draw(ctx);
  }
  ctx.restore();
}

function eightPath(ctx, cx, cy, rx, ry) {
  ctx.beginPath();
  for (let i = 0; i <= 48; i++) {
    const t = (i / 48) * Math.PI * 2;
    const px = cx + rx * Math.sin(t);
    const py = cy + ry * Math.sin(2 * t);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
}

function drawPockets(ctx, spec, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const rx = w / 2 - 2;
  const ry = h / 2 - 2;
  ctx.strokeStyle = themeColor('petite', '#ac647e');
  ctx.lineWidth = 1.8;
  ctx.lineJoin = 'round';

  if (spec.shape === 'loop') {
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
    placeRow(ctx, spec.pockets[0], cx, cy, rx * 1.75, h);
  } else {
    eightPath(ctx, cx, cy, rx, ry);
    ctx.stroke();
    // A lobe spans about rx across its middle; keep creatures inside the cord.
    placeRow(ctx, spec.pockets[0], cx - rx * 0.5, cy, rx * 0.8, h);
    placeRow(ctx, spec.pockets[1], cx + rx * 0.5, cy, rx * 0.8, h);
  }
}

function placeRow(ctx, tokens, cx, cy, span, h) {
  const n = tokens.length;
  const slot = span / n;
  const size = Math.min(h * 0.78, slot * 1.05);
  tokens.forEach((token, i) => {
    drawCreature(ctx, token, cx - span / 2 + slot * (i + 0.5), cy, size, i);
  });
}

function drawTrace(ctx, spec, w, h) {
  const xs = [0.2, 0.5, 0.8].map(f => f * w);
  const ys = [h * 0.62, h * 0.38, h * 0.62];
  ctx.strokeStyle = themeColor('petite', '#ac647e');
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(3, h * 0.3);
  ctx.bezierCurveTo(w * 0.08, h * 0.9, xs[0] - 6, ys[0] + 4, xs[0], ys[0]);
  ctx.bezierCurveTo(xs[0] + 14, ys[0] - 10, xs[1] - 14, ys[1] + 10, xs[1], ys[1]);
  ctx.bezierCurveTo(xs[1] + 14, ys[1] - 10, xs[2] - 14, ys[2] + 10, xs[2], ys[2]);
  ctx.lineTo(w - 3, h * 0.3);
  ctx.stroke();
  const size = Math.min(h * 0.74, w * 0.3);
  spec.sequence.forEach((token, i) => {
    drawCreature(ctx, token, xs[i], ys[i], size, i);
    // Numbered badge, as on the field.
    const bx = xs[i] - size * 0.42;
    const by = ys[i] - size * 0.42;
    ctx.fillStyle = themeColor('panel', '#fbf8ee');
    ctx.strokeStyle = themeColor('petite', '#ac647e');
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(bx, by, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = themeColor('ink', '#4a4235');
    ctx.font = '700 7px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), bx, by + 0.3);
  });
}

/**
 * Draw the diagram for `key` into the rectangle (0, 0, w, h) of the current
 * transform. Returns false when the key has no diagram.
 */
export function drawComboDiagram(ctx, key, w, h) {
  const spec = COMBO_DIAGRAMS[key];
  if (!spec) return false;
  ctx.save();
  if (spec.shape === 'both') {
    const half = w / 2;
    for (let i = 0; i < spec.parts.length; i++) {
      ctx.save();
      ctx.translate(i * half, 0);
      drawPockets(ctx, spec.parts[i], half - 3, h);
      ctx.restore();
    }
  } else if (spec.shape === 'trace') {
    drawTrace(ctx, spec, w, h);
  } else {
    drawPockets(ctx, spec, w, h);
  }
  ctx.restore();
  return true;
}

/**
 * Fill every `<canvas data-combo="key">` under `root`. The canvas keeps its
 * CSS size and is backed at the device pixel ratio. Call again after a colour
 * mode change.
 */
export function renderComboCanvases(root) {
  const dpr = globalThis.devicePixelRatio || 1;
  root.querySelectorAll('canvas[data-combo]').forEach(canvas => {
    const w = Number(canvas.dataset.w) || 160;
    const h = Number(canvas.dataset.h) || 60;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    drawComboDiagram(ctx, canvas.dataset.combo, w, h);
  });
}
