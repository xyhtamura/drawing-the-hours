/**
 * Tests for the hour songs and their tunings (src/music.js, src/songs.js, src/tunings.js).
 *
 * 1. Each hour's tuning matches the tabota/scala file it was copied from
 * 2. Every note of every song lands in a sensible range
 * 3. The song follows the visit: it starts with a visit, changes with the hour,
 *    and stops under a menu, with Sound off, or with Music off
 * 4. Load: notes per second and oscillators sounding at once, per song, on a fake audio clock
 * 5. A picked poppy slows the song
 * 6. Chimes take the hour's tuning: ascending, in the chime register, from the song's chord
 *
 * Usage:
 *   node test/test_music.js
 *   node test/test_music.js --report     print the load table
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';

globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

// A fake audio clock: nodes record when oscillators start and stop.
function fakeContext() {
  const param = value => ({
    value,
    setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {},
    setTargetAtTime() {}, cancelScheduledValues() {},
  });
  const ctx = {
    currentTime: 0, state: 'running', sampleRate: 48000, destination: {},
    oscillators: [],
    createGain: () => ({ gain: param(1), connect() {}, disconnect() {} }),
    createBiquadFilter: () => ({ type: '', frequency: param(0), Q: param(1), connect() {}, disconnect() {} }),
    createDelay: () => ({ delayTime: param(0), connect() {}, disconnect() {} }),
    createBuffer: (channels, length) => { const data = new Float32Array(length); return { length, getChannelData: () => data }; },
    createBufferSource: () => ({ buffer: null, playbackRate: param(1), connect() {}, start() {}, onended: null }),
    createOscillator() {
      const osc = {
        type: 'sine', frequency: param(0), connect() {}, disconnect() {},
        start(t = ctx.currentTime) { this.on = t; ctx.oscillators.push(this); },
        stop(t = ctx.currentTime) { this.off = t; },
      };
      return osc;
    },
  };
  return ctx;
}

const { audio } = await import('../src/audio.js');
const { music, PERCUSSION, VOICES } = await import('../src/music.js');
const { SONGS } = await import('../src/songs.js');
const { TUNINGS, degreeHz } = await import('../src/tunings.js');

const HOURS = ['dawn', 'noon', 'dusk', 'midnight'];

console.log('--- Running music tests ---');

// 1. Tunings against their Scala sources
{
  const sclDir = new URL('../../tabota/scala/', import.meta.url);
  if (!fs.existsSync(sclDir)) {
    console.log('  (tabota/scala/ not beside this folder; tuning sources not compared)');
  } else {
    const cents = line => {
      const value = line.trim().split(/\s+/)[0];
      if (value.includes('.')) return Number(value);
      const [n, d = 1] = value.split('/').map(Number);
      return 1200 * Math.log2(n / d);
    };
    for (const hour of HOURS) {
      const tuning = TUNINGS[hour];
      const lines = fs.readFileSync(new URL(tuning.scl, sclDir), 'utf8').split(/\r?\n/).filter(l => !l.startsWith('!'));
      const count = Number(lines[1].trim());
      const values = lines.slice(2, 2 + count).map(cents);
      assert.equal(tuning.cents.length, count, `${hour}: degree count matches ${tuning.scl}`);
      for (let i = 1; i < count; i++) assert.ok(Math.abs(tuning.cents[i] - values[i - 1]) < 0.01, `${hour} degree ${i}: ${tuning.cents[i]} against ${values[i - 1]}`);
      assert.ok(Math.abs(tuning.period - values[count - 1]) < 0.01, `${hour}: period matches`);
    }
    console.log('✔ Each hour\'s tuning matches its tabota/scala file.');
  }
}

// 2. Note ranges
{
  for (const hour of HOURS) {
    const song = SONGS[hour], tuning = TUNINGS[hour];
    for (const [, degree] of song.bell) {
      const hz = degreeHz(tuning, song.root, degree);
      assert.ok(hz > 250 && hz < 1500, `${hour} melody degree ${degree} is ${hz.toFixed(1)} Hz`);
    }
    for (const [, degree] of song.bass) {
      const hz = degreeHz(tuning, song.root, degree) / 2;
      assert.ok(hz > 50 && hz < 260, `${hour} bass degree ${degree} is ${hz.toFixed(1)} Hz`);
    }
    for (const layer of song.layers || []) {
      for (const [, degree] of layer.notes) {
        const hz = degreeHz(tuning, song.root, degree);
        const [low, high] = VOICES[layer.voice].kind === 'bow' ? [40, 260] : [250, 1500];
        assert.ok(hz > low && hz < high, `${hour} ${layer.voice} degree ${degree} is ${hz.toFixed(1)} Hz`);
      }
    }
    for (const [, kind] of song.perc) assert.ok(PERCUSSION[kind], `${hour}: percussion kind ${kind} exists`);
    const layerSteps = (song.layers || []).flatMap(layer => layer.notes);
    for (const [step] of [...song.bell, ...song.bass, ...song.perc, ...layerSteps]) assert.ok(step >= 0 && step < song.steps);
    assert.equal(song.chords.length * 8, song.steps, `${hour}: one chord per bar of eight`);
  }
  console.log('✔ Every note lands between 50 Hz and 1.5 kHz.');
}

// 3 and 4. Following the visit, and load
const game = { currentLevel: { hour: 'dawn' }, state: 'PLAYING', uiSuspended: false, slowTimer: 0 };
const ctx = fakeContext();
audio.ctx = ctx;
audio.isMuted = false;
const run = seconds => { for (let t = 0; t < seconds; t += 1 / 60) { ctx.currentTime += 1 / 60; music.update(game); } };

{
  run(1);
  assert.equal(music.hour, 'dawn', 'a Dawn visit starts the Dawn song');
  game.currentLevel = { hour: 'noon' }; run(0.5);
  assert.equal(music.hour, 'noon', 'the song changes with the hour');
  game.uiSuspended = true; run(0.5);
  assert.equal(music.hour, null, 'a menu or the title stops it');
  game.uiSuspended = false; run(0.5);
  assert.equal(music.hour, 'noon', 'and closing the menu starts it again');
  audio.isMuted = true; run(0.5);
  assert.equal(music.hour, null, 'Sound: Off stops it');
  audio.isMuted = false; music.setEnabled(false); run(0.5);
  assert.equal(music.hour, null, 'Music: Off stops it');
  music.setEnabled(true); run(0.5);
  assert.equal(music.hour, 'noon');
  console.log('✔ The song follows the visit and stops under a menu, Sound: Off, or Music: Off.');
}

{
  const rows = [];
  for (const hour of HOURS) {
    game.currentLevel = { hour };
    music.stop(); run(0.1);
    const startCount = music.voiceCount, from = ctx.currentTime;
    ctx.oscillators.length = 0;
    run(60);
    const notes = (music.voiceCount - startCount) / 60;
    let peak = 0;
    for (let t = from + 5; t < ctx.currentTime; t += 0.05) {
      const sounding = ctx.oscillators.filter(o => o.on <= t && (o.off === undefined || o.off > t)).length;
      peak = Math.max(peak, sounding);
    }
    rows.push([hour, notes, peak]);
    assert.ok(notes > 0.2 && notes < 4, `${hour}: ${notes.toFixed(2)} notes a second`);
    assert.ok(peak <= 24, `${hour}: at most ${peak} oscillators at once`);
  }
  if (process.argv.includes('--report')) {
    console.log('  hour      notes/s  peak oscillators');
    for (const [hour, notes, peak] of rows) console.log(`  ${hour.padEnd(9)} ${notes.toFixed(2).padStart(7)}  ${String(peak).padStart(5)}`);
  }
  console.log('✔ Each song stays under four notes a second and two dozen oscillators.');
}

// 5. Slowed
{
  game.currentLevel = { hour: 'dusk' };
  music.stop(); run(0.1);
  let before = music.voiceCount; run(30); const normal = music.voiceCount - before;
  game.slowTimer = 8;
  before = music.voiceCount; run(30); const slowed = music.voiceCount - before;
  game.slowTimer = 0;
  assert.ok(slowed < normal * 0.75, `a picked poppy slows the song (${slowed} notes against ${normal} in 30 s)`);
  console.log('✔ A picked poppy slows the song.');
}

// 6. Chimes
{
  for (const hour of HOURS) {
    game.currentLevel = { hour };
    music.stop(); run(0.5);
    const tones = music.chimeTones(7);
    assert.equal(tones.length, 7);
    for (let i = 1; i < tones.length; i++) assert.ok(tones[i] > tones[i - 1], `${hour}: chime pitches ascend`);
    assert.ok(tones[0] >= 380 && tones[0] < 1200, `${hour}: chimes start at ${tones[0].toFixed(1)} Hz`);
    const song = SONGS[hour], tuning = TUNINGS[hour];
    const inScale = hz => {
      const steps = 1200 * Math.log2(hz / song.root) % tuning.period;
      const wrapped = (steps + tuning.period) % tuning.period;
      return tuning.cents.some(c => Math.min(Math.abs(c - wrapped), tuning.period - Math.abs(c - wrapped)) < 0.5);
    };
    assert.ok(tones.every(inScale), `${hour}: every chime is a degree of the hour's tuning`);
  }
  music.stop();
  game.uiSuspended = true; run(0.5);
  assert.equal(music.chimeTones(7), null, 'with no song, the chimes keep their own pitches');
  console.log('✔ Chimes are drawn from the hour\'s tuning, ascending, from 380 Hz.');
}

console.log('--- All music tests passed! ---');
process.exit(0); // the stop() timers would otherwise hold the process open
