import assert from 'node:assert/strict';
import { RhythmClock } from '../src/rhythm.js';
import { DRUM_VOICES } from '../src/drum-voices.js';
import { STAGE_SONGS } from '../src/song-variations.js';
import { SONGS } from '../src/songs.js';

const selected = Object.entries(STAGE_SONGS).flatMap(([hour, scores]) => scores.flatMap((score, i) => score.rhythm ? [`${hour}-0${i + 1}`] : []));
assert.deepEqual(selected, ['dawn-02', 'dawn-05', 'noon-02', 'noon-04', 'noon-06', 'dusk-03', 'dusk-05', 'midnight-05']);
const render = (config, seconds, speed = 1) => {
  const hits = [], clock = new RhythmClock(config, .1, hit => hits.push(hit));
  for (let now = 0; now < seconds; now += .02) clock.tick(now, speed, speed === 1 ? 1 : 2 ** (-100 / 1200));
  return hits;
};
for (const [hour, scores] of Object.entries(STAGE_SONGS)) for (const score of scores) {
  if (!score.rhythm) continue;
  const hits = render(score.rhythm, 120);
  assert.ok(hits.length > 0);
  assert.ok(hits.every(h => DRUM_VOICES[`${h.kit}:${h.voice}`]), `${hour}: every event names an actual kit voice`);
  assert.ok(hits.every(h => Number.isFinite(h.time) && h.time >= 0 && h.velocity > 0 && h.velocity < .25));
  assert.ok(hits.every(h => Math.abs(h.detune) <= 18 && Math.abs(h.pan) <= .08));
  const slower = render(score.rhythm, 120, .55);
  assert.ok(slower.length < hits.length * .8, `${hour}: the independent rhythm follows poppy slowdown`);
  assert.ok(slower.every(h => h.pitch === 2 ** (-100 / 1200)));
}

// Repeated accents retain the source meter rather than resetting on the 32-step melody.
for (const [hour, stage, voice, cycle] of [
  ['dawn', 1, 'pencil_wood', 5 * 30 / 74],
  ['noon', 1, 'abacus_clack_1', 7 * 30 / 92],
  ['dusk', 2, 'water_drop_high', 11 * 15 / 54],
]) {
  const config = {...STAGE_SONGS[hour][stage].rhythm, tempoDrift: {enabled: false}, humanizeMs: 0};
  const hits = render(config, 60).filter(h => h.voice === voice);
  // Each first-step accent has chance 1; other hits of that voice may intervene.
  const first = hits[0].time;
  for (let n = 1; first + n * cycle < 59; n++) {
    assert.ok(hits.some(h => Math.abs(h.time - first - n * cycle) < 1e-7), `${hour}: odd-meter cycle ${n}`);
  }
}

const fidgets = render(STAGE_SONGS.midnight[4].rhythm, 120);
assert.ok(fidgets.length >= 3 && fidgets.length <= 10, 'a handful of Midnight taps over two minutes');
assert.ok(fidgets[0].time >= 14, 'no immediate burst on entering Midnight');
assert.ok(fidgets.every(h => ['pencil_wood', 'paper_snip', 'match_slide'].includes(h.voice)));
for (let i = 1; i < fidgets.length; i++) {
  const gap = fidgets[i].time - fidgets[i - 1].time;
  assert.ok(gap <= 1.4 || gap >= 24, 'one/two taps per gesture, with long rests');
}

const late = [], clock = new RhythmClock(STAGE_SONGS.dawn[1].rhythm, 0, hit => late.push(hit));
clock.tick(0); clock.tick(120);
assert.ok(late.length <= 3 && late.every(h => h.time >= 120), 'a stalled frame skips missed beats');
const burstHits=[], burst=new RhythmClock({...STAGE_SONGS.midnight[4].rhythm,burstCount:[2,2]}, .1, hit=>burstHits.push(hit));
burst.tick(14);assert.equal(burstHits.length,1);
burst.tick(18);assert.equal(burstHits.length,1,'a missed second fidget is skipped after a stalled frame');
assert.ok(SONGS.title.rhythm, 'title has independent rhythm configured');
const titleHits = render(SONGS.title.rhythm, 60);
assert.ok(titleHits.length > 0, 'title produces rhythm hits');
assert.ok(titleHits.every(h => DRUM_VOICES[`${h.kit}:${h.voice}`]), 'title hits name valid voices');
assert.ok(titleHits.every(h => h.velocity > 0 && h.velocity < 0.20), 'title rhythm stays subtle below the xylophone');

console.log('Rhythms: title and eight selected stages, independent odd meters, poppy slowdown, sparse Midnight and no catch-up bursts.');
