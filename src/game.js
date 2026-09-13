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

    // Game state
    this.currentWave = 1; // Wave 1: Foundations | Wave 2: Twin Echoes (Correspondence Experiment)
    this.state = 'INTRO'; // 'INTRO' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'GAMEOVER'
    this.score = 0;
    this.harmoniesCount = 0;
    this.harmoniesGoal = 5;

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

  initLevel(wave = this.currentWave) {
    this.currentWave = wave;
    this.entities = [];
    this.score = 0;
    this.harmoniesCount = 0;
    this.harmoniesGoal = (this.currentWave === 1) ? 5 : 4;
    this.clock.reset(60);

    // Initial insect population based on active wave
    const fliers = (this.currentWave === 1) ? [
      new Butterfly(this.width * 0.25, this.height * 0.35, 'brimstone'),
      new Butterfly(this.width * 0.35, this.height * 0.55, 'brimstone'),
      new Butterfly(this.width * 0.65, this.height * 0.3, 'damselfly'),
      new Butterfly(this.width * 0.75, this.height * 0.6, 'damselfly'),
      new Butterfly(this.width * 0.45, this.height * 0.25, 'hawkmoth'),
      new Butterfly(this.width * 0.5, this.height * 0.7, 'hawkmoth'),
      new Butterfly(this.width * 0.2, this.height * 0.75, 'brimstone'),
    ] : [
      // Wave 2: Twin Echoes (Symmetric Correspondence experiment)
      new Butterfly(this.width * 0.22, this.height * 0.35, 'brimstone'),
      new Butterfly(this.width * 0.32, this.height * 0.55, 'brimstone'),
      new Butterfly(this.width * 0.65, this.height * 0.3, 'damselfly'),
      new Butterfly(this.width * 0.75, this.height * 0.6, 'damselfly'),
      new Butterfly(this.width * 0.45, this.height * 0.25, 'hawkmoth'),
      new Butterfly(this.width * 0.52, this.height * 0.7, 'hawkmoth'),
      new Butterfly(this.width * 0.2, this.height * 0.75, 'damselfly'),
      new Butterfly(this.width * 0.8, this.height * 0.4, 'hawkmoth'),
    ];

    const seeds = [
      new DandelionSeed(this.width * 0.1, this.height * 0.2),
      new DandelionSeed(this.width * 0.4, this.height * 0.5),
    ];

    const hazard = new Snail(this.width * 0.5, this.height - 35);

    this.entities.push(...fliers, ...seeds, hazard);
  }

  maintainPopulation() {
    const fliers = this.entities.filter(e => e.type === 'butterfly' && e.state !== 'departing');
    const kinds = ['brimstone', 'damselfly', 'hawkmoth'];

    const targetCount = (this.currentWave === 1) ? 6 : 8;
    if (fliers.length < targetCount) {
      const missingKind = kinds[Math.floor(Math.random() * kinds.length)];
      // Spawn at verge
      const edge = Math.random();
      let sx = 20, sy = 20;
      if (edge < 0.25) { sx = 20; sy = Math.random() * this.height; }
      else if (edge < 0.5) { sx = this.width - 20; sy = Math.random() * this.height; }
      else if (edge < 0.75) { sx = Math.random() * this.width; sy = 20; }
      else { sx = Math.random() * this.width; sy = this.height - 20; }

      const b = new Butterfly(sx, sy, missingKind);
      this.entities.push(b);
    }

    const seeds = this.entities.filter(e => e.type === 'seed' && e.state !== 'harmonizing');
    if (seeds.length < 2) {
      this.entities.push(new DandelionSeed(-15, 60 + Math.random() * (this.height - 120)));
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
      this.clock.addTime(4); // time bonus

      this.showFeedback(`${result.title} (+${result.finalScore} pts)`, 'success');

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

      // Check level complete. Held on game time so a restart cancels it.
      if (this.harmoniesCount >= this.harmoniesGoal) {
        this.victoryDelay = 1.2;
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

  startLevel(wave = this.currentWave) {
    this.currentWave = wave;
    this.initLevel(this.currentWave);
    this.victoryDelay = 0;
    this.state = 'PLAYING';
    const waveTitle = this.currentWave === 1 ? 'Morning Verge' : 'Twin Echoes';
    const goalText = this.currentWave === 1
      ? 'Morning Verge: Gather 5 harmonious combinations'
      : 'Twin Echoes: Mirror species across figure-eights (4 harmonies)';
    this.showFeedback(goalText, 'info', 3.0);
    if (typeof this.onWaveChanged === 'function') {
      this.onWaveChanged(this.currentWave);
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
          this.state = 'VICTORY';
          return;
        }
      }

      this.clock.update(dt);
      if (this.clock.isExpired && this.victoryDelay <= 0) {
        this.state = 'GAMEOVER';
      }

      const bounds = { width: this.width, height: this.height };
      for (let i = this.entities.length - 1; i >= 0; i--) {
        const ent = this.entities[i];
        ent.update(dt, bounds);
        if (ent.alpha <= 0.01 && (ent.state === 'departing' || ent.state === 'harmonizing')) {
          this.entities.splice(i, 1);
        }
      }

      this.maintainPopulation();
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

    // 4. Inhabitants (Folded Butterflies, Seeds, Snail)
    for (const ent of this.entities) {
      ent.draw(ctx);
    }

    // 5. Active Drawn Cord / Recoil Cord
    this.drawCord(ctx);

    // 6. HUD & Banners
    this.drawHUD(ctx);

    // 7. Modals / Overlays
    if (this.state === 'INTRO') this.drawIntroModal(ctx);
    else if (this.state === 'PAUSED') this.drawPausedModal(ctx);
    else if (this.state === 'VICTORY') this.drawVictoryModal(ctx);
    else if (this.state === 'GAMEOVER') this.drawGameOverModal(ctx);
  }

  drawMeadowFloor(ctx) {
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
      ctx.textAlign = 'right';
      ctx.fillStyle = '#4a4235';
      ctx.font = '600 12px system-ui, -apple-system, sans-serif';
      ctx.fillText(`Harmonies: ${this.harmoniesCount} / ${this.harmoniesGoal}`, this.width - 16, 26);

      ctx.fillStyle = '#7a6c57';
      ctx.font = 'italic 10.5px Georgia, serif';
      ctx.fillText(`Wave ${this.currentWave}: ${this.currentWave === 1 ? 'Verge' : 'Echoes'} • ${this.score} pts`, this.width - 16, 40);

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

      ctx.textAlign = 'right';
      ctx.fillStyle = '#4a4235';
      ctx.font = '600 13px system-ui, -apple-system, sans-serif';
      ctx.fillText(`Harmonies: ${this.harmoniesCount} / ${this.harmoniesGoal}`, this.width - 24, 34);

      ctx.fillStyle = '#7a6c57';
      ctx.font = 'italic 11px Georgia, serif';
      ctx.fillText(`Wave ${this.currentWave}: ${this.currentWave === 1 ? 'Morning Verge' : 'Twin Echoes'}`, this.width - 24, 49);

      ctx.fillStyle = '#8a7f70';
      ctx.font = '500 11px system-ui, -apple-system, sans-serif';
      ctx.fillText(`Score: ${this.score}`, this.width - 24, 64);
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

  drawIntroModal(ctx) {
    const isWave1 = (this.currentWave === 1);
    this.drawModalBox(ctx, 490, 340, (boxW, boxH) => {
      const isNarrow = boxW < 440;
      ctx.fillStyle = '#3a3429';
      ctx.font = isNarrow ? 'bold 18px Georgia, serif' : 'bold 22px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('Drawing the Hours', 0, -boxH / 2 + 34);

      ctx.font = isNarrow ? 'italic 12px Georgia, serif' : 'italic 14px Georgia, serif';
      ctx.fillStyle = '#7a6f5f';
      ctx.fillText(isWave1 ? 'Visit I: Morning Verge' : 'Visit II: Twin Echoes (Correspondence)', 0, -boxH / 2 + 56);

      ctx.font = isNarrow ? '11px system-ui, -apple-system, sans-serif' : '13px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#4c4234';
      ctx.textAlign = 'left';

      const lines = isWave1 ? [
        '• Brimstone Butterfly: Sulphur folded wings, wanders & glides.',
        '• Azure Damselfly: Slender body, hovers still then darts swiftly.',
        '• Roseate Hawkmoth: Plump body, swept delta wings in wide arcs.',
        '• Single loops: Kindred Pair (2 matching), Trio (all 3), Seed & Wing.',
        '• Cross cord into Figure-Eight for two-pocket correspondence.',
        '• Snails crawl along verges — their shells will fray your cord.',
      ] : [
        '• Experiment: Symmetric Correspondence across Figure-Eight lobes.',
        '• Cross cord to form two pockets: mirror identical species in both!',
        '• Example: 1 Damselfly + 1 Hawkmoth in Pocket A, and same in Pocket B.',
        '• Mixed groupings that fail alone harmonize through bilateral symmetry.',
        '• Goal: Gather 4 Twin Echo harmonies before the dandelion clock ends.',
      ];

      const lineSpacing = isNarrow ? 21 : 23;
      const startY = -boxH / 2 + 82;
      const padX = -boxW / 2 + (isNarrow ? 18 : 25);

      lines.forEach((line, idx) => {
        ctx.fillText(line, padX, startY + idx * lineSpacing);
      });

      // Button prompt
      ctx.fillStyle = '#5c4538';
      ctx.font = isNarrow ? '600 12px system-ui, -apple-system, sans-serif' : '600 14px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        isNarrow ? `[ Tap to start ${isWave1 ? 'Morning Verge' : 'Twin Echoes'} ]` : `[ Click anywhere or press Space to enter ${isWave1 ? 'Morning Verge' : 'Twin Echoes'} ]`,
        0,
        boxH / 2 - 20
      );
    });
  }

  drawPausedModal(ctx) {
    this.drawModalBox(ctx, 420, 240, (boxW, boxH) => {
      const isNarrow = boxW < 400;
      ctx.fillStyle = '#3a3429';
      ctx.font = isNarrow ? 'bold 18px Georgia, serif' : 'bold 20px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('Quiet Interval — Paused', 0, -boxH / 2 + 40);

      ctx.font = isNarrow ? '12px system-ui, -apple-system, sans-serif' : '13px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#54483a';
      ctx.fillText('Remaining Time: ' + Math.ceil(this.clock.remainingSeconds) + 's', 0, -15);
      ctx.fillText('Harmonies Arranged: ' + this.harmoniesCount + ' / ' + this.harmoniesGoal, 0, 12);
      ctx.fillText('Current Score: ' + this.score, 0, 38);

      ctx.fillStyle = '#785b46';
      ctx.font = isNarrow ? '600 12px system-ui, -apple-system, sans-serif' : '600 14px system-ui, -apple-system, sans-serif';
      ctx.fillText(isNarrow ? '[ Tap to Resume ]' : '[ Press Space or Click Pause to Resume ]', 0, boxH / 2 - 22);
    });
  }

  drawVictoryModal(ctx) {
    const isWave1 = (this.currentWave === 1);
    this.drawModalBox(ctx, 470, 275, (boxW, boxH) => {
      const isNarrow = boxW < 440;
      ctx.fillStyle = '#2b5028';
      ctx.font = isNarrow ? 'bold 18px Georgia, serif' : 'bold 22px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(isWave1 ? 'Morning Verge Harmonized' : 'Twin Echoes Harmonized', 0, -boxH / 2 + 40);

      ctx.font = isNarrow ? 'italic 12px Georgia, serif' : 'italic 14px Georgia, serif';
      ctx.fillStyle = '#5a7857';
      ctx.fillText(
        isWave1 ? 'The quiet hour departs in peace.' : 'Symmetric correspondence achieved across both lobes.',
        0,
        -boxH / 2 + 64
      );

      ctx.font = isNarrow ? '12px system-ui, -apple-system, sans-serif' : '14px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#3d3428';
      ctx.fillText(
        isWave1
          ? `All ${this.harmoniesGoal} relationships completed with grace.`
          : `All ${this.harmoniesGoal} correspondence experiments mirrored perfectly.`,
        0,
        -5
      );
      ctx.fillText(`Final Visit Score: ${this.score} points`, 0, 22);

      ctx.fillStyle = '#5c4538';
      ctx.font = isNarrow ? '600 12px system-ui, -apple-system, sans-serif' : '600 14px system-ui, -apple-system, sans-serif';
      ctx.fillText(
        isWave1
          ? (isNarrow ? '[ Tap to Enter Wave 2 ]' : '[ Click or Press Space to Enter Wave 2: Twin Echoes ]')
          : (isNarrow ? '[ Tap to Replay Garden ]' : '[ Click or Press Space to Replay Garden ]'),
        0,
        boxH / 2 - 22
      );
    });
  }

  drawGameOverModal(ctx) {
    this.drawModalBox(ctx, 450, 260, (boxW, boxH) => {
      const isNarrow = boxW < 440;
      ctx.fillStyle = '#6e3535';
      ctx.font = isNarrow ? 'bold 18px Georgia, serif' : 'bold 22px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('The Hour Has Passed', 0, -boxH / 2 + 40);

      ctx.font = isNarrow ? 'italic 12px Georgia, serif' : 'italic 14px Georgia, serif';
      ctx.fillStyle = '#8f5c5c';
      ctx.fillText('The dandelion seeds took flight into the morning breeze.', 0, -boxH / 2 + 64);

      ctx.font = isNarrow ? '12px system-ui, -apple-system, sans-serif' : '14px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#42372b';
      ctx.fillText(`Harmonies Gathered: ${this.harmoniesCount} / ${this.harmoniesGoal}`, 0, 0);
      ctx.fillText(`Score: ${this.score} points`, 0, 26);

      ctx.fillStyle = '#5c4538';
      ctx.font = isNarrow ? '600 12px system-ui, -apple-system, sans-serif' : '600 14px system-ui, -apple-system, sans-serif';
      ctx.fillText(isNarrow ? '[ Tap to Try Again ]' : '[ Click or Press Space to Try Again ]', 0, boxH / 2 - 22);
    });
  }

  drawModalBox(ctx, w, h, contentFn) {
    ctx.save();
    // Backdrop dim
    ctx.fillStyle = 'rgba(45, 40, 32, 0.42)';
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
