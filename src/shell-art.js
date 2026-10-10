import { CHAPTER_PALETTES } from './palettes.js';
import { paperBackdrop, onPapersArrived, paperTile, PAPER_USE } from './paper.js';
import { Insect } from './entities.js';

/**
 * Art for the title screen and the menu cards, made from the game's own
 * materials: the four hours as overlapping sheets of their papers, a cord loop
 * round the title, the six fliers, and the hour's paper on the cards.
 */

const HOURS = ['dawn', 'noon', 'dusk', 'midnight'];
const FLIERS = ['brimstone', 'damselfly', 'hawkmoth', 'hoverfly', 'lacewing', 'firefly'];

function lcg(seed) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** One hour's wash, pressed with that hour's paper, at the given pixel size. */
function hourSheet(hour, width, height) {
  const canvas = Object.assign(document.createElement('canvas'), { width, height });
  const ctx = canvas.getContext('2d');
  const p = CHAPTER_PALETTES[hour];
  const wash = ctx.createLinearGradient(0, 0, width, height);
  wash.addColorStop(0, p.top); wash.addColorStop(0.5, p.middle); wash.addColorStop(1, p.bottom);
  ctx.fillStyle = wash; ctx.fillRect(0, 0, width, height);
  // The same copy the field will use, so the title fetches nothing the game will not.
  paperBackdrop(canvas, hour, undefined, window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait');
  return canvas;
}

/** A wobbling closed loop round the centre, in logical units. */
function loopPath(ctx, cx, cy, rx, ry, rand) {
  const n = 12, wobble = Array.from({ length: n }, () => 0.93 + rand() * 0.14);
  const point = (i) => {
    // The tail overshoots the start, the way a drawn loop closes past itself.
    const a = -2.4 + (i / n) * Math.PI * 2, k = wobble[i % n] * (1 + i / n * 0.05);
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k];
  };
  ctx.beginPath();
  let [px, py] = point(0);
  ctx.moveTo(px, py);
  for (let i = 1; i <= n + 2; i++) {
    const [x, y] = point(i);
    ctx.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2);
    px = x; py = y;
  }
}

export function createTitleArt(canvas, panel) {
  const ctx = canvas.getContext('2d');
  let width = 0, height = 0, scale = 1, backdrop = null, bakeId = 0, running = false, start = 0;
  const fliers = FLIERS.map((kind, i) => Object.assign(new Insect(0, 0, kind), { lacePhase: 'travel', glowOffset: i * 0.5, turn: i / FLIERS.length }));

  function bake() {
    const id = ++bakeId;
    const w = canvas.width, h = canvas.height;
    const sheet = Object.assign(document.createElement('canvas'), { width: w, height: h });
    const sctx = sheet.getContext('2d');
    const flat = sctx.createLinearGradient(0, 0, w, 0);
    HOURS.forEach((hour, i) => flat.addColorStop((i + 0.5) / 4, CHAPTER_PALETTES[hour].middle));
    sctx.fillStyle = flat; sctx.fillRect(0, 0, w, h);
    backdrop = sheet;
    const slant = h * 0.16, band = w / 4, rand = lcg(31);
    // Sheets are laid one at a time so the page stays responsive while they bake.
    const lay = (i) => {
      if (id !== bakeId || i >= HOURS.length) return;
      const x0 = Math.floor(i * band - slant - 14 * scale), bw = Math.ceil(band + 2 * slant + 28 * scale);
      const paper = hourSheet(HOURS[i], bw, h);
      sctx.save();
      sctx.beginPath();
      // Torn left edge, leaning; the right side runs under the next sheet.
      const steps = 26;
      for (let s = 0; s <= steps; s++) {
        const y = (s / steps) * h;
        const x = i === 0 ? -20 : i * band + slant * (1 - 2 * s / steps) + (rand() - 0.5) * 9 * scale;
        if (s === 0) sctx.moveTo(x, y); else sctx.lineTo(x, y);
      }
      sctx.lineTo(w + 20, h); sctx.lineTo(w + 20, 0); sctx.closePath();
      if (i > 0) {
        sctx.shadowColor = 'rgba(30, 24, 20, 0.35)'; sctx.shadowBlur = 10 * scale; sctx.shadowOffsetX = -3 * scale;
        sctx.fillStyle = CHAPTER_PALETTES[HOURS[i]].middle; sctx.fill();
        sctx.shadowColor = 'transparent';
      }
      sctx.clip();
      sctx.drawImage(paper, x0, 0);
      if (i === HOURS.length - 1) sctx.drawImage(paper, x0 + bw - 2, 0);
      sctx.restore();
      if (i === HOURS.length - 1) cord(sctx);
      frame(performance.now());
      setTimeout(() => lay(i + 1), 0);
    };
    lay(0);
  }

  function cord(sctx) {
    const u = Math.min(width, height);
    sctx.save();
    sctx.scale(scale, scale);
    sctx.lineCap = 'round'; sctx.lineJoin = 'round';
    sctx.shadowColor = 'rgba(30, 24, 20, 0.4)'; sctx.shadowBlur = 4 * scale; sctx.shadowOffsetY = 2 * scale;
    sctx.strokeStyle = CHAPTER_PALETTES.dawn.balanced; sctx.lineWidth = Math.max(3, u * 0.007);
    loopPath(sctx, width / 2, height / 2, Math.min(width * 0.36, u * 0.62), u * 0.33, lcg(7));
    sctx.stroke();
    sctx.restore();
  }

  function frame(now) {
    const t = (now - start) / 1000;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (backdrop) ctx.drawImage(backdrop, 0, 0);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    const u = Math.min(width, height), size = Math.max(1, u / 420);
    const rx = Math.min(width * 0.42, u * 0.74), ry = u * 0.41;
    for (const flier of fliers) {
      // Each flier circles outside the loop at its own pace, drifting in and out.
      const pace = 0.05 + flier.turn * 0.02;
      const at = (time) => {
        const a = (flier.turn + time * pace) * Math.PI * 2;
        const k = 1 + 0.09 * Math.sin(time * 0.6 + flier.turn * 20);
        return [width / 2 + Math.cos(a) * rx * k, height / 2 + Math.sin(a) * ry * k];
      };
      const [x, y] = at(t), [nx, ny] = at(t + 0.05);
      flier.heading = Math.atan2(ny - y, nx - x);
      flier.flapPhase = t * flier.config.flutterFreq * 0.35 + flier.turn * 9;
      flier.stateTime = t;
      ctx.save(); ctx.translate(x, y); ctx.scale(size, size);
      flier.x = 0; flier.y = 0; flier.draw(ctx);
      ctx.restore();
    }
  }

  function tick(now) {
    if (panel.hidden) { running = false; return; }
    frame(now);
    requestAnimationFrame(tick);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    scale = Math.min(2, window.devicePixelRatio || 1);
    width = rect.width; height = rect.height;
    canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
    bake();
  }

  start = performance.now();
  resize();
  window.addEventListener('resize', () => { if (!panel.hidden) resize(); });
  onPapersArrived(() => { if (!panel.hidden) bake(); });
  const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!still && !running) { running = true; requestAnimationFrame(tick); }
  return { resize, frame };
}

/** A seamless CSS tile of the hour's paper in the given colour, as a data URL. */
function cardPaper(color, hour) {
  const tile = paperTile('card', color, { ...PAPER_USE.backdrop[hour], relief: 0.011 });
  if (!tile) return null;
  const n = tile.canvas.width;
  const out = Object.assign(document.createElement('canvas'), { width: n * 2, height: n * 2 });
  const ctx = out.getContext('2d');
  // Mirror the tile in both axes so its edges meet themselves.
  for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    ctx.setTransform(sx, 0, 0, sy, n, n);
    ctx.drawImage(tile.canvas, 0, 0);
  }
  return out.toDataURL('image/jpeg', 0.9);
}

/** Dresses the menu cards: the hour's paper, the strip of four hours, and a flier on each button. */
export function dressMenus(root = document) {
  const html = document.documentElement;
  const refresh = () => {
    const hour = HOURS.includes(html.dataset.hour) ? html.dataset.hour : 'dawn';
    const panel = getComputedStyle(html).getPropertyValue('--panel-bg').trim() || '#fdfbf7';
    const url = cardPaper(panel, hour);
    if (url) html.style.setProperty('--paper-card', `url(${url})`);
    else html.style.removeProperty('--paper-card');
    for (const strip of root.querySelectorAll('.hour-strip')) {
      strip.replaceChildren(...HOURS.map((h) => {
        const p = CHAPTER_PALETTES[h];
        const chip = document.createElement('span');
        chip.style.background = `linear-gradient(135deg, ${p.top}, ${p.middle} 55%, ${p.bottom})`;
        if (h === hour) chip.className = 'now';
        return chip;
      }));
    }
    for (const icon of root.querySelectorAll('canvas.menu-icon')) {
      const ctx = icon.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, icon.width, icon.height);
      ctx.translate(icon.width / 2, icon.height / 2);
      const k = icon.width / 62;
      ctx.scale(k, k);
      const flier = Object.assign(new Insect(0, 0, icon.dataset.creature), { heading: -Math.PI / 2 + 0.35, lacePhase: 'travel', flapPhase: 0.5 });
      flier.draw(ctx);
    }
  };
  new MutationObserver(refresh).observe(html, { attributes: true, attributeFilter: ['data-hour', 'data-color-mode'] });
  onPapersArrived(refresh);
  refresh();
  return refresh;
}
