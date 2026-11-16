/**
 * Render timing for the game page. Run it from the console of
 * http://localhost:8000/drawing-the-hours/index.html?dev :
 *
 *   const perf = await import('/drawing-the-hours/test/perf_render.js');
 *   await perf.measure({ dpr: 2, levels: ['dawn-03', 'noon-04'], frames: 60 });
 *
 * Each level is started, stepped for `settle` updates, then rendered `frames`
 * times under each paper setting. A one-pixel readback after every render
 * makes the browser finish the frame, so the time covers rasterising and not
 * only recording the draw calls. Times are milliseconds per frame (median).
 * The page's own animation loop keeps running, so read differences, not
 * absolute values.
 */
import { paperStyle, paperChanged } from '../src/paper.js';

const MODES = {
  full: { textures: true, shadows: true },
  texturesOnly: { textures: true, shadows: false },
  flat: { textures: false, shadows: false },
};

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/** Counts the fills one render issues, and how many of them carry a blurred shadow. */
function countFills(game) {
  const ctx = game.ctx, proto = Object.getPrototypeOf(ctx);
  let fills = 0, shadowed = 0, images = 0;
  ctx.fill = function (...args) { fills++; if (this.shadowBlur > 0 && this.shadowColor !== 'rgba(0, 0, 0, 0)') shadowed++; return proto.fill.apply(this, args); };
  ctx.drawImage = function (...args) { images++; return proto.drawImage.apply(this, args); };
  game.render();
  delete ctx.fill; delete ctx.drawImage;
  return { fills, shadowed, images };
}

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * sheet: share of the visit's time to mark as passed, so the hour sheet is on
 * the field; 0 leaves the clock where the visit starts. Image loads need the
 * event loop, so the function waits after each change of size or setting; in a
 * hidden tab each wait takes about a second.
 */
export async function measure({ game = globalThis.game, dpr = game.dpr, levels = ['dawn-01'], frames = 60, settle = 180, warm = 30, sheet = 0.5, modes = Object.keys(MODES) } = {}) {
  const before = { ...paperStyle, dpr: game.dpr };
  game.dpr = dpr; game.resize();
  const hold = () => { game.state = 'PLAYING'; };
  const rows = [];
  for (const id of levels) {
    game.startLevel(id);
    hold();
    for (let i = 0; i < settle; i++) { game.update(1 / 60); hold(); }
    if (sheet > 0 && !game.isUntimed()) {
      game.harmoniesCount = Math.max(1, game.harmoniesCount);
      game.clock.remainingSeconds = game.clock.totalSeconds * (1 - sheet);
    }
    const row = { level: id, entities: game.entities.length };
    for (const mode of modes) {
      Object.assign(paperStyle, MODES[mode]);
      paperChanged();
      game.render();
      await pause(250);
      // Warm caches, advancing the animation so every pose in use gets seen.
      for (let i = 0; i < warm; i++) { game.update(1 / 60); hold(); game.render(); }
      game.ctx.getImageData(0, 0, 1, 1);
      await pause(50);
      const times = [];
      for (let i = 0; i < frames; i++) {
        game.update(1 / 60); hold();
        const start = performance.now();
        game.render();
        game.ctx.getImageData(0, 0, 1, 1);
        times.push(performance.now() - start);
      }
      row[mode] = +median(times).toFixed(2);
      if (mode === 'full') Object.assign(row, countFills(game));
    }
    rows.push(row);
  }
  Object.assign(paperStyle, { textures: before.textures, shadows: before.shadows });
  paperChanged();
  game.dpr = before.dpr; game.resize();
  return rows;
}
