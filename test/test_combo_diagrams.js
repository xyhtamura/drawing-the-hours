/**
 * Combination diagrams: every requirement a visit can ask for has a diagram,
 * every creature token names a drawable species, and drawing each one runs
 * through the entity art without throwing. Run: node test/test_combo_diagrams.js
 */
import assert from 'node:assert/strict';
import { CAMPAIGN_LEVELS, PRACTICE_LEVELS, deriveObjectiveTags } from '../src/campaign.js';
import { COMBO_DIAGRAMS, COMBO_HINTS, drawComboDiagram, visitComboExamples } from '../src/combo-diagrams.js';
import { SPECIES_CONFIG } from '../src/entities.js';
import { evaluateDrawing } from '../src/recipes.js';

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
  for (const key of Object.keys(level.objectives)) {
    asked.add(key);
    const examples = visitComboExamples(key, level);
    assert.ok(COMBO_HINTS[key] && examples.length, `${level.id}/${key} needs an illustrated hint`);
    for (const spec of examples) {
      const kinds = spec.sequence || spec.pockets.flat();
      for (const kind of new Set(kinds)) {
        assert.ok(level.population[kind] >= kinds.filter(k => k === kind).length,
          `${level.id}/${key} shows unavailable ${kind}`);
      }
      let result, pockets;
      if (spec.sequence) {
        const sequences = level.traceSequences || [level.traceSequence];
        assert.ok(sequences.some(sequence => sequence?.join() === spec.sequence.join()), `${level.id}/${key} shows an invalid trace`);
        result = { valid: true, mode: 'trace', traceSequence: spec.sequence };
      } else {
        pockets = spec.pockets.map(tokens => ({ entities: tokens.map(kind => ({ kind, type: kind === 'seed' ? 'seed' : 'insect' })) }));
        result = evaluateDrawing(pockets, 420);
      }
      assert.ok(deriveObjectiveTags(result, pockets).includes(key), `${level.id}/${key} shows a combination that does not count`);
    }
  }
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
