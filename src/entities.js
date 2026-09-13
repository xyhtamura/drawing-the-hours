/**
 * Drawing the Hours — Inhabitants of the Meadow
 * Procedural paper entities with distinct morphology and flight physics:
 * 1. Brimstone Butterfly (wandering flutter-and-glide)
 * 2. Azure Damselfly (slender gauzy wings, dart-and-hover dynamics)
 * 3. Roseate Hawkmoth (plump body, vibrating delta wings, wide arcing sweeps)
 * 4. Dandelion Seeds (passive wind drift)
 * 5. Snail (ground verge crawler hazard)
 */

export const SPECIES_CONFIG = {
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

    this.flapPhase = Math.random() * Math.PI * 2;
    this.state = 'roaming'; // 'roaming' | 'harmonizing' | 'departing'
    this.stateTime = 0;
    this.alpha = 1.0;
    this.highlightGlow = 0;

    // Species-specific behavioral state
    this.behaviorTimer = 0.5 + Math.random() * 1.5;
    this.isHovering = false; // specific to damselfly
    this.arcSign = Math.random() < 0.5 ? 1 : -1; // specific to hawkmoth
  }

  update(dt, bounds) {
    this.stateTime += dt;

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
    if (this.kind === 'damselfly') {
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

    this.x += Math.cos(this.heading) * this.speed * 60 * dt;
    this.y += Math.sin(this.heading) * this.speed * 60 * dt;
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

    this.x += (Math.cos(this.heading) * this.speed + jitterX) * 60 * dt;
    this.y += (Math.sin(this.heading) * this.speed + jitterY) * 60 * dt;
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

    this.speed = this.config.speed * (0.95 + Math.sin(this.stateTime * 3) * 0.15);
    this.x += Math.cos(this.heading) * this.speed * 60 * dt;
    this.y += Math.sin(this.heading) * this.speed * 60 * dt;
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

    if (this.kind === 'damselfly') {
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
    ctx.fillStyle = this.config.bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.5, size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Antennae
    ctx.strokeStyle = this.config.bodyColor;
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
    ctx.fillStyle = this.config.wingColor;
    ctx.strokeStyle = this.config.wingEdge;
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
    ctx.fillStyle = this.config.bodyColor;
    ctx.strokeStyle = this.config.bodyAccent;
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
    ctx.fillStyle = this.config.bodyColor;
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
    ctx.fillStyle = isForewing ? this.config.wingColor : this.config.wingAltColor;
    ctx.strokeStyle = this.config.wingEdge;
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
    ctx.fillStyle = this.config.bodyColor;
    ctx.strokeStyle = this.config.bodyAccent;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 4.2, size * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Abdominal rose chevrons
    ctx.fillStyle = this.config.wingColor;
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
    ctx.fillStyle = this.config.wingColor;
    ctx.strokeStyle = this.config.wingEdge;
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

    this.vx = 0.5 + Math.random() * 0.4;
    this.vy = 0.15 + Math.random() * 0.2;
    this.phase = Math.random() * Math.PI * 2;
    this.tilt = (Math.random() - 0.5) * 0.3;

    this.state = 'roaming';
    this.stateTime = 0;
    this.alpha = 0.92;
  }

  update(dt, bounds) {
    this.stateTime += dt;

    if (this.state === 'harmonizing') {
      this.alpha = Math.max(0, 1.0 - this.stateTime / 0.8);
      return;
    }

    this.phase += dt * 2.0;
    const waveY = Math.sin(this.phase) * 0.4;

    this.x += this.vx * 60 * dt;
    this.y += (this.vy + waveY) * 60 * dt;

    // Wrap around gracefully
    if (this.x > bounds.width + 30) {
      this.x = -20;
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

    ctx.strokeStyle = '#948c78';
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
    ctx.strokeStyle = '#8a7f69';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(0, 8);
    ctx.stroke();

    // Dark seed achene
    ctx.fillStyle = '#655743';
    ctx.beginPath();
    ctx.ellipse(0, 10, 1.8, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export class Snail {
  constructor(x, y) {
    this.type = 'hazard';
    this.kind = 'snail';
    this.x = x;
    this.y = y;
    this.radius = 16;
    this.vx = 0.12;
    this.state = 'roaming';
    this.bobPhase = 0;
  }

  update(dt, bounds) {
    this.bobPhase += dt * 1.5;
    this.x += this.vx * 60 * dt;
    this.y = bounds.height - 35;

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
