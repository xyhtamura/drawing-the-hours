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
} from './geometry.js';
import { Butterfly, DandelionSeed, Snail, SPECIES_CONFIG } from './entities.js';
import { evaluateDrawing } from './recipes.js';
import { DandelionClock } from './clock.js';
import { audio } from './audio.js';
import { createDawnArt, wrapText } from './dawn-art.js';
import { createNoonArt } from './noon-art.js';
import { CampaignManager, CAMPAIGN_LEVELS, PRACTICE_LEVELS, OBJECTIVE_LABELS } from './campaign.js';

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
    this.dpr = window.devicePixelRatio || 1;

    // Campaign Manager
    this.campaign = new CampaignManager();
    this.currentLevel = this.campaign.currentLevel;

    // Game state
    this.currentWave = 1; // For practice/wave compatibility
    this.state = 'TRANSITION'; // 'TRANSITION' | 'READY' | 'PLAYING' | 'PAUSED' | 'LEVEL_COMPLETE' | 'GAMEOVER'
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

    // Transient feedback & visuals
    this.recoilStroke = null;
    this.recoilAlpha = 0;
    this.lastEvaluatedPockets = [];
    this.pocketFillAlpha = 0;
    this.stamps = [];
    this.feedbackBanner = { text: '', type: 'info', timer: 0 };
    this.victoryDelay = 0;

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

    this.initCanvas();
    this.initDecorations();
    this.initLevel();
    this.bindEvents();

    this.lastFrameTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  initCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width || 960;
    this.height = rect.height || 640;

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      this.width = rect.width;
      this.height = rect.height;
      this.canvas.width = this.width * this.dpr;
      this.canvas.height = this.height * this.dpr;
      this.ctx.scale(this.dpr, this.dpr);

      // Keep active entities within new canvas bounds
      for (const ent of this.entities) {
        if (ent.type === 'hazard') {
          ent.y = this.height - 35;
          ent.x = Math.max(30, Math.min(this.width - 30, ent.x));
        } else {
          ent.x = Math.max(16, Math.min(this.width - 16, ent.x));
          ent.y = Math.max(16, Math.min(this.height - 16, ent.y));
        }
      }

      this.initDecorations();
    }
  }

  initDecorations() {
    this.decorations = [];
    // Scattered clover leaves and paper daisies along verges
    const count = 28;
    const vergeMargin = Math.min(100, this.width * 0.22);
    for (let i = 0; i < count; i++) {
      this.decorations.push({
        x: (Math.random() < 0.5 ? Math.random() * vergeMargin : this.width - Math.random() * vergeMargin),
        y: Math.random() * this.height,
        size: 8 + Math.random() * 8,
        type: Math.random() < 0.6 ? 'clover' : 'flower',
        rotation: Math.random() * Math.PI * 2,
        tint: Math.random() < 0.5 ? '#d2e3c8' : '#e6eedb',
      });
    }
  }

  initLevel(level = this.campaign.currentLevel) {
    if (typeof level === 'number') {
      // Legacy wave compatibility
      this.currentWave = level;
      const pracId = (level === 2) ? 'practice-02' : 'practice-01';
      level = this.campaign.setLevelById(pracId);
    } else if (typeof level === 'string') {
      level = this.campaign.setLevelById(level);
    }

    this.currentLevel = level || this.campaign.currentLevel;
    this.campaign.initProgress(this.currentLevel);

    this.entities = [];
    this.respawnQueue = [];
    this.score = 0;
    this.harmoniesCount = 0;
    this.victoryDelay = 0;
    this.clock.reset(this.currentLevel.durationSeconds || 60);

    // Reset wind state
    this.windTimer = 0;
    this.windPhase = 'calm';
    this.prevWindPhase = 'calm';
    this.windStreaks = [];

    const mScale = this.currentLevel.motionScale || 1.0;
    const pop = this.currentLevel.population || {};

    const padX = this.width * 0.15;
    const padY = this.height * 0.2;

    // Fliers
    const kinds = ['brimstone', 'damselfly', 'hawkmoth', 'hoverfly'];
    for (const k of kinds) {
      const count = pop[k] || 0;
      for (let i = 0; i < count; i++) {
        const x = padX + Math.random() * (this.width - 2 * padX);
        const y = padY + Math.random() * (this.height - 2 * padY);
        const b = new Butterfly(x, y, k);
        b.motionScale = mScale;
        this.entities.push(b);
      }
    }

    // Seeds
    const seedCount = pop.seed || 0;
    for (let i = 0; i < seedCount; i++) {
      const x = padX + Math.random() * (this.width - 2 * padX);
      const y = padY + Math.random() * (this.height - 2 * padY);
      this.entities.push(new DandelionSeed(x, y));
    }

    // Snail
    const snailCount = pop.snail || 0;
    for (let i = 0; i < snailCount; i++) {
      this.entities.push(new Snail(this.width * 0.5, this.height - 35));
    }

    this.initDecorations();
  }

  maintainPopulation(dt = 0.016) {
    if (!this.currentLevel || !this.currentLevel.population) return;
    const pop = this.currentLevel.population;
    const mScale = this.currentLevel.motionScale || 1.0;

    const activeCounts = { brimstone: 0, damselfly: 0, hawkmoth: 0, seed: 0, snail: 0 };
    for (const ent of this.entities) {
      if (ent.state === 'departing' || ent.state === 'harmonizing') continue;
      if (ent.type === 'butterfly' || ent.type === 'insect') {
        const k = (ent.kind === 'azure') ? 'damselfly' : ((ent.kind === 'roseate') ? 'hawkmoth' : ent.kind);
        activeCounts[k] = (activeCounts[k] || 0) + 1;
      } else if (ent.type === 'seed') {
        activeCounts.seed += 1;
      } else if (ent.type === 'hazard') {
        activeCounts.snail += 1;
      }
    }

    const pendingCounts = { brimstone: 0, damselfly: 0, hawkmoth: 0, seed: 0, snail: 0 };
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
          this.entities.push(new DandelionSeed(-15, 60 + Math.random() * (this.height - 120)));
        } else if (item.kind === 'snail') {
          this.entities.push(new Snail(this.width * 0.5, this.height - 35));
        } else {
          const edge = Math.random();
          let sx = 20, sy = 20;
          if (edge < 0.25) { sx = 20; sy = Math.random() * this.height; }
          else if (edge < 0.5) { sx = this.width - 20; sy = Math.random() * this.height; }
          else if (edge < 0.75) { sx = Math.random() * this.width; sy = 20; }
          else { sx = Math.random() * this.width; sy = this.height - 20; }

          const b = new Butterfly(sx, sy, item.kind);
          b.motionScale = mScale;
          this.entities.push(b);
        }
      }
    }
  }

  showFeedback(text, type = 'info', duration = 2.4) {
    this.feedbackBanner = { text, type, timer: duration };
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());

    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    const onPointerDown = (e) => {
      const modal = document.getElementById('fieldbook-modal');
      if (modal && modal.classList.contains('active')) return;

      if (this.state !== 'PLAYING') return;
      e.preventDefault();
      audio.ensureContext();

      if (this.canvas.setPointerCapture && e.pointerId !== undefined) {
        try {
          this.canvas.setPointerCapture(e.pointerId);
          this.activePointerId = e.pointerId;
        } catch (_) {}
      }

      const pos = getPos(e);
      this.isDrawing = true;
      this.currentStroke = [pos];
      this.strokeLength = 0;
      this.activeBand = getLengthBand(0);
      this.lastPointerPos = pos;
      this.lastPointerTime = performance.now();

      audio.startDrawingRustle();
    };

    const onPointerMove = (e) => {
      if (!this.isDrawing || this.state !== 'PLAYING') return;
      e.preventDefault();

      const pos = getPos(e);
      const last = this.currentStroke[this.currentStroke.length - 1];
      const dist = distance(last, pos);

      if (dist >= 4) {
        this.currentStroke.push(pos);
        this.strokeLength += dist;
        this.activeBand = getLengthBand(this.strokeLength);

        const now = performance.now();
        const dt = (now - this.lastPointerTime) / 1000;
        const speed = dt > 0 ? dist / dt : 0;
        this.lastPointerPos = pos;
        this.lastPointerTime = now;

        audio.updateDrawingSpeed(speed);
      }
    };

    const onPointerUp = (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();

      if (this.canvas.releasePointerCapture && this.activePointerId !== undefined) {
        try {
          this.canvas.releasePointerCapture(this.activePointerId);
        } catch (_) {}
        this.activePointerId = undefined;
      }

      this.isDrawing = false;
      audio.stopDrawingRustle();

      this.resolveCurrentStroke();
    };

    this.canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    this.canvas.addEventListener('pointercancel', onPointerUp);
  }

  resolveCurrentStroke() {
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
    const rawPockets = extractPockets(strokePoints, { closeDist: 90, minArea: 900 });

    // Associate entities with pockets
    const pocketsWithEntities = rawPockets.map(pocket => {
      const enclosed = this.entities.filter(entity => {
        if (entity.state === 'departing') return false;
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
      // Success!
      audio.playHarmonyChord(result.recipeType, result.band);
      this.score += result.finalScore;
      this.harmoniesCount += 1;

      // Process with campaign manager
      const campResult = this.campaign.processDrawing(result, pocketsWithEntities, this.clock);

      if (campResult.advancedObjective) {
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
        this.victoryDelay = 1.0;
      }
    } else {
      // Fault / Invalid feedback
      if (result.status === 'HAZARD') {
        audio.playFrayFault();
        this.showFeedback(result.message, 'warning');
      } else if (result.status === 'OPEN') {
        this.showFeedback('Loop did not close — trace back or cross over.', 'hint');
      } else {
        audio.playFrayFault();
        this.showFeedback(result.message || 'Irregular grouping', 'warning');
      }
    }

    this.currentStroke = [];
    this.strokeLength = 0;
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
    } else if (this.state === 'LEVEL_COMPLETE' || this.state === 'VICTORY') {
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

  setWave(wave) {
    this.startLevel(wave);
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.clock.isPaused = true;
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.clock.isPaused = false;
    }
  }

  loop(timestamp) {
    const dt = Math.min(0.1, (timestamp - this.lastFrameTime) / 1000);
    this.lastFrameTime = timestamp;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.loop.bind(this));
  }

  update(dt) {
    if (this.state === 'PLAYING') {
      if (this.victoryDelay > 0) {
        this.victoryDelay -= dt;
        if (this.victoryDelay <= 0) {
          this.state = 'LEVEL_COMPLETE';
          this.campaign.recordVictory(this.score);
          if (typeof this.onLevelChanged === 'function') {
            this.onLevelChanged(this.currentLevel);
          }
          return;
        }
      }

      this.clock.update(dt);
      if (this.clock.isExpired && this.victoryDelay <= 0) {
        this.state = 'GAMEOVER';
      }

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

      const bounds = { width: this.width, height: this.height };
      const windVx = (this.windPhase === 'gust' && this.currentLevel?.wind)
        ? (this.currentLevel.wind.seedSpeedPlayWidthsPerSecond || 0.08) * this.width
        : 0;

      for (let i = this.entities.length - 1; i >= 0; i--) {
        const ent = this.entities[i];
        ent.update(dt, bounds, ent.type === 'seed' ? windVx : 0);
        if (ent.alpha <= 0.01 && (ent.state === 'departing' || ent.state === 'harmonizing')) {
          this.entities.splice(i, 1);
        }
      }

      this.maintainPopulation(dt);
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

  spawnWindStreaks() {
    this.windStreaks = [];
    const count = 7;
    for (let i = 0; i < count; i++) {
      this.windStreaks.push({
        x: -40 - Math.random() * 240,
        y: 60 + Math.random() * (this.height - 140),
        length: 90 + Math.random() * 140,
        speed: this.width * (0.65 + Math.random() * 0.35),
        alpha: 0.22 + Math.random() * 0.28,
        curveOffset: (Math.random() - 0.5) * 16,
      });
    }
  }

  updateWindStreaks(dt) {
    if (this.windPhase === 'warning' && this.windStreaks.length < 3 && Math.random() < 0.08) {
      this.windStreaks.push({
        x: -50,
        y: 80 + Math.random() * (this.height - 160),
        length: 60 + Math.random() * 80,
        speed: this.width * 0.32,
        alpha: 0.14,
        curveOffset: (Math.random() - 0.5) * 12,
      });
    }

    for (let i = this.windStreaks.length - 1; i >= 0; i--) {
      const s = this.windStreaks[i];
      s.x += s.speed * dt;
      if (s.x > this.width + 40) {
        if (this.windPhase === 'gust') {
          s.x = -s.length - Math.random() * 100;
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
        ctx.rotate(sway * dir);
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
      ctx.quadraticCurveTo(s.x + s.length * 0.5, s.y + s.curveOffset, s.x + s.length, s.y);
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

    // 3. Pressed Paper Stamps
    this.drawStamps(ctx);

    // 4. Dynamic Atrium Planter Leaves Sway
    this.drawWindPlanters(ctx);

    // 5. Inhabitants (Folded Butterflies, Seeds, Snail)
    for (const ent of this.entities) {
      ent.draw(ctx);
    }

    // 6. Translucent Paper Wind Streamlines
    this.drawWindStreaks(ctx);

    // 7. Active Drawn Cord / Recoil Cord
    this.drawCord(ctx);

    // 6. HUD & Banners
    this.drawHUD(ctx);

    // 7. Modals / Overlays
    if (this.state === 'TRANSITION') this.drawTransitionModal(ctx);
    else if (this.state === 'READY' || this.state === 'INTRO') this.drawReadyModal(ctx);
    else if (this.state === 'PAUSED') this.drawPausedModal(ctx);
    else if (this.state === 'LEVEL_COMPLETE' || this.state === 'VICTORY') this.drawLevelCompleteModal(ctx);
    else if (this.state === 'GAMEOVER') this.drawGameOverModal(ctx);
  }

  drawMeadowFloor(ctx) {
    if (this.currentLevel?.scene === 'atrium') {
      const key = `${this.width}:${this.height}:${window.devicePixelRatio || 1}`;
      if (this.noonArtKey !== key) {
        this.noonArt = createNoonArt(this.width, this.height, window.devicePixelRatio || 1);
        this.noonArtKey = key;
      }
      ctx.drawImage(this.noonArt, 0, 0, this.width, this.height);
      return;
    }
    if (this.currentLevel?.scene === 'curb') {
      const key = `${this.width}:${this.height}:${window.devicePixelRatio || 1}`;
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

      // Gentle verge fence shadow at the top
      ctx.save();
      ctx.fillStyle = 'rgba(60, 75, 45, 0.045)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(this.width, 0);
      ctx.lineTo(this.width, 45);
      ctx.quadraticCurveTo(this.width * 0.5, 65, 0, 40);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Subtle paper verge clover & flower decorations
    for (const dec of this.decorations) {
      ctx.save();
      ctx.translate(dec.x, dec.y);
      ctx.rotate(dec.rotation);
      ctx.fillStyle = dec.tint;

      if (dec.type === 'clover') {
        const r = dec.size * 0.45;
        for (let a = 0; a < 3; a++) {
          const ang = (a * Math.PI * 2) / 3;
          ctx.beginPath();
          ctx.arc(Math.cos(ang) * r, Math.sin(ang) * r, r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Little daisy
        const r = dec.size * 0.5;
        ctx.fillStyle = '#faf8ef';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f3cf55';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
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

      ctx.save();

      // Cord contact shadow
      ctx.strokeStyle = 'rgba(40, 45, 30, 0.16)';
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pts[0].x + 2, pts[0].y + 3);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x + 2, pts[i].y + 3);
      }
      ctx.stroke();

      // Main dyed cotton cord strand
      ctx.strokeStyle = band.cordHue;
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

      // Drawing head ring
      const tip = pts[pts.length - 1];
      ctx.fillStyle = band.color;
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  drawHUD(ctx) {
    ctx.save();
    const isNarrow = (this.width < 560);

    if (isNarrow) {
      // --- MOBILE / VERTICAL HUD LAYOUT ---
      // Tier 1: Left Clock, Right Objectives
      this.clock.draw(ctx, 28, 28, 18);

      ctx.fillStyle = '#4a4235';
      ctx.font = '600 13px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      const secondsLeft = Math.ceil(this.clock.remainingSeconds);
      const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
      const ss = String(secondsLeft % 60).padStart(2, '0');
      ctx.fillText(`${mm}:${ss}`, 52, 28);

      ctx.fillStyle = '#8a7f70';
      ctx.font = '500 10px system-ui, -apple-system, sans-serif';
      ctx.fillText('Clock', 52, 40);

      // Top-Right: Objective & Score
      const objEntries = Object.entries(this.campaign.objectiveProgress);
      const objText = objEntries.length > 0
        ? objEntries.map(([k, o]) => `${o.label}: ${o.current}/${o.target}`).join(' • ')
        : `Harmonies: ${this.harmoniesCount}`;
      const lvlTitle = this.currentLevel ? `${this.currentLevel.title}` : `Wave ${this.currentWave}`;

      ctx.textAlign = 'right';
      ctx.fillStyle = '#4a4235';
      ctx.font = '600 11px system-ui, -apple-system, sans-serif';
      ctx.fillText(objText, this.width - 16, 26);

      ctx.fillStyle = '#7a6c57';
      ctx.font = 'italic 10.5px Mali, sans-serif';
      ctx.fillText(`${lvlTitle} • ${this.score} pts`, this.width - 16, 40);

      // Tier 2: Centered Stroke Length Band Meter (compact, below top row)
      const cx = this.width / 2;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.strokeStyle = '#dcd4c5';
      ctx.lineWidth = 1.1;
      const meterW = Math.min(140, this.width - 60);
      const meterH = 15;
      const meterY = 52;

      ctx.beginPath();
      drawRoundedRect(ctx, cx - meterW / 2, meterY, meterW, meterH, 7);
      ctx.fill();
      ctx.stroke();

      const fillRatio = Math.min(1.0, this.strokeLength / 1400);
      if (fillRatio > 0.01) {
        ctx.fillStyle = this.activeBand.color;
        ctx.beginPath();
        drawRoundedRect(ctx, cx - meterW / 2 + 2, meterY + 2, (meterW - 4) * fillRatio, meterH - 4, 5);
        ctx.fill();
      }

      ctx.fillStyle = '#4a4235';
      ctx.font = '600 9.5px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`CORD: ${this.activeBand.name.toUpperCase()}`, cx, meterY + 11);
    } else {
      // --- STANDARD WIDESCREEN HUD LAYOUT ---
      this.clock.draw(ctx, 42, 40, 24);

      ctx.fillStyle = '#4a4235';
      ctx.font = '600 14px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      const secondsLeft = Math.ceil(this.clock.remainingSeconds);
      const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
      const ss = String(secondsLeft % 60).padStart(2, '0');
      ctx.fillText(`${mm}:${ss}`, 74, 38);

      ctx.fillStyle = '#8a7f70';
      ctx.font = '500 11px system-ui, -apple-system, sans-serif';
      ctx.fillText('Dandelion Clock', 74, 52);

      const cx = this.width / 2;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.strokeStyle = '#dcd4c5';
      ctx.lineWidth = 1.2;
      const meterW = 160, meterH = 18;
      ctx.beginPath();
      drawRoundedRect(ctx, cx - meterW / 2, 24, meterW, meterH, 9);
      ctx.fill();
      ctx.stroke();

      const fillRatio = Math.min(1.0, this.strokeLength / 1400);
      if (fillRatio > 0.01) {
        ctx.fillStyle = this.activeBand.color;
        ctx.beginPath();
        drawRoundedRect(ctx, cx - meterW / 2 + 2, 26, (meterW - 4) * fillRatio, meterH - 4, 7);
        ctx.fill();
      }

      ctx.fillStyle = '#4a4235';
      ctx.font = '600 11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`CORD: ${this.activeBand.name.toUpperCase()}`, cx, 37);

      const objEntries = Object.entries(this.campaign.objectiveProgress);
      const objText = objEntries.length > 0
        ? objEntries.map(([k, o]) => `${o.label}: ${o.current}/${o.target}`).join(' • ')
        : `Harmonies: ${this.harmoniesCount}`;
      const lvlTitle = this.currentLevel ? `${this.currentLevel.title}` : `Wave ${this.currentWave}`;

      ctx.textAlign = 'right';
      ctx.fillStyle = '#4a4235';
      ctx.font = '600 12.5px system-ui, -apple-system, sans-serif';
      ctx.fillText(objText, this.width - 24, 34);

      ctx.fillStyle = '#7a6c57';
      ctx.font = 'italic 11px Mali, sans-serif';
      ctx.fillText(lvlTitle, this.width - 24, 49);

      ctx.fillStyle = '#8a7f70';
      ctx.font = '500 11px system-ui, -apple-system, sans-serif';
      ctx.fillText(`Score: ${this.score}`, this.width - 24, 64);
    }

    // --- Wind Indicator Badge (Noon Visits V-VI) ---
    if (this.currentLevel?.wind && (this.windPhase === 'warning' || this.windPhase === 'gust')) {
      const cx = this.width / 2;
      const isGust = this.windPhase === 'gust';
      const isNarrow = this.width < 560;
      const badgeText = isGust ? '💨 Atrium Breeze: Rightward Gust »»' : '🍃 Breeze Warning: Gust Approaching';
      const bg = isGust ? 'rgba(232, 246, 228, 0.94)' : 'rgba(254, 247, 230, 0.94)';
      const border = isGust ? '#8ab583' : '#d8b97e';
      const textCol = isGust ? '#234f21' : '#684d1e';

      ctx.save();
      ctx.font = isNarrow ? '600 10.5px system-ui, sans-serif' : '600 11.5px system-ui, sans-serif';
      const tw = ctx.measureText(badgeText).width;
      const bw = Math.min(this.width - 24, tw + 20);
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
      const boxW = Math.min(this.width - 24, Math.max(180, textWidth + 30));
      const boxH = 32;
      const by = this.height - 54;
      const cx = this.width / 2;

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
      ctx.fillStyle = '#8a7d6d';
      ctx.textAlign = 'center';
      ctx.fillText((lvl.hourLabel || 'DAWN · VISIT').toUpperCase(), 0, -boxH / 2 + 38);

      // Title
      ctx.fillStyle = '#2c251d';
      ctx.font = isNarrow ? '600 23px Mali, sans-serif' : '600 27px Mali, sans-serif';
      ctx.fillText(lvl.title, 0, -boxH / 2 + 66);

      // Decorative divider
      ctx.strokeStyle = '#d6cbba';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-boxW * 0.28, -boxH / 2 + 82);
      ctx.lineTo(boxW * 0.28, -boxH / 2 + 82);
      ctx.stroke();

      // Verbatim transition text
      ctx.font = isNarrow ? '400 18px Mali, sans-serif' : '400 21px Mali, sans-serif';
      ctx.fillStyle = '#3a3227';
      const lines = wrapText(ctx, lvl.transitionText, boxW - 64);
      const lineHeight = isNarrow ? 27 : 30;
      lines.forEach((line, i) => ctx.fillText(line, 0, 7 + (i - (lines.length - 1) / 2) * lineHeight));

      // Prompt
      ctx.fillStyle = '#5c4538';
      ctx.font = isNarrow ? '600 12px system-ui, sans-serif' : '600 14px system-ui, sans-serif';
      ctx.fillText(isNarrow ? '[ Tap to Continue ]' : '[ Click anywhere or press Space to Continue ]', 0, boxH / 2 - 24);
    });
  }

  drawReadyModal(ctx) {
    const lvl = this.currentLevel;
    const teachCounterpart = lvl.id === 'noon-01' || lvl.id === 'practice-noon';
    const teachNursery = lvl.id === 'noon-02';
    const teachSeedTrio = lvl.id === 'noon-03';
    const hasDiagram = teachCounterpart || teachNursery || teachSeedTrio;

    this.drawModalBox(ctx, 500, hasDiagram ? 415 : 310, (boxW, boxH) => {
      const isNarrow = boxW < 440;

      // Header
      ctx.fillStyle = '#3a3429';
      ctx.font = isNarrow ? '600 22px Mali, sans-serif' : '600 27px Mali, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(lvl.title, 0, -boxH / 2 + 36);

      // Subtitle
      ctx.font = isNarrow ? 'italic 12px Mali, sans-serif' : 'italic 13px Mali, sans-serif';
      ctx.fillStyle = '#7a6f5f';
      ctx.fillText(lvl.hourLabel || 'Dawn · Visit', 0, -boxH / 2 + 58);

      // Instruction
      ctx.font = isNarrow ? '12px system-ui, sans-serif' : '13px system-ui, sans-serif';
      ctx.fillStyle = '#4c4234';
      const instructionLines = wrapText(ctx, lvl.instruction, boxW - 48);
      instructionLines.forEach((line, i) => ctx.fillText(line, 0, -boxH / 2 + 88 + i * 17));

      // Objectives box
      ctx.textAlign = 'left';
      ctx.font = isNarrow ? '600 11.5px system-ui, sans-serif' : '600 12.5px system-ui, sans-serif';
      ctx.fillStyle = '#2c251d';
      const padX = -boxW / 2 + (isNarrow ? 22 : 36);
      let startY = -boxH / 2 + 124 + (instructionLines.length - 1) * 17;

      ctx.fillText('VISIT REQUIREMENTS:', padX, startY);
      startY += 19;

      ctx.font = isNarrow ? '12px system-ui, sans-serif' : '13px system-ui, sans-serif';
      ctx.fillStyle = '#4c4234';
      for (const [k, obj] of Object.entries(this.campaign.objectiveProgress)) {
        ctx.fillText(`• ${obj.label}: ${obj.current} / ${obj.target}`, padX + 8, startY);
        startY += 21;
      }

      // Duration note
      ctx.font = 'italic 11.5px Mali, sans-serif';
      ctx.fillStyle = '#8a7e6f';
      ctx.fillText(`Dandelion Clock: ${lvl.durationSeconds} seconds`, padX, startY + 8);

      if (teachCounterpart) {
        ctx.save(); ctx.translate(0, boxH / 2 - 84);
        ctx.strokeStyle = '#ac647e'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-100, -65, -100, 65, 0, 0);
        ctx.bezierCurveTo(100, -65, 100, 65, 0, 0); ctx.stroke();
        ctx.fillStyle = '#f1d152'; ctx.beginPath(); ctx.ellipse(-46, 0, 11, 15, -.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#eab765'; ctx.beginPath(); ctx.ellipse(46, 0, 8, 13, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5d493a'; for (const y of [-6, 0, 6]) ctx.fillRect(40, y, 12, 3);
        ctx.fillStyle = '#5c4538'; ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('One different insect in each pocket', 0, 42);
        ctx.restore();
      } else if (teachNursery) {
        ctx.save(); ctx.translate(0, boxH / 2 - 84);
        ctx.strokeStyle = '#ac647e'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-100, -65, -100, 65, 0, 0);
        ctx.bezierCurveTo(100, -65, 100, 65, 0, 0); ctx.stroke();
        // Left lobe: 1 Brimstone + 1 Hoverfly
        ctx.fillStyle = '#f1d152'; ctx.beginPath(); ctx.ellipse(-54, -6, 9, 13, -0.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#eab765'; ctx.beginPath(); ctx.ellipse(-40, 8, 6, 10, 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5d493a'; for (const y of [4, 8, 12]) ctx.fillRect(-44, y, 8, 2);
        // Right lobe: 2 Dandelion seeds
        for (const [sx, sy] of [[40, -6], [54, 8]]) {
          ctx.fillStyle = '#faf7ed'; ctx.beginPath(); ctx.arc(sx, sy, 7, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#8a7e6b'; ctx.lineWidth = 0.8;
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 7, sy + 9); ctx.stroke();
          ctx.beginPath(); ctx.arc(sx, sy, 7, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = '#655543'; ctx.beginPath(); ctx.ellipse(sx + 7, sy + 9, 1.5, 3, 0.6, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = '#5c4538'; ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Insects in one lobe, seeds in the other (Nursery)', 0, 39);
        ctx.fillStyle = '#6e5a47'; ctx.font = 'italic 11px Mali, sans-serif';
        ctx.fillText('🍃 2-second rightward breeze gusts will drift seeds across the glass', 0, 54);
        ctx.restore();
      } else if (teachSeedTrio) {
        ctx.save(); ctx.translate(0, boxH / 2 - 84);
        // Single loop cord (circle)
        ctx.strokeStyle = '#ac647e'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 2, 78, 38, 0, 0, Math.PI * 2);
        ctx.stroke();

        // 1 Seed at center-top
        const sx = 0, sy = -14;
        ctx.fillStyle = '#faf7ed'; ctx.beginPath(); ctx.arc(sx, sy, 7, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#8a7e6b'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 7, sy + 9); ctx.stroke();
        ctx.beginPath(); ctx.arc(sx, sy, 7, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#655543'; ctx.beginPath(); ctx.ellipse(sx + 7, sy + 9, 1.5, 3, 0.6, 0, Math.PI * 2); ctx.fill();

        // 1 Brimstone butterfly at bottom-left
        ctx.fillStyle = '#f1d152'; ctx.beginPath(); ctx.ellipse(-44, 12, 9, 13, -0.4, 0, Math.PI * 2); ctx.fill();

        // 1 Amber hoverfly at bottom-center
        ctx.fillStyle = '#eab765'; ctx.beginPath(); ctx.ellipse(0, 14, 6, 10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5d493a'; for (const y of [10, 14, 18]) ctx.fillRect(-4, y, 8, 2);

        // 1 Roseate hawkmoth at bottom-right
        ctx.fillStyle = '#de99a5'; ctx.beginPath(); ctx.ellipse(44, 12, 7, 12, 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#a8b894'; ctx.beginPath(); ctx.ellipse(44, 6, 4, 8, 0.8, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#5c4538'; ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('1 seed and 3 distinct insects in a loop (Seed & Trio)', 0, 39);
        ctx.fillStyle = '#6e5a47'; ctx.font = 'italic 11px Mali, sans-serif';
        ctx.fillText('🍃 Periodic atrium breeze gusts will carry seeds rightward', 0, 54);
        ctx.restore();
      }

      // Prompt
      ctx.textAlign = 'center';
      ctx.fillStyle = '#5c4538';
      ctx.font = isNarrow ? '600 12px system-ui, sans-serif' : '600 14px system-ui, sans-serif';
      ctx.fillText(isNarrow ? '[ Tap to Begin Visit ]' : '[ Click anywhere or press Space to Begin ]', 0, boxH / 2 - 24);
    });
  }

  drawLevelCompleteModal(ctx) {
    const lvl = this.currentLevel;
    const nextLevel = this.campaign.getNextLevel();
    this.drawModalBox(ctx, 480, 280, (boxW, boxH) => {
      const isNarrow = boxW < 440;
      ctx.fillStyle = '#2b5028';
      ctx.font = isNarrow ? '600 22px Mali, sans-serif' : '600 27px Mali, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Visit Complete', 0, -boxH / 2 + 38);

      ctx.font = isNarrow ? 'italic 12px Mali, sans-serif' : 'italic 14px Mali, sans-serif';
      ctx.fillStyle = '#5a7857';
      ctx.fillText(`${lvl.title} harmonized peacefully.`, 0, -boxH / 2 + 62);

      // Objectives recap
      ctx.textAlign = 'left';
      const padX = -boxW / 2 + 36;
      let startY = -boxH / 2 + 96;
      ctx.font = '500 13px system-ui, sans-serif';
      ctx.fillStyle = '#2f6932';
      for (const [k, obj] of Object.entries(this.campaign.objectiveProgress)) {
        ctx.fillText(`✔ ${obj.label}: ${obj.current} / ${obj.target}`, padX, startY);
        startY += 22;
      }

      ctx.textAlign = 'center';
      ctx.font = isNarrow ? '12px system-ui, sans-serif' : '13px system-ui, sans-serif';
      ctx.fillStyle = '#3d3428';
      const best = (this.campaign.saveState.bestScores && this.campaign.saveState.bestScores[lvl.id]) || this.score;
      ctx.fillText(`Score: ${this.score} pts  (Best: ${best} pts)`, 0, startY + 12);

      ctx.fillStyle = '#5c4538';
      ctx.font = isNarrow ? '600 12px system-ui, sans-serif' : '600 14px system-ui, sans-serif';
      ctx.fillText(
        nextLevel
          ? (isNarrow ? `[ Tap for Next: ${nextLevel.title} ]` : `[ Click or Space for Next Visit: ${nextLevel.title} ]`)
          : (isNarrow ? '[ Tap to Replay ]' : '[ Click or Press Space to Replay ]'),
        0,
        boxH / 2 - 24
      );
    });
  }

  drawPausedModal(ctx) {
    const lvl = this.currentLevel;
    this.drawModalBox(ctx, 450, 260, (boxW, boxH) => {
      const isNarrow = boxW < 400;
      ctx.fillStyle = '#3a3429';
      ctx.font = isNarrow ? '600 22px Mali, sans-serif' : 'bold 20px Mali, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Quiet Interval — Paused', 0, -boxH / 2 + 38);

      ctx.font = isNarrow ? 'italic 12px Mali, sans-serif' : 'italic 13px Mali, sans-serif';
      ctx.fillStyle = '#7a6f5f';
      ctx.fillText(lvl.title, 0, -boxH / 2 + 58);

      ctx.font = isNarrow ? '12px system-ui, -apple-system, sans-serif' : '13px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#54483a';
      ctx.fillText('Remaining Time: ' + Math.ceil(this.clock.remainingSeconds) + 's', 0, -10);

      // Objectives progress
      const objEntries = Object.entries(this.campaign.objectiveProgress);
      const objText = objEntries.map(([k, o]) => `${o.label}: ${o.current}/${o.target}`).join(' • ');
      ctx.fillText(objText, 0, 14);
      ctx.fillText('Current Score: ' + this.score + ' pts', 0, 38);

      ctx.fillStyle = '#785b46';
      ctx.font = isNarrow ? '600 12px system-ui, -apple-system, sans-serif' : '600 14px system-ui, -apple-system, sans-serif';
      ctx.fillText(isNarrow ? '[ Tap to Resume ]' : '[ Press Space or Click Pause to Resume ]', 0, boxH / 2 - 22);
    });
  }

  drawGameOverModal(ctx) {
    const lvl = this.currentLevel;
    this.drawModalBox(ctx, 450, 260, (boxW, boxH) => {
      const isNarrow = boxW < 440;
      ctx.fillStyle = '#6e3535';
      ctx.font = isNarrow ? '600 22px Mali, sans-serif' : '600 27px Mali, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('The Hour Has Passed', 0, -boxH / 2 + 38);

      ctx.font = isNarrow ? 'italic 12px Mali, sans-serif' : 'italic 14px Mali, sans-serif';
      ctx.fillStyle = '#8f5c5c';
      ctx.fillText('The dandelion seeds took flight into the morning breeze.', 0, -boxH / 2 + 60);

      ctx.font = isNarrow ? '12px system-ui, -apple-system, sans-serif' : '13px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#42372b';

      const objEntries = Object.entries(this.campaign.objectiveProgress);
      const objText = objEntries.map(([k, o]) => `${o.label}: ${o.current}/${o.target}`).join(' • ');
      ctx.fillText(objText, 0, 0);
      ctx.fillText(`Score: ${this.score} points`, 0, 26);

      ctx.fillStyle = '#5c4538';
      ctx.font = isNarrow ? '600 12px system-ui, -apple-system, sans-serif' : '600 14px system-ui, -apple-system, sans-serif';
      ctx.fillText(isNarrow ? '[ Tap to Retry Visit ]' : '[ Click or Press Space to Retry Visit ]', 0, boxH / 2 - 22);
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
    const actualH = Math.min(h, this.height - 24);

    // Paper card drop shadow
    ctx.fillStyle = 'rgba(20, 25, 15, 0.2)';
    ctx.beginPath();
    drawRoundedRect(ctx, -actualW / 2 + 5, -actualH / 2 + 8, actualW, actualH, 14);
    ctx.fill();

    // Paper card body
    ctx.fillStyle = '#fbf8ee';
    ctx.strokeStyle = '#d8ccb6';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    drawRoundedRect(ctx, -actualW / 2, -actualH / 2, actualW, actualH, 14);
    ctx.fill();
    ctx.stroke();

    // Inner delicate border
    ctx.strokeStyle = '#ece3d2';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    drawRoundedRect(ctx, -actualW / 2 + 8, -actualH / 2 + 8, actualW - 16, actualH - 16, 10);
    ctx.stroke();

    contentFn(actualW, actualH);
    ctx.restore();
  }
}
