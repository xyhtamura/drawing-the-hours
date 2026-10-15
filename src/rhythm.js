/** Adapted from unversioned dthdrums/src/drum-engine.js, 2026-10-16.
 * Source SHA-256: 4534ef5dfc26bb4da5e54a5ffa0968d7245caadf7e13a94f42ffa16066a69c39
 * The game's frame drives this
 * independent audio clock; no timer or output bypasses the music controls.
 * Pattern data stays in the stamped copy of dthdrums/src/patterns.js.
 */
import { PATTERNS } from './drum-patterns.js';

function seeded(seed) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export class RhythmClock {
  constructor(config, start, emit) {
    this.pattern = { ...PATTERNS[config.pattern], ...config };
    this.emit = emit;
    this.rand = seeded(config.seed ?? 173);
    this.step = 0;
    this.nextTime = start + (config.delay ?? 2);
    this.origin = this.nextTime;
    this.pending = [];
  }

  hit(kit, voice, time, velocity, pitch) {
    this.emit({ kit, voice, time, velocity: velocity * this.pattern.subtletyGain * (this.pattern.gain ?? 1),
      pitch, detune: (this.rand() * 2 - 1) * 18, pan: (this.rand() * 2 - 1) * .08 });
  }

  tick(now, multiplier = 1, pitch = 1, ahead = .25) {
    const pat = this.pattern, horizon = now + ahead;
    // A stalled frame must not dump missed beats into one audible pile.
    if (this.nextTime < now - .5) {
      this.nextTime = now + (pat.mode === 'aleatoric' ? pat.minInterval : .05);
      this.pending = [];
    }
    if (pat.mode === 'aleatoric') {
      while (this.nextTime < horizon) {
        const count = pat.burstCount[0] + Math.floor(this.rand() * (pat.burstCount[1] - pat.burstCount[0] + 1));
        const span = pat.burstSpan[0] + this.rand() * (pat.burstSpan[1] - pat.burstSpan[0]);
        for (let i = 0; i < count; i++) {
          const at = this.nextTime + (count === 1 ? 0 : i / (count - 1)) * span / multiplier;
          const voice = pat.voices[Math.floor(this.rand() * pat.voices.length)];
          const velocity = (.9 - i / count * .45) * (.8 + this.rand() * .4);
          this.pending.push({ voice, time: at, velocity });
        }
        this.nextTime += (span + pat.minInterval + this.rand() * (pat.maxInterval - pat.minInterval)) / multiplier;
      }
      while (this.pending.length && this.pending[0].time < horizon) {
        const event = this.pending.shift();
        if (event.time < now - .1) continue;
        this.hit(pat.kit, event.voice, Math.max(now, event.time), event.velocity, pitch);
      }
      return;
    }
    while (this.nextTime < horizon) {
      let bpm = pat.baseBpm * (pat.tempo ?? 1) * multiplier;
      if (pat.tempoDrift?.enabled) {
        bpm *= 1 + Math.sin(2 * Math.PI * (this.nextTime - this.origin) / pat.tempoDrift.cycleSeconds) * pat.tempoDrift.depth;
      }
      for (const [at, voice, velocity = .7, chance = 1] of pat.layers) {
        if (at !== this.step % pat.steps || this.rand() >= chance) continue;
        const jitter = (this.rand() * 2 - 1) * pat.humanizeMs / 1000;
        this.hit(pat.kit, voice, Math.max(now, this.nextTime + jitter), velocity * (.85 + this.rand() * .2), pitch);
      }
      this.step++;
      this.nextTime += (pat.meter.division === 16 ? 15 : 30) / bpm;
    }
  }
}
