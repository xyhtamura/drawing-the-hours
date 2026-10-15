import assert from 'node:assert/strict';
import { SampleBank } from '../src/samples.js';
const buffer = { duration: 4 };
let starts = [], params = [], sources = [];
const param = { setValueAtTime: (...a) => params.push(a), linearRampToValueAtTime: (...a) => params.push(a), exponentialRampToValueAtTime: (...a) => params.push(a) };
const ctx = {
  decodeAudioData: async data => { if (!data) throw Error('decode'); return buffer; },
  createBufferSource: () => { const source = { playbackRate: {}, connect() {}, disconnect() {}, start: t => starts.push(t), stop() {} }; sources.push(source); return source; },
  createGain: () => ({ gain: param, connect() {}, disconnect() {} }),
  createBiquadFilter: () => ({ frequency: {}, Q: {}, connect() {}, disconnect() {} }),
};
const profile = { bank: 'reed', envelope: [1.1, 0.5, 2.2], level: 0.45, cutoff: 1400 };
const bank = new SampleBank(async url => {
  if (url.pathname.endsWith('bank.json')) return { ok: true, json: async () => ({ version: 1, voices: { reed: [{ file: 'reed-low.mp3', hz: 440 }, { file: 'reed-high.mp3', hz: 587 }], brass: [{ file: 'broken.mp3', hz: 523 }] } }) };
  return { ok: !url.pathname.endsWith('broken.mp3'), arrayBuffer: async () => new ArrayBuffer(8) };
});
assert.equal(bank.play(profile, ctx, {}, 869.8, 2, 0.5), false, 'pending assets use the synth');
await bank.load(ctx);
assert.equal(bank.play(profile, ctx, {}, 869.8, 2, 0.5), true);
assert.equal(sources.at(-1).playbackRate.value, 869.8 / 587, 'microtonal pitch follows the selected source');
assert.equal(starts.at(-1), 2);
assert.ok(params.some(([level, time]) => level === 0.225 && time === 3.1), 'reed has a soft, slow entrance');
assert.equal(bank.play({ ...profile, bank: 'brass' }, ctx, {}, 523, 2, 0.5), false, 'one broken voice does not disable other voices');
const absent = new SampleBank(async () => ({ ok: false })); await absent.load(ctx);
assert.equal(absent.ready.size, 0, 'a missing local bank is valid');
const corrupt = new SampleBank(async url => url.pathname.endsWith('bank.json') ? { ok: true, json: async () => ({ version: 1, voices: { reed: [{ file: 'bad.mp3', hz: 440 }] } }) } : { ok: true, arrayBuffer: async () => null });
await corrupt.load(ctx); assert.equal(corrupt.ready.size, 0, 'decode failures keep synthesis available');
const mixed = new SampleBank(async url => url.pathname.endsWith('bank.json')
  ? {ok:true,json:async()=>({version:1,voices:{reed:[{file:'reed.mp3',hz:440}]},drums:{good:{file:'wood.mp3'},missing:{file:'missing.mp3'},invalid:{file:'../escape.mp3'},corrupt:{file:'corrupt.mp3'}}})}
  : {ok:!url.pathname.endsWith('missing.mp3'),arrayBuffer:async()=>url.pathname.endsWith('corrupt.mp3')?null:new ArrayBuffer(8)});
await mixed.load(ctx);
assert.equal(mixed.ready.size,1,'drum failures do not affect melody voices');
assert.deepEqual([...mixed.drums.keys()],['good'],'bad or missing drum assets stay available for synth fallback');
assert.equal(absent.drums.size,0);
console.log('Samples: missing/partial/corrupt banks fall back; available notes retain pitch, envelope, and level.');
