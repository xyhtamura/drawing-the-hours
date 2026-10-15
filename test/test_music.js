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
globalThis.location = { search: process.argv.includes('--somewarez') ? '?somewarez' : '' };

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
const { STAGE_SONGS, songForLevel } = await import('../src/song-variations.js');
const { CAMPAIGN_LEVELS } = await import('../src/campaign.js');
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
        const voices = [layer.voice].flat();
        for (const name of voices) assert.ok(VOICES[name], `${hour}: voice ${name} exists`);
        const [low, high] = voices.every(name => VOICES[name].kind === 'bow') ? [40, 260] : [250, 1500];
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

// 7. Sounded lead notes alternate timbres across loops, including after omissions.
{
  const song = SONGS.midnight;
  const originalNote = music.note, originalHit = music.hit;
  const capture = score => {
    const notes = [], hits = [];
    music.note = (voice, hz, time, level) => notes.push({ voice, hz, time, level });
    music.hit = (...args) => hits.push(args);
    music.hour = 'midnight';
    music.leadNote = 0;
    for (let index = 0; index < song.steps * 8; index++) music.playStep(score, index, index * 30 / song.bpm, 1);
    return { notes, hits };
  };
  try {
    const cycled = capture(song);
    const baseline = capture({ ...song, leadCycle: undefined });
    assert.deepEqual(cycled.notes.map(n => [n.hz, n.time]), baseline.notes.map(n => [n.hz, n.time]));
    assert.deepEqual(cycled.hits, baseline.hits, 'the sparse percussion is unchanged');
    const melody = cycled.notes.filter(n => n.level === 0.5);
    assert.ok(melody.length > song.bell.length, 'the check crosses loop boundaries');
    assert.ok(melody.length < song.bell.length * 8, 'the check includes omitted notes');
    melody.forEach((note, i) => assert.equal(note.voice, VOICES[song.leadCycle[i % 3]], `sounded lead note ${i}: pad/reed/brass`));
    const firstLoop = cycled.notes.filter(n => n.time < song.steps * 30 / song.bpm);
    assert.equal(firstLoop.filter(n => n.level === 0.5).length, 4, 'four lead notes instead of eight');
    assert.equal(firstLoop.filter(n => n.level === song.layers[0].level).length, 2, 'two quieter, swelled answering notes instead of five');
    assert.equal(firstLoop.length, 8, 'eight pitched attacks including bass, previously fifteen');
  } finally {
    music.note = originalNote; music.hit = originalHit; music.hour = null;
  }
  game.currentLevel = { hour: 'midnight' }; game.uiSuspended = false;
  music.start('midnight');
  assert.equal(music.nextStep, 0);
  assert.equal(music.leadNote, 0, 'a new visit or resumed song starts with a pad note');
  music.stop();
  const { KIOSK } = await import('../src/build.js');
  assert.equal(KIOSK, process.argv.includes('--somewarez'));
  console.log(`✔ Midnight alternates pad/reed/brass on sounded lead notes with fewer attacks (${KIOSK ? 'SOMEWAREZ' : 'main'} build).`);
}

// 8. Title music follows the same master controls; attract scenes stay silent.
{
  const originalNote = music.note, originalHit = music.hit;
  try {
    const notes = [], song = SONGS.title;
    music.note = (voice, hz, time, level) => notes.push({voice, hz, time, level});
    music.hit = () => {};
    music.hour = 'title'; music.leadNote = 0;
    for (let index = 0; index < song.steps * 8; index++) music.playStep(song, index, index * 30 / song.bpm, 1);
    const lead = notes.filter(n => n.voice === VOICES.xylophone);
    const answers = notes.filter(n => ![VOICES.xylophone, VOICES.pluck].includes(n.voice));
    assert.equal(song.steps, 16 * 8, 'title has sixteen bars for call, answer, bridge and return');
    assert.equal(song.chords.length, song.steps / 8, 'harmony covers the whole form');
    assert.equal(lead.length, song.bell.length * 8, 'the theme is never randomly thinned');
    for (let pass = 1; pass < 8; pass++) {
      assert.deepEqual(lead.slice(pass * song.bell.length, (pass + 1) * song.bell.length).map(n => n.hz),
        lead.slice(0, song.bell.length).map(n => n.hz), 'the complete melody recurs intact');
    }
    const phrase = (start, end) => song.bell.filter(([step]) => step >= start && step < end).map(([step, degree]) => [step - start, degree]);
    assert.deepEqual(phrase(0, 16), phrase(32, 48), 'the answer recalls the hook');
    assert.deepEqual(phrase(0, 16), phrase(96, 112), 'the closing section returns to the hook');
    assert.notDeepEqual(phrase(0, 32), phrase(64, 96), 'the bridge is a contrasting phrase');
    assert.ok(Math.min(...phrase(64, 96).map(n => n[1])) < Math.min(...phrase(0, 32).map(n => n[1])), 'the bridge opens the lower register');
    assert.equal(song.bell.at(-1)[1] % TUNINGS.title.cents.length, 0, 'the melody resolves to the root');
    assert.ok(song.steps - song.bell.at(-1)[0] >= 8, 'the cadence leaves a breath before restarting');
    assert.ok(new Set(song.bass.map(n => n[1])).size >= 4, 'bass supports harmonic movement');
    for (const [step, degree] of [...song.bell, ...song.bass, ...song.layers.flatMap(l => l.notes)]) {
      assert.ok(Number.isInteger(step) && step >= 0 && step < song.steps);
      assert.ok(Number.isFinite(degreeHz(TUNINGS.title, song.root, degree)));
    }
    assert.ok(lead.every(n => n.hz > 500 && n.hz < 1500), 'the wooden lead avoids an extreme register');
    assert.equal(answers.length, 10 * 8, 'ten quiet hour accents per full theme');
    assert.ok(answers.every(n => n.level <= .08 && ['dampedString', 'toyPiano', 'bonang', 'midnightBrass'].some(name => VOICES[name] === n.voice)));
    for (const n of answers) assert.ok(!lead.some(l => Math.abs(l.time-n.time)<.1), 'answers fit between lead attacks');
  } finally { music.note = originalNote; music.hit = originalHit; music.hour = null; }
  game.musicTitle = true; game.uiSuspended = true;
  run(1); assert.equal(music.hour, 'title');
  const count = music.voiceCount; run(12);
  assert.ok(music.voiceCount - count >= 8, 'the theme begins promptly after the title gesture');
  assert.equal(TUNINGS.title, TUNINGS.dawn, 'the title colors share a tuning');
  game.musicIdle = true; run(0.1); assert.equal(music.hour, null, 'attract title is silent');
  game.musicIdle = false; run(0.1); assert.equal(music.hour, 'title');
  music.setEnabled(false); run(0.1); assert.equal(music.hour, null);
  music.setEnabled(true); audio.isMuted = true; run(0.1); assert.equal(music.hour, null);
  audio.isMuted = false; game.musicTitle = false; game.uiSuspended = false;
  game.currentLevel = { hour: 'midnight' }; run(0.1);
  assert.equal(music.hour, 'midnight', 'Begin replaces title music with the visit');
  music.stop();
  console.log('✔ The xylophone title and quiet hour flourishes obey Music, Sound, Begin, and silent attract mode.');
}


// 9. Every authored visit selects its own stable score, including practice copies.
{
  for (const hour of HOURS) {
    const scores = STAGE_SONGS[hour], original = SONGS[hour];
    assert.equal(scores.length, 6);
    assert.equal(scores[0], original, `${hour}: visit I retains the original`);
    assert.equal(new Set(scores.map(score => JSON.stringify(score.bell))).size, 6, `${hour}: six different lead phrases`);
    for (const score of scores) {
      for (const key of ['voice', 'root', 'bpm', 'gain', 'steps', 'leadCycle', 'skip', 'drone']) {
        assert.deepEqual(score[key], original[key], `${hour}: ${key} retains the hour's identity`);
      }
      assert.ok(score.bell.length <= original.bell.length, `${hour}: no extra lead density`);
      const pitched = [...score.bell, ...score.bass, ...(score.gong || []), ...(score.layers || []).flatMap(l => l.notes)];
      for (const [step] of [...pitched, ...score.perc]) assert.ok(Number.isInteger(step) && step >= 0 && step < score.steps);
      for (const [, degree] of score.bell) {
        const hz = degreeHz(TUNINGS[hour], score.root, degree);
        assert.ok(hz > 250 && hz < 1500, `${hour}: lead stays in register`);
      }
      for (const [, degree] of score.bass) {
        const hz = degreeHz(TUNINGS[hour], score.root, degree) / 2;
        assert.ok(hz > 50 && hz < 260);
      }
      for (const layer of score.layers || []) {
        assert.ok(original.layers.some(l => l.voice === layer.voice), `${hour}: accompaniment keeps its instrument`);
        assert.ok(layer.level <= Math.max(...original.layers.map(l => l.level)));
        for (const [, degree] of layer.notes) {
          const hz = degreeHz(TUNINGS[hour], score.root, degree);
          assert.ok(hz > (VOICES[layer.voice].kind === 'bow' ? 40 : 250) && hz < 1500);
        }
      }
    }
    assert.equal(songForLevel(hour, {id: 'sandbox'}), original);
    assert.equal(songForLevel(hour, {id: `${hour}-07`}), original);
  }
  for (const level of CAMPAIGN_LEVELS) {
    const score = STAGE_SONGS[level.hour][Number(level.id.slice(-2)) - 1];
    assert.equal(songForLevel(level.hour, level), score);
    assert.equal(songForLevel(level.hour, {id: 'practice-visit', practiceOf: level.id}), score);
    game.currentLevel = level;
    const previous = music.bus;
    run(.35);
    assert.equal(music.song, score, level.id);
    assert.notEqual(music.bus, previous, `${level.id}: stage change starts its own arrangement`);
    const bus = music.bus; run(.5);
    assert.equal(music.bus, bus, `${level.id}: ordinary frames do not restart music`);
    game.currentLevel = {...level, id: 'practice-visit', practiceOf: level.id}; run(.1);
    assert.equal(music.bus, bus, `${level.id}: the untimed practice uses the same arrangement`);
  }
  game.musicTitle = true; game.uiSuspended = true; run(.2);
  assert.equal(music.song, SONGS.title, 'title keeps its unique xylophone score');
  game.musicTitle = false; game.uiSuspended = false;
  music.stop();
  console.log('✔ All 24 visits select distinct phrases without changing hour identity or restarting every frame.');
}

// 10. Midnight's stage variations stay sparse, low, and soft across skipped notes.
{
  const originalNote = music.note, originalHit = music.hit;
  try {
    for (const [stage, score] of STAGE_SONGS.midnight.entries()) {
      const notes = [], hits = [];
      music.note = (voice, hz, time, level) => notes.push({voice, hz, time, level});
      music.hit = (voice, time, pitch, level) => hits.push({voice, time, level});
      music.hour = 'midnight'; music.leadNote = 0;
      for (let i = 0; i < score.steps * 8; i++) music.playStep(score, i, i * 30 / score.bpm, 1);
      const lead = notes.filter(n => n.level === .5);
      assert.ok(score.bell.length >= 3 && score.bell.length <= 4);
      assert.ok(score.layers.reduce((n, layer) => n + layer.notes.length, 0) <= 2);
      assert.ok(lead.length < score.bell.length * 8, 'later loops omit notes');
      for (const [i, note] of lead.entries()) {
        assert.equal(note.voice, VOICES[score.leadCycle[i % 3]], `stage ${stage + 1}, sounded note ${i}`);
        assert.ok(note.hz <= degreeHz(TUNINGS.midnight, score.root, 19) + .01, 'no higher lead register');
        if (i) assert.ok(note.time - lead[i - 1].time >= 6 * 30 / score.bpm - .02, 'space between swells, including loop boundaries');
      }
      assert.ok(notes.filter(n => n.level !== .5 && n.voice !== VOICES.pluck).every(n => n.level <= .11));
      assert.ok(hits.every(hit => hit.voice === PERCUSSION.tom && hit.level <= .66));
    }
  } finally { music.note = originalNote; music.hit = originalHit; music.hour = null; }
  console.log('✔ Every Midnight visit keeps three/four calm swells, two quiet answers at most, and the sounded-note cycle.');
}


// 11. The independent rhythm shares the music lifecycle and replaces the old beat.
{
  const score = STAGE_SONGS.dawn[1];
  game.currentLevel = {hour:'dawn',id:'dawn-02'};
  const oldNote = music.note, oldHit = music.hit;
  try {
    const notes=[],hits=[];
    music.note=(voice,hz,time,level)=>notes.push([voice,hz,time,level]);
    music.hit=(...args)=>hits.push(args);
    music.hour='dawn';music.leadNote=0;
    for(let i=0;i<32;i++)music.playStep(score,i,i*.4,1);
    assert.equal(hits.length,0,'the old beat is not stacked under the new rhythm');
    const melody=notes.slice();notes.length=0;music.leadNote=0;
    for(let i=0;i<32;i++)music.playStep({...score,rhythm:undefined},i,i*.4,1);
    assert.deepEqual(notes,melody,'all pitched notes stay unchanged');
    assert.ok(hits.length>0,'the original beat remains for stages without the new rhythm');
  } finally {music.note=oldNote;music.hit=oldHit;music.hour=null;}
  run(4);assert.ok(music.rhythm.step>0,'the game frame advances the independent clock');
  game.state='PAUSED';run(.1);assert.equal(music.rhythm,null);
  game.state='PLAYING';run(.2);assert.ok(music.rhythm);
  game.uiSuspended=true;run(.1);assert.equal(music.rhythm,null);
  game.uiSuspended=false;run(.2);audio.isMuted=true;run(.1);assert.equal(music.rhythm,null);
  audio.isMuted=false;run(.2);music.setEnabled(false);assert.equal(music.rhythm,null);
  music.setEnabled(true);run(.2);game.musicIdle=true;run(.1);assert.equal(music.rhythm,null,'attract mode remains silent');
  game.musicIdle=false;run(.2);globalThis.document={hidden:true};run(.1);assert.equal(music.rhythm,null,'hidden pages stop drums');
  delete globalThis.document;music.stop();
  console.log('✔ Odd-meter rhythms replace selected beats and obey Pause, menu, Sound, Music, attract mode and visibility.');
}

console.log('--- All music tests passed! ---');
process.exit(0); // the stop() timers would otherwise hold the process open
