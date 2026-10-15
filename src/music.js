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
  dampedString: { kind: 'string', decay: [0.35, 0.75], dead: 0.12, brightness: [0.25, 0.5], detune: 7 },
  // Kept from the first Dawn draft; no song uses it now.
  musicBox: { type: 'sine', partials: [[1, 1, 1.6], [2.01, 0.25, 0.7], [5.4, 0.08, 0.18]] },
  toyPiano: { type: 'sine', partials: [[1, 1, 0.9], [3.02, 0.18, 0.25], [6.8, 0.06, 0.08]] },
  bonang: { type: 'sine', partials: [[1, 1, 2.2], [2.42, 0.3, 0.9], [4.1, 0.08, 0.3]] },
  // Odd harmonics only, from the triangle wave: Bohlen-Pierce is built on odd ratios.
  reed: { type: 'triangle', partials: [[1, 1, 2.4], [3, 0.12, 0.8]] },
  pluck: { type: 'sine', partials: [[1, 1, 0.7], [2, 0.2, 0.2]] },
  gong: { type: 'sine', partials: [[1, 1, 5], [1.48, 0.35, 3.5], [2.13, 0.15, 1.5]] },
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
      this.note(VOICES[song.voice], degreeHz(tuning, song.root, degree) * pitch, time + rand() * 0.012, 0.5);
    }
    for (const [at, degree] of song.bass) {
      if (at === step) this.note(VOICES.pluck, degreeHz(tuning, song.root, degree) / 2 * pitch, time, 0.55);
    }
    for (const [at, degree] of song.gong || []) {
      if (at === step && pass % 2 === 0) this.note(VOICES.gong, degreeHz(tuning, song.root, degree) / 2 * pitch, time, 0.35);
    }
    for (const [at] of song.tick) {
      if (at === step) this.tick(time, 0.18 + rand() * 0.08);
    }
  }

  note(voice, hz, time, level) {
    if (voice.kind === 'string') { this.pluck(voice, hz, time, level); return; }
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
    const length = Math.ceil(STRING_RATE * (decay + 0.05));
    const buffer = ctx.createBuffer(1, length, STRING_RATE);
    const out = buffer.getChannelData(0);
    // The pluck: soft noise, low-passed, so the attack is a thumb rather than a pick.
    const line = new Float32Array(period);
    let smooth = 0;
    for (let i = 0; i < period; i++) { smooth += (rand() * 2 - 1 - smooth) * (0.35 + brightness * 0.5); line[i] = smooth; }
    // Loss per period so the note falls 60 dB in `decay` seconds.
    const loss = 0.001 ** (1 / (decay * hz));
    let index = 0, peak = 0;
    const lean = brightness * 0.5; // weight on the next sample: shortens the loop by this much
    for (let i = 0; i < length; i++) {
      const next = index + 1 === period ? 0 : index + 1;
      const value = line[index];
      out[i] = value;
      line[index] = loss * ((1 - lean) * value + lean * line[next]);
      index = next;
      if (value > peak) peak = value; else if (-value > peak) peak = -value;
    }
    const fade = Math.floor(STRING_RATE * 0.04);
    for (let i = 0; i < length; i++) {
      out[i] /= peak || 1;
      if (i > length - fade) out[i] *= (length - i) / fade;
    }
    buffer.rateFix = (period - lean) / exact;
    this.strings.set(key, buffer);
    return buffer;
  }

  tick(time, level) {
    const ctx = audio.ctx;
    const source = ctx.createBufferSource();
    const band = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = this.noise;
    band.type = 'bandpass'; band.frequency.value = 3200; band.Q.value = 4;
    gain.gain.value = level;
    source.connect(band); band.connect(gain); gain.connect(this.bus);
    source.start(time);
    source.onended = () => { try { gain.disconnect(); } catch {} };
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

export const music = new Music();

// The chimes ask for their pitches here; audio.js keeps its pentatonic when this returns null.
audio.chimeTuner = count => music.chimeTones(count);
