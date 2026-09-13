/**
 * Drawing the Hours — Inhabitants of the Meadow
 * Procedural paper entities: Folded Butterflies (Brimstone, Azure, Roseate),
 * Airborne Dandelion Seeds, and Snail Crawler.
 */

export const SPECIES_CONFIG = {
  brimstone: {
    name: 'Brimstone',
    bodyColor: '#5c5238',
    wingColor: '#fae37d',
    wingAltColor: '#f1d152',
    wingEdge: '#e5be38',
    markColor: '#d69e2e',
    speed: 1.1,
    size: 22,
    flutterFreq: 14,
  },
  azure: {
    name: 'Azure',
    bodyColor: '#30424f',
    wingColor: '#8ecae6',
    wingAltColor: '#70b2d6',
    wingEdge: '#529bc4',
    markColor: '#219ebc',
    speed: 1.4,
    size: 19,
    flutterFreq: 18,
  },
  roseate: {
    name: 'Roseate',
    bodyColor: '#4f303e',
    wingColor: '#f7b2bd',
    wingAltColor: '#ee9ca7',
    wingEdge: '#e2808e',
    markColor: '#d1536b',
    speed: 0.95,
    size: 20,
    flutterFreq: 12,
  },
};

export class Butterfly {
  constructor(x, y, kind = 'brimstone') {
    this.type = 'butterfly';
    this.kind = kind;
    this.config = SPECIES_CONFIG[kind];
    this.x = x;
    this.y = y;
    this.radius = this.config.size * 0.9;

    this.heading = Math.random() * Math.PI * 2;
    this.targetHeading = this.heading;
    this.speed = this.config.speed * (0.85 + Math.random() * 0.3);

    this.flapPhase = Math.random() * Math.PI * 2;
    this.flapSpeed = this.config.flutterFreq;
    this.glideTimer = 0;

    this.state = 'roaming'; // 'roaming' | 'harmonizing' | 'departing'
    this.stateTime = 0;
    this.alpha = 1.0;
    this.highlightGlow = 0;
    this.spinAngle = 0;
  }

  update(dt, bounds) {
    this.stateTime += dt;

    if (this.state === 'harmonizing') {
      // Wings synchronize, glow intensifies, brief hold
      this.flapPhase += 24 * dt;
      this.highlightGlow = Math.min(1.0, this.highlightGlow + dt * 3);
      if (this.stateTime > 0.8) {
        this.state = 'departing';
        this.stateTime = 0;
        // Launch toward nearest screen edge
        const cx = bounds.width / 2;
        const cy = bounds.height / 2;
        this.heading = Math.atan2(this.y - cy, this.x - cx) + (Math.random() - 0.5) * 0.5;
      }
      return;
    }

    if (this.state === 'departing') {
      // Depart smoothly toward edge
      this.flapPhase += 20 * dt;
      this.speed = 3.5;
      this.x += Math.cos(this.heading) * this.speed * 60 * dt;
      this.y += Math.sin(this.heading) * this.speed * 60 * dt;
      this.alpha = Math.max(0, 1.0 - this.stateTime / 1.0);
      return;
    }

    // Normal roaming flight dynamics
    this.flapPhase += this.flapSpeed * dt;

    // Glide intervals
    this.glideTimer -= dt;
    if (this.glideTimer <= 0) {
      if (Math.random() < 0.3) {
        this.glideTimer = 0.6 + Math.random() * 0.8; // glide without heavy flap
      } else {
        this.glideTimer = 1.2 + Math.random() * 1.5;
        this.targetHeading += (Math.random() - 0.5) * 1.6;
      }
    }

    // Soft boundary steering
    const pad = 60;
    if (this.x < pad) this.targetHeading = 0;
    else if (this.x > bounds.width - pad) this.targetHeading = Math.PI;
    if (this.y < pad) this.targetHeading = Math.PI / 2;
    else if (this.y > bounds.height - pad) this.targetHeading = -Math.PI / 2;

    // Smooth turn towards target heading
    let diff = this.targetHeading - this.heading;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.heading += diff * Math.min(1, 3.5 * dt);

    const currentSpeed = (this.glideTimer > 0.6) ? this.speed * 0.7 : this.speed;
    this.x += Math.cos(this.heading) * currentSpeed * 60 * dt;
    this.y += Math.sin(this.heading) * currentSpeed * 60 * dt;

    // Clamp inside bounds
    this.x = Math.max(10, Math.min(bounds.width - 10, this.x));
    this.y = Math.max(10, Math.min(bounds.height - 10, this.y));
  }

  draw(ctx) {
    if (this.alpha <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.heading + Math.PI / 2);

    // Flap factor: scale X to simulate 3D wing hinge at the center crease
    const flap = Math.cos(this.flapPhase);
    const wingSpread = 0.2 + 0.8 * Math.abs(flap);

    const size = this.config.size;

    // Paper drop shadow cast onto meadow floor
    ctx.save();
    ctx.translate(4, 7);
    ctx.scale(wingSpread, 1);
    ctx.fillStyle = 'rgba(40, 50, 30, 0.13)';
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.1, size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Harmonious glow if triggered
    if (this.highlightGlow > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 245, 180, ${0.4 * this.highlightGlow})`;
      ctx.beginPath();
      ctx.arc(0, 0, size * 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Left Wing (Folded paper polygon)
    ctx.save();
    ctx.scale(-wingSpread, 1);
    this.drawFoldedWing(ctx, size);
    ctx.restore();

    // Right Wing
    ctx.save();
    ctx.scale(wingSpread, 1);
    this.drawFoldedWing(ctx, size);
    ctx.restore();

    // Central Crease & Body
    ctx.fillStyle = this.config.bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.5, size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Delicate Antennae
    ctx.strokeStyle = this.config.bodyColor;
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-1, -size * 0.5);
    ctx.quadraticCurveTo(-6, -size * 0.9, -8, -size * 0.8);
    ctx.moveTo(1, -size * 0.5);
    ctx.quadraticCurveTo(6, -size * 0.9, 8, -size * 0.8);
    ctx.stroke();

    ctx.restore();
  }

  drawFoldedWing(ctx, size) {
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

    // Internal paper fold / printed mark
    ctx.fillStyle = this.config.markColor;
    ctx.beginPath();
    ctx.arc(size * 0.6, -size * 0.25, size * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }
}

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
