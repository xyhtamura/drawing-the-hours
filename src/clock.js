/**
 * Drawing the Hours — Dandelion Visit Clock
 * Represents the passage of quiet time in the meadow through a shedding dandelion head.
 */

export class DandelionClock {
  constructor(totalSeconds = 60, seedCount = 12) {
    this.totalSeconds = totalSeconds;
    this.remainingSeconds = totalSeconds;
    this.seedCount = seedCount;
    this.isPaused = false;
    this.isExpired = false;

    // Drifting shed seeds animation
    this.shedSeeds = [];
    this.lastShedIndex = -1;
  }

  reset(seconds = 60) {
    this.totalSeconds = seconds;
    this.remainingSeconds = seconds;
    this.isPaused = false;
    this.isExpired = false;
    this.shedSeeds = [];
    this.lastShedIndex = -1;
  }

  addTime(seconds) {
    this.remainingSeconds = Math.min(this.totalSeconds + 15, this.remainingSeconds + seconds);
  }

  update(dt) {
    if (this.isPaused || this.isExpired) return;

    this.remainingSeconds = Math.max(0, this.remainingSeconds - dt);

    // Calculate how many seeds should have detached
    const progress = 1.0 - (this.remainingSeconds / this.totalSeconds);
    const expectedShed = Math.floor(progress * this.seedCount);

    if (expectedShed > this.lastShedIndex && this.lastShedIndex < this.seedCount - 1) {
      for (let i = this.lastShedIndex + 1; i <= Math.min(expectedShed, this.seedCount - 1); i++) {
        this.spawnShedSeed(i);
      }
      this.lastShedIndex = expectedShed;
    }

    // Update floating shed seeds
    for (let i = this.shedSeeds.length - 1; i >= 0; i--) {
      const s = this.shedSeeds[i];
      s.x += s.vx * 60 * dt;
      s.y += s.vy * 60 * dt;
      s.alpha -= 0.6 * dt;
      if (s.alpha <= 0) {
        this.shedSeeds.splice(i, 1);
      }
    }

    if (this.remainingSeconds <= 0 && !this.isExpired) {
      this.isExpired = true;
    }
  }

  spawnShedSeed(index) {
    const angle = (index / this.seedCount) * Math.PI * 2;
    this.shedSeeds.push({
      x: Math.cos(angle) * 16,
      y: Math.sin(angle) * 16,
      vx: 1.2 + Math.random() * 0.8,
      vy: -0.4 + (Math.random() - 0.5) * 0.6,
      alpha: 1.0,
      angle,
    });
  }

  draw(ctx, x, y, radius = 26) {
    ctx.save();
    ctx.translate(x, y);

    // Stem
    ctx.strokeStyle = '#8fa382';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-4, radius * 1.2, -6, radius * 1.8);
    ctx.stroke();

    // Pale sage ground behind the head, so the white tufts have something to
    // sit on. Measured 1.09:1 against the cream page without it.
    ctx.fillStyle = 'rgba(126, 140, 110, 0.16)';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.05, 0, Math.PI * 2);
    ctx.fill();

    // Central receptacle (golden-brown cushion)
    ctx.fillStyle = '#b89467';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Remaining radial seeds
    const remainingCount = Math.max(0, this.seedCount - (this.lastShedIndex + 1));

    for (let i = this.lastShedIndex + 1; i < this.seedCount; i++) {
      const angle = (i / this.seedCount) * Math.PI * 2;
      const seedDist = radius * 0.85;
      const sx = Math.cos(angle) * seedDist;
      const sy = Math.sin(angle) * seedDist;

      // Seed filament
      ctx.strokeStyle = 'rgba(122, 116, 96, 0.85)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * (radius * 0.28), Math.sin(angle) * (radius * 0.28));
      ctx.lineTo(sx, sy);
      ctx.stroke();

      // Tuft tip
      ctx.fillStyle = '#fdfbf4';
      ctx.strokeStyle = 'rgba(122, 116, 96, 0.7)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.arc(sx, sy, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Shed floating seeds
    for (const s of this.shedSeeds) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, s.alpha);
      ctx.strokeStyle = 'rgba(130, 124, 104, 0.75)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - 8, s.y - 3);
      ctx.stroke();
      ctx.fillStyle = '#fefcf6';
      ctx.beginPath();
      ctx.arc(s.x - 8, s.y - 3, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }
}
