import { bumpThemeVersion, getColorMode } from './theme.js';
import { CHAPTER_PALETTES } from './palettes.js';
import { BAKED_BACKDROPS } from './backdrops.js';

/**
 * Paper textures for fills and backdrops.
 *
 * A texture contributes its relief, not its colour. Each source image is
 * reduced to per-pixel OKLab residuals around its own mean, and a fill is
 * rebuilt around the colour the draw site asked for:
 *
 *   relief  lightness swing, in OKLab L, for one standard deviation of relief
 *   keep    how much of the texture's own hue and chroma variation survives,
 *           rotated so its mean hue lands on the target hue
 *   split   degrees of hue shift between creases and highlights
 *
 * keep = 0 and split = 0 gives a single-hue tint. The other two terms are what
 * stop a recoloured texture from reading as one flat hue.
 *
 * A texture is fetched the first time something asks for it. Without a DOM, or
 * until its image has loaded, every function falls back to the flat colour and
 * the outline, so Node suites see the original draw calls.
 */

// contact: the soft ellipse under a flier, which the cut-paper shadow replaces.
export const paperStyle = { textures: true, outlines: false, shadows: true, contact: false };

// file: what the game loads from assets/textures/. source: its master in textures/.
// scripts/compress_textures.py reads this table and writes one from the other.
// scale: logical units per source pixel when the texture is used as a fill tile.
// grey: the compressed copy drops colour; only for textures used with keep 0.
export const PAPERS = {
  mulberry: { file: 'SB012.webp', source: 'SB012.JPG', scale: 0.3 },
  crepe: { file: 'SB013.webp', source: 'SB013.JPG', scale: 0.3 },
  tissue: { file: 'SB034.webp', source: 'SB034.JPG', scale: 0.18 },
  tissueGold: { file: 'SB035.webp', source: 'SB035.JPG', scale: 0.18 },
  lace: { file: 'cip60062.jpg', source: 'cip60062.jpg', scale: 0.34 },
  coir: { file: 'cip60095.jpg', source: 'cip60095.jpg', scale: 0.34 },
  fibre: { file: 'cip60097.jpg', source: 'cip60097.jpg', scale: 0.34 },
  leafFleck: { file: 'cit60069.jpg', source: 'cit60069.jpg', scale: 0.34 },
  canvas: { file: 'CANVAS10.JPG', source: 'CANVAS10.JPG', scale: 0.7 },
  strands: { file: 'STRANDS2.JPG', source: 'STRANDS2.JPG', scale: 1.28 },
  asphalt: { file: 'asphalt.webp', source: 'asphalt.png', scale: 0.3 },
  glass: { file: 'glass.webp', source: 'glass.png', scale: 0.14, grey: true },
  plastic: { file: 'plastic.webp', source: 'plastic.png', scale: 0.12, grey: true },
  metal: { file: 'metal.webp', source: 'metal.png', scale: 0.12 },
  rubber: { file: 'rubber.webp', source: 'rubber.png', scale: 0.3 },
};

// Role → texture and recolour settings. Tuned in texture-lab.html.
// mid: where the wash's middle colour sits along the diagonal. After changing a
// backdrop line, run scripts/bake_backdrops.py; until then the game presses that
// backdrop at runtime instead of using the baked file.
export const PAPER_USE = {
  backdrop: {
    dawn: { paper: 'asphalt', relief: 0.03, keep: 0.8, split: 10, mid: 0.42 },
    noon: { paper: 'glass', relief: 0.024, keep: 0, split: 12, mid: 0.65 },
    dusk: { paper: 'plastic', relief: 0.035, keep: 0, split: 16, mid: 0.5 },
    midnight: { paper: 'metal', relief: 0.05, keep: 0.5, split: 14, mid: 0.5 },
    none: { paper: 'mulberry', relief: 0.02, keep: 0.5, split: 8, mid: 0.5 },
  },
  default: { paper: 'mulberry', relief: 0.05, keep: 0.6, split: 12 },
  brimstone: { paper: 'tissueGold', relief: 0.055, keep: 0.7, split: 14 },
  hawkmoth: { paper: 'tissue', relief: 0.055, keep: 0.7, split: 16 },
  damselfly: { paper: 'lace', relief: 0.05, keep: 0.8, split: 18 },
  hoverfly: { paper: 'lace', relief: 0.04, keep: 0.6, split: 12 },
  lacewing: { paper: 'fibre', relief: 0.05, keep: 0.6, split: 14 },
  firefly: { paper: 'canvas', relief: 0.045, keep: 0.4, split: 12 },
  body: { paper: 'coir', relief: 0.05, keep: 0.6, split: 12 },
  leaf: { paper: 'crepe', relief: 0.05, keep: 0.7, split: 16 },
  shell: { paper: 'coir', relief: 0.05, keep: 0.6, split: 12 },
  petal: { paper: 'mulberry', relief: 0.04, keep: 0.6, split: 12 },
};

const TILE = 128;        // logical units covered by one fill tile
const TILE_BAKE = 2;     // tile pixels per logical unit
const BACKDROP_MAX = 1024; // longest backdrop side worked on, in pixels
const SOURCE_MAX = 1280;   // longest side kept of a source image
const hasDom = typeof document !== 'undefined' && typeof Image !== 'undefined';

const sources = new Map();   // paper name → HTMLImageElement, once loaded
const loading = new Map();   // paper name → Promise<boolean>, once requested
const baked = new Map();     // baked file name → HTMLImageElement, or false if it failed
const listeners = new Set();
let announce = 0;
const tileData = new Map();  // paper name → residuals for the fill tile
const tiles = new Map();     // `${paper}|${color}|${settings}` → { canvas, pattern }
let version = 0;

export function paperVersion() { return version; }
export function paperReady(name) { return sources.has(name); }

/** Call after editing PAPER_USE or paperStyle so cached art is rebuilt. */
export function paperChanged() {
  tiles.clear();
  clearShadowSprites();
  version++;
  bumpThemeVersion();
}

/** Large sources are reduced once on load, so each bake starts from a small image. */
function shrunk(image) {
  const k = SOURCE_MAX / Math.max(image.naturalWidth, image.naturalHeight);
  if (k >= 1) return image;
  const canvas = Object.assign(document.createElement('canvas'), { width: Math.round(image.naturalWidth * k), height: Math.round(image.naturalHeight * k) });
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return Object.assign(canvas, { naturalWidth: canvas.width, naturalHeight: canvas.height });
}

/** Fetches one texture, once. Resolves false if it cannot be loaded. */
export function loadPaper(name) {
  if (!hasDom || !PAPERS[name]) return Promise.resolve(false);
  let pending = loading.get(name);
  if (!pending) {
    pending = new Promise((resolve) => {
      const image = new Image();
      image.onload = () => { sources.set(name, shrunk(image)); arrived(); resolve(true); };
      image.onerror = () => resolve(false);
      image.src = new URL(`../assets/textures/${PAPERS[name].file}`, import.meta.url).href;
    });
    loading.set(name, pending);
  }
  return pending;
}

/** Textures that land close together are announced once, so cached art is rebuilt once. */
function arrived() {
  clearTimeout(announce);
  announce = setTimeout(() => {
    version++;
    bumpThemeVersion();
    for (const listener of listeners) listener();
  }, 80);
}

/** Calls back after textures arrive. Art that drew a fallback redraws from here. */
export function onPapersArrived(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Every texture in the table. The game never needs this; the lab does. */
export function loadAllPapers() {
  return Promise.all(Object.keys(PAPERS).map(loadPaper)).then((results) => results.every(Boolean));
}

/** The loaded source for a texture, or null after asking for it. */
function sourceFor(name) {
  const image = sources.get(name);
  if (!image) loadPaper(name);
  return image ?? null;
}

// --- OKLab ---------------------------------------------------------------

const TO_LINEAR = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  const c = i / 255;
  TO_LINEAR[i] = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
const TO_SRGB = new Uint8ClampedArray(4097);
for (let i = 0; i <= 4096; i++) {
  const c = i / 4096;
  TO_SRGB[i] = Math.round(255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055));
}

/** Writes OKLab for every pixel of an RGBA buffer into `lab` (3 floats per pixel). */
function toLab(rgba, lab) {
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
    const r = TO_LINEAR[rgba[i]], g = TO_LINEAR[rgba[i + 1]], b = TO_LINEAR[rgba[i + 2]];
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    lab[j] = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
    lab[j + 1] = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    lab[j + 2] = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  }
}

function writeLab(out, i, L, a, b) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  out[i] = TO_SRGB[r <= 0 ? 0 : r >= 1 ? 4096 : (r * 4096) | 0];
  out[i + 1] = TO_SRGB[g <= 0 ? 0 : g >= 1 ? 4096 : (g * 4096) | 0];
  out[i + 2] = TO_SRGB[bl <= 0 ? 0 : bl >= 1 ? 4096 : (bl * 4096) | 0];
}

/**
 * Reduces a texture to residuals around its mean: relief in standard
 * deviations of lightness, and the a/b offsets that carry its own hue variation.
 */
function residuals(rgba) {
  const n = rgba.length / 4;
  const lab = new Float32Array(n * 3);
  toLab(rgba, lab);
  let mL = 0, ma = 0, mb = 0;
  for (let j = 0; j < lab.length; j += 3) { mL += lab[j]; ma += lab[j + 1]; mb += lab[j + 2]; }
  mL /= n; ma /= n; mb /= n;
  let variance = 0;
  for (let j = 0; j < lab.length; j += 3) variance += (lab[j] - mL) ** 2;
  const sd = Math.sqrt(variance / n) || 1;
  for (let j = 0; j < lab.length; j += 3) {
    lab[j] = Math.max(-3, Math.min(3, (lab[j] - mL) / sd));
    lab[j + 1] -= ma; lab[j + 2] -= mb;
  }
  return { res: lab, hue: Math.hypot(ma, mb) > 0.015 ? Math.atan2(mb, ma) : null };
}

/**
 * Rebuilds a texture around target colours. `target` holds OKLab per pixel,
 * or three floats for one colour. Writes RGB into `out`; alpha is left alone.
 */
function recolor({ res, hue }, target, settings, out) {
  const { relief, keep, split } = settings;
  const constant = target.length === 3;
  const splitRad = split * Math.PI / 180 / 2;
  const hueCos = hue === null ? 1 : Math.cos(hue), hueSin = hue === null ? 0 : Math.sin(hue);
  for (let j = 0, i = 0; j < res.length; j += 3, i += 4) {
    const t = constant ? 0 : j;
    const r = res[j];
    let a = target[t + 1], b = target[t + 2];
    // Creases turn one way round the hue wheel and gain chroma; highlights turn the other way and lose it.
    const half = r < -2 ? -1 : r > 2 ? 1 : r / 2;
    const turn = -splitRad * half;
    const gain = 1 - 0.25 * half;
    const cosT = 1 - turn * turn / 2, sinT = turn - turn * turn * turn / 6;
    const ta = (a * cosT - b * sinT) * gain, tb = (a * sinT + b * cosT) * gain;
    a = ta; b = tb;
    if (keep) {
      // Carry the texture's own hue variation across, turned to sit on the target hue.
      // Cosine and sine of (target hue − texture hue), taken from the vectors rather than the angles.
      const ua = target[t + 1], ub = target[t + 2], chroma = Math.sqrt(ua * ua + ub * ub);
      const flat = hue === null || chroma < 0.01;
      const c = flat ? 1 : (ua * hueCos + ub * hueSin) / chroma, s = flat ? 0 : (ub * hueCos - ua * hueSin) / chroma;
      a += keep * (res[j + 1] * c - res[j + 2] * s);
      b += keep * (res[j + 1] * s + res[j + 2] * c);
    }
    writeLab(out, i, Math.max(0, Math.min(1, target[t] + relief * r)), a, b);
  }
}

// --- Colour parsing ------------------------------------------------------

let probe = null;
const parsed = new Map();
function parseColor(color) {
  let hit = parsed.get(color);
  if (hit) return hit;
  probe ??= Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true });
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = '#000'; probe.fillStyle = color; probe.fillRect(0, 0, 1, 1);
  const px = probe.getImageData(0, 0, 1, 1).data;
  const alpha = px[3] / 255;
  // Undo premultiplication so translucent colours keep their hue.
  const rgba = new Uint8ClampedArray([px[0], px[1], px[2], 255]);
  if (alpha > 0 && alpha < 1) {
    const m = /rgba?\(([^)]+)\)/.exec(probe.fillStyle);
    if (m) { const p = m[1].split(',').map(Number); rgba[0] = p[0]; rgba[1] = p[1]; rgba[2] = p[2]; }
  }
  const lab = new Float32Array(3);
  toLab(rgba, lab);
  hit = { lab, alpha };
  parsed.set(color, hit);
  return hit;
}

// --- Fill tiles ----------------------------------------------------------

function tileResiduals(name) {
  let data = tileData.get(name);
  if (data) return data;
  const image = sourceFor(name);
  if (!image) return null;
  const size = TILE * TILE_BAKE;
  const region = Math.min(size / (PAPERS[name].scale * TILE_BAKE), image.naturalWidth, image.naturalHeight);
  const canvas = Object.assign(document.createElement('canvas'), { width: size, height: size });
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, (image.naturalWidth - region) / 2, (image.naturalHeight - region) / 2, region, region, 0, 0, size, size);
  data = residuals(ctx.getImageData(0, 0, size, size).data);
  tileData.set(name, data);
  return data;
}

function settingsFor(role) {
  return PAPER_USE[role] ?? PAPER_USE.default;
}

/** A tinted tile canvas for this role and colour, or null when the texture is unavailable. */
export function paperTile(role, color, override) {
  if (!hasDom || !paperStyle.textures) return null;
  const settings = override ?? settingsFor(role);
  const key = `${settings.paper}|${color}|${settings.relief}|${settings.keep}|${settings.split}`;
  let tile = tiles.get(key);
  if (tile) return tile;
  const data = tileResiduals(settings.paper);
  if (!data) return null;
  const size = TILE * TILE_BAKE;
  const canvas = Object.assign(document.createElement('canvas'), { width: size, height: size });
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(size, size);
  const { lab, alpha } = parseColor(color);
  recolor(data, lab, settings, image.data);
  const a = Math.round(alpha * 255);
  for (let i = 3; i < image.data.length; i += 4) image.data[i] = a;
  ctx.putImageData(image, 0, 0);
  tile = { canvas, pattern: null, alpha };
  tiles.set(key, tile);
  return tile;
}

/** The role's tile for this colour with its fill pattern made, or null when the texture is unavailable. */
function patternTile(ctx, role, color) {
  if (typeof color !== 'string' || typeof ctx.createPattern !== 'function') return null;
  const tile = paperTile(role, color);
  if (!tile) return null;
  if (!tile.pattern) {
    tile.pattern = ctx.createPattern(tile.canvas, 'repeat');
    // Centre a tile on the local origin so a creature's shapes do not straddle a tile seam.
    tile.pattern?.setTransform?.(new DOMMatrix().translate(-TILE / 2, -TILE / 2).scale(1 / TILE_BAKE));
  }
  return tile.pattern ? tile : null;
}

function patternFor(ctx, role, color) {
  return patternTile(ctx, role, color)?.pattern ?? null;
}

/*
 * Cut-paper shadows from stored images.
 *
 * A blurred canvas shadow is rasterised again on every fill, and it is the
 * most expensive thing a frame of the game asks for. A shape's shadow depends
 * only on its outline, so it is blurred once into a small image and stamped
 * from then on.
 *
 * trackPaths(ctx) makes a context keep a copy of the path being built. When
 * paperShape is asked to fill a path it has a copy of, it looks the outline up
 * and draws the stored shadow, offset on screen exactly as the canvas shadow
 * was. A path that is new is blurred directly, as before, and stored the
 * second time it is seen, so an outline that changes on every frame is never
 * stored. Contexts that are not tracked, and paths too long or built across a
 * change of transform, also take the direct route.
 */
const SHADOW_RGB = '38, 30, 26', SHADOW_ALPHA = 0.3;
const SHADOW_BLUR = 2.4, SHADOW_DX = 1, SHADOW_DY = 1.6;   // in units of the drawing scale
const PATH_MAX = 192;            // numbers kept per path; a longer path is not stored
const SPRITE_SIDE_MAX = 512;     // pixels; a larger shadow is not stored
const SPRITE_COUNT_MAX = 600;
const SCALE_STEP = Math.log(1.25); // images are made at scales 1.25 apart, rounded up
const tracked = new WeakMap();   // context → the copy of its current path
const shadowSprites = new Map(); // outline, scale and opacity → { image, x, y, w, h, used }
const seenOnce = new Map();      // the same key → the call it was first seen on
const shadowCounts = { stamped: 0, stored: 0, direct: 0 };
let shadowCall = 0;

// Path commands, by the code each is copied under.
const MOVE = 1, LINE = 2, QUAD = 3, CUBIC = 4, ARC = 5, ELLIPSE = 6, RECT = 7, CLOSE = 8;

/** Counts since the last reset, and how many shadows are held. For tests and timing. */
export function paperShadowStats(reset = false) {
  const stats = { ...shadowCounts, held: shadowSprites.size };
  if (reset) shadowCounts.stamped = shadowCounts.stored = shadowCounts.direct = 0;
  return stats;
}

function clearShadowSprites() {
  for (const sprite of shadowSprites.values()) sprite.image.close?.();
  shadowSprites.clear();
  seenOnce.clear();
}

/** Makes a context keep a copy of its current path, so paperShape can stamp stored shadows on it. */
export function trackPaths(ctx) {
  if (!hasDom || !ctx || tracked.has(ctx) || typeof ctx.getTransform !== 'function') return;
  const proto = Object.getPrototypeOf(ctx);
  const data = new Float64Array(PATH_MAX);
  const path = { data, words: new Int32Array(data.buffer), n: 0, ok: true, proto };
  tracked.set(ctx, path);
  const room = (count) => {
    if (path.ok && path.n + count > PATH_MAX) path.ok = false;
    return path.ok;
  };
  ctx.beginPath = function () { path.n = 0; path.ok = true; proto.beginPath.call(this); };
  ctx.moveTo = function (x, y) {
    if (room(3)) { data[path.n++] = MOVE; data[path.n++] = x; data[path.n++] = y; }
    proto.moveTo.call(this, x, y);
  };
  ctx.lineTo = function (x, y) {
    if (room(3)) { data[path.n++] = LINE; data[path.n++] = x; data[path.n++] = y; }
    proto.lineTo.call(this, x, y);
  };
  ctx.quadraticCurveTo = function (cx, cy, x, y) {
    if (room(5)) { data[path.n++] = QUAD; data[path.n++] = cx; data[path.n++] = cy; data[path.n++] = x; data[path.n++] = y; }
    proto.quadraticCurveTo.call(this, cx, cy, x, y);
  };
  ctx.bezierCurveTo = function (ax, ay, bx, by, x, y) {
    if (room(7)) {
      data[path.n++] = CUBIC; data[path.n++] = ax; data[path.n++] = ay; data[path.n++] = bx; data[path.n++] = by; data[path.n++] = x; data[path.n++] = y;
    }
    proto.bezierCurveTo.call(this, ax, ay, bx, by, x, y);
  };
  ctx.arc = function (x, y, r, from, to, anticlockwise = false) {
    if (room(7)) {
      data[path.n++] = ARC; data[path.n++] = x; data[path.n++] = y; data[path.n++] = r; data[path.n++] = from; data[path.n++] = to; data[path.n++] = anticlockwise ? 1 : 0;
    }
    proto.arc.call(this, x, y, r, from, to, anticlockwise);
  };
  ctx.ellipse = function (x, y, rx, ry, turn, from, to, anticlockwise = false) {
    if (room(9)) {
      data[path.n++] = ELLIPSE; data[path.n++] = x; data[path.n++] = y; data[path.n++] = rx; data[path.n++] = ry;
      data[path.n++] = turn; data[path.n++] = from; data[path.n++] = to; data[path.n++] = anticlockwise ? 1 : 0;
    }
    proto.ellipse.call(this, x, y, rx, ry, turn, from, to, anticlockwise);
  };
  ctx.rect = function (x, y, w, h) {
    if (room(5)) { data[path.n++] = RECT; data[path.n++] = x; data[path.n++] = y; data[path.n++] = w; data[path.n++] = h; }
    proto.rect.call(this, x, y, w, h);
  };
  ctx.closePath = function () {
    if (room(1)) data[path.n++] = CLOSE;
    proto.closePath.call(this);
  };
  // Commands with no copy made, and a transform changed part-way through a path:
  // the copy would no longer describe the path, so it is not used.
  const spoils = (name, always) => {
    const native = proto[name];
    if (typeof native !== 'function') return;
    ctx[name] = function (...args) {
      if (always || path.n > 0) path.ok = false;
      return native.apply(this, args);
    };
  };
  for (const name of ['arcTo', 'roundRect']) spoils(name, true);
  for (const name of ['translate', 'rotate', 'scale', 'transform', 'setTransform', 'resetTransform', 'restore', 'reset']) spoils(name, false);
}

function replayPath(path, ctx) {
  const d = path.data;
  ctx.beginPath();
  for (let i = 0; i < path.n;) {
    switch (d[i]) {
      case MOVE: ctx.moveTo(d[i + 1], d[i + 2]); i += 3; break;
      case LINE: ctx.lineTo(d[i + 1], d[i + 2]); i += 3; break;
      case QUAD: ctx.quadraticCurveTo(d[i + 1], d[i + 2], d[i + 3], d[i + 4]); i += 5; break;
      case CUBIC: ctx.bezierCurveTo(d[i + 1], d[i + 2], d[i + 3], d[i + 4], d[i + 5], d[i + 6]); i += 7; break;
      case ARC: ctx.arc(d[i + 1], d[i + 2], d[i + 3], d[i + 4], d[i + 5], d[i + 6] === 1); i += 7; break;
      case ELLIPSE: ctx.ellipse(d[i + 1], d[i + 2], d[i + 3], d[i + 4], d[i + 5], d[i + 6], d[i + 7], d[i + 8] === 1); i += 9; break;
      case RECT: ctx.rect(d[i + 1], d[i + 2], d[i + 3], d[i + 4]); i += 5; break;
      default: ctx.closePath(); i += 1;
    }
  }
}

/** A box that holds the path: control points for curves, the full circle for arcs. */
function pathBounds(path) {
  const d = path.data;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const point = (x, y) => { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; };
  for (let i = 0; i < path.n;) {
    switch (d[i]) {
      case MOVE: case LINE: point(d[i + 1], d[i + 2]); i += 3; break;
      case QUAD: point(d[i + 1], d[i + 2]); point(d[i + 3], d[i + 4]); i += 5; break;
      case CUBIC: point(d[i + 1], d[i + 2]); point(d[i + 3], d[i + 4]); point(d[i + 5], d[i + 6]); i += 7; break;
      case ARC: { const r = Math.abs(d[i + 3]); point(d[i + 1] - r, d[i + 2] - r); point(d[i + 1] + r, d[i + 2] + r); i += 7; break; }
      case ELLIPSE: { const r = Math.max(Math.abs(d[i + 3]), Math.abs(d[i + 4])); point(d[i + 1] - r, d[i + 2] - r); point(d[i + 1] + r, d[i + 2] + r); i += 9; break; }
      case RECT: point(d[i + 1], d[i + 2]); point(d[i + 1] + d[i + 3], d[i + 2] + d[i + 4]); i += 5; break;
      default: i += 1;
    }
  }
  return [x0, y0, x1, y1];
}

/** Blurs the path's shadow once, at `scale` pixels per unit, into an image placed in the path's own units. */
function bakeShadow(path, scale, alpha) {
  const [x0, y0, x1, y1] = pathBounds(path);
  if (![x0, y0, x1, y1].every(Number.isFinite)) return null;
  const pad = SHADOW_BLUR * 2 + 1;
  const width = Math.ceil((x1 - x0 + 2 * pad) * scale), height = Math.ceil((y1 - y0 + 2 * pad) * scale);
  if (width < 1 || height < 1 || width > SPRITE_SIDE_MAX || height > SPRITE_SIDE_MAX) return null;
  const canvas = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(width, height) : Object.assign(document.createElement('canvas'), { width, height });
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  // The shape itself is drawn off the canvas, and its shadow is thrown back onto it.
  const away = width + 64;
  ctx.setTransform(scale, 0, 0, scale, (pad - x0) * scale - away, (pad - y0) * scale);
  ctx.shadowColor = `rgba(${SHADOW_RGB}, ${SHADOW_ALPHA})`;
  ctx.shadowBlur = SHADOW_BLUR * scale;
  ctx.shadowOffsetX = away;
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
  replayPath(path, ctx);
  ctx.fill();
  const image = typeof canvas.transferToImageBitmap === 'function' ? canvas.transferToImageBitmap() : canvas;
  return { image, x: x0 - pad, y: y0 - pad, w: width / scale, h: height / scale, used: shadowCall };
}

function dropStaleSprites() {
  for (const [key, sprite] of shadowSprites) {
    if (shadowCall - sprite.used > 20000) { sprite.image.close?.(); shadowSprites.delete(key); }
  }
  if (shadowSprites.size >= SPRITE_COUNT_MAX) clearShadowSprites();
}

/** The stored shadow for the context's current path under transform `m`, or null to blur it directly. */
function shadowSprite(ctx, m, alpha) {
  const path = tracked.get(ctx);
  if (!path) return null;
  shadowCall++;
  if (!path.ok || path.n === 0) return null;
  const axis = Math.max(Math.hypot(m.a, m.b), Math.hypot(m.c, m.d));
  if (!(axis > 0.05 && axis < 12)) return null;
  const step = Math.ceil(Math.log(axis) / SCALE_STEP - 1e-6);
  let h1 = 0x811c9dc5 ^ step, h2 = 0x9e3779b9 ^ Math.round(alpha * 255);
  const words = path.words;
  for (let i = 0, end = path.n * 2; i < end; i++) {
    const v = words[i];
    h1 = Math.imul(h1 ^ v, 0x01000193); h1 ^= h1 >>> 15;
    h2 = Math.imul(h2 + v, 0x85ebca6b); h2 ^= h2 >>> 13;
  }
  const key = (h1 >>> 11) * 4294967296 + (h2 >>> 0);
  let sprite = shadowSprites.get(key);
  if (sprite) { sprite.used = shadowCall; shadowCounts.stamped++; return sprite; }
  const first = seenOnce.get(key);
  if (first === undefined || shadowCall - first > 5000) {
    if (seenOnce.size > 4000) seenOnce.clear();
    seenOnce.set(key, shadowCall);
    return null;
  }
  seenOnce.delete(key);
  if (shadowSprites.size >= SPRITE_COUNT_MAX) dropStaleSprites();
  sprite = bakeShadow(path, Math.exp(step * SCALE_STEP), alpha);
  if (!sprite) return null;
  shadowSprites.set(key, sprite);
  shadowCounts.stored++;
  return sprite;
}

/**
 * Fills the current path with the role's paper, tinted to the current
 * fillStyle, and casts a short cut-paper shadow. Strokes the path only when
 * outlines are on or no texture is available.
 */
export function paperShape(ctx, role) {
  const tile = patternTile(ctx, role, ctx.fillStyle);
  if (!tile) { ctx.fill(); ctx.stroke(); return; }
  const path = tracked.get(ctx);
  const usable = path?.ok;
  ctx.save();
  if (paperStyle.shadows) {
    const m = ctx.getTransform?.();
    const unit = m ? Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) : 1;
    const sprite = m ? shadowSprite(ctx, m, tile.alpha) : null;
    if (sprite) {
      // The canvas shadow's offset is in screen pixels whatever the transform, so the stamp's is too.
      path.proto.setTransform.call(ctx, m.a, m.b, m.c, m.d, m.e + SHADOW_DX * unit, m.f + SHADOW_DY * unit);
      ctx.drawImage(sprite.image, sprite.x, sprite.y, sprite.w, sprite.h);
      path.proto.setTransform.call(ctx, m);
    } else {
      if (path) shadowCounts.direct++;
      ctx.shadowColor = `rgba(${SHADOW_RGB}, ${SHADOW_ALPHA})`;
      ctx.shadowBlur = SHADOW_BLUR * unit;
      ctx.shadowOffsetX = SHADOW_DX * unit;
      ctx.shadowOffsetY = SHADOW_DY * unit;
    }
  }
  ctx.fillStyle = tile.pattern;
  ctx.fill();
  ctx.restore();
  // The restore puts back the transform the path was built under, so the copy still describes it.
  if (path) path.ok = usable;
  if (paperStyle.outlines) ctx.stroke();
}

/** The colour for a flier's contact ellipse: kept whenever cut-paper shadows are not being drawn. */
export function contactShadow(color) {
  const replaced = hasDom && paperStyle.textures && paperStyle.shadows && sources.size > 0;
  return replaced && !paperStyle.contact ? 'rgba(0, 0, 0, 0)' : color;
}

/** Fills the current path with the role's paper and never strokes it. */
export function paperFill(ctx, role) {
  const pattern = patternFor(ctx, role, ctx.fillStyle);
  if (!pattern) { ctx.fill(); return; }
  ctx.save();
  ctx.fillStyle = pattern;
  ctx.fill();
  ctx.restore();
}

/**
 * Presses the hour's paper into a canvas that already holds the colour wash.
 * Returns false, leaving the canvas untouched, when the texture is unavailable.
 * A baked file from scripts/bake_backdrops.py is used instead whenever one
 * matches the live settings; `orient` picks its landscape or portrait copy.
 */
/** The settings a baked backdrop must have been made from. scripts/bake_backdrops.py builds the same string. */
export function backdropKey(hour) {
  const s = PAPER_USE.backdrop[hour], p = CHAPTER_PALETTES[hour];
  return s && p ? [s.paper, s.relief, s.keep, s.split, s.mid, p.top, p.middle, p.bottom].join('|') : '';
}

/**
 * Draws the hour's baked backdrop over the canvas. Returns true when drawn,
 * false while the file is still loading, and null when no baked file applies:
 * Pure light colours, settings changed since the bake, or a file that failed.
 */
function bakedBackdrop(canvas, hour, orient) {
  const entry = BAKED_BACKDROPS[hour];
  if (!entry || getColorMode() !== 'default' || entry.key !== backdropKey(hour)) return null;
  const file = entry[orient ?? (canvas.width >= canvas.height ? 'landscape' : 'portrait')];
  const image = baked.get(file);
  if (image === false) return null;
  if (!image) {
    if (!baked.has(file)) {
      baked.set(file, undefined);
      const pending = new Image();
      pending.onload = () => { baked.set(file, pending); arrived(); };
      pending.onerror = () => { baked.set(file, false); arrived(); };
      pending.src = new URL(`../assets/backdrops/${file}`, import.meta.url).href;
    }
    return false;
  }
  const ctx = canvas.getContext('2d');
  const fit = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
  const w = image.naturalWidth * fit, h = image.naturalHeight * fit;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  ctx.restore();
  return true;
}

export function paperBackdrop(canvas, hour, override, orient) {
  if (!hasDom || !paperStyle.textures) return false;
  if (!override) {
    const drawn = bakedBackdrop(canvas, hour, orient);
    if (drawn !== null) return drawn;
  }
  const settings = override ?? PAPER_USE.backdrop[hour] ?? PAPER_USE.backdrop.none;
  const image = sourceFor(settings.paper);
  if (!image) return false;
  // Work no larger than the source can resolve, then scale the result up.
  const shrink = Math.min(1, BACKDROP_MAX / Math.max(canvas.width, canvas.height));
  const width = Math.round(canvas.width * shrink), height = Math.round(canvas.height * shrink);
  const small = Object.assign(document.createElement('canvas'), { width, height });
  const ctx = small.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(canvas, 0, 0, width, height);
  const scratch = Object.assign(document.createElement('canvas'), { width, height });
  const sctx = scratch.getContext('2d', { willReadFrequently: true });
  // Cover the field with the source, turned to match the field's orientation.
  const turned = (width >= height) !== (image.naturalWidth >= image.naturalHeight);
  const iw = turned ? image.naturalHeight : image.naturalWidth, ih = turned ? image.naturalWidth : image.naturalHeight;
  const fit = Math.max(width / iw, height / ih);
  sctx.imageSmoothingQuality = 'high';
  sctx.translate(width / 2, height / 2);
  if (turned) sctx.rotate(Math.PI / 2);
  sctx.drawImage(image, -image.naturalWidth * fit / 2, -image.naturalHeight * fit / 2, image.naturalWidth * fit, image.naturalHeight * fit);
  const data = residuals(sctx.getImageData(0, 0, width, height).data);
  const wash = ctx.getImageData(0, 0, width, height);
  const target = new Float32Array(width * height * 3);
  toLab(wash.data, target);
  recolor(data, target, settings, wash.data);
  ctx.putImageData(wash, 0, 0);
  const out = canvas.getContext('2d');
  out.save();
  out.setTransform(1, 0, 0, 1, 0, 0);
  out.imageSmoothingQuality = 'high';
  out.drawImage(small, 0, 0, canvas.width, canvas.height);
  out.restore();
  return true;
}
