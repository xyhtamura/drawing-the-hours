import { themeColor } from './theme.js';
import { updateLacewing, drawLacewing } from './lacewing.js';
import { curbSeamY } from './geometry.js';
/**
 * Drawing the Hours — Inhabitants of the Meadow
 * Procedural paper entities with distinct morphology and flight physics:
 * 1. Brimstone Butterfly (wandering flutter-and-glide)
 * 2. Azure Damselfly (slender gauzy wings, dart-and-hover dynamics)
 * 3. Roseate Hawkmoth (plump body, vibrating delta wings, wide arcing sweeps)
 * 4. Dandelion Seeds (passive wind drift)
 * 5. Snail (ground verge crawler hazard)
 * 6. Hornet (atrium patrol hazard), Web patch (static cord hazard), Cord spool (power-up)
 */

export const SPECIES_CONFIG = {
  hornet: {
    id: 'hornet',
    name: 'Atrium Hornet',
    shortName: 'Hornet',
    speciesGroup: 'hazard',
    bodyColor: '#d97a1e',
    wingColor: '#f3efe2',
    wingEdge: '#a99a80',
    speed: 1.35,
    size: 17,
    flutterFreq: 34,
  },
  brimstone: {
    id: 'brimstone',
    name: 'Brimstone Butterfly',
    shortName: 'Brimstone',
    speciesGroup: 'butterfly',
    bodyColor: '#524a35',
    wingColor: '#fae37d',
    wingAltColor: '#f3d459',
    wingEdge: '#e5be38',
    markColor: '#d69e2e',
    speed: 1.1,
    size: 22,
    flutterFreq: 13,
    description: 'Folded sulphur paper wings; wanders with gentle glides.',
  },
  damselfly: {
    id: 'damselfly',
    name: 'Azure Damselfly',
    shortName: 'Damselfly',
    speciesGroup: 'damselfly',
    bodyColor: '#1d3557',
    bodyAccent: '#457b9d',
    wingColor: 'rgba(175, 225, 245, 0.75)',
    wingAltColor: 'rgba(145, 205, 235, 0.7)',
    wingEdge: '#529bc4',
    markColor: '#219ebc',
    speed: 1.5,
    size: 24,
    flutterFreq: 26,
    description: 'Slender needle body with 4 gauzy wings; freezes to hover, then darts.',
  },
  hawkmoth: {
    id: 'hawkmoth',
    name: 'Roseate Hawkmoth',
    shortName: 'Hawkmoth',
    speciesGroup: 'hawkmoth',
    bodyColor: '#4f2b3b',
    bodyAccent: '#7a3e56',
    wingColor: '#e07a8f',
    wingAltColor: '#c9546d',
    wingEdge: '#ba415b',
    markColor: '#8a2b42',
    speed: 1.7,
    size: 20,
    flutterFreq: 30,
    description: 'Plump velvety body and swept delta wings; flies in sweeping arcs.',
  },
  hoverfly: {
    id: 'hoverfly', name: 'Amber Hoverfly', shortName: 'Hoverfly',
    speciesGroup: 'hoverfly', bodyColor: '#5d493a', bodyAccent: '#eab765',
    wingColor: 'rgba(239, 245, 232, 0.82)', wingEdge: '#aaa58b',
    speed: 1, size: 19, flutterFreq: 38,
    description: 'Striped amber body; pauses, turns, then shifts sideways.',
  },
  lacewing: {
    id: 'lacewing', name: 'Paper Lacewing', shortName: 'Lacewing',
    speciesGroup: 'lacewing', bodyColor: '#405c49', wingColor: '#e5f4de',
    wingEdge: '#3f7158', speed: 1, size: 23, flutterFreq: 12,
    description: 'Veined mint wings; travels between leaves and rests for 1.5 seconds.',
  },
  firefly: {
    id: 'firefly', name: 'Window Firefly', shortName: 'Firefly',
    speciesGroup: 'firefly', bodyColor: '#394955', wingColor: '#829c8f',
    wingEdge: '#465e58', speed: 1.1 * 0.65, size: 22, flutterFreq: 9,
    description: 'Slow wandering beetle; its pale abdomen stays visible between glows.',
  },
  // Aliases for backward compatibility
  azure: null,
  roseate: null,
};
// Aliases
SPECIES_CONFIG.azure = SPECIES_CONFIG.damselfly;
SPECIES_CONFIG.roseate = SPECIES_CONFIG.hawkmoth;

export class Insect {
  constructor(x, y, kind = 'brimstone') {
    this.type = 'butterfly'; // keep 'butterfly' type tag for recipe compatibility
    this.insectClass = 'insect';
    this.kind = (kind === 'azure') ? 'damselfly' : ((kind === 'roseate') ? 'hawkmoth' : kind);
    this.config = SPECIES_CONFIG[this.kind] || SPECIES_CONFIG.brimstone;
    this.x = x;
    this.y = y;
    this.radius = this.config.size * 0.9;

    this.heading = Math.random() * Math.PI * 2;
    this.targetHeading = this.heading;
    this.speed = this.config.speed;

    this.glowOffset = Math.random() * 3;
    this.flapPhase = Math.random() * Math.PI * 2;
    this.state = 'roaming'; // 'roaming' | 'harmonizing' | 'departing'
    this.stateTime = 0;
    this.alpha = 1.0;
    this.highlightGlow = 0;
    this.motionScale = 1.0;

    // Species-specific behavioral state
    this.behaviorTimer = 0.5 + Math.random() * 1.5;
    this.hoverPhase = 'hold';
    this.hoverRemaining = 1.4 + Math.random() * 0.6;
    this.isHovering = false; // specific to damselfly
    this.arcSign = Math.random() < 0.5 ? 1 : -1; // specific to hawkmoth
    this.crossesCord = false;
    this.isBead = false;
  }

  // Cord walls are applied after this update by constrainToWalls in src/string.js.
  update(dt, bounds) {
    this.stateTime += dt;

    // A bead keeps its own movement and StringGesture.updateBeads confines it to the
    // cord. A lacewing's route is tied to its leaves, so a threaded lacewing holds still.
    if (this.state === 'bead' && this.kind === 'lacewing') {
      this.flapPhase += (this.config?.flutterFreq || 16) * dt;
      return;
    }

    if (this.state === 'harmonizing') {
      this.flapPhase += 28 * dt;
      this.highlightGlow = Math.min(1.0, this.highlightGlow + dt * 3);
      if (this.stateTime > 0.8) {
        this.state = 'departing';
        this.stateTime = 0;
        const cx = bounds.width / 2;
        const cy = bounds.height / 2;
        this.heading = Math.atan2(this.y - cy, this.x - cx) + (Math.random() - 0.5) * 0.4;
      }
      return;
    }

    if (this.state === 'departing') {
      this.flapPhase += 24 * dt;
      this.speed = 4.0;
      this.x += Math.cos(this.heading) * this.speed * 60 * dt;
      this.y += Math.sin(this.heading) * this.speed * 60 * dt;
      this.alpha = Math.max(0, 1.0 - this.stateTime / 1.0);
      return;
    }

    // --- SPECIES-SPECIFIC MOVEMENT DYNAMICS ---
    if (this.kind === 'firefly') {
      this.updateFirefly(dt, bounds);
    } else if (this.kind === 'lacewing') {
      updateLacewing(this, dt, bounds);
    } else if (this.kind === 'hoverfly') {
      this.updateHoverfly(dt, bounds);
    } else if (this.kind === 'damselfly') {
      this.updateDamselfly(dt, bounds);
    } else if (this.kind === 'hawkmoth') {
      this.updateHawkmoth(dt, bounds);
    } else {
      this.updateBrimstone(dt, bounds);
    }

    // Clamp inside play area
    this.x = Math.max(12, Math.min(bounds.width - 12, this.x));
    this.y = Math.max(12, Math.min(bounds.height - 12, this.y));
  }

  updateFirefly(dt, bounds) {
    this.flapPhase += this.config.flutterFreq * dt;
    this.targetHeading += Math.sin(this.stateTime * 0.8 + this.glowOffset) * 0.45 * dt;
    this.applyBoundarySteering(bounds, 70);
    this.smoothTurn(2 * dt);
    this.x += Math.cos(this.heading) * this.config.speed * this.motionScale * 60 * dt;
    this.y += Math.sin(this.heading) * this.config.speed * this.motionScale * 60 * dt;
  }

  // 1. Brimstone Butterfly: Wandering flutter with periodic glides
  updateBrimstone(dt, bounds) {
    this.flapPhase += this.config.flutterFreq * dt;
    this.behaviorTimer -= dt;

    if (this.behaviorTimer <= 0) {
      if (Math.random() < 0.35) {
        // Glide
        this.behaviorTimer = 0.8 + Math.random() * 0.9;
        this.speed = this.config.speed * 0.65;
      } else {
        // Active flutter turn
        this.behaviorTimer = 1.2 + Math.random() * 1.6;
        this.speed = this.config.speed * (0.85 + Math.random() * 0.35);
        this.targetHeading += (Math.random() - 0.5) * 1.8;
      }
    }

    this.applyBoundarySteering(bounds, 65);
    this.smoothTurn(3.5 * dt);

    const scale = this.motionScale || 1.0;
    this.x += Math.cos(this.heading) * this.speed * scale * 60 * dt;
    this.y += Math.sin(this.heading) * this.speed * scale * 60 * dt;
  }

  // 2. Azure Damselfly: Dart-and-hover (freezes still, then swift dart)
  updateDamselfly(dt, bounds) {
    this.flapPhase += this.config.flutterFreq * dt;
    this.behaviorTimer -= dt;

    if (this.behaviorTimer <= 0) {
      if (!this.isHovering) {
        // Switch to Hovering (freeze in air)
        this.isHovering = true;
        this.behaviorTimer = 0.7 + Math.random() * 0.9;
        this.speed = 0.08; // slight micro-drift
      } else {
        // Switch to Darting (swift linear burst)
        this.isHovering = false;
        this.behaviorTimer = 0.45 + Math.random() * 0.55;
        this.speed = 3.2; // fast dart
        this.targetHeading += (Math.random() - 0.5) * 2.2;
      }
    }

    this.applyBoundarySteering(bounds, 50);
    this.smoothTurn(8.0 * dt);

    // Micro-jitter during hover
    const jitterX = this.isHovering ? (Math.random() - 0.5) * 0.6 : 0;
    const jitterY = this.isHovering ? (Math.random() - 0.5) * 0.6 : 0;
    const scale = this.motionScale || 1.0;

    this.x += (Math.cos(this.heading) * this.speed * scale + jitterX) * 60 * dt;
    this.y += (Math.sin(this.heading) * this.speed * scale + jitterY) * 60 * dt;
  }

  // 3. Roseate Hawkmoth: Brisk sweeping arcs and loops
  updateHawkmoth(dt, bounds) {
    this.flapPhase += this.config.flutterFreq * dt;
    this.behaviorTimer -= dt;

    if (this.behaviorTimer <= 0) {
      this.behaviorTimer = 1.4 + Math.random() * 1.8;
      this.arcSign *= -1; // change curve direction
    }

    // Continuously curve heading
    this.targetHeading += this.arcSign * 1.4 * dt;
    this.applyBoundarySteering(bounds, 65);
    this.smoothTurn(4.0 * dt);

    const scale = this.motionScale || 1.0;
    this.speed = this.config.speed * (0.95 + Math.sin(this.stateTime * 3) * 0.15);
    this.x += Math.cos(this.heading) * this.speed * scale * 60 * dt;
    this.y += Math.sin(this.heading) * this.speed * scale * 60 * dt;
  }

  // Explicit phases give a stationary capture window and a turn before each shift.
  updateHoverfly(dt, bounds) {
    this.flapPhase += this.config.flutterFreq * dt;
    let remaining = dt * this.motionScale;
    while (remaining > 0) {
      const step = Math.min(remaining, this.hoverRemaining);
      if (this.hoverPhase === 'shift') {
        this.x += Math.cos(this.heading) * 95 * step;
        this.y += Math.sin(this.heading) * 95 * step;
      } else if (this.hoverPhase === 'turn') {
        this.smoothTurn(12 * step);
      }
      remaining -= step;
      this.hoverRemaining -= step;
      if (this.hoverRemaining <= 0) {
        if (this.hoverPhase === 'hold') {
          this.hoverPhase = 'turn'; this.hoverRemaining = 0.3;
          this.targetHeading = this.heading + (Math.random() < 0.5 ? -1 : 1) * Math.PI / 2;
          this.applyBoundarySteering(bounds, 90);
        } else if (this.hoverPhase === 'turn') {
          this.hoverPhase = 'shift'; this.hoverRemaining = 0.5;
          this.heading = this.targetHeading;
        } else {
          this.hoverPhase = 'hold'; this.hoverRemaining = 1.4 + Math.random() * 0.6;
        }
      }
    }
  }

  drawHoverfly(ctx) {
    const flutter = 0.86 + Math.sin(this.flapPhase) * 0.14;
    ctx.fillStyle = 'rgba(70, 55, 35, 0.12)';
    ctx.beginPath(); ctx.ellipse(3, 7, 13, 17, 0, 0, Math.PI * 2); ctx.fill();
    for (const side of [-1, 1]) {
      ctx.save(); ctx.scale(side * flutter, 1);
      ctx.fillStyle = themeColor(this.kind, this.config.wingColor); ctx.strokeStyle = themeColor('outline', this.config.wingEdge); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(12, -1, 8, 15, -0.7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(3, -7); ctx.lineTo(18, 7); ctx.stroke(); ctx.restore();
    }
    ctx.fillStyle = themeColor(this.kind === 'hoverfly' ? 'hoverfly' : 'body', this.config.bodyAccent);
    ctx.beginPath(); ctx.ellipse(0, 5, 7, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = themeColor('body', this.config.bodyColor);
    for (const y of [0, 7, 14]) ctx.fillRect(-8, y, 16, 3);
    ctx.restore();
    ctx.fillStyle = themeColor('body', this.config.bodyColor);
    ctx.beginPath(); ctx.ellipse(0, -7, 7, 6, 0, 0, Math.PI * 2); ctx.fill();
    for (const x of [-4, 4]) {
      ctx.fillStyle = '#967757'; ctx.beginPath(); ctx.ellipse(x, -12, 3.5, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff2d5'; ctx.beginPath(); ctx.arc(x - 0.8, -13, 0.9, 0, Math.PI * 2); ctx.fill();
    }
  }

  applyBoundarySteering(bounds, pad) {
    if (this.x < pad) this.targetHeading = 0;
    else if (this.x > bounds.width - pad) this.targetHeading = Math.PI;
    if (this.y < pad) this.targetHeading = Math.PI / 2;
    else if (this.y > bounds.height - pad) this.targetHeading = -Math.PI / 2;
  }

  smoothTurn(factor) {
    let diff = this.targetHeading - this.heading;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.heading += diff * Math.min(1, factor);
  }

  draw(ctx) {
    if (this.alpha <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.heading + Math.PI / 2);

    // Harmonious glow if triggered
    if (this.highlightGlow > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 245, 180, ${0.45 * this.highlightGlow})`;
      ctx.beginPath();
      ctx.arc(0, 0, this.config.size * 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (this.kind === 'firefly') {
      drawFirefly(ctx, this);
    } else if (this.kind === 'lacewing') {
      drawLacewing(ctx, this);
    } else if (this.kind === 'hoverfly') {
      this.drawHoverfly(ctx);
    } else if (this.kind === 'damselfly') {
      this.drawDamselfly(ctx);
    } else if (this.kind === 'hawkmoth') {
      this.drawHawkmoth(ctx);
    } else {
      this.drawBrimstone(ctx);
    }

    ctx.restore();
  }

  // --- 1. BRIMSTONE BUTTERFLY DRAWING ---
  drawBrimstone(ctx) {
    const flap = Math.cos(this.flapPhase);
    const wingSpread = 0.2 + 0.8 * Math.abs(flap);
    const size = this.config.size;

    // Contact shadow
    ctx.save();
    ctx.translate(4, 7);
    ctx.scale(wingSpread, 1);
    ctx.fillStyle = 'rgba(40, 50, 30, 0.13)';
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.1, size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Left Wing
    ctx.save();
    ctx.scale(-wingSpread, 1);
    this.drawFoldedButterflyWing(ctx, size);
    ctx.restore();

    // Right Wing
    ctx.save();
    ctx.scale(wingSpread, 1);
    this.drawFoldedButterflyWing(ctx, size);
    ctx.restore();

    // Body
    ctx.fillStyle = themeColor('body', this.config.bodyColor);
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.5, size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Antennae
    ctx.strokeStyle = themeColor('body', this.config.bodyColor);
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-1, -size * 0.5);
    ctx.quadraticCurveTo(-6, -size * 0.9, -8, -size * 0.8);
    ctx.moveTo(1, -size * 0.5);
    ctx.quadraticCurveTo(6, -size * 0.9, 8, -size * 0.8);
    ctx.stroke();
  }

  drawFoldedButterflyWing(ctx, size) {
    // Forewing
    ctx.fillStyle = themeColor(this.kind, this.config.wingColor);
    ctx.strokeStyle = themeColor('outline', this.config.wingEdge);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(1, -size * 0.2);
    ctx.quadraticCurveTo(size * 0.6, -size * 0.9, size * 1.1, -size * 0.5);
    ctx.quadraticCurveTo(size * 1.2, size * 0.1, size * 0.3, size * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Hindwing
    ctx.fillStyle = this.config.wingAltColor;
    ctx.beginPath();
    ctx.moveTo(1, size * 0.1);
    ctx.quadraticCurveTo(size * 0.9, size * 0.4, size * 0.7, size * 0.85);
    ctx.quadraticCurveTo(size * 0.2, size * 0.8, 1, size * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wing disc
    ctx.fillStyle = this.config.markColor;
    ctx.beginPath();
    ctx.arc(size * 0.6, -size * 0.25, size * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- 2. AZURE DAMSELFLY DRAWING ---
  drawDamselfly(ctx) {
    const size = this.config.size;
    const flap = Math.sin(this.flapPhase);

    // Needle drop shadow
    ctx.save();
    ctx.translate(4, 7);
    ctx.fillStyle = 'rgba(30, 45, 55, 0.12)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 1.8, size * 1.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4 Narrow Gauzy Wings (2 pairs beating slightly out of phase)
    const wingAngle1 = 0.25 * flap;
    const wingAngle2 = 0.25 * Math.sin(this.flapPhase + 1.2);

    // Forewings (Left & Right)
    ctx.save();
    ctx.translate(0, -size * 0.2);
    this.drawDamselflyWingPair(ctx, size * 1.15, wingAngle1, true);
    ctx.restore();

    // Hindwings (Left & Right)
    ctx.save();
    ctx.translate(0, -size * 0.05);
    this.drawDamselflyWingPair(ctx, size * 0.95, wingAngle2, false);
    ctx.restore();

    // Slender needle abdomen (segmented paper strips)
    ctx.fillStyle = themeColor('body', this.config.bodyColor);
    ctx.strokeStyle = themeColor(this.kind === 'hoverfly' ? 'hoverfly' : 'body', this.config.bodyAccent);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.roundRect(-1.5, -size * 0.6, 3, size * 1.4, 1.5);
    ctx.fill();
    ctx.stroke();

    // Abdomen rings
    ctx.strokeStyle = '#8ecae6';
    ctx.lineWidth = 0.8;
    for (let r = 0; r < 5; r++) {
      const y = -size * 0.2 + r * (size * 0.2);
      ctx.beginPath();
      ctx.moveTo(-1.4, y);
      ctx.lineTo(1.4, y);
      ctx.stroke();
    }

    // Head with bead eyes
    ctx.fillStyle = themeColor('body', this.config.bodyColor);
    ctx.beginPath();
    ctx.arc(0, -size * 0.7, 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-2.4, -size * 0.72, 1.3, 0, Math.PI * 2);
    ctx.arc(2.4, -size * 0.72, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }

  drawDamselflyWingPair(ctx, length, angle, isForewing) {
    ctx.save();
    // Left wing
    ctx.save();
    ctx.rotate(-Math.PI / 2 + 0.35 + angle);
    this.drawSingleDamselflyWing(ctx, length, isForewing);
    ctx.restore();

    // Right wing
    ctx.save();
    ctx.rotate(Math.PI / 2 - 0.35 - angle);
    this.drawSingleDamselflyWing(ctx, length, isForewing);
    ctx.restore();
    ctx.restore();
  }

  drawSingleDamselflyWing(ctx, length, isForewing) {
    ctx.fillStyle = isForewing ? themeColor(this.kind, this.config.wingColor) : this.config.wingAltColor;
    ctx.strokeStyle = themeColor('outline', this.config.wingEdge);
    ctx.lineWidth = 1.0;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(length * 0.5, -3.5, length, 0);
    ctx.quadraticCurveTo(length * 0.5, 3.5, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Delicate wing vein
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(length * 0.85, 0);
    ctx.stroke();

    // Pterostigma (small dark mark near wing tip)
    ctx.fillStyle = this.config.markColor;
    ctx.fillRect(length * 0.75, -1.2, length * 0.12, 1.2);
  }

  // --- 3. ROSEATE HAWKMOTH DRAWING ---
  drawHawkmoth(ctx) {
    const size = this.config.size;
    const flap = Math.sin(this.flapPhase);
    const spread = 0.4 + 0.6 * Math.abs(flap);

    // Teardrop contact shadow
    ctx.save();
    ctx.translate(4, 7);
    ctx.scale(spread, 1);
    ctx.fillStyle = 'rgba(55, 30, 40, 0.14)';
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.1, size * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Swept delta wings
    ctx.save();
    // Left delta wing
    ctx.save();
    ctx.scale(-spread, 1);
    this.drawSingleHawkmothWing(ctx, size);
    ctx.restore();

    // Right delta wing
    ctx.save();
    ctx.scale(spread, 1);
    this.drawSingleHawkmothWing(ctx, size);
    ctx.restore();
    ctx.restore();

    // Plump velvety body (thorax + tapered abdomen)
    ctx.fillStyle = themeColor('body', this.config.bodyColor);
    ctx.strokeStyle = themeColor(this.kind === 'hoverfly' ? 'hoverfly' : 'body', this.config.bodyAccent);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 4.2, size * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Abdominal rose chevrons
    ctx.fillStyle = themeColor(this.kind, this.config.wingColor);
    for (let c = 0; c < 3; c++) {
      const y = -size * 0.1 + c * (size * 0.18);
      ctx.beginPath();
      ctx.moveTo(-3, y);
      ctx.lineTo(0, y - 2);
      ctx.lineTo(3, y);
      ctx.lineTo(0, y);
      ctx.closePath();
      ctx.fill();
    }

    // Feathered comb antennae
    ctx.strokeStyle = '#f3c4ce';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-1.5, -size * 0.6);
    ctx.lineTo(-7, -size * 0.95);
    ctx.moveTo(1.5, -size * 0.6);
    ctx.lineTo(7, -size * 0.95);
    ctx.stroke();
  }

  drawSingleHawkmothWing(ctx, size) {
    // Large swept delta forewing
    ctx.fillStyle = themeColor(this.kind, this.config.wingColor);
    ctx.strokeStyle = themeColor('outline', this.config.wingEdge);
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.moveTo(2, -size * 0.3);
    ctx.lineTo(size * 1.25, -size * 0.35); // swept wingtip
    ctx.lineTo(size * 0.8, size * 0.45);
    ctx.lineTo(2, size * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Smaller hindwing
    ctx.fillStyle = this.config.wingAltColor;
    ctx.beginPath();
    ctx.moveTo(2, size * 0.05);
    ctx.lineTo(size * 0.7, size * 0.4);
    ctx.lineTo(size * 0.45, size * 0.75);
    ctx.lineTo(2, size * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Olive/rose wing pattern stripe
    ctx.fillStyle = this.config.markColor;
    ctx.beginPath();
    ctx.moveTo(size * 0.4, -size * 0.15);
    ctx.lineTo(size * 1.1, -size * 0.25);
    ctx.lineTo(size * 0.85, 0);
    ctx.lineTo(size * 0.3, 0);
    ctx.closePath();
    ctx.fill();
  }
}

// Butterfly alias pointing to Insect for existing code
export const Butterfly = Insect;

export class DandelionSeed {
  constructor(x, y) {
    this.type = 'seed';
    this.kind = 'dandelion_seed';
    this.x = x;
    this.y = y;
    this.radius = 14;

    this.vx = 0.38 + Math.random() * 0.3;
    this.vy = 0.12 + Math.random() * 0.15;
    // Seeds take the visit's motion scale like the fliers do; without it a Dusk
    // seed outran every insect on the field (Xyh, 2026-09-16).
    this.motionScale = 1.0;
    this.phase = Math.random() * Math.PI * 2;
    this.tilt = (Math.random() - 0.5) * 0.3;

    this.state = 'roaming';
    this.stateTime = 0;
    this.alpha = 0.92;
    this.crossesCord = false;
    this.isBead = false;
  }

  // Cord walls are applied after this update by constrainToWalls in src/string.js.
  update(dt, bounds, windVx = 0) {
    this.stateTime += dt;

    // A seed bead keeps drifting; StringGesture.updateBeads confines it to the cord.

    if (this.state === 'harmonizing') {
      this.alpha = Math.max(0, 1.0 - this.stateTime / 0.8);
      return;
    }

    this.phase += dt * 2.0;
    const waveY = Math.sin(this.phase) * 0.4;

    const scale = this.motionScale || 1.0;
    this.x += (this.vx * scale * 60 + windVx) * dt;
    this.y += (this.vy + waveY) * scale * 60 * dt;

    // Lean with an active gust, whichever way it blows
    if (windVx !== 0) {
      this.tilt = Math.max(-0.48, Math.min(0.48, this.tilt + Math.sign(windVx) * dt * 0.75));
    } else {
      this.tilt = Math.max(-0.25, Math.min(0.25, this.tilt * (1 - dt * 1.5)));
    }

    // Wrap around gracefully; a leftward gust can carry seeds off the left edge
    if (this.x > bounds.width + 30) {
      this.x = -20;
      this.y = 50 + Math.random() * (bounds.height - 100);
    } else if (this.x < -30) {
      this.x = bounds.width + 20;
      this.y = 50 + Math.random() * (bounds.height - 100);
    }
    if (this.y > bounds.height + 30) {
      this.y = -20;
      this.x = Math.random() * bounds.width;
    }
  }

  draw(ctx) {
    if (this.alpha <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.tilt + Math.sin(this.phase) * 0.15);

    // Drop shadow
    ctx.save();
    ctx.translate(2, 5);
    ctx.fillStyle = 'rgba(40, 50, 30, 0.08)';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Feathery Pappus. Drawn as pencil-grey filaments over a pale tuft rather
    // than in near-white: on cream paper white-on-cream measured 2.1:1 and the
    // seed read as a bare speck, which made Seed & Wing unplayable.
    ctx.fillStyle = 'rgba(252, 250, 244, 0.85)';
    ctx.beginPath();
    ctx.ellipse(0, -9, 11, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = themeColor('seed', '#948c78');
    ctx.lineWidth = 1.1;
    const rayCount = 10;
    for (let i = 0; i < rayCount; i++) {
      const angle = -Math.PI / 2 + (i - (rayCount - 1) / 2) * 0.22;
      const len = 12 + (i % 2) * 3;
      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len - 2);
      ctx.stroke();
    }

    // Slender stalk
    ctx.strokeStyle = themeColor('seed', '#8a7f69');
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(0, 8);
    ctx.stroke();

    // Dark seed achene
    ctx.fillStyle = themeColor('seed', '#655743');
    ctx.beginPath();
    ctx.ellipse(0, 10, 1.8, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

/**
 * The snail crawls its seam and spoils any pocket that holds it, but it does not
 * cut the cord (Xyh, 2026-09-16): a hazard disturbs a drawing one way or the
 * other, not both, and the snail's way is to be a dud ingredient.
 */
export class Snail {
  /** route: 'edge' keeps to the bottom verge; 'seam' crawls the Dawn paving seam mid-field. */
  constructor(x, y, route = 'edge') {
    this.type = 'hazard';
    this.kind = 'snail';
    this.cutsCord = false;
    this.x = x;
    this.y = y;
    this.radius = 16;
    this.route = route;
    this.vx = route === 'seam' ? 0.2 : 0.12;
    this.state = 'roaming';
    this.bobPhase = 0;
    this.crossesCord = true;
  }

  update(dt, bounds) {
    this.bobPhase += dt * 1.5;
    this.x += this.vx * 60 * dt;
    this.y = this.route === 'seam'
      ? curbSeamY(this.x, bounds.width, bounds.height)
      : bounds.height - 35;

    if (this.x > bounds.width - 40) {
      this.vx = -Math.abs(this.vx);
    } else if (this.x < 40) {
      this.vx = Math.abs(this.vx);
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    const dir = this.vx >= 0 ? 1 : -1;
    ctx.scale(dir, 1);

    // Ground shadow
    ctx.fillStyle = 'rgba(50, 45, 30, 0.12)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Foot / body (cream paper)
    ctx.fillStyle = '#eddcc8';
    ctx.strokeStyle = '#c4ae97';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-16, 8);
    ctx.quadraticCurveTo(0, 4, 14, 8);
    ctx.quadraticCurveTo(18, 4, 16, 0);
    ctx.quadraticCurveTo(10, 2, -6, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Eye stalks
    ctx.strokeStyle = '#b8a087';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(14, 2);
    ctx.lineTo(19, -6);
    ctx.moveTo(12, 3);
    ctx.lineTo(16, -7);
    ctx.stroke();

    ctx.fillStyle = '#6e5a47';
    ctx.beginPath();
    ctx.arc(19, -6, 1.3, 0, Math.PI * 2);
    ctx.arc(16, -7, 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Spiral Shell
    ctx.fillStyle = '#a67c52';
    ctx.strokeStyle = '#7c542e';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(-2, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner paper spiral
    ctx.strokeStyle = '#d6b38a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(-2, 0, 6, 0.5, Math.PI * 1.5);
    ctx.stroke();

    ctx.restore();
  }
}


/**
 * Atrium hornet. It flies like the other insects — a wandering flutter with its
 * own turns — because a creature with a fixed route reads as scenery (Xyh,
 * 2026-09-16). It cuts a cord it touches, and like any uninvited entity it
 * spoils a pocket that holds it.
 */
export class Hornet extends Insect {
  constructor(x, y) {
    super(x, y, 'hornet');
    this.type = 'hazard';
    this.cutsCord = true;
    this.crossesCord = true;
    this.wingPhase = Math.random() * Math.PI * 2;
  }

  update(dt, bounds) {
    this.wingPhase += dt * 26;
    super.update(dt, bounds);
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(Math.cos(this.heading) >= 0 ? 1 : -1, 1);

    // Blurred paper wings
    const beat = 0.55 + 0.45 * Math.abs(Math.sin(this.wingPhase));
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = themeColor('panel', '#f3efe2');
    ctx.strokeStyle = themeColor('outline', '#a99a80');
    ctx.lineWidth = 1;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(-1, side * 6 * beat, 13, 5 * beat, side * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Banded body. Deeper amber and heavier bands than the hoverfly's, so a
    // hazard is never mistaken for a target.
    ctx.fillStyle = '#d97a1e';
    ctx.strokeStyle = '#3d2a12';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#241c12';
    for (const bx of [-3, 2, 7]) {
      ctx.beginPath();
      ctx.ellipse(bx, 0, 2.6, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sting
    ctx.strokeStyle = '#241c12';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(18, 0);
    ctx.stroke();

    // Head and antennae
    ctx.fillStyle = '#241c12';
    ctx.beginPath();
    ctx.arc(-12, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#241c12';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-14, -2); ctx.lineTo(-20, -6);
    ctx.moveTo(-14, 1); ctx.lineTo(-20, 4);
    ctx.stroke();

    ctx.restore();
  }
}

/**
 * A patch of web strung across the atrium. It never moves and nothing lives in
 * it; a cord drawn into it sticks and breaks. Fixed-place hazards are things
 * rather than creatures (Xyh, 2026-09-16). It is terrain, not an inhabitant, so
 * it is never pocket content and never a drawing target.
 */
export class WebPatch {
  /** Placed by field ratio so it keeps its position in the scene when the canvas resizes. */
  constructor(xRatio, yRatio, radius = 30) {
    this.type = 'terrain';
    this.kind = 'web';
    this.xRatio = xRatio;
    this.yRatio = yRatio;
    this.x = 0;
    this.y = 0;
    this.radius = radius;
    this.state = 'static';
    this.cutsCord = true;
    this.crossesCord = true;
    this.spin = Math.random() * Math.PI;
  }

  update(dt, bounds) {
    if (!bounds) return;
    this.x = bounds.width * this.xRatio;
    // Kept clear of the HUD at the top and the frame at the bottom, so a short
    // canvas never hangs a web under the readouts.
    const top = 104 + this.radius;
    const bottom = bounds.height - 40 - this.radius;
    this.y = Math.min(Math.max(bounds.height * this.yRatio, top), Math.max(top, bottom));
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.spin);
    ctx.strokeStyle = themeColor('edge', '#cfd6c8');
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 1;

    const spokes = 8;
    for (let i = 0; i < spokes; i++) {
      const a = (i / spokes) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * this.radius, Math.sin(a) * this.radius);
      ctx.stroke();
    }
    for (let ring = 1; ring <= 3; ring++) {
      const r = (this.radius * ring) / 3;
      ctx.beginPath();
      for (let i = 0; i <= spokes; i++) {
        const a = (i / spokes) * Math.PI * 2;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.quadraticCurveTo(Math.cos(a - Math.PI / spokes) * r * 0.86, Math.sin(a - Math.PI / spokes) * r * 0.86, px, py);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
}

/**
 * A string bean hanging in the atrium planting. Drawing the cord over one picks
 * it, and the pod's length is added to the next cord you draw; it is not pocket
 * content and is never threaded.
 */
export class StringBean {
  constructor(x, y) {
    this.type = 'bean';
    this.kind = 'bean';
    this.x = x;
    this.y = y;
    this.radius = 15;
    this.state = 'roaming';
    this.swayPhase = Math.random() * Math.PI * 2;
    this.lean = (Math.random() - 0.5) * 0.5;
  }

  update(dt) {
    this.swayPhase += dt * 1.1;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.lean + Math.sin(this.swayPhase) * 0.07);

    // Stem and a pair of leaves at the top
    ctx.strokeStyle = themeColor('outline', '#6f8b52');
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -17);
    ctx.quadraticCurveTo(3, -13, 1, -10);
    ctx.stroke();

    ctx.fillStyle = '#8fae63';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 6, -16, 6, 3, side * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // The pod, a long curved bean
    ctx.fillStyle = '#9dc06a';
    ctx.strokeStyle = '#5f7d3f';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.quadraticCurveTo(9, 2, 3, 15);
    ctx.quadraticCurveTo(-3, 3, -4, -9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Seeds showing through the pod
    ctx.fillStyle = 'rgba(92, 120, 60, 0.55)';
    for (const [bx, by] of [[0, -4], [2, 2], [2, 8]]) {
      ctx.beginPath();
      ctx.ellipse(bx, by, 2, 2.6, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

/** The glow changes its halo, never its body visibility or target radius. */
export function drawFirefly(ctx, insect) {
  const phase = ((insect.stateTime || 0) + (insect.glowOffset || 0)) % 3;
  const glow = phase < 0.8 ? Math.sin(Math.PI * phase / 0.8) : 0;
  if (glow > 0) {
    const halo = ctx.createRadialGradient(0, 8, 3, 0, 8, 29);
    halo.addColorStop(0, `rgba(255,237,148,${0.55 * glow})`);
    halo.addColorStop(1, 'rgba(255,237,148,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(0, 8, 29, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = themeColor('outline', '#465e58'); ctx.lineWidth = 1.1;
  for (const side of [-1, 1]) {
    for (const y of [-5, 1, 7]) {
      ctx.beginPath(); ctx.moveTo(side * 5, y); ctx.lineTo(side * 12, y + 5); ctx.stroke();
    }
    ctx.fillStyle = '#adc1b3'; ctx.beginPath();
    ctx.ellipse(side * 7, -1, 5, 13, side * 0.25, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.fillStyle = themeColor('body', '#394955'); ctx.beginPath(); ctx.ellipse(0, 0, 6, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = themeColor('firefly', '#fff0ae'); ctx.beginPath(); ctx.ellipse(0, 9, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = themeColor('body', '#394955'); ctx.beginPath(); ctx.ellipse(0, 9, 5, 6, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-2, -12); ctx.lineTo(-6, -19); ctx.moveTo(2, -12); ctx.lineTo(6, -19); ctx.stroke();
}
