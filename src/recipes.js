/**
 * Drawing the Hours — Combinatorial Recipes & Validation
 * Evaluates entities enclosed in single pockets or two-pocket figure-eights.
 */

import { getLengthBand } from './geometry.js';

export const RECIPE_TYPES = {
  KINDRED_PAIR: 'KINDRED_PAIR',
  TRIO_OF_FLIGHT: 'TRIO_OF_FLIGHT',
  SEED_AND_WING: 'SEED_AND_WING',
  CROSS_MEADOW_CORRESPONDENCE: 'CROSS_MEADOW_CORRESPONDENCE',
  NURSERY_POLARITY: 'NURSERY_POLARITY',
  TWIN_SEED_AND_WING: 'TWIN_SEED_AND_WING',
};

/**
 * Summarize entities within a pocket
 */
function summarizePocket(entities) {
  const butterflies = entities.filter(e => e.type === 'butterfly');
  const seeds = entities.filter(e => e.type === 'seed');
  const hazards = entities.filter(e => e.type === 'hazard');

  const countsByKind = {};
  for (const b of butterflies) {
    countsByKind[b.kind] = (countsByKind[b.kind] || 0) + 1;
  }

  return {
    total: entities.length,
    butterflies,
    seeds,
    hazards,
    countsByKind,
    distinctButterflyKinds: Object.keys(countsByKind).length,
  };
}

/**
 * Check if a single pocket satisfies a basic recipe
 */
function evaluateSinglePocket(entities) {
  const summary = summarizePocket(entities);

  if (summary.hazards.length > 0) {
    return {
      valid: false,
      reason: 'A ground crawler disturbed the cord!',
      faultType: 'HAZARD',
    };
  }

  if (summary.total === 0) {
    return {
      valid: false,
      reason: 'Empty pocket — nothing was gathered.',
      faultType: 'EMPTY',
    };
  }

  // Kindred Pair: 2 butterflies of the same kind, 0 seeds
  if (summary.butterflies.length === 2 && summary.seeds.length === 0) {
    if (summary.distinctButterflyKinds === 1) {
      const kind = summary.butterflies[0].kind;
      return {
        valid: true,
        type: RECIPE_TYPES.KINDRED_PAIR,
        title: 'Kindred Pair',
        detail: `Two kindred ${kind}s gathered in harmony.`,
        score: 120,
        entities,
      };
    }
    return {
      valid: false,
      reason: 'Two mismatched wings: need a matching pair or a third for a trio.',
      faultType: 'MISMATCH',
    };
  }

  // Trio of Flight: 3 butterflies of 3 distinct kinds, 0 seeds
  if (summary.butterflies.length === 3 && summary.seeds.length === 0) {
    if (summary.distinctButterflyKinds === 3) {
      return {
        valid: true,
        type: RECIPE_TYPES.TRIO_OF_FLIGHT,
        title: 'Trio of Flight',
        detail: 'Three distinct wings gathered together.',
        score: 300,
        entities,
      };
    }
    return {
      valid: false,
      reason: 'Trio requires 3 distinct species (Brimstone, Azure, Roseate).',
      faultType: 'MISMATCH',
    };
  }

  // Seed & Wing: 1 butterfly + 1 seed
  if (summary.butterflies.length === 1 && summary.seeds.length === 1) {
    return {
      valid: true,
      type: RECIPE_TYPES.SEED_AND_WING,
      title: 'Seed & Wing',
      detail: 'A traveler meeting an airborne seed.',
      score: 160,
      entities,
    };
  }

  // Detailed feedback for near-misses
  if (summary.butterflies.length === 1 && summary.seeds.length === 0) {
    return {
      valid: false,
      reason: 'A solitary wing needs a companion or a seed.',
      faultType: 'UNDERFULL',
    };
  }

  if (summary.seeds.length > 0 && summary.butterflies.length === 0) {
    return {
      valid: false,
      reason: 'Floating seeds need a winged companion in a single loop.',
      faultType: 'NEED_WINGS',
    };
  }

  return {
    valid: false,
    reason: 'Unrecognized arrangement: try a pair, trio, or butterfly with a seed.',
    faultType: 'IRREGULAR',
  };
}

/**
 * Evaluate full drawing result: pockets + stroke metrics
 */
export function evaluateDrawing(pocketsWithEntities, strokeLength) {
  const band = getLengthBand(strokeLength);
  const bandMultiplier = band.name === 'Petite' ? 1.0 : (band.name === 'Balanced' ? 1.25 : 1.5);

  if (!pocketsWithEntities || pocketsWithEntities.length === 0) {
    return {
      valid: false,
      status: 'OPEN',
      message: 'Figure did not close. Complete the loop or cross over.',
    };
  }

  // SINGLE POCKET
  if (pocketsWithEntities.length === 1) {
    const pocket = pocketsWithEntities[0];
    const evalResult = evaluateSinglePocket(pocket.entities);

    if (!evalResult.valid) {
      return {
        valid: false,
        status: 'INVALID_POCKET',
        message: evalResult.reason,
        faultType: evalResult.faultType,
        pockets: pocketsWithEntities,
      };
    }

    const finalScore = Math.round(evalResult.score * bandMultiplier);
    return {
      valid: true,
      recipeType: evalResult.type,
      title: evalResult.title,
      detail: evalResult.detail,
      baseScore: evalResult.score,
      finalScore,
      band: band.name,
      bandMultiplier,
      harmonizedEntities: evalResult.entities,
      pockets: pocketsWithEntities,
    };
  }

  // TWO POCKETS (Figure-Eight)
  if (pocketsWithEntities.length >= 2) {
    const pocketA = pocketsWithEntities[0];
    const pocketB = pocketsWithEntities[1];
    const allEntities = [...pocketA.entities, ...pocketB.entities];

    // Check hazards in either pocket
    if (allEntities.some(e => e.type === 'hazard')) {
      return {
        valid: false,
        status: 'HAZARD',
        message: 'A crawler disturbed the figure-eight cords!',
        pockets: pocketsWithEntities,
      };
    }

    const sumA = summarizePocket(pocketA.entities);
    const sumB = summarizePocket(pocketB.entities);

    // Nursery Polarity: Butterflies in A, Seeds in B (or vice versa)
    const isNursery = (sumA.butterflies.length >= 1 && sumA.seeds.length === 0 &&
      sumB.seeds.length >= 1 && sumB.butterflies.length === 0) ||
      (sumB.butterflies.length >= 1 && sumB.seeds.length === 0 &&
      sumA.seeds.length >= 1 && sumA.butterflies.length === 0);

    if (isNursery) {
      const bCount = sumA.butterflies.length + sumB.butterflies.length;
      const sCount = sumA.seeds.length + sumB.seeds.length;
      const score = Math.round((250 + (bCount + sCount) * 50) * bandMultiplier);
      return {
        valid: true,
        recipeType: RECIPE_TYPES.NURSERY_POLARITY,
        title: 'Nursery Polarity',
        detail: 'Wings sheltered on one side, wild seeds gathered on the other.',
        baseScore: 250,
        finalScore: score,
        band: band.name,
        bandMultiplier,
        harmonizedEntities: allEntities,
        pockets: pocketsWithEntities,
      };
    }

    // Cross-Meadow Correspondence: Kindred pair in A, Kindred pair in B
    const aPair = sumA.butterflies.length === 2 && sumA.distinctButterflyKinds === 1 && sumA.seeds.length === 0;
    const bPair = sumB.butterflies.length === 2 && sumB.distinctButterflyKinds === 1 && sumB.seeds.length === 0;

    if (aPair && bPair) {
      const score = Math.round(550 * bandMultiplier);
      return {
        valid: true,
        recipeType: RECIPE_TYPES.CROSS_MEADOW_CORRESPONDENCE,
        title: 'Cross-Meadow Correspondence',
        detail: 'Two kindred pairs mirror each other across the figure-eight.',
        baseScore: 550,
        finalScore: score,
        band: band.name,
        bandMultiplier,
        harmonizedEntities: allEntities,
        pockets: pocketsWithEntities,
      };
    }

    // Twin Seed & Wing: 1 butterfly + 1 seed in A, 1 butterfly + 1 seed in B
    const aSeedWing = sumA.butterflies.length === 1 && sumA.seeds.length === 1;
    const bSeedWing = sumB.butterflies.length === 1 && sumB.seeds.length === 1;

    if (aSeedWing && bSeedWing) {
      const score = Math.round(480 * bandMultiplier);
      return {
        valid: true,
        recipeType: RECIPE_TYPES.TWIN_SEED_AND_WING,
        title: 'Twin Seed & Wing',
        detail: 'Symmetrical travelers carrying airborne seeds.',
        baseScore: 480,
        finalScore: score,
        band: band.name,
        bandMultiplier,
        harmonizedEntities: allEntities,
        pockets: pocketsWithEntities,
      };
    }

    // Both single pockets independently valid?
    const evalA = evaluateSinglePocket(pocketA.entities);
    const evalB = evaluateSinglePocket(pocketB.entities);

    if (evalA.valid && evalB.valid) {
      const combinedScore = Math.round((evalA.score + evalB.score + 150) * bandMultiplier);
      return {
        valid: true,
        recipeType: 'DOUBLE_HARMONY',
        title: `${evalA.title} & ${evalB.title}`,
        detail: 'Two harmonious pockets enclosed in a single gesture.',
        baseScore: evalA.score + evalB.score + 150,
        finalScore: combinedScore,
        band: band.name,
        bandMultiplier,
        harmonizedEntities: allEntities,
        pockets: pocketsWithEntities,
      };
    }

    // Explain two-pocket failure
    const errorA = evalA.valid ? 'OK' : evalA.reason;
    const errorB = evalB.valid ? 'OK' : evalB.reason;
    return {
      valid: false,
      status: 'INVALID_FIGURE8',
      message: `Lobe 1: ${errorA} | Lobe 2: ${errorB}`,
      pockets: pocketsWithEntities,
    };
  }

  return {
    valid: false,
    status: 'UNKNOWN',
    message: 'Could not resolve the drawn figures.',
  };
}
