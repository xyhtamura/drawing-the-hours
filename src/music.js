/**
 * Drawing the Hours — the hour's song, and chimes tuned to it.
 *
 * Lullaby-weight on purpose. There are no samples, no reverb convolution, and
 * no audio worklet: each note is two or three oscillators that stop themselves
 * within a few seconds, or one short buffer for the damped string, scheduled a quarter second ahead from the game's own
 * frame (Game.update calls music.update). One shared delay gives the room.
 * At the densest song that is about three notes a second, roughly a dozen
 * oscillators sounding at once.
 *
 * Songs and their notes are data in src/songs.js; tunings are in
 * src/tunings.js. The music follows the visit's hour, plays only while a visit
 * is on screen (not on the title or under a menu), honours Sound: Off, and has
 * its own Music setting. A picked poppy slows it and drops it a semitone, the
 * way the field slows.
 */

import { audio } from './audio.js';
import { storage } from './storage.js';
import { TUNINGS, degreeHz } from './tunings.js';
import { SONGS } from './songs.js';

export const MUSIC_STORAGE_KEY = 'drawing-the-hours-music';
const LOOKAHEAD = 0.25;   // seconds of notes scheduled ahead of the audio clock
const BUS_GAIN = 0.16;    // the song sits under the chimes and the cord sounds
const SLOW_TEMPO = 0.55;  // a picked poppy: tempo multiplier
const SLOW_PITCH = 2 ** (-100 / 1200);
// The damped string is rendered at this rate: it has little above 5 kHz, and half
// the samples halve the time it takes to render.
const STRING_RATE = 22050;

// Each voice is a few sine or triangle partials with a fast attack and an
// exponential fall: [frequency ratio, level, decay in seconds].
export const VOICES = {
  // A plucked string with no body that does not ring well: Karplus-Strong, heavily
  // damped, rendered once per pitch and variant into a short buffer (see dampedString).
  // decay: seconds to fall 60 dB, as [shortest, longest]; dead: chance of a choked note;
  // brightness: 0 dull to 1 bright; detune: cents either way.
  // octave: a second string an octave down, at this level, ringing this multiple of
  // the decay. body: one wooden resonance mixed under it.
  dampedString: {
    kind: 'string', decay: [0.35, 0.75], dead: 0.12, brightness: [0.25, 0.5], detune: 7,
    octave: { level: 0.45, decay: 1.3 }, body: { hz: 210, q: 3, mix: 0.6 },
  },
  // The music box with its tines damped: shorter, and the high partials nearly gone.
  musicBoxDamped: { type: 'sine', partials: [[1, 1, 0.55], [2.01, 0.14, 0.25], [5.4, 0.025, 0.06]] },
  // Kept from the first Dawn draft; no song uses it now.
  musicBox: { type: 'sine', partials: [[1, 1, 1.6], [2.01, 0.25, 0.7], [5.4, 0.08, 0.18]] },
  toyPiano: { type: 'sine', partials: [[1, 1, 0.9], [3.02, 0.18, 0.25], [6.8, 0.06, 0.08]] },
  bonang: { type: 'sine', partials: [[1, 1, 2.2], [2.42, 0.3, 0.9], [4.1, 0.08, 0.3]] },
  // Dusk's bowed bass: a sawtooth under a low low-pass, a slow bow-in and a long
  // fade, with a slight vibrato that starts once the note has settled.
  bowedBass: { kind: 'bow', type: 'sawtooth', attack: 1.4, hold: 4.2, release: 2.2, cutoff: 380, vibrato: { hz: 4.6, cents: 7, delay: 1.2 } },
  // Midnight's pad: slow swell, long fade, detuned pairs of triangle waves (odd
  // harmonics only, which Bohlen-Pierce is built on), the third partial faint.
  // attack, hold, release in seconds; spread in cents either side; cutoff in Hz.
  pad: { kind: 'pad', type: 'triangle', partials: [[1, 1], [3, 0.08]], attack: 1.1, hold: 0.8, release: 2.6, spread: 6, cutoff: 1300 },
  // Single oscillators keep these narrower than the pad. The reed's square wave
  // has odd harmonics; the brass's saw adds even harmonics. Cutoff ratios follow
  // the note, opening with the swell, then closing through its release.
  midnightReed: { kind: 'wind', type: 'square', attack: 0.35, hold: 0.8, release: 1.8, level: 0.48, cutoff: [2.2, 5, 2.5], vibrato: { hz: 4.3, cents: 4, delay: 0.7 } },
  midnightBrass: { kind: 'wind', type: 'sawtooth', attack: 0.65, hold: 0.8, release: 2.2, level: 0.85, cutoff: [1.2, 4.2, 1.5], vibrato: { hz: 4.8, cents: 3, delay: 0.9 } },
  // The reed swelled in: the same odd partials, a slower attack, a little detune.
  reedSlow: { kind: 'pad', type: 'triangle', partials: [[1, 1], [3, 0.12]], attack: 0.6, hold: 0.3, release: 1.8, spread: 3, cutoff: 2600 },
  // Odd harmonics only, from the triangle wave. Midnight's first melody voice, now its reed layer.
  reed: { type: 'triangle', partials: [[1, 1, 2.4], [3, 0.12, 0.8]] },
  pluck: { type: 'sine', partials: [[1, 1, 0.7], [2, 0.2, 0.2]] },
  gong: { type: 'sine', partials: [[1, 1, 5], [1.48, 0.35, 3.5], [2.13, 0.15, 1.5]] },
};

// Quiet percussion, all short. Each is built from oscillators or the one shared
// noise burst, so a hit costs two or three nodes for a fraction of a second.
//   thump   a soft low drum: a sine falling from `from` to `to` Hz
//   knock   a small woodblock: a short sine with a click of filtered noise
//   shaker  noise through a high-pass, very short
//   tick    noise through a narrow band-pass
//   tom     a low drum far off: a falling sine and a thud of noise, darkened, then
//           heard again in `echoes` [seconds after, level], each one darker
export const PERCUSSION = {
  tom: { kind: 'tom', from: 118, to: 74, decay: 0.75, noise: 0.35, cutoff: 900, level: 0.45, echoes: [[0.41, 0.42], [0.88, 0.18], [1.42, 0.07]] },
  thump: { kind: 'drop', from: 95, to: 48, decay: 0.22, level: 0.9 },
  knock: { kind: 'knock', hz: 1150, decay: 0.05, noise: 0.25, level: 0.35 },
  shaker: { kind: 'noise', filter: 'highpass', hz: 6500, q: 0.7, rate: 1.3, level: 0.22 },
  tick: { kind: 'noise', filter: 'bandpass', hz: 3200, q: 4, rate: 1, level: 0.22 },
};

function seeded(seed) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
}

class Music {
  constructor() {
    let enabled = true;
    try { if (storage.getItem(MUSIC_STORAGE_KEY) === 'off') enabled = false; } catch {}
    this.enabled = enabled;
    this.hour = null;      // the hour whose song is scheduled
    this.bus = null;
    this.noise = null;
    this.drones = [];
    this.nextStep = 0;     // index of the next eighth note to schedule, counted from the song's start
    this.leadNote = 0;     // sounded lead notes; omissions do not advance the timbre cycle
    this.nextTime = 0;     // audio-clock time of that eighth note
    this.voiceCount = 0;   // notes started, for checks
  }

  setEnabled(on) {
    this.enabled = Boolean(on);
    try { storage.setItem(MUSIC_STORAGE_KEY, this.enabled ? 'on' : 'off'); } catch {}
    if (!this.enabled) this.stop();
    return this.enabled;
  }

  toggle() { return this.setEnabled(!this.enabled); }

  /** Called every frame by the game. Starts, follows, and stops the song. */
  update(game) {
    const ctx = audio.ctx;
    const hour = game.currentLevel?.hour;
    const showing = !game.uiSuspended && game.state !== 'PAUSED' && SONGS[hour];
    const wanted = this.enabled && !audio.isMuted && showing && ctx && !(typeof document !== 'undefined' && document.hidden);
    if (!wanted) { if (this.hour) this.stop(); return; }
    if (ctx.state !== 'running') return;
    if (hour !== this.hour) this.start(hour);

    const song = SONGS[this.hour];
    const slow = game.slowTimer > 0;
    const stepSeconds = 30 / song.bpm / (slow ? SLOW_TEMPO : 1);
    const pitch = slow ? SLOW_PITCH : 1;
    for (const drone of this.drones) drone.osc.frequency.setTargetAtTime(drone.hz * pitch, ctx.currentTime, 0.3);
    while (this.nextTime < ctx.currentTime + LOOKAHEAD) {
      this.playStep(song, this.nextStep, this.nextTime, pitch);
      this.nextStep += 1;
      this.nextTime += stepSeconds;
    }
  }

  start(hour) {
    this.stop();
    const ctx = audio.ctx;
    const song = SONGS[hour];
    this.hour = hour;
    this.bus = ctx.createGain();
    this.bus.gain.setValueAtTime(0, ctx.currentTime);
    this.bus.gain.linearRampToValueAtTime(BUS_GAIN * song.gain, ctx.currentTime + 1.5);
    // One feedback delay, low-passed, for a small room.
    const delay = ctx.createDelay(1);
    const feedback = ctx.createGain();
    const tone = ctx.createBiquadFilter();
    const send = ctx.createGain();
    delay.delayTime.value = 60 / song.bpm * 0.75;
    feedback.gain.value = 0.3;
    tone.type = 'lowpass'; tone.frequency.value = 2400;
    send.gain.value = 0.35;
    this.bus.connect(ctx.destination);
    this.bus.connect(send); send.connect(delay); delay.connect(tone); tone.connect(feedback);
    feedback.connect(delay); tone.connect(ctx.destination);
    this.room = [delay, feedback, tone, send];
    if (!this.noise) {
      const length = Math.floor(ctx.sampleRate * 0.04);
      this.noise = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      const rand = seeded(11);
      for (let i = 0; i < length; i++) data[i] = (rand() * 2 - 1) * (1 - i / length) ** 3;
    }
    const tuning = TUNINGS[hour];
    this.drones = (song.drone || []).map(degree => {
      const hz = degreeHz(tuning, song.root, degree) / 2;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = hz;
      gain.gain.value = 0.12;
      osc.connect(gain); gain.connect(this.bus);
      osc.start();
      return { osc, gain, hz };
    });
    // Render the string's buffers now, while the visit card is up, not on each pitch's first note.
    const voice = VOICES[song.voice];
    if (voice.kind === 'string') {
      for (const [, degree] of song.bell) {
        for (const pitch of [1, SLOW_PITCH]) {
          for (let variant = 0; variant < 3; variant++) this.stringBuffer(voice, degreeHz(tuning, song.root, degree) * pitch, variant);
        }
      }
    }
    this.nextStep = 0;
    this.leadNote = 0;
    this.nextTime = ctx.currentTime + 0.1;
  }

  stop() {
    const ctx = audio.ctx;
    if (this.bus && ctx) {
      const bus = this.bus, room = this.room, drones = this.drones;
      bus.gain.cancelScheduledValues(ctx.currentTime);
      bus.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
      // Let the tail fade, then free the nodes.
      setTimeout(() => {
        for (const { osc } of drones) { try { osc.stop(); } catch {} }
        try { bus.disconnect(); } catch {}
        for (const node of room) { try { node.disconnect(); } catch {} }
      }, 1500);
    }
    this.bus = null; this.room = []; this.drones = []; this.hour = null;
  }

  playStep(song, index, time, pitch) {
    const step = index % song.steps;
    const pass = Math.floor(index / song.steps);
    const tuning = TUNINGS[this.hour];
    const rand = seeded(index * 7919 + 13);
    for (const [at, degree] of song.bell) {
      if (at !== step) continue;
      if (pass > 0 && rand() < song.skip) continue;
      const voice = song.leadCycle?.[this.leadNote % song.leadCycle.length] ?? song.voice;
      this.note(VOICES[voice], degreeHz(tuning, song.root, degree) * pitch, time + rand() * 0.012, 0.5);
      this.leadNote += 1;
    }
    for (const [at, degree] of song.bass) {
      if (at === step) this.note(VOICES.pluck, degreeHz(tuning, song.root, degree) / 2 * pitch, time, 0.55);
    }
    for (const [at, degree] of song.gong || []) {
      if (at === step && pass % 2 === 0) this.note(VOICES.gong, degreeHz(tuning, song.root, degree) / 2 * pitch, time, 0.35);
    }
    for (const layer of song.layers || []) {
      // A layer with `passChance` is in or out for a whole pass, and out on the first.
      if (layer.passChance !== undefined && (pass === 0 || seeded(pass * 104729 + 3)() >= layer.passChance)) continue;
      for (const [at, degree] of layer.notes) {
        if (at !== step || (pass > 0 && rand() < layer.skip)) continue;
        // A layer may name several voices; each note picks one.
        const name = Array.isArray(layer.voice) ? layer.voice[Math.floor(rand() * layer.voice.length)] : layer.voice;
        this.note(VOICES[name], degreeHz(tuning, song.root, degree) * pitch, time + 0.01 + rand() * 0.015, layer.level);
      }
    }
    for (const [at, kind, chance = 1] of song.perc || []) {
      if (at === step && rand() < chance) this.hit(PERCUSSION[kind], time + rand() * 0.008, pitch, (song.percLevel ?? 1) * (0.8 + rand() * 0.3));
    }
  }

  note(voice, hz, time, level) {
    if (voice.kind === 'string') { this.pluck(voice, hz, time, level); return; }
    if (voice.kind === 'pad') { this.pad(voice, hz, time, level); return; }
    if (voice.kind === 'bow') { this.bow(voice, hz, time, level); return; }
    if (voice.kind === 'wind') { this.wind(voice, hz, time, level); return; }
    const ctx = audio.ctx;
    const out = ctx.createGain();
    out.gain.value = level;
    out.connect(this.bus);
    let end = time;
    for (const [ratio, amp, decay] of voice.partials) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = voice.type;
      osc.frequency.value = hz * ratio;
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(amp, time + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + decay);
      osc.connect(gain); gain.connect(out);
      osc.start(time);
      osc.stop(time + decay + 0.05);
      end = Math.max(end, time + decay + 0.05);
      osc.onended = () => { try { gain.disconnect(); } catch {} };
    }
    setTimeout(() => { try { out.disconnect(); } catch {} }, (end - ctx.currentTime) * 1000 + 200);
    this.voiceCount += 1;
  }

  /**
   * The damped string. Each note picks one of three variants (decay, brightness,
   * a choked note now and then) and a few cents of detune, so no two plucks of
   * a pitch sound alike. Buffers are rendered on first use and kept: Dawn's song
   * needs about a dozen pitches, each a fraction of a second long.
   */
  pluck(voice, hz, time, level) {
    const ctx = audio.ctx;
    const rand = seeded(Math.round(time * 1000) + 7);
    const variant = Math.floor(rand() * 3);
    const buffer = this.stringBuffer(voice, hz, variant);
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    // The buffer holds a whole number of samples per period; the rate makes up the rest, plus the detune.
    source.playbackRate.value = buffer.rateFix * 2 ** ((rand() * 2 - 1) * voice.detune / 1200);
    gain.gain.value = level * (0.75 + rand() * 0.35);
    source.connect(gain); gain.connect(this.bus);
    source.start(time);
    source.onended = () => { try { gain.disconnect(); } catch {} };
    this.voiceCount += 1;
  }

  stringBuffer(voice, hz, variant) {
    const ctx = audio.ctx;
    this.strings ??= new Map();
    const key = `${Math.round(hz * 10)}:${variant}`;
    if (this.strings.has(key)) return this.strings.get(key);
    const rand = seeded(Math.round(hz * 100) * 31 + variant);
    const dead = variant === 2 && rand() < voice.dead * 3;
    const [shortest, longest] = voice.decay;
    const decay = dead ? 0.12 : shortest + (longest - shortest) * (variant / 2);
    const [dull, bright] = voice.brightness;
    const brightness = dull + (bright - dull) * rand();
    const exact = STRING_RATE / hz;
    const period = Math.max(2, Math.round(exact));
    const lean = brightness * 0.5; // weight on the next sample: shortens the loop by this much
    const length = Math.ceil(STRING_RATE * (Math.max(decay, decay * (voice.octave?.decay ?? 0)) + 0.05));
    const buffer = ctx.createBuffer(1, length, STRING_RATE);
    const out = buffer.getChannelData(0);
    karplusStrong(out, period, lean, decay, hz, brightness, 1, rand);
    // A string an octave down, plucked with the same thumb: twice the loop and twice
    // the lean, so it stays exactly an octave under after the rate correction.
    if (voice.octave) karplusStrong(out, period * 2, Math.min(1, lean * 2), decay * voice.octave.decay, hz / 2, brightness * 0.6, voice.octave.level, rand);
    // A hint of a wooden box: one resonance, mixed under the string.
    if (voice.body) resonate(out, STRING_RATE, voice.body.hz * (0.94 + rand() * 0.12), voice.body.q, voice.body.mix);
    let peak = 0;
    for (let k = 0; k < length; k++) { const v = out[k] < 0 ? -out[k] : out[k]; if (v > peak) peak = v; }
    const fade = Math.floor(STRING_RATE * 0.04);
    for (let k = 0; k < length; k++) {
      out[k] /= peak || 1;
      if (k > length - fade) out[k] *= (length - k) / fade;
    }
    buffer.rateFix = (period - lean) / exact;
    this.strings.set(key, buffer);
    return buffer;
  }

  /**
   * A slow pad note: detuned pairs of oscillators that swell in over `attack`,
   * hold, and fade over `release`, under one low-pass filter.
   */
  pad(voice, hz, time, level) {
    const ctx = audio.ctx;
    const env = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = voice.cutoff;
    filter.Q.value = 0.4;
    const top = time + voice.attack, fall = top + voice.hold, end = fall + voice.release;
    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(level, top);
    env.gain.setValueAtTime(level, fall);
    env.gain.exponentialRampToValueAtTime(0.0001, end);
    env.connect(filter); filter.connect(this.bus);
    for (const [ratio, amp] of voice.partials) {
      for (const side of [-1, 1]) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = voice.type;
        osc.frequency.value = hz * ratio * 2 ** (side * voice.spread / 1200);
        gain.gain.value = amp / 2;
        osc.connect(gain); gain.connect(env);
        osc.start(time);
        osc.stop(end + 0.05);
        osc.onended = () => { try { gain.disconnect(); } catch {} };
      }
    }
    setTimeout(() => { try { env.disconnect(); filter.disconnect(); } catch {} }, (end - ctx.currentTime) * 1000 + 300);
    this.voiceCount += 1;
  }

  /** A narrow reed or soft brass swell with a moving filter and delayed vibrato. */
  wind(voice, hz, time, level) {
    const ctx = audio.ctx;
    const osc = ctx.createOscillator(), lfo = ctx.createOscillator();
    const depth = ctx.createGain(), filter = ctx.createBiquadFilter(), env = ctx.createGain();
    const top = time + voice.attack, fall = top + voice.hold, end = fall + voice.release;
    const peak = level * voice.level;
    osc.type = voice.type;
    osc.frequency.value = hz;
    lfo.frequency.value = voice.vibrato.hz;
    depth.gain.setValueAtTime(0, time);
    depth.gain.setValueAtTime(0, time + voice.vibrato.delay);
    depth.gain.linearRampToValueAtTime(hz * (2 ** (voice.vibrato.cents / 1200) - 1), time + voice.vibrato.delay + 0.6);
    filter.type = 'lowpass'; filter.Q.value = 0.45;
    const cutoff = ratio => Math.min(ctx.sampleRate * 0.45, hz * ratio);
    filter.frequency.setValueAtTime(cutoff(voice.cutoff[0]), time);
    filter.frequency.exponentialRampToValueAtTime(cutoff(voice.cutoff[1]), top);
    filter.frequency.exponentialRampToValueAtTime(cutoff(voice.cutoff[2]), end);
    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(peak, top);
    env.gain.setValueAtTime(peak, fall);
    env.gain.exponentialRampToValueAtTime(0.0001, end);
    lfo.connect(depth); depth.connect(osc.frequency);
    osc.connect(filter); filter.connect(env); env.connect(this.bus);
    for (const node of [osc, lfo]) { node.start(time); node.stop(end + 0.05); }
    osc.onended = () => {
      for (const node of [osc, lfo, depth, filter, env]) { try { node.disconnect(); } catch {} }
    };
    this.voiceCount += 1;
  }

  /** A bowed note: one sawtooth, a delayed vibrato, a low-pass, a slow envelope. */
  bow(voice, hz, time, level) {
    const ctx = audio.ctx;
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const env = ctx.createGain();
    const top = time + voice.attack, fall = top + voice.hold, end = fall + voice.release;
    osc.type = voice.type;
    osc.frequency.value = hz;
    lfo.frequency.value = voice.vibrato.hz;
    depth.gain.setValueAtTime(0, time);
    depth.gain.linearRampToValueAtTime(hz * (2 ** (voice.vibrato.cents / 1200) - 1), time + voice.vibrato.delay + 0.8);
    filter.type = 'lowpass';
    filter.frequency.value = voice.cutoff;
    filter.Q.value = 0.6;
    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(level, top);
    env.gain.setValueAtTime(level, fall);
    env.gain.exponentialRampToValueAtTime(0.0001, end);
    lfo.connect(depth); depth.connect(osc.frequency);
    osc.connect(filter); filter.connect(env); env.connect(this.bus);
    for (const node of [osc, lfo]) { node.start(time); node.stop(end + 0.05); }
    setTimeout(() => { try { env.disconnect(); filter.disconnect(); depth.disconnect(); } catch {} }, (end - ctx.currentTime) * 1000 + 300);
    this.voiceCount += 1;
  }

  /**
   * The distant tom: one strike and its echoes, each scheduled as its own short
   * sound through a darker low-pass, so the echo costs nothing between hits and
   * needs no delay line.
   */
  tom(drum, time, pitch, velocity) {
    const ctx = audio.ctx;
    for (const [after, share] of [[0, 1], ...drum.echoes]) {
      const at = time + after;
      const darker = drum.cutoff * (1 - after * 0.4);
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      filter.type = 'lowpass';
      filter.frequency.value = Math.max(220, darker);
      gain.gain.value = drum.level * velocity * share;
      filter.connect(gain); gain.connect(this.bus);
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(drum.from * pitch, at);
      osc.frequency.exponentialRampToValueAtTime(drum.to * pitch, at + drum.decay * 0.5);
      env.gain.setValueAtTime(0.0001, at);
      env.gain.linearRampToValueAtTime(1, at + 0.012);
      env.gain.exponentialRampToValueAtTime(0.0001, at + drum.decay);
      osc.connect(env); env.connect(filter);
      osc.start(at); osc.stop(at + drum.decay + 0.03);
      const source = ctx.createBufferSource();
      const thud = ctx.createGain();
      source.buffer = this.noise;
      source.playbackRate.value = 0.5;
      thud.gain.value = drum.noise;
      source.connect(thud); thud.connect(filter);
      source.start(at);
      setTimeout(() => { try { gain.disconnect(); filter.disconnect(); } catch {} }, (at + drum.decay - ctx.currentTime) * 1000 + 300);
    }
  }

  /** One percussion hit from PERCUSSION, at `time`, scaled by `velocity`. */
  hit(drum, time, pitch, velocity) {
    if (drum.kind === 'tom') { this.tom(drum, time, pitch, velocity); return; }
    const ctx = audio.ctx;
    const gain = ctx.createGain();
    gain.connect(this.bus);
    const level = drum.level * velocity;
    let end = time + 0.1;
    if (drum.kind === 'noise' || drum.kind === 'knock') {
      const source = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      source.buffer = this.noise;
      source.playbackRate.value = drum.rate ?? 1;
      filter.type = drum.filter ?? 'bandpass';
      filter.frequency.value = drum.kind === 'knock' ? drum.hz * 2 : drum.hz;
      filter.Q.value = drum.q ?? 2;
      const noiseGain = ctx.createGain();
      noiseGain.gain.value = drum.kind === 'knock' ? level * drum.noise : level;
      source.connect(filter); filter.connect(noiseGain); noiseGain.connect(gain);
      source.start(time);
    }
    if (drum.kind === 'knock' || drum.kind === 'drop') {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine';
      if (drum.kind === 'drop') {
        osc.frequency.setValueAtTime(drum.from * pitch, time);
        osc.frequency.exponentialRampToValueAtTime(drum.to * pitch, time + drum.decay * 0.6);
      } else {
        osc.frequency.value = drum.hz * pitch;
      }
      env.gain.setValueAtTime(0.0001, time);
      env.gain.linearRampToValueAtTime(level, time + 0.004);
      env.gain.exponentialRampToValueAtTime(0.0001, time + drum.decay);
      osc.connect(env); env.connect(gain);
      osc.start(time);
      osc.stop(time + drum.decay + 0.03);
      end = time + drum.decay + 0.03;
    }
    setTimeout(() => { try { gain.disconnect(); } catch {} }, (end - ctx.currentTime) * 1000 + 250);
  }

  /**
   * Chime pitches in the current hour's tuning: the bar's chord first, then the
   * rest of the scale, all at or above ~380 Hz. Before any song has started
   * (no visit on screen) this returns null and the chimes keep their pentatonic.
   */
  chimeTones(count) {
    const song = SONGS[this.hour];
    if (!song) return null;
    const tuning = TUNINGS[this.hour];
    const bar = Math.floor((this.nextStep % song.steps) / 8) % song.chords.length;
    const chord = song.chords[bar];
    const floor = 380;
    const lift = degree => { let hz = degreeHz(tuning, song.root, degree); while (hz < floor) hz *= tuning.period === 1200 ? 2 : 3; return hz; };
    const tones = [...new Set(chord.map(lift).map(hz => Math.round(hz * 100) / 100))].sort((a, b) => a - b);
    // Extend upward through the chord a period at a time.
    const up = 2 ** (tuning.period / 1200);
    for (let i = 0; tones.length < count; i++) tones.push(tones[i] * up);
    return tones.slice(0, count);
  }
}

/**
 * Adds a damped Karplus-Strong string into `out`: a soft, low-passed noise pluck
 * going round a loop `period` samples long, losing enough each pass to fall 60 dB
 * in `decay` seconds.
 */
function karplusStrong(out, period, lean, decay, hz, brightness, level, rand) {
  const line = new Float32Array(period);
  let smooth = 0;
  for (let i = 0; i < period; i++) { smooth += (rand() * 2 - 1 - smooth) * (0.35 + brightness * 0.5); line[i] = smooth; }
  const loss = 0.001 ** (1 / (decay * hz));
  let index = 0;
  for (let i = 0; i < out.length; i++) {
    const next = index + 1 === period ? 0 : index + 1;
    const value = line[index];
    out[i] += value * level;
    line[index] = loss * ((1 - lean) * value + lean * line[next]);
    index = next;
  }
}

/** Mixes one band-pass resonance of the signal back into it, in place. */
function resonate(out, rate, hz, q, mix) {
  const w = 2 * Math.PI * hz / rate, alpha = Math.sin(w) / (2 * q), a0 = 1 + alpha;
  const b0 = alpha / a0, b2 = -alpha / a0, a1 = -2 * Math.cos(w) / a0, a2 = (1 - alpha) / a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < out.length; i++) {
    const x = out[i];
    const y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    out[i] = x + mix * y;
  }
}

export const music = new Music();

// The chimes ask for their pitches here; audio.js keeps its pentatonic when this returns null.
audio.chimeTuner = count => music.chimeTones(count);
