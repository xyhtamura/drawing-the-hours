import { fitField, fieldPoint } from './viewport.js';
import { themeColor, themeKey, setThemeHour } from './theme.js';
import { createMidnightArt } from './midnight-art.js';
import { createDuskArt } from './dusk-art.js';
import { leafAnchors, duskSafeArea, placeLacewing, updateLacewing, drawLacewing } from './lacewing.js';
/**
 * Drawing the Hours — Level One: "Morning Verge: The First Hour"
 * Main Game Loop, Input Coordination, Particle & Stamp Effects, and Meadow Renderer.
 */

import {
  distance,
  polylineLength,
  getLengthBand,
  extractPockets,
  pointInPolygon,
  polylineTouchesDisk,
  extractClosedPockets,
} from './geometry.js';
import { Butterfly, DandelionSeed, Snail, Hornet, WebPatch, FlaxFlower, drawFlaxFlower, NightJasmine, SPECIES_CONFIG, drawFirefly } from './entities.js';
import { evaluateDrawing } from './recipes.js';
import { COMBO_DIAGRAMS, drawComboDiagram } from './combo-diagrams.js';
import { DandelionClock } from './clock.js';
import { audio } from './audio.js';
import { storage } from './storage.js';
import { createDawnArt, wrapText } from './dawn-art.js';
import { createNoonArt } from './noon-art.js';
import { CampaignManager, CAMPAIGN_LEVELS, PRACTICE_LEVELS, OBJECTIVE_LABELS } from './campaign.js';

// Drawn width of the held cord. Under string rules a tip that comes this close to
// the cord overlaps it on screen, so it counts as closing (STRING.md, rule 9).
const CORD_WIDTH = 4.5;

// A picked string bean lengthens the NEXT cord by this much, keeps for this many
// seconds, and another pod grows after this delay (Noon, cord economy).
const BEAN_BONUS = 400;
const BEAN_KEEPS_SECONDS = 12;
const BEAN_REGROW_SECONDS = 8;

// An insect taken by the night jasmine settles on it for this long; the spent
// bloom then closes and another opens after the regrow delay (Midnight XI-XII).
const JASMINE_STAY = 24;
const JASMINE_REGROW = 12;

// Height of one requirement row on the visit card; the row holds a figure diagram.
const REQUIREMENT_ROW = 36;

// Seconds of play without objective progress before the hint card appears
// (CAMPAIGN.md, tuning section). Dismissing it starts the count again.
const HINT_DELAY_SECONDS = 12;
export const HINTS_STORAGE_KEY = 'drawing-the-hours-hints';

// One line per unfinished requirement. The hint names the figure and its shape;
// it never points at particular insects on the field.
const HINT_TEXT = {
  any: 'Any combination counts. Two insects of one kind in a single loop is the shortest.',
  single: 'Close one loop around two insects of the same kind.',
  figure8: 'Cross the cord to make two pockets, with one insect in each.',
  pair: 'Close one loop around two insects of the same kind.',
  trio: 'Close one loop around three different kinds at once.',
  seedWing: 'Close one loop around one insect and one drifting seed.',
  counterpartPair: 'Cross the cord: one kind in one pocket, a different kind in the other.',
  lacewingCounterpart: 'Cross the cord: a resting lacewing in one pocket, a different kind in the other.',
  nursery: 'Cross the cord: exactly one insect in one pocket, exactly one seed in the other.',
  mixedEcho: 'Cross the cord: the same two kinds mirrored in both pockets.',
  seedTrio: 'Close one loop around three different kinds and one seed.',
  twinSeedWing: 'Cross the cord: one insect and one seed in each pocket.',
  trace: 'Thread a firefly, then a lacewing, then a different firefly in one stroke.',
  lacewingTrace: 'Thread a lacewing, then a firefly, then the other lacewing in one stroke.',
};

// What cut the cord, named so the player can act on it. The snail is absent on
// purpose: it spoils a pocket instead of cutting (Xyh, 2026-09-16).
const HAZARD_BREAK_MESSAGE = {
  hornet: 'The hornet cut the cord.',
  web: 'The cord stuck in the web. Draw around it.',
};

// The failure card's second line, one per hour.
const GAME_OVER_LINES = {
  dawn: 'The dandelion seeds took flight into the morning breeze.',
  noon: 'The dandelion seeds scattered across the midday atrium.',
  dusk: 'The dandelion seeds drifted off into the evening air.',
  midnight: 'The dandelion seeds slipped away into the dark.',
};

/** Species name for interface text, for example 'firefly' → 'Firefly'. */
function speciesLabel(kind) {
  return SPECIES_CONFIG[kind]?.shortName || kind.charAt(0).toUpperCase() + kind.slice(1);
}
import { StringGesture, TapTracker, gestureRoles, pointAndTangentAtArcLength, constrainToWalls, MAX_CORD_LENGTH } from './string.js';

function drawRoundedRect(ctx, x, y, w, h, r) {
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.width = 960;
    this.height = 640;
    this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;

    // Campaign Manager
    this.campaign = new CampaignManager();
    this.currentLevel = this.campaign.currentLevel;

    // Game state
    this.currentWave = 1; // For practice/wave compatibility
    this.state = 'TRANSITION'; // 'TRANSITION' | 'READY' | 'CARD' | 'PLAYING' | 'PAUSED' | 'LEVEL_COMPLETE' | 'GAMEOVER'
    this.score = 0;
    this.harmoniesCount = 0;
    this.harmoniesGoal = 5;
    this.respawnQueue = [];

    // Drawing cord state
    this.isDrawing = false;
    this.currentStroke = [];
    this.strokeLength = 0;
    this.activeBand = getLengthBand(0);
    this.lastPointerPos = { x: 0, y: 0 };
    this.lastPointerTime = 0;
    this.activePointerId = undefined;
    this.tapTracker = new TapTracker();
    this.stringGesture = null;
    this.lastTap = null;
    this.saltGrains = [];
    this.activePockets = [];

    // A picked flax flower, kept for the next cord
    this.beanBonus = 0;
    this.beanTimer = 0;

    // The jasmine a held cord started inside, if any
    this.jasmineStart = null;

    // Stalled-play hint and failure-screen options
    let hints = true;
    try {
      if (storage.getItem(HINTS_STORAGE_KEY) === 'off') hints = false;
    } catch {}
    this.hintsEnabled = hints;
    this.hintTimer = 0;
    this.hint = null;
    this.hintRect = null;
    this.gameOverOptions = [];

    // Transient feedback & visuals
    this.recoilStroke = null;
    this.recoilAlpha = 0;
    this.lastEvaluatedPockets = [];
    this.pocketFillAlpha = 0;
    this.stamps = [];
    this.feedbackBanner = { text: '', type: 'info', timer: 0 };
    this.victoryDelay = 0;
    this.victoryTotalDelay = 0;
    this.levelCompleteButton = null;
    this.levelCompleteTimer = 0;

    // Meadow Entities
    this.entities = [];
    this.clock = new DandelionClock(60, 12);

    // Background paper decor
    this.decorations = [];

    // Atrium Wind Mechanics (Noon Visits V-VI)
    this.windTimer = 0;
    this.windPhase = 'calm'; // 'calm' | 'warning' | 'gust'
    this.prevWindPhase = 'calm';
    this.windStreaks = [];
    this.windDirection = 1; // +1 blows right, -1 blows left (STRING.md rule 7)
    this.windDirectionRun = 0;

    this.initCanvas();
    this.initDecorations();
    this.initLevel();
    this.bindEvents();

    // A reload resumes the saved visit at its ready screen rather than replaying
    // its story card (CAMPAIGN.md, save section).
    if (this.campaign.resumedFromSave) this.state = 'READY';

    this.lastFrameTime = performance.now();
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(this.loop.bind(this));
    }
  }

  layoutCanvas() {
    const viewport = this.canvas.parentElement?.getBoundingClientRect() || {width: 960, height: 640};
    const field = fitField(globalThis.window?.innerWidth || viewport.width || 960, globalThis.window?.innerHeight || viewport.height || 640);
    if (this.canvas.parentElement?.style) {
      this.canvas.parentElement.style.width = `${field.displayWidth}px`;
      this.canvas.parentElement.style.height = `${field.displayHeight}px`;
    }
    if (this.canvas.style) {
      this.canvas.style.width = `${field.displayWidth}px`;
      this.canvas.style.height = `${field.displayHeight}px`;
    }
    this.width = field.width; this.height = field.height;
    this.displayScale = field.scale;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  canvasPoint(clientX, clientY) {
    return fieldPoint(clientX, clientY, this.canvas.getBoundingClientRect(), this.width, this.height);
  }

  initCanvas() { this.layoutCanvas(); }

  resize() {
    this.cancelStroke();
    const oldWidth = this.width, oldHeight = this.height;
    this.layoutCanvas();
    // A window resize changes only display scale. Rotation changes field orientation.
    if (oldWidth !== this.width || oldHeight !== this.height) {
      for (const ent of this.entities) {
        ent.x *= this.width / oldWidth;
        ent.y *= this.height / oldHeight;
      }
      // Keep active entities within new canvas bounds
      for (const ent of this.entities) {
        if (ent.type === 'hazard' || ent.type === 'terrain' || ent.type === 'plant') {
          ent.x = Math.max(30, Math.min(this.width - 30, ent.x));
          ent.update(0, { width: this.width, height: this.height });
        } else {
          ent.x = Math.max(16, Math.min(this.width - 16, ent.x));
          ent.y = Math.max(16, Math.min(this.height - 16, ent.y));
        }
      }

      for (const ent of this.entities) {
        if (ent.kind === 'lacewing' && ent.state === 'roaming') updateLacewing(ent, 0, this);
      }
      this.initDecorations();
    }
  }

  initDecorations() { this.decorations = []; }

  initLevel(level = this.campaign.currentLevel) {
    if (typeof level === 'number') {
      // Legacy wave compatibility
      this.currentWave = level;
      const pracId = (level === 2) ? 'practice-02' : 'practice-01';
      level = this.campaign.setLevelById(pracId);
    } else if (typeof level === 'string') {
      level = this.campaign.setLevelById(level);
    }

    this.cancelStroke();
    this.currentLevel = level || this.campaign.currentLevel;
    setThemeHour(this.currentLevel.hour);
    this.gestureMode = 'string';
    this.stringGesture = null;
    this.trace = null;
    this.tapTracker?.cancel();
    this.saltGrains = [];
    this.campaign.initProgress(this.currentLevel);

    if (this.activePointerId !== undefined) {
      try { this.canvas.releasePointerCapture(this.activePointerId); } catch (_) {}
      this.activePointerId = undefined;
    }
    this.isDrawing = false;
    this.currentStroke = [];
    this.strokeLength = 0;
    this.activeBand = getLengthBand(0);
    this.stamps = [];
    this.feedbackBanner = { text: '', type: 'info', timer: 0 };
    this.recoilAlpha = 0;
    this.pocketFillAlpha = 0;
    this.entities = [];
    this.respawnQueue = [];
    this.score = 0;
    this.harmoniesCount = 0;
    this.victoryDelay = 0;
    this.victoryTotalDelay = 0;
    this.levelCompleteButton = null;
    this.levelCompleteTimer = 0;
    this.hintTimer = 0;
    this.hint = null;
    this.hintRect = null;
    this.gameOverOptions = [];
    this.beanBonus = 0;
    this.beanTimer = 0;
    this.jasmineStart = null;
    this.clock.reset(this.currentLevel.durationSeconds || 60);

    // Reset wind state
    this.windTimer = 0;
    this.windPhase = 'calm';
    this.prevWindPhase = 'calm';
    this.windStreaks = [];
    this.windDirection = 1;
    this.windDirectionRun = 0;
    audio.stopCicadas();

    const mScale = this.currentLevel.motionScale || 1.0;
    const pop = this.currentLevel.population || {};

    const padX = this.width * 0.15;
    const padY = this.height * 0.2;

    if (this.currentLevel.scene === 'window') {
      const r = duskSafeArea(this);

      // 1. Anchored Fireflies
      const fireflyPositions = [[0.14, 0.82], [0.50, 0.50], [0.86, 0.82]];
      const fireflyCount = pop.firefly || 0;
      for (let i = 0; i < fireflyCount; i++) {
        const [fx, fy] = fireflyPositions[i % fireflyPositions.length];
        const b = new Butterfly(r.left + fx * (r.right - r.left), r.top + fy * (r.bottom - r.top), 'firefly');
        b.motionScale = mScale;
        b.glowOffset = i;
        this.entities.push(b);
      }

      // 2. Leaf-anchored Lacewings
      const lacewingCount = pop.lacewing || 0;
      for (let i = 0; i < lacewingCount; i++) {
        const b = new Butterfly(0, 0, 'lacewing');
        b.motionScale = mScale;
        placeLacewing(b, this, i, i * 0.75);
        this.entities.push(b);
      }

      const hasClearance = (x, y, radius) => {
        return this.entities.every(e => Math.hypot(e.x - x, e.y - y) >= e.radius + radius + 14);
      };

      // 3. Hoverflies
      const hoverCount = pop.hoverfly || 0;
      for (let i = 0; i < hoverCount; i++) {
        let placed = false;
        const leaf = leafAnchors(this)[i % 3];
        if (hasClearance(leaf.x, leaf.y + 85, 16)) {
          const b = new Butterfly(leaf.x, leaf.y + 85, 'hoverfly');
          b.motionScale = mScale;
          this.entities.push(b);
          placed = true;
        } else {
          for (let attempt = 0; attempt < 25; attempt++) {
            const cx = r.left + Math.random() * (r.right - r.left);
            const cy = r.top + Math.random() * (r.bottom - r.top);
            if (hasClearance(cx, cy, 16)) {
              const b = new Butterfly(cx, cy, 'hoverfly');
              b.motionScale = mScale;
              this.entities.push(b);
              placed = true;
              break;
            }
          }
        }
        if (!placed) {
          this.respawnQueue.push({ kind: 'hoverfly', delay: 0.3 });
        }
      }

      // 4. Brimstones (final Midnight visit)
      const brimCount = pop.brimstone || 0;
      for (let i = 0; i < brimCount; i++) {
        let placed = false;
        for (let attempt = 0; attempt < 25; attempt++) {
          const cx = r.left + Math.random() * (r.right - r.left);
          const cy = r.top + Math.random() * (r.bottom - r.top);
          if (hasClearance(cx, cy, 18)) {
            const b = new Butterfly(cx, cy, 'brimstone');
            b.motionScale = mScale;
            this.entities.push(b);
            placed = true;
            break;
          }
        }
        if (!placed) {
          this.respawnQueue.push({ kind: 'brimstone', delay: 0.3 });
        }
      }

      // 5. Seeds
      const seedCount = pop.seed || 0;
      for (let i = 0; i < seedCount; i++) {
        let placed = false;
        for (let attempt = 0; attempt < 25; attempt++) {
          const cx = r.left + Math.random() * (r.right - r.left);
          const cy = r.top + Math.random() * (r.bottom - r.top);
          if (hasClearance(cx, cy, 14)) {
            const seed = new DandelionSeed(cx, cy);
            seed.motionScale = mScale;
            this.entities.push(seed);
            placed = true;
            break;
          }
        }
        if (!placed) {
          this.respawnQueue.push({ kind: 'seed', delay: 0.3 });
        }
      }

      // 6. Perimeter Snail (final Midnight visit)
      const snailCount = pop.snail || 0;
      for (let i = 0; i < snailCount; i++) {
        this.entities.push(new Snail(this.width * 0.5, this.height - 35));
      }
    } else {
      // Fliers (Meadow & Passage)
      const kinds = ['brimstone', 'damselfly', 'hawkmoth', 'hoverfly', 'lacewing', 'firefly'];
      for (const k of kinds) {
        const count = pop[k] || 0;
        for (let i = 0; i < count; i++) {
          const x = padX + Math.random() * (this.width - 2 * padX);
          const y = padY + Math.random() * (this.height - 2 * padY);
          const b = new Butterfly(x, y, k);
          b.motionScale = mScale;
          if (k === 'lacewing') {
            placeLacewing(b, this, i, i * 0.75);
          } else if (k === 'hoverfly' && this.currentLevel.scene === 'passage') {
            const leaf = leafAnchors(this)[i % 3];
            b.x = leaf.x; b.y = leaf.y + 85;
          } else if (this.currentLevel.scene === 'passage') {
            const r = duskSafeArea(this);
            b.x = r.left + Math.random() * (r.right - r.left);
            b.y = r.top + Math.random() * (r.bottom - r.top);
          }
          this.entities.push(b);
        }
      }

      // Seeds
      const seedCount = pop.seed || 0;
      for (let i = 0; i < seedCount; i++) {
        const x = padX + Math.random() * (this.width - 2 * padX);
        const y = padY + Math.random() * (this.height - 2 * padY);
        const seed = new DandelionSeed(x, y);
        seed.motionScale = mScale;
        this.entities.push(seed);
      }

      // Snail
      const snailCount = pop.snail || 0;
      for (let i = 0; i < snailCount; i++) {
        const snail = new Snail(this.width * 0.5, this.height - 35, this.currentLevel.snailRoute);
        snail.update(0, { width: this.width, height: this.height });
        this.entities.push(snail);
      }

      // Atrium hazards: wandering hornets and web patches.
      for (const kind of ['hornet', 'web']) {
        for (let i = 0; i < (pop[kind] || 0); i++) this.spawnAtriumFixture(kind, i);
      }
    }
    for (let i = 0; i < (pop.bean || 0); i++) this.spawnAtriumFixture('bean', i);
    for (let i = 0; i < (pop.jasmine || 0); i++) this.spawnAtriumFixture('jasmine', i);

    this.initDecorations();
  }

  /**
   * Place one atrium fixture: a hornet loose in the planting, a web patch at its authored
   * spot, or a bean on clear ground. Web positions come from the level so a
   * player can learn them; the hornet and the bean are placed at random.
   * Returns false when a bean found no clear ground, so the caller can requeue.
   */
  spawnAtriumFixture(kind, index = 0) {
    const bounds = { width: this.width, height: this.height };
    if (kind === 'hornet') {
      const hornet = new Hornet(
        this.width * (0.2 + Math.random() * 0.6),
        this.height * (0.2 + Math.random() * 0.6)
      );
      hornet.motionScale = this.currentLevel?.motionScale || 1;
      this.entities.push(hornet);
      return true;
    }
    if (kind === 'jasmine') {
      const spots = this.currentLevel?.jasminePlaces || [[0.5, 0.82]];
      const [jx, jy] = spots[index % spots.length];
      const jasmine = new NightJasmine(jx, jy, 26);
      jasmine.update(0, bounds);
      this.entities.push(jasmine);
      return true;
    }
    if (kind === 'web') {
      const spots = this.currentLevel?.webPatches || [[0.28, 0.3], [0.72, 0.68]];
      const [wx, wy] = spots[index % spots.length];
      const web = new WebPatch(wx, wy, 30);
      web.update(0, bounds);
      this.entities.push(web);
      return true;
    }
    if (kind === 'bean') {
      for (let attempt = 0; attempt < 25; attempt++) {
        const sx = this.width * (0.15 + Math.random() * 0.7);
        const sy = this.height * (0.2 + Math.random() * 0.6);
        const clear = this.entities.every(e => Math.hypot(e.x - sx, e.y - sy) >= e.radius + 34);
        if (clear) {
          this.entities.push(new FlaxFlower(sx, sy));
          return true;
        }
      }
      this.respawnQueue.push({ kind: 'bean', delay: 0.4 });
      return false;
    }
    return false;
  }

  maintainPopulation(dt = 0.016) {
    if (!this.currentLevel || !this.currentLevel.population) return;
    const pop = this.currentLevel.population;
    const mScale = this.currentLevel.motionScale || 1.0;

    const activeCounts = { brimstone: 0, damselfly: 0, hawkmoth: 0, seed: 0, snail: 0, hornet: 0, web: 0, bean: 0, jasmine: 0 };
    for (const ent of this.entities) {
      if (ent.state === 'departing' || ent.state === 'harmonizing') continue;
      if (ent.type === 'butterfly' || ent.type === 'insect') {
        const k = (ent.kind === 'azure') ? 'damselfly' : ((ent.kind === 'roseate') ? 'hawkmoth' : ent.kind);
        activeCounts[k] = (activeCounts[k] || 0) + 1;
      } else if (ent.type === 'seed') {
        activeCounts.seed += 1;
      } else {
        // Hazards, terrain, and beans are counted by kind, so one hazard never
        // stands in for another.
        activeCounts[ent.kind] = (activeCounts[ent.kind] || 0) + 1;
      }
    }

    const pendingCounts = { brimstone: 0, damselfly: 0, hawkmoth: 0, seed: 0, snail: 0, hornet: 0, web: 0, bean: 0, jasmine: 0 };
    for (const item of this.respawnQueue) {
      pendingCounts[item.kind] = (pendingCounts[item.kind] || 0) + 1;
    }

    for (const [kind, quota] of Object.entries(pop)) {
      const planned = (activeCounts[kind] || 0) + (pendingCounts[kind] || 0);
      if (planned < quota) {
        const deficit = quota - planned;
        for (let i = 0; i < deficit; i++) {
          this.respawnQueue.push({
            kind,
            delay: 0.8,
          });
        }
      }
    }

    for (let i = this.respawnQueue.length - 1; i >= 0; i--) {
      const item = this.respawnQueue[i];
      item.delay -= dt;
      if (item.delay <= 0) {
        this.respawnQueue.splice(i, 1);
        if (item.kind === 'seed') {
          if (this.currentLevel.scene === 'window') {
            const r = duskSafeArea(this);
            const sx = r.left + Math.random() * (r.right - r.left);
            const sy = r.top + Math.random() * (r.bottom - r.top);
            if (this.entities.some(e => e.state !== 'departing' && e.state !== 'harmonizing' && Math.hypot(e.x - sx, e.y - sy) < e.radius + 26)) {
              this.respawnQueue.push({ kind: item.kind, delay: 0.2 });
              continue;
            }
            const seed = new DandelionSeed(sx, sy);
            seed.motionScale = mScale;
            this.entities.push(seed);
          } else {
            const seed = new DandelionSeed(-15, 60 + Math.random() * (this.height - 120));
            seed.motionScale = mScale;
            this.entities.push(seed);
          }
        } else if (item.kind === 'snail') {
          const snail = new Snail(this.width * 0.5, this.height - 35, this.currentLevel.snailRoute);
          snail.update(0, { width: this.width, height: this.height });
          this.entities.push(snail);
        } else if (['hornet', 'web', 'bean', 'jasmine'].includes(item.kind)) {
          this.spawnAtriumFixture(item.kind, this.entities.filter(e => e.kind === item.kind).length);
        } else {
          const edge = Math.random();
          let sx = 20, sy = 20;
          if (edge < 0.25) { sx = 20; sy = Math.random() * this.height; }
          else if (edge < 0.5) { sx = this.width - 20; sy = Math.random() * this.height; }
          else if (edge < 0.75) { sx = Math.random() * this.width; sy = 20; }
          else { sx = Math.random() * this.width; sy = this.height - 20; }

          const b = new Butterfly(sx, sy, item.kind);
          b.motionScale = mScale;
          if (item.kind === 'lacewing') {
            const available = leafAnchors(this).findIndex(a => this.entities.every(e =>
              e.state !== 'roaming' || Math.hypot(e.x - a.x, e.y - a.y) > 65));
            if (available < 0) { this.respawnQueue.push({ kind: item.kind, delay: 0.2 }); continue; }
            placeLacewing(b, this, available);
          } else if (['passage', 'window'].includes(this.currentLevel.scene)) {
            const r = duskSafeArea(this);
            b.x = r.left + Math.random() * (r.right - r.left);
            b.y = r.top + Math.random() * (r.bottom - r.top);
          }
          if (this.currentLevel.scene === 'window' && this.entities.some(e =>
              e.state !== 'departing' && e.state !== 'harmonizing' &&
              Math.hypot(e.x - b.x, e.y - b.y) < e.radius + b.radius + 12)) {
            this.respawnQueue.push({ kind: item.kind, delay: 0.2 });
            continue;
          }
          this.entities.push(b);
        }
      }
    }
  }

  showFeedback(text, type = 'info', duration = 2.4) {
    this.feedbackBanner = { text, type, timer: duration };
  }

  /** Visits flagged clockStartsOnFirstCombination hold the clock until the first accepted drawing. */
  isClockHeld() {
    return !!this.currentLevel?.clockStartsOnFirstCombination && this.harmoniesCount === 0;
  }

  /** Untimed practice runs the visit with the clock stopped and nothing written to the save. */
  isUntimed() {
    return !!this.currentLevel?.untimed;
  }

  /**
   * Offer a hint after twelve seconds without objective progress (CAMPAIGN.md).
   * It names one unfinished requirement and draws its figure; it never moves a
   * target or completes anything.
   */
  updateHint(dt) {
    if (!this.hintsEnabled || this.hint) return;
    this.hintTimer += dt;
    if (this.hintTimer < HINT_DELAY_SECONDS) return;
    const unfinished = Object.entries(this.campaign.objectiveProgress)
      .find(([, obj]) => obj.current < obj.target);
    if (!unfinished) return;
    const [key, obj] = unfinished;
    this.hint = {
      key,
      label: obj.label,
      remaining: obj.target - obj.current,
      text: HINT_TEXT[key] || 'Draw one more combination the visit asks for.',
    };
  }

  /** Dismiss the hint and start the twelve seconds again. */
  dismissHint() {
    this.hint = null;
    this.hintRect = null;
    this.hintTimer = 0;
  }

  setHintsEnabled(enabled) {
    this.hintsEnabled = Boolean(enabled);
    if (!this.hintsEnabled) {
      this.dismissHint();
    }
    try {
      storage.setItem(HINTS_STORAGE_KEY, this.hintsEnabled ? 'on' : 'off');
    } catch {}
    return this.hintsEnabled;
  }

  toggleHints() {
    return this.setHintsEnabled(!this.hintsEnabled);
  }

  /** Run the current campaign visit untimed, without touching campaign progress. */
  startPracticeOfCurrent() {
    const sourceId = this.currentLevel?.practiceOf || this.currentLevel?.id;
    const practice = this.campaign.startPracticeOf(sourceId);
    if (!practice) {
      this.initLevel(this.currentLevel);
      this.state = 'READY';
      return false;
    }
    this.initLevel(practice);
    this.victoryDelay = 0;
    this.state = 'READY';
    this.onLevelChanged?.(this.currentLevel);
    this.onStateChanged?.(this.state, this.currentLevel);
    return true;
  }

  /**
   * Route a click on the canvas that lands on an overlay control: a failure-screen
   * option, or the hint card's dismissal. Returns true when the click was used,
   * so the caller does not also advance the state.
   */
  handleOverlayClick(x, y) {
    if (this.state === 'LEVEL_COMPLETE' || this.state === 'VICTORY') {
      const b = this.levelCompleteButton;
      if (b && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        this.advance();
        return true;
      }
      return true;
    }
    if (this.state === 'GAMEOVER') {
      const option = this.gameOverOptions.find(
        o => x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h
      );
      if (!option) return false;
      if (option.action === 'practice') {
        this.startPracticeOfCurrent();
      } else if (option.action === 'select') {
        if (typeof this.onOpenVisitModal === 'function') this.onOpenVisitModal();
        else this.advance();
      } else {
        this.advance();
      }
      return true;
    }
    if (this.hint && this.hintRect) {
      const r = this.hintRect;
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        this.dismissHint();
        return true;
      }
    }
    return false;
  }

  /** Fault text that does not suggest a figure the current visit cannot supply. */
  explainFault(result) {
    const pop = this.currentLevel?.population || {};
    const flierKinds = Object.entries(pop).filter(([k, n]) => n > 0 && k !== 'seed' && k !== 'snail').length;
    if (this.currentLevel?.hour === 'dawn' && flierKinds < 3
        && result.faultType === 'MISMATCH' && result.message?.startsWith('Two mismatched')) {
      return 'Two different kinds cannot share a loop. Loop a matching pair.';
    }
    return result.message || 'Irregular grouping';
  }

  /**
   * String visits close a cord only where it visibly closes (STRING.md, rule 9);
   * other visits keep the 90 px end-to-start tolerance.
   */
  findPockets(points) {
    return this.currentLevel?.stringRules
      ? extractClosedPockets(points, { touchDist: CORD_WIDTH, minArea: 900 })
      : extractPockets(points, { closeDist: 90, minArea: 900 });
  }

  bindEvents() {
    if (typeof window === 'undefined') return;
    window.addEventListener('resize', () => this.resize());

    const getPos = (e) => {
      const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
      return this.canvasPoint(clientX, clientY);
    };

    const ownsPointer = e => this.activePointerId === e.pointerId;
    const onPointerDown = e => {
      if (this.isDrawing || e.isPrimary === false || (e.button !== undefined && e.button !== 0)) return;
      if (document.querySelector('.modal-overlay.active')) return;
      if (this.uiSuspended || this.state !== 'PLAYING' || this.victoryDelay > 0 || this.clock.remainingSeconds <= 0) return;
      e.preventDefault();
      // A press on the hint card dismisses it instead of starting a cord.
      if (this.hint && this.hintRect) {
        const p = getPos(e);
        if (p.x >= this.hintRect.x && p.x <= this.hintRect.x + this.hintRect.w
          && p.y >= this.hintRect.y && p.y <= this.hintRect.y + this.hintRect.h) {
          this.dismissHint();
          return;
        }
      }
      audio.ensureContext();
      this.activePointerId = e.pointerId;
      try { this.canvas.setPointerCapture(e.pointerId); } catch (_) {}
      const pos = getPos(e);
      this.isDrawing = true;
      this.currentStroke = [pos];
      this.strokeLength = 0;
      this.activePockets = [];
      this.activeBand = getLengthBand(0);
      this.lastPointerPos = pos;
      this.lastPointerTime = performance.now();
      this.lastReportedTraceKey = null;
      if (this.currentLevel?.stringRules) {
        this.tapTracker.onPress(pos, performance.now(), this.entities);
        // A bean picked on an earlier cord is spent on this one.
        const limit = (this.currentLevel.maxCordLength ?? MAX_CORD_LENGTH) + (this.beanBonus || 0);
        if (this.beanBonus) {
          this.beanBonus = 0;
          this.beanTimer = 0;
        }
        this.stringGesture = new StringGesture(pos, limit);
        // Thread starter: a stroke that begins inside an open jasmine
        // (STRING.md rule 10). The first insect it threads settles on the flower.
        this.jasmineStart = this.entities.find(
          e => e.kind === 'jasmine' && e.isOpen && distance(pos, e) <= e.radius
        ) || null;
      } else {
        this.stringGesture = null;
      }
      this.trace = null;
      audio.startDrawingRustle();
      this.onDrawingStateChanged?.(true);
    };
    const onPointerMove = e => {
      if (!this.isDrawing || !ownsPointer(e) || this.state !== 'PLAYING') return;
      e.preventDefault();
      const samples = e.getCoalescedEvents?.();
      for (const sample of samples?.length ? samples : [e]) {
        const samplePos = getPos(sample);
        if (this.currentLevel?.stringRules) {
          this.tapTracker.onMove(samplePos);
          if (this.tapTracker.candidate?.startedOnTarget && this.stringGesture) {
            const cand = this.tapTracker.candidate;
            if (cand.maxDisplacement > (cand.target.radius + 8)) {
              if (!this.stringGesture.beads.some(b => b.entity === cand.target)) {
                this.stringGesture.threadBead(cand.target, 0);
              }
            }
          }
        }
        this.samplePointer(samplePos);
      }
    };
    const onPointerUp = e => {
      if (!this.isDrawing || !ownsPointer(e)) return;
      e.preventDefault();
      if (this.state !== 'PLAYING' || this.clock.remainingSeconds <= 0 || this.victoryDelay > 0) {
        this.cancelStroke(); return;
      }
      const endPos = getPos(e);
      if (this.currentLevel?.stringRules) {
        const tapRes = this.tapTracker.onRelease(endPos, performance.now());
        if (tapRes.isTap) {
          this.cancelStroke();
          this.lastTap = tapRes;
          this.saltGrains.push({
            x: endPos.x,
            y: endPos.y,
            rotation: Math.random() * Math.PI,
            size: 2.8 + Math.random() * 0.8,
          });
          if (this.saltGrains.length > 80) {
            this.saltGrains.shift();
          }
          return;
        }
        if (tapRes.startedOnTarget && tapRes.duration > 250 && tapRes.maxDisplacement <= (tapRes.target.radius + 8)) {
          this.cancelStroke();
          return;
        }
      }
      // Include the release position even when no final move event was sent.
      this.samplePointer(endPos, true);
      this.isDrawing = false;
      try { this.canvas.releasePointerCapture(e.pointerId); } catch (_) {}
      this.activePointerId = undefined;
      audio.stopDrawingRustle();
      this.onDrawingStateChanged?.(false);
      this.resolveCurrentStroke();
      this.trace = null;
    };
    const onCancel = e => { if (this.isDrawing && ownsPointer(e)) this.cancelStroke(); };
    this.canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onCancel);
    this.canvas.addEventListener('lostpointercapture', onCancel);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'PLAYING') this.togglePause();
    });
    window.addEventListener('blur', () => {
      if (this.state === 'PLAYING') this.togglePause();
    });
  }

  cancelStroke() {
    this.isDrawing = false;
    const pointerId = this.activePointerId;
    this.activePointerId = undefined;
    if (pointerId !== undefined) {
      try { this.canvas.releasePointerCapture(pointerId); } catch (_) {}
    }
    if (this.stringGesture) {
      this.stringGesture.releaseBeads();
      this.stringGesture = null;
    }
    this.tapTracker?.cancel();
    this.trace = null;
    this.lastReportedTraceKey = null;
    this.currentStroke = [];
    this.strokeLength = 0;
    this.activePockets = [];
    this.activeBand = getLengthBand(0);
    audio.stopDrawingRustle();
    this.onDrawingStateChanged?.(false);
  }

  samplePointer(pos, force = false) {
    if (!this.isDrawing) return;
    this.lastPointerPos = pos;
    const last = this.currentStroke.at(-1);
    const dist = distance(last, pos);
    if (dist >= 4 || force) {
      this.currentStroke.push(pos);
      this.strokeLength += dist;
      this.activeBand = getLengthBand(this.strokeLength);
      const now = performance.now();
      const dt = (now - this.lastPointerTime) / 1000;
      audio.updateDrawingSpeed(dt > 0 ? dist / dt : 0);
      this.lastPointerTime = now;

      if (this.currentLevel?.stringRules && this.stringGesture) {
        // A press that started on an insect threads it only once it leaves the tap radius.
        const cand = this.tapTracker.candidate;
        const tapTarget = cand?.startedOnTarget && cand.maxDisplacement <= cand.target.radius + 8
          ? cand.target : null;
        const sampleRes = this.stringGesture.sample(pos, this.entities, force, tapTarget);
        if (sampleRes.snapped) {
          this.breakCord('The cord snapped. Keep your stroke shorter.');
          return;
        }
      }

      if (this.checkCordHazards(this.currentStroke.slice(-2))) return;
      if (this.checkJasmineTake()) return;
      this.checkCordBeans(this.currentStroke.slice(-2));
      if (this.currentStroke.length >= 5) {
        this.activePockets = this.findPockets(this.currentStroke);
      } else {
        this.activePockets = [];
      }
      // After the pockets update, so the banner sees this sample's enclosure.
      this.reportTraceProgress();
    }
  }

  /** Live banner for a string Trace visit. It speaks when the threaded count or the enclosure changes. */
  reportTraceProgress() {
    if (!this.isDrawing) return;
    const trace = this.traceStatus();
    if (!trace || trace.order.length === 0) return;
    const key = `${trace.order.length}:${trace.encloses}`;
    if (key === this.lastReportedTraceKey) return;
    this.lastReportedTraceKey = key;
    if (trace.ready) {
      this.showFeedback(`Trace ready: ${trace.threaded}. Release to score.`, 'success', 3.0);
    } else if (trace.matchesSoFar && !trace.encloses) {
      this.showFeedback(`Trace: ${trace.threaded} (${trace.order.length}/${trace.sequence.length})`, 'info', 2.0);
    } else {
      this.showFeedback(this.traceFaultMessage(trace), 'warning', 2.5);
    }
  }

  /**
   * Progress of the held stroke towards the visit's Trace sequence (STRING.md
   * rule 4), or null outside string visits with a `traceSequence`. The pointer
   * update, release, cord glow, and bead markers all read this one result.
   */
  traceStatus(pockets = this.activePockets) {
    const level = this.currentLevel;
    const recipes = level?.stringRules ? (level.traceSequences || (level.traceSequence ? [level.traceSequence] : [])) : [];
    if (!recipes.length || !recipes[0]?.length) return null;
    const order = this.stringGesture?.threadingOrder || [];
    // With two recipes on a visit, the stroke is read against the one it follows furthest.
    const matched = recipe => {
      let n = 0;
      while (n < recipe.length && n < order.length && order[n].kind === recipe[n]) n++;
      return n;
    };
    const sequence = recipes.reduce((best, recipe) => (matched(recipe) > matched(best) ? recipe : best));
    const prefixMatches = order.slice(0, sequence.length).every((e, i) => e.kind === sequence[i]);
    const matchesSoFar = prefixMatches && order.length <= sequence.length;
    const complete = matchesSoFar && order.length === sequence.length;
    // Purity (STRING.md rule 4): a stroke that also encloses a live entity scores nothing.
    const encloses = this.enclosedEntities(pockets || []).length > 0;
    return {
      sequence,
      order,
      prefixMatches,
      matchesSoFar,
      complete,
      encloses,
      ready: complete && !encloses,
      required: recipes.map(recipe => recipe.map(speciesLabel).join(' → ')).join(', or '),
      threaded: order.map(e => speciesLabel(e.kind)).join(' → '),
    };
  }

  /** Live, unthreaded entities inside any pocket. Beads and departing insects do not count. */
  enclosedEntities(pockets) {
    const found = new Set();
    for (const pocket of pockets) {
      for (const entity of this.entities) {
        if (entity.type === 'terrain' || entity.type === 'bean' || entity.type === 'plant') continue;
        if (entity.state === 'roaming' && pointInPolygon({ x: entity.x, y: entity.y }, pocket.polygon)) {
          found.add(entity);
        }
      }
    }
    return [...found];
  }

  /**
   * Faults in the order the player can act on them: a wrong order, an extra bead,
   * a stroke that also encloses, then a count. Live and release messages agree.
   */
  traceFaultMessage(trace) {
    if (!trace.prefixMatches) return `Wrong order: ${trace.threaded}. A Trace needs ${trace.required}.`;
    if (trace.order.length > trace.sequence.length) return `Too many insects threaded. A Trace needs ${trace.required}.`;
    if (trace.encloses) return 'A stroke cannot both thread and enclose, so neither counts.';
    return `Trace incomplete: ${trace.order.length} of ${trace.sequence.length} threaded. A Trace needs ${trace.required}.`;
  }

  breakCord(message = 'The cord broke.') {
    const stroke = [...this.currentStroke];
    if (this.stringGesture) {
      this.stringGesture.releaseBeads();
    }
    this.cancelStroke();
    this.recoilStroke = stroke;
    this.recoilAlpha = 1;
    this.lastEvaluatedPockets = [];
    audio.playFrayFault();
    this.showFeedback(message, 'warning');
  }

  /**
   * A cutting hazard touching the unfinished cord ends the stroke at once.
   * Pointer samples test the newest segment; each update tests the whole cord,
   * so a hornet flying into a held line also cuts it. The snail is not a cutter.
   */
  checkCordHazards(points = this.currentStroke) {
    if (!this.isDrawing) return false;
    const hazard = this.entities.find(e => e.cutsCord && e.state !== 'departing'
      && polylineTouchesDisk(points, e.x, e.y, e.radius + 3));
    if (!hazard) return false;
    this.breakCord(HAZARD_BREAK_MESSAGE[hazard.kind] || 'The cord was cut.');
    return true;
  }

  /**
   * A held cord drawn over a string bean picks it: the pod's length is kept for
   * the NEXT cord, for BEAN_KEEPS_SECONDS, and another pod grows after
   * BEAN_REGROW_SECONDS. A bean is never pocket content and is never threaded.
   */
  checkCordBeans(points = this.currentStroke) {
    if (!this.isDrawing) return false;
    let picked = false;
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const bean = this.entities[i];
      if (bean.type !== 'bean' || bean.state === 'departing') continue;
      if (!polylineTouchesDisk(points, bean.x, bean.y, bean.radius + 3)) continue;
      this.entities.splice(i, 1);
      this.respawnQueue.push({ kind: 'bean', delay: this.currentLevel.beanRegrowSeconds ?? BEAN_REGROW_SECONDS });
      this.beanBonus = BEAN_BONUS;
      this.beanTimer = BEAN_KEEPS_SECONDS;
      audio.playCordPluck(520);
      this.showFeedback(`Flax flower picked: the next cord runs ${BEAN_BONUS} px longer.`, 'success');
      picked = true;
    }
    return picked;
  }

  /**
   * A thread begun inside an open jasmine takes the first insect it threads: the
   * cord ends there, the insect settles on the flower for JASMINE_STAY seconds,
   * and the spent bloom closes when the stay ends. It scores nothing — the move
   * thins a crowded field and leaves a target that holds still (Xyh, 2026-09-16).
   */
  checkJasmineTake() {
    const jasmine = this.jasmineStart;
    if (!jasmine || !this.isDrawing || !this.stringGesture) return false;
    const taken = this.stringGesture.threadingOrder[0];
    if (!taken) return false;
    if (!jasmine.isOpen) {
      this.jasmineStart = null;
      return false;
    }

    const stroke = [...this.currentStroke];
    this.stringGesture.releaseBeads();
    this.cancelStroke();
    this.recoilStroke = stroke;
    this.recoilAlpha = 1;
    this.lastEvaluatedPockets = [];

    taken.parkTarget = { x: jasmine.x, y: jasmine.y };
    taken.parkedBy = jasmine;
    jasmine.guest = taken;
    jasmine.stayTimer = JASMINE_STAY;

    audio.playCordPluck(300);
    this.showFeedback(
      `${speciesLabel(taken.kind)} settled on the jasmine. It stays for ${JASMINE_STAY} seconds.`,
      'info'
    );
    return true;
  }

  /** Free a guest, close the spent bloom, and grow another later. */
  releaseJasmine(jasmine) {
    const guest = jasmine.guest;
    if (guest) {
      delete guest.parkTarget;
      delete guest.parkedBy;
    }
    jasmine.guest = null;
    jasmine.stayTimer = 0;
    const index = this.entities.indexOf(jasmine);
    if (index >= 0) this.entities.splice(index, 1);
    this.respawnQueue.push({ kind: 'jasmine', delay: JASMINE_REGROW });
  }

  /** Count down each guest's stay; a guest used in a drawing frees its flower early. */
  updateJasmines(dt) {
    for (const jasmine of this.entities.filter(e => e.kind === 'jasmine' && e.guest)) {
      const guest = jasmine.guest;
      const gone = guest.state === 'harmonizing' || guest.state === 'departing'
        || !this.entities.includes(guest);
      jasmine.stayTimer -= dt;
      if (gone || jasmine.stayTimer <= 0) this.releaseJasmine(jasmine);
    }
  }

  /** The kept bean fades if it is not used on the next cord. */
  updateBean(dt) {
    if (!this.beanBonus) return;
    this.beanTimer -= dt;
    if (this.beanTimer <= 0) {
      this.beanBonus = 0;
      this.beanTimer = 0;
      this.showFeedback('The flax flower wilted. Pick another for a longer cord.', 'hint');
    }
  }

  /** The snap limit in force: the held cord's, or the level's plus a kept bean. */
  cordLimit() {
    if (this.isDrawing && this.stringGesture) return this.stringGesture.maxCordLength;
    return (this.currentLevel?.maxCordLength ?? MAX_CORD_LENGTH) + (this.beanBonus || 0);
  }

  resolveCurrentStroke() {
    if (this.state !== 'PLAYING' || this.clock.remainingSeconds <= 0 || this.victoryDelay > 0) {
      this.cancelStroke(); return;
    }
    if (this.currentLevel?.stringRules && this.stringGesture?.hasBeads) {
      const strokePoints = [...this.currentStroke];
      this.recoilStroke = strokePoints;
      this.recoilAlpha = 1.0;
      this.lastEvaluatedPockets = [];

      // Pockets are measured on the released stroke: a live insect, seed, or snail
      // inside one makes the stroke impure (STRING.md rule 4).
      const trace = this.traceStatus(this.findPockets(strokePoints));
      if (trace) {
        const beadEntities = [...trace.order];

        if (trace.ready) {
          const band = getLengthBand(this.strokeLength);
          const multiplier = band.name === 'Petite' ? 1 : band.name === 'Balanced' ? 1.25 : 1.5;
          const result = {
            valid: true,
            mode: 'trace',
            recipeType: 'ORDERED_TRACE',
            traceSequence: trace.sequence,
            title: 'Ordered Trace',
            finalScore: Math.round(240 * multiplier),
            band: band.name,
            harmonizedEntities: [...beadEntities],
          };
          this.acceptDrawing(result, []);
          this.stringGesture.releaseBeads();
          this.currentStroke = [];
          this.strokeLength = 0;
          return;
        }

        this.showFeedback(this.traceFaultMessage(trace), 'warning');
        audio.playFrayFault();
        this.stringGesture.releaseBeads();
        this.currentStroke = [];
        this.strokeLength = 0;
        return;
      }

      this.showFeedback('An insect was threaded on the cord, so the loop does not count.', 'warning');
      audio.playFrayFault();
      this.stringGesture.releaseBeads();
      this.currentStroke = [];
      this.strokeLength = 0;
      return;
    }
    if (this.currentStroke.length < 5) {
      this.currentStroke = [];
      this.strokeLength = 0;
      return;
    }

    const strokePoints = [...this.currentStroke];
    const totalLen = this.strokeLength;

    // Pluck cord sound
    const pluckPitch = this.activeBand.name === 'Petite' ? 320 : (this.activeBand.name === 'Balanced' ? 240 : 180);
    audio.playCordPluck(pluckPitch);

    // Extract enclosed pockets
    const rawPockets = this.findPockets(strokePoints);

    // Associate entities with pockets
    const pocketsWithEntities = rawPockets.map(pocket => {
      const enclosed = this.entities.filter(entity => {
        if (entity.state === 'departing' || entity.state === 'harmonizing') return false;
        // Web patches and beans are scenery, never pocket content.
        if (entity.type === 'terrain' || entity.type === 'bean' || entity.type === 'plant') return false;
        return pointInPolygon({ x: entity.x, y: entity.y }, pocket.polygon);
      });
      return {
        ...pocket,
        entities: enclosed,
      };
    });

    const result = evaluateDrawing(pocketsWithEntities, totalLen);

    // Set up recoil & pocket highlight visuals
    this.recoilStroke = strokePoints;
    this.recoilAlpha = 1.0;
    this.lastEvaluatedPockets = pocketsWithEntities;
    this.pocketFillAlpha = result.valid ? 0.45 : 0.22;

    if (result.valid) {
      this.acceptDrawing(result, pocketsWithEntities);
    } else {
      // Fault / Invalid feedback
      if (result.status === 'HAZARD') {
        audio.playFrayFault();
        this.showFeedback(result.message, 'warning');
      } else if (result.status === 'OPEN') {
        this.showFeedback('Loop did not close — trace back or cross over.', 'hint');
      } else {
        audio.playFrayFault();
        this.showFeedback(this.explainFault(result), 'warning');
      }
    }

    this.currentStroke = [];
    this.strokeLength = 0;
  }

  acceptDrawing(result, pocketsWithEntities) {
    // Success!
    audio.playHarmonyChord(result.recipeType, result.band);
    this.score += result.finalScore;
    this.harmoniesCount += 1;

    // Process with campaign manager
    const campResult = this.campaign.processDrawing(result, pocketsWithEntities, this.clock);

    if (campResult.advancedObjective) {
      this.dismissHint();
      this.showFeedback(`${result.title} (+${result.finalScore} pts)`, 'success');
    } else {
      this.showFeedback(`${result.title} (+${result.finalScore} pts) — Objective unchanged`, 'info');
    }

    // Animate harmonized entities
    for (const ent of result.harmonizedEntities) {
      ent.state = 'harmonizing';
      ent.stateTime = 0;
    }

    // Add pressed paper stamp at pocket centroids
    for (const p of pocketsWithEntities) {
      this.stamps.push({
        x: p.centroid.x,
        y: p.centroid.y,
        radius: Math.min(36, Math.sqrt(p.area) * 0.25),
        alpha: 1.0,
        title: result.title,
      });
    }

    // Check level complete
    if (campResult.allComplete) {
      this.victoryDelay = 1.35;
      this.victoryTotalDelay = 1.35;
    }
  }

  startLevel(levelOrId = this.campaign.currentLevel) {
    let lvl = levelOrId;
    if (typeof levelOrId === 'string' || typeof levelOrId === 'number') {
      lvl = this.campaign.setLevelById(levelOrId);
    } else if (levelOrId && levelOrId.id) {
      lvl = this.campaign.setLevelById(levelOrId.id);
    }
    this.initLevel(lvl);
    this.victoryDelay = 0;
    this.victoryTotalDelay = 0;
    this.levelCompleteButton = null;
    this.levelCompleteTimer = 0;
    this.state = 'TRANSITION';
    if (typeof this.onLevelChanged === 'function') {
      this.onLevelChanged(this.currentLevel);
    }
  }

  advance() {
    if (this.state === 'TRANSITION') {
      this.state = 'READY';
    } else if (this.state === 'READY' || this.state === 'INTRO') {
      this.state = 'PLAYING';
    } else if (this.state === 'CARD') {
      this.state = 'PLAYING';
      this.clock.isPaused = false;
    } else if (this.state === 'LEVEL_COMPLETE' || this.state === 'VICTORY') {
      if (this.currentLevel.id === CAMPAIGN_LEVELS[CAMPAIGN_LEVELS.length - 1].id) {
        if (typeof this.onOpenVisitModal === 'function') {
          this.onOpenVisitModal();
        } else {
          this.startLevel(this.currentLevel);
        }
        return;
      }
      const nextLevel = this.campaign.getNextLevel();
      if (nextLevel) {
        this.startLevel(nextLevel);
      } else {
        this.startLevel(this.currentLevel);
      }
    } else if (this.state === 'GAMEOVER') {
      this.initLevel(this.currentLevel);
      this.state = 'READY';
    }
    if (typeof this.onStateChanged === 'function') {
      this.onStateChanged(this.state, this.currentLevel);
    }
  }

  /**
   * Show the visit card again during play, so a player can reread what the visit
   * asks for without restarting it (CAMPAIGN.md: the story and requirements stay
   * reachable). The clock stops while it is open and the visit is not reset.
   */
  toggleVisitCard() {
    if (this.state === 'PLAYING') {
      this.cancelStroke();
      this.clock.isPaused = true;
      this.state = 'CARD';
    } else if (this.state === 'CARD') {
      this.clock.isPaused = false;
      this.state = 'PLAYING';
    } else {
      return false;
    }
    this.onStateChanged?.(this.state, this.currentLevel);
    return true;
  }

  setWave(wave) {
    this.startLevel(wave);
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.cancelStroke();
      this.state = 'PAUSED';
      this.clock.isPaused = true;
      audio.stopCicadas();
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.clock.isPaused = false;
    }
    this.onStateChanged?.(this.state, this.currentLevel);
  }

  loop(timestamp) {
    const dt = Math.min(0.1, (timestamp - this.lastFrameTime) / 1000);
    this.lastFrameTime = timestamp;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.loop.bind(this));
  }

  update(dt) {
    if (this.uiSuspended) return;
    if (this.state === 'PLAYING') {
      if (this.victoryDelay > 0) {
        this.victoryDelay -= dt;
        if (this.victoryDelay <= 0) {
          this.state = 'LEVEL_COMPLETE';
          this.levelCompleteTimer = 0;
          this.campaign.recordVictory(this.score);
          if (typeof this.onLevelChanged === 'function') {
            this.onLevelChanged(this.currentLevel);
          }
          return;
        }
      }

      if (!this.isClockHeld() && !this.isUntimed()) this.clock.update(dt);
      if (this.clock.isExpired && !this.isUntimed() && this.victoryDelay <= 0) {
        this.cancelStroke();
        this.state = 'GAMEOVER';
        audio.stopCicadas();
        return;
      }

      this.updateHint(dt);

      // Atrium Wind Mechanics (Noon Visits V-VI)
      if (this.currentLevel?.wind) {
        const wind = this.currentLevel.wind;
        const period = wind.periodSeconds || 12;
        const warnSec = wind.warningSeconds || 2;
        const gustSec = wind.gustSeconds || 2;
        const calmSec = Math.max(0, period - warnSec - gustSec);

        this.windTimer = (this.windTimer + dt) % period;

        let phase = 'calm';
        if (this.windTimer >= calmSec + warnSec) {
          phase = 'gust';
        } else if (this.windTimer >= calmSec) {
          phase = 'warning';
        }

        if (phase !== this.windPhase) {
          if (phase === 'warning') {
            this.chooseWindDirection();
            audio.playWindWarning();
          } else if (phase === 'gust') {
            audio.playWindGust();
            this.spawnWindStreaks();
          }
          this.prevWindPhase = this.windPhase;
          this.windPhase = phase;
        }

        this.updateWindStreaks(dt);
      } else {
        this.windPhase = 'calm';
        this.windTimer = 0;
        this.windStreaks = [];
      }

      // Dusk cicada ambient layer: the visit whose line is about the cicadas carries the flag.
      const isCicadaLevel = Boolean(this.currentLevel?.cicadas);
      audio.updateCicadas(dt, isCicadaLevel && this.state === 'PLAYING');

      const bounds = { width: this.width, height: this.height };
      const windVx = this.windVelocity();

      const walls = (this.isDrawing && this.currentLevel?.stringRules && this.stringGesture)
        ? this.stringGesture.wallSegments
        : [];

      for (let i = this.entities.length - 1; i >= 0; i--) {
        const ent = this.entities[i];
        const from = walls.length ? { x: ent.x, y: ent.y } : null;
        ent.update(dt, bounds, ent.type === 'seed' ? windVx : 0);
        if (from) constrainToWalls(ent, from, walls, bounds, dt);
        if (['passage', 'window'].includes(this.currentLevel.scene) && ent.type === 'butterfly' && ent.state === 'roaming') {
          const r = duskSafeArea(bounds);
          if (ent.kind !== 'lacewing') {
            const pad = 35;
            if (ent.x < r.left + pad) ent.targetHeading = 0;
            else if (ent.x > r.right - pad) ent.targetHeading = Math.PI;
            if (ent.y < r.top + pad) ent.targetHeading = Math.PI / 2;
            else if (ent.y > r.bottom - pad) ent.targetHeading = -Math.PI / 2;
          }
          ent.x = Math.max(r.left, Math.min(r.right, ent.x));
          ent.y = Math.max(r.top, Math.min(r.bottom, ent.y));
        }
        if (ent.alpha <= 0.01 && (ent.state === 'departing' || ent.state === 'harmonizing')) {
          this.entities.splice(i, 1);
        }
      }

      if (this.isDrawing && this.stringGesture) {
        this.stringGesture.updateBeads(dt, bounds);
      }

      if (this.isDrawing && !this.checkCordHazards()) {
        if (!this.checkJasmineTake()) this.checkCordBeans();
      }
      this.updateBean(dt);
      this.updateJasmines(dt);
      this.maintainPopulation(dt);
    } else {
      audio.stopCicadas();
      if (this.state === 'LEVEL_COMPLETE') {
        this.levelCompleteTimer = (this.levelCompleteTimer || 0) + dt;
      }
    }

    // Update feedback timer
    if (this.feedbackBanner.timer > 0) {
      this.feedbackBanner.timer -= dt;
    }

    // Fade recoil stroke
    if (this.recoilAlpha > 0) {
      this.recoilAlpha = Math.max(0, this.recoilAlpha - dt * 2.2);
    }

    // Fade pocket fill
    if (this.pocketFillAlpha > 0) {
      this.pocketFillAlpha = Math.max(0, this.pocketFillAlpha - dt * 1.8);
    }

    // Fade stamps
    for (let i = this.stamps.length - 1; i >= 0; i--) {
      this.stamps[i].alpha -= dt * 0.35;
      if (this.stamps[i].alpha <= 0) {
        this.stamps.splice(i, 1);
      }
    }
  }

  /**
   * Picks the next gust's direction from the visit's `wind.directions` when a
   * warning starts, so the warning can show it. The same direction never comes
   * more than twice in a row (STRING.md rule 7).
   */
  chooseWindDirection() {
    const wind = this.currentLevel?.wind;
    const names = wind?.directions || [wind?.direction || 'right'];
    const signs = [...new Set(names.map(name => (name === 'left' ? -1 : 1)))];
    let next = signs[Math.floor(Math.random() * signs.length)];
    if (signs.length > 1 && next === this.windDirection && this.windDirectionRun >= 2) next = -next;
    this.windDirectionRun = (next === this.windDirection) ? this.windDirectionRun + 1 : 1;
    this.windDirection = next;
  }

  /** Signed horizontal seed speed from the current gust, in px/s. */
  windVelocity() {
    if (this.windPhase !== 'gust' || !this.currentLevel?.wind) return 0;
    return (this.currentLevel.wind.seedSpeedPlayWidthsPerSecond || 0.08) * this.width * this.windDirection;
  }

  windBadgeText() {
    const way = this.windDirection < 0 ? 'left' : 'right';
    return this.windPhase === 'gust'
      ? `💨 Gust: blowing ${way} ${this.windDirection < 0 ? '««' : '»»'}`
      : `🍃 Gust coming: blowing ${way}`;
  }

  spawnWindStreaks() {
    this.windStreaks = [];
    const dir = this.windDirection;
    const count = 7;
    for (let i = 0; i < count; i++) {
      const offset = 40 + Math.random() * 240;
      this.windStreaks.push({
        x: dir > 0 ? -offset : this.width + offset,
        y: 60 + Math.random() * (this.height - 140),
        length: 90 + Math.random() * 140,
        speed: this.width * (0.65 + Math.random() * 0.35),
        alpha: 0.22 + Math.random() * 0.28,
        curveOffset: (Math.random() - 0.5) * 16,
        dir,
      });
    }
  }

  updateWindStreaks(dt) {
    const dir = this.windDirection;
    if (this.windPhase === 'warning' && this.windStreaks.length < 3 && Math.random() < 0.08) {
      this.windStreaks.push({
        x: dir > 0 ? -50 : this.width + 50,
        y: 80 + Math.random() * (this.height - 160),
        length: 60 + Math.random() * 80,
        speed: this.width * 0.32,
        alpha: 0.14,
        curveOffset: (Math.random() - 0.5) * 12,
        dir,
      });
    }

    for (let i = this.windStreaks.length - 1; i >= 0; i--) {
      const s = this.windStreaks[i];
      s.x += s.speed * s.dir * dt;
      // A streak runs downwind from s.x by its length; it is gone once s.x leaves the far edge.
      const gone = s.dir > 0 ? s.x > this.width + 40 : s.x < -40;
      if (gone) {
        if (this.windPhase === 'gust' && s.dir === dir) {
          s.x = dir > 0 ? -s.length - Math.random() * 100 : this.width + s.length + Math.random() * 100;
          s.y = 60 + Math.random() * (this.height - 140);
        } else {
          this.windStreaks.splice(i, 1);
        }
      }
    }
  }

  drawWindPlanters(ctx) {
    if (!this.currentLevel?.wind || this.currentLevel.scene !== 'atrium') return;
    const isWarning = this.windPhase === 'warning';
    const isGust = this.windPhase === 'gust';
    if (!isWarning && !isGust) return;

    const time = performance.now() * 0.003;
    const sway = isGust ? (0.26 + Math.sin(time * 5.5) * 0.09) : (0.1 + Math.sin(time * 3) * 0.05);

    ctx.save();
    for (const side of [0, 1]) {
      const x = side ? this.width - 7 : 7;
      for (let i = 0; i < 9; i++) {
        const y = this.height * 0.52 + i * Math.max(12, this.height * 0.038);
        const dir = side ? -1 : 1;
        ctx.save();
        ctx.translate(x + dir * 11, y);
        ctx.rotate(sway * this.windDirection); // both planters lean downwind
        ctx.fillStyle = i % 2 ? 'rgba(180, 198, 158, 0.75)' : 'rgba(145, 173, 136, 0.75)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 4.5, 10, dir * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  drawWindStreaks(ctx) {
    if (this.windStreaks.length === 0) return;

    ctx.save();
    ctx.lineCap = 'round';
    for (const s of this.windStreaks) {
      ctx.strokeStyle = `rgba(255, 252, 240, ${s.alpha})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      const dir = s.dir || 1;
      ctx.quadraticCurveTo(s.x + s.length * 0.5 * dir, s.y + s.curveOffset, s.x + s.length * dir, s.y);
      ctx.stroke();

      ctx.strokeStyle = `rgba(215, 228, 220, ${s.alpha * 0.85})`;
      ctx.lineWidth = 1.0;
      ctx.stroke();
    }
    ctx.restore();
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Paper Meadow Floor
    this.drawMeadowFloor(ctx);

    // 2. Evaluated Pocket Fills (Pastel tinted paper)
    if (this.pocketFillAlpha > 0 && this.lastEvaluatedPockets.length > 0) {
      this.drawPocketFills(ctx);
    }

    // 2b. Live Closed Loop Preview (Shadow, Watercolor Wash & Loop Sign)
    this.drawLiveLoopPreview(ctx);

    // 3. Pressed Paper Stamps
    this.drawStamps(ctx);

    // 4. Dynamic Atrium Planter Leaves Sway
    // Edge planting removed; wind remains visible through drifting streaks.

    // 4b. Placed Salt Grains
    this.drawSaltGrains(ctx);

    // 5. Inhabitants (Folded Butterflies, Seeds, Snail)
    for (const ent of this.entities) {
      ent.draw(ctx);
    }

    this.drawBeadMarkers(ctx);

    // 6. Translucent Paper Wind Streamlines
    this.drawWindStreaks(ctx);

    // 7. Active Drawn Cord / Recoil Cord
    this.drawCord(ctx);

    // 6. HUD & Banners
    this.drawHUD(ctx);
    this.drawHint(ctx);

    // Soft parchment wash fade-out before the Visit Complete modal appears
    if (this.state === 'PLAYING' && this.victoryDelay > 0 && this.victoryDelay < 1.05) {
      const progress = Math.min(1, Math.max(0, (1.05 - this.victoryDelay) / 1.05));
      const ease = progress * progress;
      ctx.save();
      ctx.fillStyle = themeColor('paperDim', `rgba(40, 32, 28, ${(ease * 0.52).toFixed(3)})`);
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }

    // 7. Modals / Overlays
    if (this.state === 'TRANSITION') this.drawTransitionModal(ctx);
    else if (this.state === 'READY' || this.state === 'INTRO' || this.state === 'CARD') this.drawReadyModal(ctx);
    else if (this.state === 'PAUSED' && !this.uiSuspended) this.drawPausedModal(ctx);
    else if (this.state === 'LEVEL_COMPLETE' || this.state === 'VICTORY') this.drawLevelCompleteModal(ctx);
    else if (this.state === 'GAMEOVER') this.drawGameOverModal(ctx);
  }

  drawMeadowFloor(ctx) {
    if (this.currentLevel?.scene === 'window') {
      const key = `${themeKey()}:${this.width}:${this.height}:${this.dpr}`;
      if (this.midnightArtKey !== key) {
        this.midnightArt = createMidnightArt(this.width, this.height, this.dpr);
        this.midnightArtKey = key;
      }
      ctx.drawImage(this.midnightArt, 0, 0, this.width, this.height);
      return;
    }
    if (this.currentLevel?.scene === 'passage') {
      const key = `${themeKey()}:${this.width}:${this.height}:${window.devicePixelRatio || 1}`;
      if (this.duskArtKey !== key) {
        this.duskArt = createDuskArt(this.width, this.height, window.devicePixelRatio || 1);
        this.duskArtKey = key;
      }
      ctx.drawImage(this.duskArt, 0, 0, this.width, this.height);
      return;
    }
    if (this.currentLevel?.scene === 'atrium') {
      const key = `${themeKey()}:${this.width}:${this.height}:${window.devicePixelRatio || 1}`;
      if (this.noonArtKey !== key) {
        this.noonArt = createNoonArt(this.width, this.height, window.devicePixelRatio || 1);
        this.noonArtKey = key;
      }
      ctx.drawImage(this.noonArt, 0, 0, this.width, this.height);
      return;
    }
    if (this.currentLevel?.scene === 'curb') {
      const key = `${themeKey()}:${this.width}:${this.height}:${window.devicePixelRatio || 1}`;
      if (this.dawnArtKey !== key) {
        this.dawnArt = createDawnArt(this.width, this.height, window.devicePixelRatio || 1);
        this.dawnArtKey = key;
      }
      ctx.drawImage(this.dawnArt, 0, 0, this.width, this.height);
      return;
    }
    {
      // Warm sunlit cream paper base
      const grad = ctx.createLinearGradient(0, 0, 0, this.height);
      grad.addColorStop(0, '#f9f6ea');
      grad.addColorStop(1, '#f1ede0');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);

    }
  }

  drawPocketFills(ctx) {
    ctx.save();
    for (const p of this.lastEvaluatedPockets) {
      ctx.beginPath();
      const poly = p.polygon;
      ctx.moveTo(poly[0].x, poly[0].y);
      for (let i = 1; i < poly.length; i++) {
        ctx.lineTo(poly[i].x, poly[i].y);
      }
      ctx.closePath();

      const fillColor = p.entities.length > 0 ? 'rgba(235, 245, 215, ' : 'rgba(245, 225, 220, ';
      ctx.fillStyle = fillColor + this.pocketFillAlpha + ')';
      ctx.fill();

      // Delicate dashed inner boundary
      ctx.strokeStyle = `rgba(180, 160, 140, ${this.pocketFillAlpha * 1.5})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawLiveLoopPreview(ctx) {
    if (!this.isDrawing || !this.activePockets || this.activePockets.length === 0) return;

    ctx.save();
    const hasBeads = Boolean(this.currentLevel?.stringRules && this.stringGesture?.hasBeads);

    for (const pocket of this.activePockets) {
      const poly = pocket.polygon;
      if (!poly || poly.length < 3) continue;

      // Count non-hazard roaming entities currently inside the loop
      const enclosedCount = this.entities.filter(entity => {
        if (entity.state === 'departing' || entity.state === 'harmonizing') return false;
        if (entity.type === 'hazard' || entity.type === 'terrain' || entity.type === 'bean' || entity.type === 'plant') return false;
        return pointInPolygon({ x: entity.x, y: entity.y }, poly);
      }).length;

      // 1. Soft botanical watercolor paper wash & shadow inside closed loop
      ctx.beginPath();
      ctx.moveTo(poly[0].x, poly[0].y);
      for (let i = 1; i < poly.length; i++) {
        ctx.lineTo(poly[i].x, poly[i].y);
      }
      ctx.closePath();

      if (hasBeads) {
        ctx.fillStyle = 'rgba(215, 185, 170, 0.22)';
        ctx.strokeStyle = 'rgba(195, 110, 80, 0.45)';
      } else if (enclosedCount > 0) {
        ctx.fillStyle = 'rgba(220, 240, 205, 0.32)';
        ctx.strokeStyle = 'rgba(105, 145, 75, 0.55)';
      } else {
        ctx.fillStyle = 'rgba(245, 235, 210, 0.25)';
        ctx.strokeStyle = 'rgba(180, 155, 120, 0.45)';
      }

      ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 4]);
      ctx.stroke();

      // 2. Translucent watermark loop sign at centroid
      const centroid = pocket.centroid;
      if (centroid) {
        ctx.save();
        ctx.translate(centroid.x, centroid.y);
        ctx.setLineDash([]);

        if (pocket.type === 'figure8_lobeA' || pocket.type === 'figure8_lobeB') {
          // Infinity figure-eight sign
          const signHue = hasBeads ? 'rgba(180, 100, 70, 0.35)' : 'rgba(130, 160, 95, 0.45)';
          ctx.strokeStyle = signHue;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.ellipse(-7, 0, 7, 5, 0, 0, Math.PI * 2);
          ctx.ellipse(7, 0, 7, 5, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = signHue;
          ctx.beginPath();
          ctx.arc(0, 0, 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Pressed botanical loop ring with corner pips
          const signHue = hasBeads ? 'rgba(180, 100, 70, 0.35)' : 'rgba(125, 155, 95, 0.45)';
          ctx.strokeStyle = signHue;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.arc(0, 0, 14, 0, Math.PI * 2);
          ctx.stroke();

          for (let a = 0; a < 4; a++) {
            const ang = (a * Math.PI) / 2;
            ctx.beginPath();
            ctx.arc(Math.cos(ang) * 14, Math.sin(ang) * 14, 2, 0, Math.PI * 2);
            ctx.fillStyle = signHue;
            ctx.fill();
          }

          ctx.beginPath();
          ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = signHue;
          ctx.fill();
        }
        ctx.restore();
      }

      // 3. Delicate closure seam bridge for single loop. String visits close only
      // where the cord visibly closes, so they draw no bridge across a gap.
      if (pocket.type === 'single' && !this.currentLevel?.stringRules && this.currentStroke.length >= 2) {
        const start = this.currentStroke[0];
        const tip = this.currentStroke[this.currentStroke.length - 1];
        ctx.save();
        ctx.strokeStyle = hasBeads ? 'rgba(195, 110, 80, 0.65)' : 'rgba(120, 165, 90, 0.75)';
        ctx.lineWidth = 2.0;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(tip.x, tip.y);
        ctx.lineTo(start.x, start.y);
        ctx.stroke();

        ctx.fillStyle = hasBeads ? '#d46b43' : '#7fad5a';
        ctx.beginPath();
        ctx.arc(start.x, start.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.restore();
  }

  /**
   * The hint card: one unfinished requirement, its figure, and how to close it.
   * Tapping anywhere on the card dismisses it (see handleOverlayClick).
   */
  drawHint(ctx) {
    if (!this.hint || this.state !== 'PLAYING') {
      this.hintRect = null;
      return;
    }
    const isNarrow = this.width < 560;
    const cardW = Math.min(this.width - 24, isNarrow ? 250 : 288);
    const x = 12;
    const y = isNarrow ? 150 : 132;
    const padX = 10;
    const glyphW = 54;
    const textX = x + padX + glyphW + 10;
    const textW = cardW - (padX * 2) - glyphW - 10;

    ctx.save();
    ctx.font = '500 11.5px system-ui, -apple-system, sans-serif';
    const lines = wrapText(ctx, this.hint.text, textW);
    const cardH = Math.max(72, 34 + lines.length * 15 + 16);

    ctx.fillStyle = themeColor('panel', 'rgba(250, 246, 236, 0.96)');
    ctx.strokeStyle = themeColor('edge', '#d3c7ae');
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    drawRoundedRect(ctx, x, y, cardW, cardH, 9);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = themeColor('ink', '#4a4235');
    ctx.font = '600 11.5px system-ui, -apple-system, sans-serif';
    ctx.fillText(`Hint · ${this.hint.label}: ${this.hint.remaining} left`, x + padX, y + 18);

    ctx.fillStyle = themeColor('ink', '#54483a');
    ctx.font = '500 11.5px system-ui, -apple-system, sans-serif';
    lines.forEach((line, i) => ctx.fillText(line, textX, y + 36 + i * 15));

    ctx.fillStyle = themeColor('muted', '#8a7f70');
    ctx.font = '500 10px system-ui, -apple-system, sans-serif';
    ctx.fillText('Tap this card to dismiss', textX, y + cardH - 8);

    this.drawHintGlyph(ctx, this.hint.key, x + padX, y + 26, glyphW, cardH - 38);
    ctx.restore();

    this.hintRect = { x, y, w: cardW, h: cardH };
  }

  /** A small jasmine spray, used on the Midnight ready cards. */
  drawJasmineGlyph(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = themeColor('outline', '#4d6b52');
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.quadraticCurveTo(-6, 2, -9, -7);
    ctx.moveTo(0, 10);
    ctx.quadraticCurveTo(6, 2, 9, -7);
    ctx.stroke();
    ctx.fillStyle = '#5f7f5a';
    ctx.beginPath(); ctx.ellipse(-7, 6, 5, 2.4, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(7, 6, 5, 2.4, 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f6f8ec';
    ctx.strokeStyle = 'rgba(120, 140, 110, 0.55)';
    ctx.lineWidth = 0.7;
    for (const [bx, by] of [[-9, -9], [0, -13], [9, -9]]) {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.ellipse(bx + Math.cos(a) * 3.2, by + Math.sin(a) * 3.2, 2.7, 1.8, a, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /** The flax flower, shared with the field drawing. */
  /** The small cross a ready card puts beside a figure that does not count. */
  drawCardCross(ctx, x, y) {
    ctx.save();
    ctx.strokeStyle = '#b54a4a'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5);
    ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5);
    ctx.stroke();
    ctx.restore();
  }

  drawBeanGlyph(ctx, x, y) {
    ctx.save(); ctx.translate(x, y); ctx.scale(0.8, 0.8);
    drawFlaxFlower(ctx); ctx.restore();
  }

  /** The figure a hint names, drawn as cord and marks. No target is moved or marked. */
  drawHintGlyph(ctx, key, x, y, w, h) {
    const EIGHTS = new Set(['figure8', 'counterpartPair', 'lacewingCounterpart', 'nursery', 'mixedEcho', 'twinSeedWing']);
    const cx = x + w / 2;
    const cy = y + h / 2;
    const cord = themeColor('muted', '#9a8f7c');
    const ink = themeColor('ink', '#4a4235');

    const dot = (dx, dy, filled = true) => {
      ctx.beginPath();
      ctx.arc(dx, dy, 3, 0, Math.PI * 2);
      if (filled) {
        ctx.fillStyle = ink;
        ctx.fill();
      } else {
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }
    };

    ctx.save();
    ctx.strokeStyle = cord;
    ctx.lineWidth = 1.6;

    if (key === 'trace') {
      ctx.beginPath();
      ctx.moveTo(x + 2, cy + 10);
      ctx.quadraticCurveTo(cx, cy - 16, x + w - 2, cy + 10);
      ctx.stroke();
      dot(x + 8, cy + 4);
      dot(cx, cy - 5);
      dot(x + w - 8, cy + 4);
    } else if (EIGHTS.has(key)) {
      const r = Math.min(w * 0.24, h * 0.34);
      ctx.beginPath();
      ctx.ellipse(cx - r * 0.9, cy, r, r * 0.92, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx + r * 0.9, cy, r, r * 0.92, 0, 0, Math.PI * 2);
      ctx.stroke();
      dot(cx - r * 0.9, cy);
      dot(cx + r * 0.9, cy, key !== 'nursery' && key !== 'twinSeedWing');
    } else {
      const rx = Math.min(w * 0.42, 24);
      const ry = Math.min(h * 0.42, 20);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      if (key === 'trio' || key === 'seedTrio') {
        dot(cx - 8, cy + 4);
        dot(cx + 8, cy + 4);
        dot(cx, cy - 6);
        if (key === 'seedTrio') dot(cx + 13, cy - 7, false);
      } else if (key === 'seedWing') {
        dot(cx - 6, cy);
        dot(cx + 7, cy, false);
      } else {
        dot(cx - 6, cy);
        dot(cx + 6, cy);
      }
    }
    ctx.restore();
  }

  drawStamps(ctx) {
    for (const s of this.stamps) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, s.alpha);
      ctx.translate(s.x, s.y);

      // Pressed floral watermark ring
      ctx.strokeStyle = 'rgba(160, 130, 95, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, s.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Tiny rosette petals
      const petals = 8;
      for (let i = 0; i < petals; i++) {
        const ang = (i * Math.PI * 2) / petals;
        ctx.beginPath();
        ctx.arc(Math.cos(ang) * s.radius, Math.sin(ang) * s.radius, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(195, 165, 125, 0.5)';
        ctx.fill();
      }
      ctx.restore();
    }
  }

  drawCord(ctx) {
    // 1. Recoil fading cord
    if (this.recoilAlpha > 0 && this.recoilStroke && this.recoilStroke.length >= 2) {
      ctx.save();
      ctx.globalAlpha = this.recoilAlpha;
      ctx.strokeStyle = '#a6808c';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(this.recoilStroke[0].x, this.recoilStroke[0].y);
      for (let i = 1; i < this.recoilStroke.length; i++) {
        ctx.lineTo(this.recoilStroke[i].x, this.recoilStroke[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 2. Active Drawn Cord
    if (this.isDrawing && this.currentStroke.length >= 2) {
      const pts = this.currentStroke;
      const band = this.activeBand;
      const isClosed = Boolean(this.activePockets && this.activePockets.length > 0);
      const hasBeads = Boolean(this.currentLevel?.stringRules && this.stringGesture?.hasBeads);

      const isTraceReady = Boolean(this.traceStatus()?.ready);

      ctx.save();

      // Cord closure luminous aura when loop qualifies as closed or trace is ready
      if (isTraceReady) {
        ctx.shadowColor = 'rgba(70, 180, 220, 0.9)';
        ctx.shadowBlur = 14;
      } else if (isClosed) {
        ctx.shadowColor = hasBeads ? 'rgba(215, 90, 50, 0.75)' : 'rgba(240, 195, 75, 0.85)';
        ctx.shadowBlur = 12;
      }

      // Cord contact shadow
      ctx.strokeStyle = 'rgba(40, 45, 30, 0.16)';
      ctx.lineWidth = CORD_WIDTH;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pts[0].x + 2, pts[0].y + 3);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x + 2, pts[i].y + 3);
      }
      ctx.stroke();

      // Soft luminous under-glow along cord if closed or trace is ready
      if (isTraceReady) {
        ctx.strokeStyle = 'rgba(70, 180, 220, 0.4)';
        ctx.lineWidth = 6.5;
        ctx.stroke();
      } else if (isClosed) {
        ctx.strokeStyle = hasBeads ? 'rgba(215, 90, 50, 0.35)' : 'rgba(245, 205, 80, 0.45)';
        ctx.lineWidth = 6.5;
        ctx.stroke();
      }

      // Main dyed cotton cord strand
      ctx.strokeStyle = isTraceReady
        ? themeColor('trace', '#416e83')
        : (isClosed
          ? (hasBeads ? '#d46b43' : '#7fad5a')
          : themeColor(band.name.toLowerCase(), band.cordHue));
      ctx.lineWidth = 3.8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();

      // Inner twist highlight (gives spun thread texture)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 5]);
      ctx.stroke();

      // Drawing head ring (pulses gently when closed or trace is ready)
      const tip = pts[pts.length - 1];
      ctx.fillStyle = isTraceReady ? themeColor('trace', '#416e83') : (isClosed ? (hasBeads ? '#d46b43' : '#7fad5a') : themeColor(band.name.toLowerCase(), band.color));
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, (isTraceReady || isClosed) ? 5.2 : 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  drawSaltGrains(ctx) {
    if (!this.saltGrains || this.saltGrains.length === 0) return;
    ctx.save();
    for (const grain of this.saltGrains) {
      ctx.save();
      ctx.translate(grain.x, grain.y);
      ctx.rotate(grain.rotation || 0);
      const s = grain.size || 2.8;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'rgba(180, 172, 160, 0.85)';
      ctx.lineWidth = 0.7;
      ctx.fillRect(-s / 2, -s / 2, s, s);
      ctx.strokeRect(-s / 2, -s / 2, s, s);
      // Subtle specular facet
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(-s / 2 + 0.3, -s / 2 + 0.3, s * 0.45, s * 0.45);
      ctx.restore();
    }
    ctx.restore();
  }

  drawBeadMarkers(ctx) {
    if (!this.isDrawing || !this.stringGesture || !this.stringGesture.hasBeads) return;
    const trace = this.traceStatus();
    const isTraceLevel = Boolean(trace);
    const traceOrder = trace?.order || [];
    ctx.save();
    for (const bead of this.stringGesture.beads) {
      const ent = bead.entity;
      const orderIdx = traceOrder.indexOf(ent);
      // A bead is marked as matching only while every bead up to it is in order.
      const isMatchingBead = isTraceLevel && orderIdx >= 0 && orderIdx < trace.sequence.length
        && traceOrder.slice(0, orderIdx + 1).every((e, i) => e.kind === trace.sequence[i]);
      const markerHue = isTraceLevel ? (isMatchingBead ? themeColor('trace', '#315b73') : themeColor('balanced', '#c85a32')) : themeColor('balanced', '#c85a32');

      // Hit circle indicator around the bug
      ctx.strokeStyle = markerHue;
      ctx.lineWidth = 2.0;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(ent.x, ent.y, ent.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Find anchor point on the cord at bead.s
      const { point } = pointAndTangentAtArcLength(this.stringGesture.points, bead.s);

      // Subtle tether line from cord anchor point to insect center
      ctx.setLineDash([]);
      ctx.strokeStyle = isTraceLevel && isMatchingBead ? 'rgba(49, 91, 115, 0.45)' : 'rgba(200, 90, 50, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(ent.x, ent.y);
      ctx.stroke();

      // Small bead pip on the cord itself
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = markerHue;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // If in trace level and ordered, show index badge (1, 2, 3) near insect
      if (isTraceLevel && orderIdx >= 0) {
        ctx.fillStyle = markerHue;
        ctx.beginPath();
        ctx.arc(ent.x + ent.radius, ent.y - ent.radius, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(String(orderIdx + 1), ent.x + ent.radius, ent.y - ent.radius + 3.5);
      }
    }
    ctx.restore();
  }

  drawObjectivePills(ctx, right, top, maxWidth) {
    const entries = Object.values(this.campaign.objectiveProgress);
    const labels = entries.length ? entries.map(o => `${o.label}: ${o.current}/${o.target}`) : [`Harmonies: ${this.harmoniesCount}`];
    ctx.font = '500 11px Mali, sans-serif';
    ctx.textAlign = 'right';
    let y = top;
    labels.forEach((label, i) => {
      const lines = wrapText(ctx, label, maxWidth - 20);
      const w = Math.min(maxWidth, Math.max(...lines.map(line => ctx.measureText(line).width)) + 20);
      const h = lines.length * 14 + 8;
      ctx.save();
      ctx.globalAlpha = entries[i]?.current >= entries[i]?.target ? .4 : .6;
      ctx.fillStyle = themeColor('panel', '#eeeada');
      ctx.beginPath(); drawRoundedRect(ctx, right - w, y, w, h, 12); ctx.fill();
      ctx.restore();
      ctx.fillStyle = themeColor('ink', '#4a4235');
      lines.forEach((line, j) => ctx.fillText(line, right - 10, y + 15 + j * 14));
      y += h + 5;
    });
    return y - top;
  }

  drawHUD(ctx) {
    ctx.save();
    // Keep status text readable when the logical field shrinks on a phone.
    const hudScale = Math.max(1, 1 / (this.displayScale || 1));
    const width = this.width / hudScale, height = this.height / hudScale;
    ctx.scale(hudScale, hudScale);
    const isNarrow = width < height || width < 560;

    if (isNarrow) {
      // --- MOBILE / VERTICAL HUD LAYOUT ---
      // Tier 1: Left Clock, Right Objectives
      this.clock.draw(ctx, 28, 28, 18);

      ctx.fillStyle = themeColor('ink', '#4a4235');
      ctx.font = '600 13px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      const secondsLeft = Math.ceil(this.clock.remainingSeconds);
      const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
      const ss = String(secondsLeft % 60).padStart(2, '0');
      ctx.fillText(this.isUntimed() ? '--:--' : `${mm}:${ss}`, 52, 28);

      ctx.fillStyle = themeColor('muted', '#8a7f70');
      ctx.font = '500 10px system-ui, -apple-system, sans-serif';
      ctx.fillText(this.isUntimed() ? 'Untimed' : (this.isClockHeld() ? 'Waiting' : 'Clock'), 52, 40);

      // Top-Right: Objective & Score
      const lvlTitle = this.currentLevel ? `${this.currentLevel.title}` : `Wave ${this.currentWave}`;

      ctx.textAlign = 'right';
      ctx.fillStyle = themeColor('ink', '#4a4235');
      ctx.font = '600 11px system-ui, -apple-system, sans-serif';
      const extraHUDHeight = this.drawObjectivePills(ctx, width - 16, 12, width - 126) - 14;

      ctx.fillStyle = themeColor('muted', '#7a6c57');
      ctx.font = 'italic 10.5px Mali, sans-serif';
      ctx.fillText(`${lvlTitle} • ${this.score} pts`, width - 16, 40 + extraHUDHeight);

      // Tier 2: Centered Stroke Length Band Meter (compact, below top row)
      const cx = width / 2;
      ctx.fillStyle = themeColor('panel', 'rgba(255, 255, 255, 0.75)');
      ctx.strokeStyle = themeColor('edge', '#dcd4c5');
      ctx.lineWidth = 1.1;
      const meterW = Math.min(140, width - 60);
      const meterH = 15;
      const meterY = 52 + extraHUDHeight;

      ctx.beginPath();
      drawRoundedRect(ctx, cx - meterW / 2, meterY, meterW, meterH, 7);
      ctx.fill();
      ctx.stroke();

      const meterMax = Math.max(1400, this.cordLimit() + 100);
      const fillRatio = Math.min(1.0, this.strokeLength / meterMax);
      if (fillRatio > 0.01) {
        ctx.fillStyle = themeColor(this.activeBand.name.toLowerCase(), this.activeBand.color);
        ctx.beginPath();
        drawRoundedRect(ctx, cx - meterW / 2 + 2, meterY + 2, (meterW - 4) * fillRatio, meterH - 4, 5);
        ctx.fill();
      }

      if (this.currentLevel?.stringRules) {
        const snapRatio = Math.min(1.0, this.cordLimit() / meterMax);
        const snapX = cx - meterW / 2 + 2 + (meterW - 4) * snapRatio;
        ctx.strokeStyle = themeColor('balanced', '#c85a32');
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(snapX, meterY + 2);
        ctx.lineTo(snapX, meterY + meterH - 2);
        ctx.stroke();
      }

      ctx.fillStyle = themeColor('ink', '#4a4235');
      ctx.font = '600 9.5px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`CORD: ${this.activeBand.name.toUpperCase()}`, cx, meterY + 11);
    } else {
      // --- STANDARD WIDESCREEN HUD LAYOUT ---
      this.clock.draw(ctx, 42, 40, 24);

      ctx.fillStyle = themeColor('ink', '#4a4235');
      ctx.font = '600 14px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      const secondsLeft = Math.ceil(this.clock.remainingSeconds);
      const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
      const ss = String(secondsLeft % 60).padStart(2, '0');
      ctx.fillText(this.isUntimed() ? '--:--' : `${mm}:${ss}`, 74, 38);

      ctx.fillStyle = themeColor('muted', '#8a7f70');
      ctx.font = '500 11px system-ui, -apple-system, sans-serif';
      ctx.fillText(
        this.isUntimed() ? 'Untimed practice' : (this.isClockHeld() ? 'Starts after first loop' : 'Dandelion Clock'),
        74,
        52
      );

      const cx = width / 2;
      ctx.fillStyle = themeColor('panel', 'rgba(255, 255, 255, 0.7)');
      ctx.strokeStyle = themeColor('edge', '#dcd4c5');
      ctx.lineWidth = 1.2;
      const meterW = 160, meterH = 18;
      ctx.beginPath();
      drawRoundedRect(ctx, cx - meterW / 2, 24, meterW, meterH, 9);
      ctx.fill();
      ctx.stroke();

      const meterMax = Math.max(1400, this.cordLimit() + 100);
      const fillRatio = Math.min(1.0, this.strokeLength / meterMax);
      if (fillRatio > 0.01) {
        ctx.fillStyle = themeColor(this.activeBand.name.toLowerCase(), this.activeBand.color);
        ctx.beginPath();
        drawRoundedRect(ctx, cx - meterW / 2 + 2, 26, (meterW - 4) * fillRatio, meterH - 4, 7);
        ctx.fill();
      }

      if (this.currentLevel?.stringRules) {
        const snapRatio = Math.min(1.0, this.cordLimit() / meterMax);
        const snapX = cx - meterW / 2 + 2 + (meterW - 4) * snapRatio;
        ctx.strokeStyle = themeColor('balanced', '#c85a32');
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(snapX, 26);
        ctx.lineTo(snapX, 40);
        ctx.stroke();
      }

      ctx.fillStyle = themeColor('ink', '#4a4235');
      ctx.font = '600 11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`CORD: ${this.activeBand.name.toUpperCase()}`, cx, 37);

      const lvlTitle = this.currentLevel ? `${this.currentLevel.title}` : `Wave ${this.currentWave}`;

      ctx.textAlign = 'right';
      ctx.fillStyle = themeColor('ink', '#4a4235');
      ctx.font = '600 12.5px system-ui, -apple-system, sans-serif';
      // Wrap inside the space right of the cord meter. A visit with five
      // requirements used to run its list back across the meter and the clock.
      const objRight = width - 24;
      const objWidth = Math.max(160, objRight - (cx + meterW / 2) - 16);
      const objectiveDrop = this.drawObjectivePills(ctx, objRight, 16, objWidth) - 15;

      ctx.fillStyle = themeColor('muted', '#7a6c57');
      ctx.font = 'italic 11px Mali, sans-serif';
      ctx.fillText(lvlTitle, objRight, 49 + objectiveDrop);

      ctx.fillStyle = themeColor('muted', '#8a7f70');
      ctx.font = '500 11px system-ui, -apple-system, sans-serif';
      ctx.fillText(`Score: ${this.score}`, objRight, 64 + objectiveDrop);
    }

    // --- Wind Indicator Badge (Noon Visits V-VI) ---
    if (this.currentLevel?.wind && (this.windPhase === 'warning' || this.windPhase === 'gust')) {
      const cx = width / 2;
      const isGust = this.windPhase === 'gust';
      const isNarrow = width < 560;
      const badgeText = this.windBadgeText();
      const bg = isGust ? 'rgba(232, 246, 228, 0.94)' : 'rgba(254, 247, 230, 0.94)';
      const border = isGust ? '#8ab583' : '#d8b97e';
      const textCol = isGust ? '#234f21' : '#684d1e';

      ctx.save();
      ctx.font = isNarrow ? '600 10.5px system-ui, sans-serif' : '600 11.5px system-ui, sans-serif';
      const tw = ctx.measureText(badgeText).width;
      const bw = Math.min(width - 24, tw + 20);
      const bh = isNarrow ? 19 : 22;
      const by = isNarrow ? 71 : 48;

      ctx.fillStyle = bg;
      ctx.strokeStyle = border;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      drawRoundedRect(ctx, cx - bw / 2, by, bw, bh, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = textCol;
      ctx.textAlign = 'center';
      ctx.fillText(badgeText, cx, by + (isNarrow ? 13 : 15));
      ctx.restore();
    }

    // --- Bottom-Center: Feedback Banner ---
    if (this.feedbackBanner.timer > 0) {
      const bAlpha = Math.min(1.0, this.feedbackBanner.timer * 2.5);
      ctx.globalAlpha = bAlpha;

      let bgColor = 'rgba(247, 243, 232, 0.94)';
      let textColor = '#4f4433';
      let borderColor = '#c4b59f';

      if (this.feedbackBanner.type === 'success') {
        bgColor = 'rgba(235, 247, 230, 0.95)';
        textColor = '#2c5929';
        borderColor = '#8cb885';
      } else if (this.feedbackBanner.type === 'warning') {
        bgColor = 'rgba(253, 237, 236, 0.95)';
        textColor = '#7d2626';
        borderColor = '#df9595';
      }

      ctx.fillStyle = bgColor;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1.2;

      ctx.font = '500 13px system-ui, -apple-system, sans-serif';
      const textWidth = ctx.measureText(this.feedbackBanner.text).width;
      const boxW = Math.min(width - 24, Math.max(180, textWidth + 30));
      const boxH = 32;
      // Below the HUD, trace line, and wind badge: the canvas bottom can sit below
      // the fold (a 720 px window ends the 640 px canvas at 779 px).
      const by = isNarrow ? 128 : 108;
      const cx = width / 2;

      ctx.beginPath();
      drawRoundedRect(ctx, cx - boxW / 2, by, boxW, boxH, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.fillText(this.feedbackBanner.text, cx, by + 20);
    }

    ctx.restore();
  }

  drawTransitionModal(ctx) {
    const lvl = this.currentLevel;
    this.drawModalBox(ctx, 480, 260, (boxW, boxH) => {
      const isNarrow = boxW < 440;

      // Hour subtitle
      ctx.font = isNarrow ? '600 11px system-ui, sans-serif' : '600 12px system-ui, sans-serif';
      ctx.fillStyle = themeColor('muted', '#8a7d6d');
      ctx.textAlign = 'center';
      ctx.fillText((lvl.hourLabel || 'DAWN · VISIT').toUpperCase(), 0, -boxH / 2 + 38);

      // Title
      ctx.fillStyle = themeColor('ink', '#2c251d');
      ctx.font = isNarrow ? '600 23px Mali, sans-serif' : '600 27px Mali, sans-serif';
      ctx.fillText(lvl.title, 0, -boxH / 2 + 66);

      // Decorative divider
      ctx.strokeStyle = themeColor('edge', '#d6cbba');
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-boxW * 0.28, -boxH / 2 + 82);
      ctx.lineTo(boxW * 0.28, -boxH / 2 + 82);
      ctx.stroke();

      // Verbatim transition text
      ctx.font = isNarrow ? '400 18px Mali, sans-serif' : '400 21px Mali, sans-serif';
      ctx.fillStyle = themeColor('ink', '#3a3227');
      const lines = wrapText(ctx, lvl.transitionText, boxW - 64);
      const lineHeight = isNarrow ? 27 : 30;
      lines.forEach((line, i) => ctx.fillText(line, 0, 7 + (i - (lines.length - 1) / 2) * lineHeight));

      // Prompt
      ctx.fillStyle = themeColor('ink', '#5c4538');
      ctx.font = isNarrow ? '600 12px system-ui, sans-serif' : '600 14px system-ui, sans-serif';
      ctx.fillText(isNarrow ? '[ Tap to Continue ]' : '[ Click anywhere or press Space to Continue ]', 0, boxH / 2 - 24);
    });
  }

  drawReadyModal(ctx) {
    const lvl = this.currentLevel;
    // Untimed practice copies keep the visit's teaching diagram.
    const lid = lvl.practiceOf || lvl.id;
    const teachMidnight01 = lid === 'midnight-01' || lid === 'midnight-04' || lid === 'practice-midnight' || lid === 'practice-string-trace';
    const teachMidnight02 = lid === 'midnight-03';
    const teachMidnight03 = lid === 'midnight-05' || lid === 'midnight-06';
    const teachLacewing = lid === 'dusk-01' || lid === 'practice-dusk';
    const teachDusk02 = lid === 'dusk-03' || lid === 'dusk-04';
    const teachDusk03 = lid === 'dusk-05' || lid === 'dusk-06';
    const teachNoon01 = lid === 'noon-01' || lid === 'practice-noon';
    const teachNoon02 = lid === 'noon-03';
    const teachNoon03 = lid === 'noon-04' || lid === 'noon-06';
    const teachDawn01 = lid === 'dawn-01';
    const teachDawn02 = lid === 'dawn-03' || lid === 'dawn-04';
    const teachDawn03 = lid === 'dawn-05';
    const teachDawn = teachDawn01 || teachDawn02 || teachDawn03;
    const teachDusk = teachLacewing || teachDusk02 || teachDusk03;
    const teachMidnight = teachMidnight01 || teachMidnight02 || teachMidnight03;
    // Visits that add nothing new still get a picture: what the visit is practising.
    const teachDawnPairs = lid === 'dawn-02';
    const teachDawnAll = lid === 'dawn-06';
    const teachNoonGust = lid === 'noon-02';
    const teachNoonWeb = lid === 'noon-05';
    const teachDuskCounterpart = lid === 'dusk-02';
    const teachMidnightRoute = lid === 'midnight-02';
    const hasDiagram = teachDawn || teachDusk || teachMidnight || teachNoon01 || teachNoon02 || teachNoon03
      || teachDawnPairs || teachDawnAll || teachNoonGust || teachNoonWeb || teachDuskCounterpart || teachMidnightRoute;
    const modalHeight = hasDiagram ? 445 : 310;
    // Each requirement row carries a diagram, so rows are taller than bare text.
    const requirementCount = Object.keys(this.campaign.objectiveProgress).length;
    const rowExtra = requirementCount * (REQUIREMENT_ROW - 21);

    this.drawModalBox(ctx, 500, modalHeight + rowExtra, (boxW, boxH) => {
      const isNarrow = boxW < 440;

      // Header
      ctx.fillStyle = themeColor('ink', '#3a3429');
      ctx.font = isNarrow ? '600 22px Mali, sans-serif' : '600 27px Mali, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(lvl.title, 0, -boxH / 2 + 36);

      // Subtitle
      ctx.font = isNarrow ? 'italic 12px Mali, sans-serif' : 'italic 13px Mali, sans-serif';
      ctx.fillStyle = themeColor('muted', '#7a6f5f');
      ctx.fillText(lvl.hourLabel || 'Dawn · Visit', 0, -boxH / 2 + 58);

      // Instruction
      ctx.font = isNarrow ? '12px system-ui, sans-serif' : '13px system-ui, sans-serif';
      ctx.fillStyle = themeColor('ink', '#4c4234');
      const instructionLines = wrapText(ctx, lvl.instruction, boxW - 48);
      instructionLines.forEach((line, i) => ctx.fillText(line, 0, -boxH / 2 + 88 + i * 17));

      // Objectives box
      ctx.textAlign = 'left';
      ctx.font = isNarrow ? '600 11.5px system-ui, sans-serif' : '600 12.5px system-ui, sans-serif';
      ctx.fillStyle = themeColor('ink', '#2c251d');
      const padX = -boxW / 2 + (isNarrow ? 22 : 36);
      let startY = -boxH / 2 + 124 + (instructionLines.length - 1) * 17;

      ctx.fillText('VISIT REQUIREMENTS:', padX, startY);
      startY += 19;

      ctx.font = isNarrow ? '12px system-ui, sans-serif' : '13px system-ui, sans-serif';
      ctx.fillStyle = themeColor('ink', '#4c4234');
      const diagramW = isNarrow ? 76 : 92;
      const diagramH = isNarrow ? 28 : 34;
      for (const [k, obj] of Object.entries(this.campaign.objectiveProgress)) {
        if (COMBO_DIAGRAMS[k]) {
          ctx.save();
          ctx.translate(padX + 4, startY - 14 + (REQUIREMENT_ROW - diagramH) / 2 - 3);
          drawComboDiagram(ctx, k, diagramW, diagramH);
          ctx.restore();
        }
        ctx.fillText(`${obj.label}: ${obj.current} / ${obj.target}`, padX + diagramW + 16, startY + (REQUIREMENT_ROW - 21) / 2 - 3);
        startY += REQUIREMENT_ROW;
      }

      // Duration note
      ctx.font = 'italic 11.5px Mali, sans-serif';
      ctx.fillStyle = themeColor('muted', '#8a7e6f');
      ctx.fillText(`Dandelion Clock: ${lvl.durationSeconds} seconds${lvl.clockStartsOnFirstCombination ? ', starting after your first loop' : ''}`, padX, startY + 8);

      if (teachDawn01) {
        ctx.save(); ctx.translate(0, boxH / 2 - 108);
        // Cord drawn as a curved wall with open gap at the top right
        ctx.strokeStyle = themeColor('petite', '#ac647e'); ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(14, -16);
        ctx.quadraticCurveTo(24, 18, -20, 24);
        ctx.quadraticCurveTo(-78, 22, -74, -8);
        ctx.quadraticCurveTo(-66, -32, -14, -28);
        ctx.stroke();

        // Start point pip at (-14, -28)
        ctx.fillStyle = themeColor('petite', '#ac647e');
        ctx.beginPath(); ctx.arc(-14, -28, 2.5, 0, Math.PI * 2); ctx.fill();

        // Drawing tip / pointer at (14, -16)
        ctx.fillStyle = themeColor('petite', '#ac647e');
        ctx.beginPath(); ctx.arc(14, -16, 4, 0, Math.PI * 2); ctx.fill();

        // Dashed gap line showing open space to close
        ctx.save();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = 'rgba(172, 100, 126, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(14, -16); ctx.lineTo(-14, -28); ctx.stroke();
        ctx.restore();

        // Insects inside: two Brimstones
        const a = new Butterfly(-48, -12, 'brimstone'); a.heading = 0.3; a.draw(ctx);
        const b = new Butterfly(-22, 6, 'brimstone'); b.heading = 0.8; b.draw(ctx);

        // Wall deflection bounce mark inside the wall
        ctx.save();
        ctx.strokeStyle = '#9c8e7e'; ctx.lineWidth = 1.2; ctx.setLineDash([2, 2]);
        ctx.beginPath(); ctx.moveTo(-36, 14); ctx.lineTo(-58, 16); ctx.lineTo(-44, 2); ctx.stroke();
        ctx.restore();

        // Bystander outside the wall
        const d = new Butterfly(68, -4, 'damselfly'); d.heading = -Math.PI / 2; d.draw(ctx);

        ctx.textAlign = 'center'; ctx.fillStyle = themeColor('ink', '#5c4538'); ctx.font = '11px system-ui, sans-serif';
        ctx.fillText('The held cord is a wall: fliers cannot cross it while you draw.', 0, 41);
        ctx.fillText('Close the loop before insects escape through the open gap.', 0, 56);
        ctx.restore();
      } else if (teachDawn02) {
        ctx.save(); ctx.translate(0, boxH / 2 - 108);
        // Left: Valid Seed & Wing loop
        ctx.strokeStyle = themeColor('petite', '#ac647e'); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(-80, -6, 50, 28, 0, 0, Math.PI * 2); ctx.stroke();
        const fly = new Butterfly(-100, -6, 'brimstone'); fly.heading = -0.4; fly.draw(ctx);
        ctx.save(); ctx.translate(-62, -6); ctx.scale(0.85, 0.85);
        new DandelionSeed(0, 0).draw(ctx); ctx.restore();
        ctx.textAlign = 'center'; ctx.fillStyle = themeColor('ink', '#5c4538'); ctx.font = '10.5px system-ui, sans-serif';
        ctx.fillText('Valid Seed & Wing', -80, 28);

        // Right: Threaded bead cancellation warning
        ctx.strokeStyle = '#b85c38'; ctx.lineWidth = 2; // terracotta warning
        ctx.beginPath(); ctx.ellipse(78, -6, 50, 28, 0, 0, Math.PI * 2); ctx.stroke();
        const d = new Butterfly(78, -6, 'damselfly'); d.heading = -Math.PI / 2; d.draw(ctx);

        // Bead indicator on cord: ring around insect + white bead pip + cancel cross
        ctx.strokeStyle = 'rgba(184, 92, 56, 0.7)'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(78, -6, 18, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(78, -6, 3, 0, Math.PI * 2); ctx.fill();

        // Cancellation badge at top-right of the bead
        ctx.strokeStyle = '#b54a4a'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(106, -22); ctx.lineTo(116, -12);
        ctx.moveTo(116, -22); ctx.lineTo(106, -12);
        ctx.stroke();

        ctx.textAlign = 'center'; ctx.fillStyle = themeColor('petite', '#852b2b'); ctx.font = '10.5px system-ui, sans-serif';
        ctx.fillText('Threaded (loop cancelled)', 78, 28);

        ctx.textAlign = 'center'; ctx.fillStyle = themeColor('ink', '#5c4538'); ctx.font = '11px system-ui, sans-serif';
        ctx.fillText('Touching an insect threads it as a bead on the cord and cancels the loop.', 0, 43);
        ctx.fillText(lvl.population.snail
          ? 'Draw around creatures to enclose them. A loop holding the snail gathers nothing.'
          : 'Draw around creatures to enclose them.', 0, 58);
        ctx.restore();
      } else if (teachDawn03) {
        ctx.save(); ctx.translate(0, boxH / 2 - 108);

        // Enclosed area wash
        ctx.save();
        ctx.fillStyle = 'rgba(220, 240, 205, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, -6, 94, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Watermark loop sign in centroid
        ctx.strokeStyle = 'rgba(100, 140, 70, 0.45)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(0, -6, 8, 0, Math.PI * 2); ctx.stroke();
        for (const [px, py] of [[-10, -6], [10, -6], [0, -16], [0, 4]]) {
          ctx.beginPath(); ctx.arc(px, py, 1.2, 0, Math.PI * 2); ctx.stroke();
        }

        // Cord with visible crossing at right edge
        ctx.save();
        ctx.shadowColor = 'rgba(212, 163, 89, 0.55)';
        ctx.shadowBlur = 8;
        ctx.strokeStyle = themeColor('petite', '#ac647e'); ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(82, 12);
        ctx.quadraticCurveTo(88, -6, 78, -18);
        ctx.quadraticCurveTo(40, -38, -10, -36);
        ctx.quadraticCurveTo(-94, -34, -94, -6);
        ctx.quadraticCurveTo(-94, 22, -10, 24);
        ctx.quadraticCurveTo(50, 24, 88, 2);
        ctx.stroke();
        ctx.restore();

        // Highlight the crossing point
        ctx.strokeStyle = '#7c9a62'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(84, 4, 6, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(84, 4, 2, 0, Math.PI * 2); ctx.fill();

        // Trio insects inside
        const f1 = new Butterfly(-54, -6, 'brimstone'); f1.heading = -0.4; f1.draw(ctx);
        const f2 = new Butterfly(-4, -6, 'damselfly'); f2.heading = -Math.PI / 2; f2.draw(ctx);
        const f3 = new Butterfly(46, -6, 'hawkmoth'); f3.heading = 0.4; f3.draw(ctx);

        ctx.textAlign = 'center'; ctx.fillStyle = themeColor('ink', '#5c4538'); ctx.font = '11px system-ui, sans-serif';
        ctx.fillText('Close the loop by crossing the cord over itself or landing on the line.', 0, 41);
        ctx.fillText('Trio of Flight: three different kinds in one loop. Past the meter mark, the cord snaps.', 0, 56);
        ctx.restore();
      } else if (teachMidnight01) {
        ctx.save(); ctx.translate(0, boxH / 2 - 112);
        // Cord line threading three insects, in the order this visit asks for
        const cardSequence = lvl.traceSequence || ['firefly', 'lacewing', 'firefly'];
        const lacewingFirst = cardSequence[0] === 'lacewing';
        ctx.strokeStyle = themeColor('trace', '#416e83'); ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(-110, 8); ctx.lineTo(110, 8); ctx.stroke();
        for (const [i, x] of [-70, 0, 70].entries()) {
          ctx.save(); ctx.translate(x, 8); ctx.scale(0.8, 0.8);
          if (cardSequence[i] === 'lacewing') drawLacewing(ctx, { lacePhase: 'rest', flapPhase: 0 });
          else drawFirefly(ctx, { stateTime: 0.4, glowOffset: 0 });
          ctx.restore();
          // Bead pip on the cord
          ctx.fillStyle = '#ffffff'; ctx.strokeStyle = themeColor('trace', '#315b73'); ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.arc(x, 8, 3.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          // Badge
          ctx.fillStyle = themeColor('trace', '#315b73'); ctx.beginPath(); ctx.arc(x + 14, 8 - 14, 8, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = themeColor('panel', '#fff'); ctx.font = '600 10px system-ui'; ctx.textAlign = 'center';
          ctx.fillText(String(i + 1), x + 14, 8 - 10.5);

          ctx.textAlign = 'center'; ctx.fillStyle = themeColor('trace', '#315b73'); ctx.font = '11px system-ui';
          ctx.fillText(`${i + 1}. ${cardSequence[i] === 'lacewing' ? 'Lacewing' : 'Firefly'}`, x, 34);
        }
        ctx.textAlign = 'center'; ctx.fillStyle = themeColor('ink', '#5c4538'); ctx.font = '11px system-ui';
        ctx.fillText(lacewingFirst
          ? 'Thread three insects in sequence: Lacewing → Firefly → the other Lacewing.'
          : 'Thread three insects in sequence: Firefly → Lacewing → different Firefly.', 0, 56);
        ctx.fillText('Line may stay open or close. Release after the third to score.', 0, 71);
        ctx.restore();
      } else if (teachLacewing) {
        ctx.save(); ctx.translate(0, boxH / 2 - 100);
        ctx.strokeStyle = themeColor('petite', '#ac647e'); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-100, -65, -100, 65, 0, 0);
        ctx.bezierCurveTo(100, -65, 100, 65, 0, 0); ctx.stroke();
        ctx.save(); ctx.translate(-46, -5); ctx.scale(0.7, 0.7);
        drawLacewing(ctx, { lacePhase: 'rest', flapPhase: 0 }); ctx.restore();
        const fly = new Butterfly(46, 0, 'hoverfly'); fly.heading = -Math.PI / 2; fly.draw(ctx);
        ctx.textAlign = 'center'; ctx.fillStyle = themeColor('ink', '#5c4538'); ctx.font = '11px system-ui, sans-serif';
        ctx.fillText('One lacewing and one hoverfly in separate pockets.', 0, 41);
        ctx.fillText('Cross your start to close both pockets; lacewings rest on leaves for 1.5 s.', 0, 56);
        ctx.restore();
      } else if (teachDusk02) {
        ctx.save(); ctx.translate(0, boxH / 2 - 100);
        ctx.strokeStyle = themeColor('petite', '#ac647e'); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-100, -65, -100, 65, 0, 0);
        ctx.bezierCurveTo(100, -65, 100, 65, 0, 0); ctx.stroke();
        ctx.save(); ctx.translate(-46, -5); ctx.scale(0.7, 0.7);
        drawLacewing(ctx, { lacePhase: 'rest', flapPhase: 0 }); ctx.restore();
        ctx.save(); ctx.translate(46, -2); ctx.scale(0.85, 0.85);
        new DandelionSeed(0, 0).draw(ctx);
        ctx.restore();
        ctx.textAlign = 'center'; ctx.fillStyle = themeColor('ink', '#5c4538'); ctx.font = '11px system-ui, sans-serif';
        ctx.fillText('Nursery: 1 flier and 1 seed in separate pockets. Cross your start to close.', 0, 41);
        ctx.fillText(lvl.population.snail
          ? 'Also make a lacewing Counterpart Pair. Keep the snail out of both pockets.'
          : 'Exactly one of each: a second flier or seed in a pocket spoils it.', 0, 56);
        ctx.restore();
      } else if (teachDusk03) {
        ctx.save(); ctx.translate(0, boxH / 2 - 100);
        // Left: single circular loop
        ctx.strokeStyle = '#7c9a62'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(-62, -2, 34, 0, Math.PI * 2); ctx.stroke();
        const fly1 = new Butterfly(-72, -6, 'brimstone'); fly1.heading = -0.4; fly1.draw(ctx);
        const fly2 = new Butterfly(-52, 6, 'hoverfly'); fly2.heading = 0.5; fly2.draw(ctx);
        // Right: figure-eight
        ctx.strokeStyle = themeColor('petite', '#ac647e'); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(60, -2);
        ctx.bezierCurveTo(20, -45, 20, 41, 60, -2);
        ctx.bezierCurveTo(100, -45, 100, 41, 60, -2); ctx.stroke();
        const fly3 = new Butterfly(40, -2, 'damselfly'); fly3.heading = -Math.PI / 2; fly3.draw(ctx);
        const fly4 = new Butterfly(80, -2, 'hawkmoth'); fly4.heading = Math.PI / 2; fly4.draw(ctx);
        ctx.textAlign = 'center'; ctx.fillStyle = themeColor('ink', '#5c4538'); ctx.font = '11px system-ui, sans-serif';
        const fliers = ['brimstone', 'damselfly', 'hawkmoth', 'hoverfly', 'lacewing', 'firefly']
          .reduce((sum, kind) => sum + (lvl.population[kind] || 0), 0);
        ctx.fillText(`Switch gestures: ${lvl.objectives.single} single loops and ${lvl.objectives.figure8} figure-eights. Cross the cord to close.`, 0, 41);
        ctx.fillText(`${fliers >= 8 ? 'Dense field with' : 'A thinner field, with'} ${fliers} fliers; keep clear of the perimeter snail.`, 0, 56);
        ctx.restore();
      } else if (teachNoon01) {
        ctx.save(); ctx.translate(0, boxH / 2 - 100);
        // One loop around three kinds, with a bean picked on the way round.
        ctx.strokeStyle = themeColor('petite', '#ac647e'); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(0, -2, 80, 30, 0, 0, Math.PI * 2); ctx.stroke();

        ctx.fillStyle = themeColor('brimstone', '#f1d152'); ctx.beginPath(); ctx.ellipse(-42, 6, 10, 14, -0.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = themeColor('hoverfly', '#eab765'); ctx.beginPath(); ctx.ellipse(2, 8, 7, 11, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5d493a'; for (const y of [3, 8, 13]) ctx.fillRect(-2, y, 8, 2);
        ctx.fillStyle = '#de99a5'; ctx.beginPath(); ctx.ellipse(44, 6, 7, 12, 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#a8b894'; ctx.beginPath(); ctx.ellipse(44, 0, 4, 8, 0.8, 0, Math.PI * 2); ctx.fill();

        this.drawBeanGlyph(ctx, -2, -32);

        ctx.fillStyle = themeColor('ink', '#5c4538'); ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Three different kinds in one loop. Cross your start to close.', 0, 39);
        ctx.fillStyle = themeColor('muted', '#6e5a47'); ctx.font = 'italic 11px Mali, sans-serif';
        ctx.fillText('Pick a flax flower. The next cord is longer; use it within 12 seconds.', 0, 54);
        ctx.restore();
      } else if (teachNoon02) {
        ctx.save(); ctx.translate(0, boxH / 2 - 100);
        // One loop around a flier and a seed, drawn clear of the hornet's lane.
        ctx.strokeStyle = themeColor('petite', '#ac647e'); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(-24, 4, 58, 32, 0, 0, Math.PI * 2); ctx.stroke();

        ctx.fillStyle = themeColor('brimstone', '#f1d152'); ctx.beginPath(); ctx.ellipse(-46, 4, 10, 14, -0.4, 0, Math.PI * 2); ctx.fill();
        const sx = -4, sy = 4;
        ctx.fillStyle = '#faf7ed'; ctx.beginPath(); ctx.arc(sx, sy, 7, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = themeColor('seed', '#8a7e6b'); ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 7, sy + 9); ctx.stroke();
        ctx.beginPath(); ctx.arc(sx, sy, 7, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = themeColor('seed', '#655543'); ctx.beginPath(); ctx.ellipse(sx + 7, sy + 9, 1.5, 3, 0.6, 0, Math.PI * 2); ctx.fill();

        // The hornet wanders; the card shows one of its turns.
        ctx.strokeStyle = 'rgba(160, 110, 40, 0.45)'; ctx.lineWidth = 1.2; ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(-70, -22);
        ctx.bezierCurveTo(-20, -48, 20, -14, 56, -34);
        ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#d97a1e'; ctx.strokeStyle = '#3d2a12'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(56, -34, 11, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#3d3222';
        for (const bx of [53, 58, 63]) { ctx.beginPath(); ctx.ellipse(bx, -34, 1.5, 4.4, 0, 0, Math.PI * 2); ctx.fill(); }

        ctx.fillStyle = themeColor('ink', '#5c4538'); ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('One insect and one seed in one loop. Cross your start to close.', 0, 39);
        ctx.fillStyle = themeColor('muted', '#6e5a47'); ctx.font = 'italic 11px Mali, sans-serif';
        ctx.fillText('The hornet wanders and cuts a cord it touches. Gusts drift the seeds.', 0, 54);
        ctx.restore();
      } else if (teachNoon03) {
        ctx.save(); ctx.translate(0, boxH / 2 - 100);
        // Single loop cord (circle)
        ctx.strokeStyle = themeColor('petite', '#ac647e'); ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, -3, 78, 31, 0, 0, Math.PI * 2);
        ctx.stroke();

        // 1 Seed at center-top
        const sx = 0, sy = -14;
        ctx.fillStyle = '#faf7ed'; ctx.beginPath(); ctx.arc(sx, sy, 7, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = themeColor('seed', '#8a7e6b'); ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 7, sy + 9); ctx.stroke();
        ctx.beginPath(); ctx.arc(sx, sy, 7, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = themeColor('seed', '#655543'); ctx.beginPath(); ctx.ellipse(sx + 7, sy + 9, 1.5, 3, 0.6, 0, Math.PI * 2); ctx.fill();

        // 1 Brimstone butterfly at bottom-left
        ctx.fillStyle = themeColor('brimstone', '#f1d152'); ctx.beginPath(); ctx.ellipse(-44, 12, 9, 13, -0.4, 0, Math.PI * 2); ctx.fill();

        // 1 Amber hoverfly at bottom-center
        ctx.fillStyle = themeColor('hoverfly', '#eab765'); ctx.beginPath(); ctx.ellipse(0, 14, 6, 10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5d493a'; for (const y of [10, 14, 18]) ctx.fillRect(-4, y, 8, 2);

        // 1 Roseate hawkmoth at bottom-right
        ctx.fillStyle = '#de99a5'; ctx.beginPath(); ctx.ellipse(44, 12, 7, 12, 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#a8b894'; ctx.beginPath(); ctx.ellipse(44, 6, 4, 8, 0.8, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = themeColor('ink', '#5c4538'); ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'center';
        this.drawBeanGlyph(ctx, 62, -26);
        ctx.fillText('Seed & Trio: 1 seed and 3 different insects in one loop.', 0, 39);
        ctx.fillStyle = themeColor('muted', '#6e5a47'); ctx.font = 'italic 11px Mali, sans-serif';
        ctx.fillText(lvl.population.web
          ? 'Avoid the web and the hornet. Flax gives extra length to the next cord.'
          : 'Pick a flax flower first: the next cord is longer. Watch the hornet.', 0, 54);
        ctx.restore();
      } else if (teachMidnight02) {
        ctx.save(); ctx.translate(0, boxH / 2 - 96);
        // Left side: Loop / Figure-eight (Seed & Wing)
        ctx.strokeStyle = themeColor('petite', '#ac647e'); ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(-88, -12, 54, 28, -0.15, 0, Math.PI * 2);
        ctx.stroke();

        // 1 Hoverfly and 1 Seed in loop
        const hf = new Butterfly(-108, -12, 'hoverfly'); hf.heading = 0.3; hf.draw(ctx);
        ctx.save(); ctx.translate(-68, -12); ctx.scale(0.8, 0.8);
        new DandelionSeed(0, 0).draw(ctx); ctx.restore();

        ctx.textAlign = 'center'; ctx.fillStyle = themeColor('petite', '#7a3e52'); ctx.font = '600 11px system-ui, sans-serif';
        ctx.fillText('Loop or Figure-Eight', -88, 25);
        ctx.font = '10px system-ui, sans-serif'; ctx.fillStyle = themeColor('muted', '#6e5a47');
        ctx.fillText('Cross the cord to close', -88, 39);

        // Divider
        ctx.strokeStyle = themeColor('edge', '#d6cbba'); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, -34); ctx.lineTo(0, 42); ctx.stroke();

        // Right side: Trace Path (Firefly -> Lacewing -> Firefly)
        ctx.strokeStyle = themeColor('trace', '#416e83'); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(25, -12); ctx.lineTo(145, -12); ctx.stroke();
        for (const [i, x] of [35, 85, 135].entries()) {
          ctx.save(); ctx.translate(x, -12); ctx.scale(0.65, 0.65);
          if (i === 1) drawLacewing(ctx, { lacePhase: 'rest', flapPhase: 0 });
          else drawFirefly(ctx, { stateTime: 0.4, glowOffset: 0 });
          ctx.restore();
          // Bead pip on cord
          ctx.fillStyle = '#ffffff'; ctx.strokeStyle = themeColor('trace', '#315b73'); ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(x, -12, 2.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          // Badge
          ctx.fillStyle = themeColor('trace', '#315b73'); ctx.beginPath(); ctx.arc(x + 10, -12 - 10, 6.5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = themeColor('panel', '#fff'); ctx.font = '600 8.5px system-ui'; ctx.textAlign = 'center';
          ctx.fillText(String(i + 1), x + 10, -12 - 7.5);
        }
        ctx.textAlign = 'center'; ctx.fillStyle = themeColor('trace', '#2b5570'); ctx.font = '600 11px system-ui, sans-serif';
        ctx.fillText('Thread in Sequence', 85, 25);
        ctx.font = '10px system-ui, sans-serif'; ctx.fillStyle = themeColor('ink', '#5c4538');
        ctx.fillText('Firefly → Lacewing → Firefly', 85, 39);

        ctx.textAlign = 'center'; ctx.fillStyle = themeColor('ink', '#5c4538'); ctx.font = '11px system-ui, sans-serif';
        ctx.fillText('No modes: thread to trace, or close the cord to loop.', 0, 55);
        ctx.fillText('A stroke cannot both thread and enclose.', 0, 70);
        ctx.restore();
      } else if (teachMidnight03) {
        ctx.save(); ctx.translate(0, boxH / 2 - 96);
        // Brimstone butterfly on left, night jasmine on right
        const brim = new Butterfly(-72, -8, 'brimstone'); brim.heading = -0.3; brim.draw(ctx);
        this.drawJasmineGlyph(ctx, 66, -6);

        ctx.textAlign = 'center'; ctx.fillStyle = themeColor('ink', '#5c4538'); ctx.font = '600 12px system-ui, sans-serif';
        ctx.fillText('Begin a thread inside the jasmine to settle one insect on it for 24 s.', 0, 22);
        ctx.font = '11px system-ui, sans-serif'; ctx.fillStyle = themeColor('muted', '#6e5a47');
        ctx.fillText('It gathers nothing, but the insect holds still and the field thins by one.', 0, 38);
        ctx.fillText(lvl.population.brimstone
          ? 'Brimstones and the snail return. A stroke cannot both thread and enclose.'
          : 'Either trace counts: firefly first or lacewing first.', 0, 54);
        ctx.restore();
      } else if (teachDawnPairs) {
        ctx.save(); ctx.translate(0, boxH / 2 - 108);
        // Left: two of one kind
        ctx.strokeStyle = themeColor('petite', '#ac647e'); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(-80, -10, 50, 24, 0, 0, Math.PI * 2); ctx.stroke();
        for (const [x, tilt] of [[-98, 0], [-62, 0.4]]) {
          ctx.save(); ctx.translate(x, -10); ctx.scale(0.75, 0.75);
          const d = new Butterfly(0, 0, 'damselfly'); d.heading = -Math.PI / 2 + tilt; d.draw(ctx);
          ctx.restore();
        }
        ctx.textAlign = 'center'; ctx.fillStyle = themeColor('ink', '#5c4538'); ctx.font = '10.5px system-ui, sans-serif';
        ctx.fillText('Kindred Pair', -80, 28);

        // Right: two different kinds in one loop
        ctx.strokeStyle = '#b85c38'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(78, -10, 50, 24, 0, 0, Math.PI * 2); ctx.stroke();
        const b1 = new Butterfly(60, -10, 'brimstone'); b1.heading = -0.4; b1.draw(ctx);
        ctx.save(); ctx.translate(96, -10); ctx.scale(0.75, 0.75);
        const d3 = new Butterfly(0, 0, 'damselfly'); d3.heading = -Math.PI / 2; d3.draw(ctx);
        ctx.restore();
        this.drawCardCross(ctx, 124, -30);
        ctx.fillStyle = themeColor('petite', '#852b2b'); ctx.font = '10.5px system-ui, sans-serif';
        ctx.fillText('Two kinds (gathers nothing)', 78, 28);

        ctx.fillStyle = themeColor('ink', '#5c4538'); ctx.font = '11px system-ui, sans-serif';
        ctx.fillText('A pair is two insects of the same kind in one loop.', 0, 43);
        ctx.fillText('There are as many damselflies as Brimstones now: pick the match.', 0, 58);
        ctx.restore();
      } else if (teachDawnAll) {
        ctx.save(); ctx.translate(0, boxH / 2 - 108);
        // The three Dawn figures side by side
        const small = (kind, x, y, heading) => {
          ctx.save(); ctx.translate(x, y); ctx.scale(0.72, 0.72);
          const fly = new Butterfly(0, 0, kind); fly.heading = heading; fly.draw(ctx);
          ctx.restore();
        };
        ctx.strokeStyle = themeColor('petite', '#ac647e'); ctx.lineWidth = 2;
        for (const cx of [-102, 0, 102]) {
          ctx.beginPath(); ctx.ellipse(cx, -8, 44, 25, 0, 0, Math.PI * 2); ctx.stroke();
        }
        small('brimstone', -116, -8, -0.4); small('brimstone', -88, -8, 0.5);
        small('damselfly', -14, -8, -Math.PI / 2);
        ctx.save(); ctx.translate(16, -8); ctx.scale(0.7, 0.7); new DandelionSeed(0, 0).draw(ctx); ctx.restore();
        small('brimstone', 76, -8, -0.4); small('damselfly', 102, -8, -Math.PI / 2); small('hawkmoth', 128, -8, 0.4);

        ctx.textAlign = 'center'; ctx.fillStyle = themeColor('ink', '#5c4538'); ctx.font = '10.5px system-ui, sans-serif';
        ctx.fillText('Pair', -102, 28);
        ctx.fillText('Seed & Wing', 0, 28);
        ctx.fillText('Trio', 102, 28);

        ctx.font = '11px system-ui, sans-serif';
        ctx.fillText('Every Dawn figure on one field. Nothing here is new.', 0, 43);
        ctx.fillText('Keep seeds and the snail out of the trio loop.', 0, 58);
        ctx.restore();
      } else if (teachNoonGust) {
        ctx.save(); ctx.translate(0, boxH / 2 - 100);
        // A Seed & Wing loop on the left, and a seed being carried off on the right.
        ctx.strokeStyle = themeColor('petite', '#ac647e'); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(-72, -6, 52, 28, 0, 0, Math.PI * 2); ctx.stroke();
        const fly = new Butterfly(-92, -6, 'brimstone'); fly.heading = -0.4; fly.draw(ctx);
        ctx.save(); ctx.translate(-54, -6); ctx.scale(0.85, 0.85); new DandelionSeed(0, 0).draw(ctx); ctx.restore();

        // Streaks: what the field shows before and during a gust
        ctx.strokeStyle = themeColor('muted', '#8a7e6f'); ctx.lineWidth = 1.3; ctx.lineCap = 'round';
        for (const [x, y, len] of [[8, -34, 46], [44, -24, 60], [16, 14, 52]]) {
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
        }
        // The same seed at three moments, fading in along the gust
        for (const [x, alpha] of [[36, 0.3], [70, 0.55], [104, 1]]) {
          ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, -6); ctx.scale(0.8, 0.8);
          const seed = new DandelionSeed(0, 0); seed.tilt = 0.5; seed.draw(ctx);
          ctx.restore();
        }
        ctx.strokeStyle = themeColor('ink', '#5c4538'); ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(122, -6); ctx.lineTo(140, -6); ctx.moveTo(134, -11); ctx.lineTo(140, -6); ctx.lineTo(134, -1); ctx.stroke();

        ctx.fillStyle = themeColor('ink', '#5c4538'); ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('A gust carries seeds sideways for two seconds.', 0, 39);
        ctx.fillStyle = themeColor('muted', '#6e5a47'); ctx.font = 'italic 11px Mali, sans-serif';
        ctx.fillText('Leaves lean and streaks cross the field two seconds before it. Close first, or wait.', 0, 54);
        ctx.restore();
      } else if (teachNoonWeb) {
        ctx.save(); ctx.translate(0, boxH / 2 - 110);
        const web = (x, y) => {
          const patch = new WebPatch(0, 0, 20);
          patch.x = x; patch.y = y; patch.spin = 0.6;
          patch.draw(ctx);
        };
        // Left: a loop closed clear of the web
        web(-126, -16);
        ctx.strokeStyle = themeColor('petite', '#ac647e'); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(-58, 4, 44, 26, 0, 0, Math.PI * 2); ctx.stroke();
        const h1 = new Butterfly(-74, 4, 'hoverfly'); h1.heading = -Math.PI / 2; h1.draw(ctx);
        const h2 = new Butterfly(-42, 4, 'hoverfly'); h2.heading = -Math.PI / 2 + 0.3; h2.draw(ctx);

        // Right: a cord that reaches the web ends there
        web(92, -4);
        ctx.strokeStyle = '#b85c38'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(24, 16); ctx.quadraticCurveTo(48, -20, 74, -6); ctx.stroke();
        ctx.save(); ctx.setLineDash([3, 4]); ctx.strokeStyle = 'rgba(184, 92, 56, 0.45)'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(110, -2); ctx.quadraticCurveTo(134, 4, 138, 22); ctx.stroke(); ctx.restore();
        this.drawCardCross(ctx, 118, -30);

        ctx.textAlign = 'center'; ctx.font = '10.5px system-ui, sans-serif';
        ctx.fillStyle = themeColor('ink', '#5c4538'); ctx.fillText('Drawn clear of it', -70, 44);
        ctx.fillStyle = themeColor('petite', '#852b2b'); ctx.fillText('Cord cut at the web', 82, 44);

        ctx.fillStyle = themeColor('muted', '#6e5a47'); ctx.font = 'italic 11px Mali, sans-serif';
        ctx.fillText('The web stays where it hangs, here and in the next visit.', 0, 60);
        ctx.restore();
      } else if (teachDuskCounterpart) {
        ctx.save(); ctx.translate(0, boxH / 2 - 100);
        const eight = (cx) => {
          ctx.beginPath(); ctx.moveTo(cx, -4);
          ctx.bezierCurveTo(cx - 62, -52, cx - 62, 44, cx, -4);
          ctx.bezierCurveTo(cx + 62, -52, cx + 62, 44, cx, -4); ctx.stroke();
        };
        // Left: two different kinds, one in each pocket
        ctx.strokeStyle = themeColor('petite', '#ac647e'); ctx.lineWidth = 2;
        eight(-76);
        const pocketed = (kind, x, heading) => {
          ctx.save(); ctx.translate(x, -4); ctx.scale(0.68, 0.68);
          const fly = new Butterfly(0, 0, kind); fly.heading = heading; fly.draw(ctx);
          ctx.restore();
        };
        pocketed('brimstone', -104, -0.4);
        pocketed('hoverfly', -48, -Math.PI / 2);

        // Right: one kind split across the crossing
        ctx.strokeStyle = '#b85c38'; ctx.lineWidth = 2;
        eight(76);
        pocketed('brimstone', 48, -0.4);
        pocketed('brimstone', 104, 0.5);
        this.drawCardCross(ctx, 130, -32);

        ctx.textAlign = 'center'; ctx.font = '10.5px system-ui, sans-serif';
        ctx.fillStyle = themeColor('ink', '#5c4538'); ctx.fillText('Counterpart Pair', -76, 30);
        ctx.fillStyle = themeColor('petite', '#852b2b'); ctx.fillText('One kind, divided', 76, 30);

        ctx.fillStyle = themeColor('ink', '#5c4538'); ctx.font = '11px system-ui, sans-serif';
        ctx.fillText('Two different kinds, one in each pocket. Cross your start to close.', 0, 45);
        ctx.fillText('Two of one kind belong together in a single loop.', 0, 60);
        ctx.restore();
      } else if (teachMidnightRoute) {
        ctx.save(); ctx.translate(0, boxH / 2 - 112);
        // The same trace, bent over a hoverfly that sits on the straight line
        ctx.strokeStyle = themeColor('trace', '#416e83'); ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(-120, 8); ctx.lineTo(-80, 8);
        ctx.bezierCurveTo(-62, 8, -64, -30, -40, -30);
        ctx.bezierCurveTo(-16, -30, -18, 8, 0, 8);
        ctx.lineTo(120, 8); ctx.stroke();
        const hover = new Butterfly(-40, 8, 'hoverfly'); hover.heading = -Math.PI / 2; hover.draw(ctx);
        ctx.save(); ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(184, 92, 56, 0.7)'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(-40, 8, 18, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        for (const [i, x] of [-80, 0, 80].entries()) {
          ctx.save(); ctx.translate(x, 8); ctx.scale(0.8, 0.8);
          if (i === 1) drawLacewing(ctx, { lacePhase: 'rest', flapPhase: 0 });
          else drawFirefly(ctx, { stateTime: 0.4, glowOffset: 0 });
          ctx.restore();
          ctx.fillStyle = '#ffffff'; ctx.strokeStyle = themeColor('trace', '#315b73'); ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.arc(x, 8, 3.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = themeColor('trace', '#315b73'); ctx.beginPath(); ctx.arc(x + 14, 8 - 14, 8, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = themeColor('panel', '#fff'); ctx.font = '600 10px system-ui'; ctx.textAlign = 'center';
          ctx.fillText(String(i + 1), x + 14, 8 - 10.5);
        }
        ctx.textAlign = 'center'; ctx.fillStyle = themeColor('ink', '#5c4538'); ctx.font = '11px system-ui';
        ctx.fillText('The same trace: Firefly → Lacewing → different Firefly.', 0, 56);
        ctx.fillText('Bend the line around a hoverfly. One threaded on the way spoils the trace.', 0, 71);
        ctx.restore();
      }

      // Prompt
      ctx.textAlign = 'center';
      ctx.fillStyle = themeColor('ink', '#5c4538');
      ctx.font = isNarrow ? '600 12px system-ui, sans-serif' : '600 14px system-ui, sans-serif';
      const resume = this.state === 'CARD';
      ctx.fillText(
        isNarrow
          ? (resume ? '[ Tap to Resume ]' : '[ Tap to Begin Visit ]')
          : (resume ? '[ Click anywhere or press Space to Resume ]' : '[ Click anywhere or press Space to Begin ]'),
        0,
        boxH / 2 - 24
      );
    });
  }

  drawLevelCompleteModal(ctx) {
    const lvl = this.currentLevel;
    const nextLevel = this.campaign.getNextLevel();
    const isMidnight12 = lvl.id === CAMPAIGN_LEVELS[CAMPAIGN_LEVELS.length - 1].id;
    const save = this.campaign.saveState;
    const completedIds = save?.completedLevelIds || [];
    const all12Completed = isMidnight12 && CAMPAIGN_LEVELS.every(l => completedIds.includes(l.id));
    const modalHeight = isMidnight12 || Object.keys(this.campaign.objectiveProgress).length >= 4 ? 340 : 290;

    const modalAlpha = Math.min(1, (this.levelCompleteTimer || 0) / 0.25);
    ctx.save();
    ctx.globalAlpha = modalAlpha;

    this.drawModalBox(ctx, 480, modalHeight, (boxW, boxH) => {
      const isNarrow = boxW < 440;
      ctx.fillStyle = themeColor('vein', '#2b5028');
      ctx.font = isNarrow ? '600 22px Mali, sans-serif' : '600 27px Mali, sans-serif';
      ctx.textAlign = 'center';

      if (all12Completed) {
        ctx.fillText('Twenty-Four Visits Complete', 0, -boxH / 2 + 38);
      } else if (isMidnight12) {
        ctx.fillText('Visit XXIV Complete', 0, -boxH / 2 + 38);
      } else {
        ctx.fillText('Visit Complete', 0, -boxH / 2 + 38);
      }

      ctx.font = isNarrow ? 'italic 12px Mali, sans-serif' : 'italic 14px Mali, sans-serif';
      ctx.fillStyle = themeColor('vein', '#5a7857');
      if (all12Completed) {
        ctx.fillText('The day harmonized peacefully across all twenty-four visits.', 0, -boxH / 2 + 62);
      } else {
        ctx.fillText(`${lvl.title} harmonized peacefully.`, 0, -boxH / 2 + 62);
      }

      // Objectives recap
      ctx.textAlign = 'left';
      const padX = -boxW / 2 + 36;
      let startY = -boxH / 2 + 96;
      ctx.font = '500 13px system-ui, sans-serif';
      ctx.fillStyle = themeColor('vein', '#2f6932');
      for (const [k, obj] of Object.entries(this.campaign.objectiveProgress)) {
        ctx.fillText(`✔ ${obj.label}: ${obj.current} / ${obj.target}`, padX, startY);
        startY += 22;
      }

      ctx.textAlign = 'center';
      ctx.font = isNarrow ? '12px system-ui, sans-serif' : '13px system-ui, sans-serif';
      ctx.fillStyle = themeColor('ink', '#3d3428');
      const best = (this.campaign.saveState.bestScores && this.campaign.saveState.bestScores[lvl.id]) || this.score;

      if (all12Completed) {
        const totalRecord = CAMPAIGN_LEVELS.reduce((sum, l) => sum + (save?.bestScores?.[l.id] || 0), 0);
        ctx.fillText(`Campaign Record: ${totalRecord} pts  (Visit XXIV: ${this.score} pts)`, 0, startY + 14);
      } else {
        ctx.fillText(`Score: ${this.score} pts  (Best: ${best} pts)`, 0, startY + 12);
      }

      // Continue button
      const btnH = isNarrow ? 32 : 36;
      const btnW = Math.min(boxW - 48, 300);
      const btnY = boxH / 2 - btnH - 18;

      ctx.fillStyle = themeColor('panel', '#f4ede0');
      ctx.strokeStyle = themeColor('edge', '#d0c3ab');
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      drawRoundedRect(ctx, -btnW / 2, btnY, btnW, btnH, 9);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = themeColor('ink', '#4a3a2e');
      ctx.font = isNarrow ? '600 12px system-ui, -apple-system, sans-serif' : '600 13.5px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';

      let btnLabel;
      if (all12Completed) {
        btnLabel = isNarrow ? 'Replay a Visit' : 'Replay a Visit (Space)';
      } else if (isMidnight12) {
        btnLabel = isNarrow ? 'Select a Visit' : 'Select a Visit (Space)';
      } else if (nextLevel) {
        btnLabel = isNarrow ? `Continue: ${nextLevel.title}` : `Continue to ${nextLevel.title} (Space)`;
      } else {
        btnLabel = isNarrow ? 'Replay Visit' : 'Replay Visit (Space)';
      }

      ctx.fillText(btnLabel, 0, btnY + btnH / 2 + 4.5);

      this.levelCompleteButton = {
        x: this.width / 2 - (btnW / 2) * this.modalScale,
        y: this.height / 2 + btnY * this.modalScale,
        w: btnW * this.modalScale,
        h: btnH * this.modalScale,
      };
    });
    ctx.restore();
  }

  drawPausedModal(ctx) {
    const lvl = this.currentLevel;
    this.drawModalBox(ctx, 450, 260, (boxW, boxH) => {
      const isNarrow = boxW < 400;
      ctx.fillStyle = themeColor('ink', '#3a3429');
      ctx.font = isNarrow ? '600 22px Mali, sans-serif' : 'bold 20px Mali, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Quiet Interval — Paused', 0, -boxH / 2 + 38);

      ctx.font = isNarrow ? 'italic 12px Mali, sans-serif' : 'italic 13px Mali, sans-serif';
      ctx.fillStyle = themeColor('muted', '#7a6f5f');
      ctx.fillText(lvl.title, 0, -boxH / 2 + 58);

      ctx.font = isNarrow ? '12px system-ui, -apple-system, sans-serif' : '13px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = themeColor('ink', '#54483a');
      ctx.fillText(
        this.isUntimed() ? 'Untimed practice — no clock' : 'Remaining Time: ' + Math.ceil(this.clock.remainingSeconds) + 's',
        0,
        -10
      );

      // Objectives progress
      const objEntries = Object.entries(this.campaign.objectiveProgress);
      const objText = objEntries.map(([k, o]) => `${o.label}: ${o.current}/${o.target}`).join(' • ');
      ctx.fillText(objText, 0, 14);
      ctx.fillText('Current Score: ' + this.score + ' pts', 0, 38);

      ctx.fillStyle = themeColor('muted', '#785b46');
      ctx.font = isNarrow ? '600 12px system-ui, -apple-system, sans-serif' : '600 14px system-ui, -apple-system, sans-serif';
      ctx.fillText(isNarrow ? '[ Tap to Resume ]' : '[ Press Space or Click Pause to Resume ]', 0, boxH / 2 - 22);
    });
  }

  drawGameOverModal(ctx) {
    const lvl = this.currentLevel;
    const canPractice = !this.isUntimed() && CAMPAIGN_LEVELS.some(l => l.id === lvl?.id);
    this.gameOverOptions = [];
    this.drawModalBox(ctx, 460, 320, (boxW, boxH) => {
      const isNarrow = boxW < 440;
      ctx.fillStyle = themeColor('petite', '#6e3535');
      ctx.font = isNarrow ? '600 22px Mali, sans-serif' : '600 27px Mali, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('The Hour Has Passed', 0, -boxH / 2 + 36);

      ctx.font = isNarrow ? 'italic 12px Mali, sans-serif' : 'italic 14px Mali, sans-serif';
      ctx.fillStyle = themeColor('muted', '#8f5c5c');
      ctx.fillText(GAME_OVER_LINES[lvl?.hour] || GAME_OVER_LINES.dawn, 0, -boxH / 2 + 58);

      ctx.font = isNarrow ? '12px system-ui, -apple-system, sans-serif' : '13px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = themeColor('ink', '#42372b');

      const objEntries = Object.entries(this.campaign.objectiveProgress);
      const objText = objEntries.map(([k, o]) => `${o.label}: ${o.current}/${o.target}`).join(' • ');
      ctx.fillText(objText, 0, -boxH / 2 + 88);
      ctx.fillText(`Score: ${this.score} points`, 0, -boxH / 2 + 110);

      // Options. Each row is clickable; Space keeps taking the first one.
      const rows = [
        { action: 'retry', label: isNarrow ? 'Retry visit (Space)' : 'Retry visit — starts at the ready screen (Space)' },
      ];
      if (canPractice) {
        rows.push({
          action: 'practice',
          label: isNarrow ? 'Practice this visit (untimed)' : 'Practice this visit — untimed, progress not saved',
        });
      }
      rows.push({ action: 'select', label: 'Level select' });

      const rowH = isNarrow ? 30 : 34;
      const gap = 8;
      const rowW = Math.min(boxW - 48, 360);
      const totalH = rows.length * rowH + (rows.length - 1) * gap;
      let rowY = boxH / 2 - 22 - totalH;

      for (const row of rows) {
        ctx.fillStyle = themeColor('panel', '#f6f1e4');
        ctx.strokeStyle = themeColor('edge', '#d8ccb6');
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        drawRoundedRect(ctx, -rowW / 2, rowY, rowW, rowH, 9);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = themeColor('ink', '#5c4538');
        ctx.font = isNarrow ? '600 11.5px system-ui, -apple-system, sans-serif' : '600 13px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(row.label, 0, rowY + rowH / 2 + 4);

        this.gameOverOptions.push({
          action: row.action,
          x: this.width / 2 - rowW / 2 * this.modalScale,
          y: this.height / 2 + rowY * this.modalScale,
          w: rowW * this.modalScale,
          h: rowH * this.modalScale,
        });
        rowY += rowH + gap;
      }
    });
  }

  drawModalBox(ctx, w, h, contentFn) {
    ctx.save();
    // Backdrop dim
    ctx.fillStyle = 'rgba(83, 66, 73, 0.22)';
    ctx.fillRect(0, 0, this.width, this.height);

    const cx = this.width / 2;
    const cy = this.height / 2;

    ctx.translate(cx, cy);

    // Responsive clamping for narrow vertical viewports
    const actualW = Math.min(w, this.width - 20);
    const actualH = h;
    const cardScale = Math.min(1, (this.height - 24) / h);
    this.modalScale = cardScale;
    ctx.scale(cardScale, cardScale);

    // Paper card drop shadow
    ctx.fillStyle = 'rgba(20, 25, 15, 0.2)';
    ctx.beginPath();
    drawRoundedRect(ctx, -actualW / 2 + 5, -actualH / 2 + 8, actualW, actualH, 14);
    ctx.fill();

    // Paper card body
    ctx.fillStyle = themeColor('panel', '#fbf8ee');
    ctx.strokeStyle = themeColor('edge', '#d8ccb6');
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    drawRoundedRect(ctx, -actualW / 2, -actualH / 2, actualW, actualH, 14);
    ctx.fill();
    ctx.stroke();

    // Inner delicate border
    ctx.strokeStyle = themeColor('edge', '#ece3d2');
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    drawRoundedRect(ctx, -actualW / 2 + 8, -actualH / 2 + 8, actualW - 16, actualH - 16, 10);
    ctx.stroke();

    // Card text never runs past the card edge. Each fillText inside the card gets
    // a maxWidth from its alignment and position, and the canvas condenses any
    // line that would otherwise overflow, however narrow the viewport.
    const dpr = this.dpr || 1;
    const left = cx + (-actualW / 2 + 12) * cardScale;
    const right = cx + (actualW / 2 - 12) * cardScale;
    const hadOwnFill = Object.prototype.hasOwnProperty.call(ctx, 'fillText');
    const baseFill = ctx.fillText;
    ctx.fillText = (text, x, y, maxWidth) => {
      const m = typeof ctx.getTransform === 'function' ? ctx.getTransform() : null;
      if (!m || !m.a) return baseFill.call(ctx, text, x, y, maxWidth);
      const scale = m.a / dpr;
      const absX = (m.e + m.a * x) / dpr;
      const align = ctx.textAlign;
      const room = align === 'center' ? 2 * Math.min(absX - left, right - absX)
        : (align === 'right' || align === 'end') ? absX - left : right - absX;
      const limit = Math.max(1, room / scale);
      return baseFill.call(ctx, text, x, y, maxWidth === undefined ? limit : Math.min(maxWidth, limit));
    };
    try {
      contentFn(actualW, actualH);
    } finally {
      if (hadOwnFill) ctx.fillText = baseFill;
      else delete ctx.fillText;
    }
    ctx.restore();
  }
}
