/**
 * Drawing the Hours — Procedural Web Audio Engine
 * Pure synthesized soundscapes: paper friction, cotton cord twangs,
 * pentatonic harmony chimes, and dandelion seed puffs.
 */

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.rustleNode = null;
    this.rustleGain = null;
    this.rustleFilter = null;
  }

  ensureContext() {
    // Audio must never block drawing: a browser that refuses an AudioContext
    // leaves this.ctx null and every sound method returns early.
    if (this.ctx === false) return;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (err) {
      this.ctx = false;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.rustleGain) {
      this.rustleGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // --- Paper & Cord Drawing Rustle ---
  startDrawingRustle() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    if (!this.rustleNode) {
      // Buffer of pink/white noise
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02; // soft pink noise
        lastOut = output[i];
      }

      this.rustleNode = this.ctx.createBufferSource();
      this.rustleNode.buffer = noiseBuffer;
      this.rustleNode.loop = true;

      this.rustleFilter = this.ctx.createBiquadFilter();
      this.rustleFilter.type = 'bandpass';
      this.rustleFilter.frequency.value = 850;
      this.rustleFilter.Q.value = 1.2;

      this.rustleGain = this.ctx.createGain();
      this.rustleGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

      this.rustleNode.connect(this.rustleFilter);
      this.rustleFilter.connect(this.rustleGain);
      this.rustleGain.connect(this.ctx.destination);
      this.rustleNode.start();
    }

    const t = this.ctx.currentTime;
    this.rustleGain.gain.cancelScheduledValues(t);
    this.rustleGain.gain.setValueAtTime(this.rustleGain.gain.value, t);
    this.rustleGain.gain.linearRampToValueAtTime(0.04, t + 0.08);
  }

  updateDrawingSpeed(speed) {
    if (this.isMuted || !this.ctx || !this.rustleGain) return;
    const t = this.ctx.currentTime;
    const targetGain = Math.min(0.08, 0.01 + speed * 0.0004);
    const targetFreq = Math.min(1800, 600 + speed * 8);

    this.rustleGain.gain.setTargetAtTime(targetGain, t, 0.05);
    this.rustleFilter.frequency.setTargetAtTime(targetFreq, t, 0.05);
  }

  stopDrawingRustle() {
    if (!this.ctx || !this.rustleGain) return;
    const t = this.ctx.currentTime;
    this.rustleGain.gain.cancelScheduledValues(t);
    this.rustleGain.gain.setValueAtTime(this.rustleGain.gain.value, t);
    this.rustleGain.gain.linearRampToValueAtTime(0.0001, t + 0.1);
  }

  // --- Plucked Cotton Cord Recoil ---
  playCordPluck(freq = 220) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq * 1.5, t);
    osc.frequency.exponentialRampToValueAtTime(freq, t + 0.04);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.4);
  }

  // --- Pentatonic Harmony Chimes ---
  playHarmonyChord(recipeType, bandName) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    // Pentatonic frequencies (G major / E minor)
    const basePitches = [392.00, 440.00, 523.25, 587.33, 659.25, 783.99]; // G4, A4, C5, D5, E5, G5
    let selectedChords = [basePitches[0], basePitches[2], basePitches[4]];

    if (recipeType === 'TRIO_OF_FLIGHT') {
      selectedChords = [basePitches[0], basePitches[2], basePitches[3], basePitches[5]];
    } else if (recipeType === 'CROSS_MEADOW_CORRESPONDENCE' || recipeType === 'SYMMETRIC_CORRESPONDENCE' || recipeType === 'NURSERY_POLARITY') {
      selectedChords = [basePitches[1], basePitches[3], basePitches[4], basePitches[5] * 1.25];
    } else if (recipeType === 'COUNTERPART_PAIR') {
      selectedChords = [basePitches[1], basePitches[2], basePitches[4], basePitches[5]];
    } else if (recipeType === 'SEED_AND_WING') {
      selectedChords = [basePitches[2], basePitches[4], basePitches[5]];
    }

    const t = this.ctx.currentTime;

    selectedChords.forEach((pitch, idx) => {
      const delay = idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, t + delay);

      gain.gain.setValueAtTime(0.0001, t + delay);
      gain.gain.linearRampToValueAtTime(0.14, t + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + delay);
      osc.stop(t + delay + 1.3);
    });
  }

  // --- Cord Fray / Fault Sound ---
  playFrayFault() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.linearRampToValueAtTime(80, t + 0.2);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  // --- Dandelion Seed Shed Puff ---
  playSeedPuff() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(160, t + 0.15);

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  // --- Atrium Wind Warning & Gust (Noon Visits V-VI) ---
  playWindWarning() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 1.8);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (last + 0.03 * white) / 1.03;
        last = output[i];
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(550, t);
      filter.frequency.linearRampToValueAtTime(850, t + 1.2);
      filter.Q.setValueAtTime(1.8, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.035, t + 0.6);
      gain.gain.linearRampToValueAtTime(0.0001, t + 1.75);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(t);
      noise.stop(t + 1.8);
    } catch (_) {}
  }

  playWindGust() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const dur = 2.0;
      const bufferSize = Math.floor(this.ctx.sampleRate * dur);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (last + 0.04 * white) / 1.04;
        last = output[i];
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, t);
      filter.frequency.linearRampToValueAtTime(1100, t + 0.7);
      filter.frequency.linearRampToValueAtTime(380, t + dur);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.065, t + 0.45);
      gain.gain.linearRampToValueAtTime(0.045, t + 1.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(t);
      noise.stop(t + dur + 0.05);
    } catch (_) {}
  }
}

export const audio = new AudioManager();
