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
    }
  }

  initDecorations() {
    this.decorations = [];
    // Scattered clover leaves and paper daisies along verges
    const count = 28;
    for (let i = 0; i < count; i++) {
      this.decorations.push({
        x: (Math.random() < 0.5 ? Math.random() * 120 : this.width - Math.random() * 120),
        y: Math.random() * this.height,
        size: 8 + Math.random() * 8,
        type: Math.random() < 0.6 ? 'clover' : 'flower',
        rotation: Math.random() * Math.PI * 2,
        tint: Math.random() < 0.5 ? '#d2e3c8' : '#e6eedb',
      });
    }
  }

  initLevel() {
    this.entities = [];
    this.score = 0;
    this.harmoniesCount = 0;
    this.clock.reset(60);

    // Initial butterfly population
    const butterflies = [
      new Butterfly(this.width * 0.25, this.height * 0.35, 'brimstone'),
      new Butterfly(this.width * 0.35, this.height * 0.55, 'brimstone'),
      new Butterfly(this.width * 0.65, this.height * 0.3, 'azure'),
      new Butterfly(this.width * 0.75, this.height * 0.6, 'azure'),
      new Butterfly(this.width * 0.45, this.height * 0.25, 'roseate'),
      new Butterfly(this.width * 0.5, this.height * 0.7, 'roseate'),
      new Butterfly(this.width * 0.2, this.height * 0.75, 'brimstone'),
    ];

    const seeds = [
      new DandelionSeed(this.width * 0.1, this.height * 0.2),
      new DandelionSeed(this.width * 0.4, this.height * 0.5),
    ];

    const hazard = new Snail(this.width * 0.5, this.height - 35);

    this.entities.push(...butterflies, ...seeds, hazard);
  }

  maintainPopulation() {
    const butterflies = this.entities.filter(e => e.type === 'butterfly' && e.state !== 'departing');
    const kinds = ['brimstone', 'azure', 'roseate'];

    if (butterflies.length < 6) {
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

  startLevel() {
    this.initLevel();
    this.victoryDelay = 0;
    this.state = 'PLAYING';
    this.showFeedback('Morning Verge: Gather 5 harmonious combinations', 'info', 3.0);
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

    // --- Top-Left: Dandelion Visit Clock ---
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

    // --- Top-Center: Stroke Length Band Meter ---
    const cx = this.width / 2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.strokeStyle = '#dcd4c5';
    ctx.lineWidth = 1.2;
    const meterW = 160, meterH = 18;
    ctx.beginPath();
    drawRoundedRect(ctx, cx - meterW / 2, 24, meterW, meterH, 9);
    ctx.fill();
    ctx.stroke();

    // Length fill fraction
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

    // --- Top-Right: Objective & Score ---
    ctx.textAlign = 'right';
    ctx.fillStyle = '#4a4235';
    ctx.font = '600 14px system-ui, -apple-system, sans-serif';
    ctx.fillText(`Harmonies: ${this.harmoniesCount} / ${this.harmoniesGoal}`, this.width - 24, 38);

    ctx.fillStyle = '#8a7f70';
    ctx.font = '500 12px system-ui, -apple-system, sans-serif';
    ctx.fillText(`Score: ${this.score}`, this.width - 24, 54);

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
      const boxW = Math.max(220, textWidth + 36);
      const boxH = 32;
      const by = this.height - 54;

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
    this.drawModalBox(ctx, 460, 310, () => {
      ctx.fillStyle = '#3a3429';
      ctx.font = 'bold 22px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('Drawing the Hours', 0, -85);

      ctx.font = 'italic 14px Georgia, serif';
      ctx.fillStyle = '#7a6f5f';
      ctx.fillText('Visit I: Morning Verge', 0, -60);

      ctx.font = '13px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#4c4234';
      ctx.textAlign = 'left';
      const lines = [
        '• Draw a loop around 2 matching butterflies (Kindred Pair)',
        '• Or 3 distinct species: Brimstone, Azure, Roseate (Trio of Flight)',
        '• Pair a butterfly with an airborne dandelion seed (Seed & Wing)',
        '• Cross over to form a Figure-Eight for two-pocket correspondence!',
        '• Avoid crawlers — snails will tangle and fray the cord.',
      ];
      lines.forEach((line, idx) => {
        ctx.fillText(line, -195, -24 + idx * 24);
      });

      // Button prompt
      ctx.fillStyle = '#5c4538';
      ctx.font = '600 14px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('[ Click anywhere or press Space to enter the meadow ]', 0, 115);
    });
  }

  drawPausedModal(ctx) {
    this.drawModalBox(ctx, 420, 240, () => {
      ctx.fillStyle = '#3a3429';
      ctx.font = 'bold 20px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('Quiet Interval — Paused', 0, -60);

      ctx.font = '13px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#54483a';
      ctx.fillText('Remaining Time: ' + Math.ceil(this.clock.remainingSeconds) + 's', 0, -20);
      ctx.fillText('Harmonies Arranged: ' + this.harmoniesCount + ' / ' + this.harmoniesGoal, 0, 10);
      ctx.fillText('Current Score: ' + this.score, 0, 40);

      ctx.fillStyle = '#785b46';
      ctx.font = '600 14px system-ui, -apple-system, sans-serif';
      ctx.fillText('[ Press Space or Click Pause to Resume ]', 0, 85);
    });
  }

  drawVictoryModal(ctx) {
    this.drawModalBox(ctx, 450, 260, () => {
      ctx.fillStyle = '#2b5028';
      ctx.font = 'bold 22px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('Morning Verge Harmonized', 0, -65);

      ctx.font = 'italic 14px Georgia, serif';
      ctx.fillStyle = '#5a7857';
      ctx.fillText('The quiet hour departs in peace.', 0, -40);

      ctx.font = '14px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#3d3428';
      ctx.fillText(`All 5 relationships completed with grace.`, 0, 0);
      ctx.fillText(`Final Visit Score: ${this.score} points`, 0, 30);

      ctx.fillStyle = '#5c4538';
      ctx.font = '600 14px system-ui, -apple-system, sans-serif';
      ctx.fillText('[ Click to Replay Morning Visit ]', 0, 85);
    });
  }

  drawGameOverModal(ctx) {
    this.drawModalBox(ctx, 450, 260, () => {
      ctx.fillStyle = '#6e3535';
      ctx.font = 'bold 22px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('The Hour Has Passed', 0, -65);

      ctx.font = 'italic 14px Georgia, serif';
      ctx.fillStyle = '#8f5c5c';
      ctx.fillText('The dandelion seeds took flight into the morning breeze.', 0, -40);

      ctx.font = '14px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#42372b';
      ctx.fillText(`Harmonies Gathered: ${this.harmoniesCount} / ${this.harmoniesGoal}`, 0, 0);
      ctx.fillText(`Score: ${this.score} points`, 0, 30);

      ctx.fillStyle = '#5c4538';
      ctx.font = '600 14px system-ui, -apple-system, sans-serif';
      ctx.fillText('[ Click to Try Again ]', 0, 85);
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

    // Paper card drop shadow
    ctx.fillStyle = 'rgba(20, 25, 15, 0.2)';
    ctx.beginPath();
    drawRoundedRect(ctx, -w / 2 + 5, -h / 2 + 8, w, h, 14);
    ctx.fill();

    // Paper card body
    ctx.fillStyle = '#fbf8ee';
    ctx.strokeStyle = '#d8ccb6';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    drawRoundedRect(ctx, -w / 2, -h / 2, w, h, 14);
    ctx.fill();
    ctx.stroke();

    // Inner delicate border
    ctx.strokeStyle = '#ece3d2';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    drawRoundedRect(ctx, -w / 2 + 8, -h / 2 + 8, w - 16, h - 16, 10);
    ctx.stroke();

    contentFn();
    ctx.restore();
  }
}
