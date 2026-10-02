/**
 * Combination diagrams: every requirement a visit can ask for has a diagram,
 * every creature token names a drawable species, and drawing each one runs
 * through the entity art without throwing. Run: node test/test_combo_diagrams.js
 */
import assert from 'node:assert/strict';
import { CAMPAIGN_LEVELS, PRACTICE_LEVELS } from '../src/campaign.js';
import { COMBO_DIAGRAMS, drawComboDiagram } from '../src/combo-diagrams.js';
import { SPECIES_CONFIG } from '../src/entities.js';

// A context that accepts any drawing call and counts how many it received.
function recordingContext() {
  const calls = { count: 0 };
  const gradient = { addColorStop() {} };
  const ctx = new Proxy({}, {
    get(target, prop) {
      if (prop === 'calls') return calls;
      if (prop === 'createRadialGradient' || prop === 'createLinearGradient') return () => gradient;
      if (prop === 'measureText') return () => ({ width: 10 });
      if (prop in target) return target[prop];
      return () => { calls.count++; };
    },
    set(target, prop, value) { target[prop] = value; return true; },
  });
  return ctx;
}

const asked = new Set();
for (const level of [...CAMPAIGN_LEVELS, ...PRACTICE_LEVELS]) {
  for (const key of Object.keys(level.objectives)) asked.add(key);
}
for (const key of asked) {
  assert.ok(COMBO_DIAGRAMS[key], `objective "${key}" has no combination diagram`);
}

const tokens = (spec) => [
  ...(spec.pockets || []).flat(),
  ...(spec.sequence || []),
  ...(spec.parts || []).flatMap(tokens),
];
for (const [key, spec] of Object.entries(COMBO_DIAGRAMS)) {
  for (const token of tokens(spec)) {
    assert.ok(token === 'seed' || token === 'ghost' || SPECIES_CONFIG[token], `${key}: unknown creature "${token}"`);
  }
  const ctx = recordingContext();
  assert.equal(drawComboDiagram(ctx, key, 160, 60), true, `${key} did not draw`);
  assert.ok(ctx.calls.count > 5, `${key} drew almost nothing`);
}
assert.equal(drawComboDiagram(recordingContext(), 'no-such-figure', 160, 60), false);

console.log(`combo diagrams: ${Object.keys(COMBO_DIAGRAMS).length} figures, ${asked.size} requirement keys covered`);
