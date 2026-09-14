/**
 * Drawing the Hours — Combinatorial Recipes & Validation
 * Evaluates entities enclosed in single pockets or two-pocket figure-eights.
 * Supports distinct meadow species: Brimstone Butterfly, Azure Damselfly, Roseate Hawkmoth.
 */

import { getLengthBand } from './geometry.js';

export const RECIPE_TYPES = {
  KINDRED_PAIR: 'KINDRED_PAIR',
  TRIO_OF_FLIGHT: 'TRIO_OF_FLIGHT',
  SEED_AND_WING: 'SEED_AND_WING',
  SEED_AND_TRIO: 'SEED_AND_TRIO',
  CROSS_MEADOW_CORRESPONDENCE: 'CROSS_MEADOW_CORRESPONDENCE',
  SYMMETRIC_CORRESPONDENCE: 'SYMMETRIC_CORRESPONDENCE',
  NURSERY_POLARITY: 'NURSERY_POLARITY',
  TWIN_SEED_AND_WING: 'TWIN_SEED_AND_WING',
  COUNTERPART_PAIR: 'COUNTERPART_PAIR',
};

export const SPECIES_NAMES = {
  lacewing: 'Paper Lacewing',
  hoverfly: 'Amber Hoverfly',
  brimstone: 'Brimstone Butterfly',
  damselfly: 'Azure Damselfly',
  hawkmoth: 'Roseate Hawkmoth',
  // Backward compatibility
  azure: 'Azure Damselfly',
  roseate: 'Roseate Hawkmoth',
};

function normalizeKind(kind) {
  if (kind === 'azure') return 'damselfly';
  if (kind === 'roseate') return 'hawkmoth';
  return kind;
}

/**
 * Summarize entities within a pocket
 */
export function summarizePocket(entities) {
  const butterflies = entities.filter(e => e.type === 'butterfly' || e.type === 'insect');
  const seeds = entities.filter(e => e.type === 'seed');
  const hazards = entities.filter(e => e.type === 'hazard');

  const countsByKind = {};
  for (const b of butterflies) {
    const k = normalizeKind(b.kind);
    countsByKind[k] = (countsByKind[k] || 0) + 1;
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
export function evaluateSinglePocket(entities) {
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

  // Kindred Pair: 2 butterflies of the same species, 0 seeds
  if (summary.butterflies.length === 2 && summary.seeds.length === 0) {
    if (summary.distinctButterflyKinds === 1) {
      const kind = Object.keys(summary.countsByKind)[0];
      const speciesName = SPECIES_NAMES[kind] || kind;
      return {
        valid: true,
        type: RECIPE_TYPES.KINDRED_PAIR,
        title: 'Kindred Pair',
        detail: `Two kindred ${speciesName}s gathered in harmony.`,
        score: 120,
        entities,
      };
    }
    return {
      valid: false,
      reason: 'Two mismatched species: need a matching pair or a third for a trio.',
      faultType: 'MISMATCH',
    };
  }

  // Trio of Flight: 3 butterflies of 3 distinct species, 0 seeds
  if (summary.butterflies.length === 3 && summary.seeds.length === 0) {
    if (summary.distinctButterflyKinds === 3) {
      return {
        valid: true,
        type: RECIPE_TYPES.TRIO_OF_FLIGHT,
        title: 'Trio of Flight',
        detail: 'Three distinct species (Brimstone, Damselfly, Hawkmoth) gathered together.',
        score: 300,
        entities,
      };
    }
    return {
      valid: false,
      reason: 'Trio requires 3 distinct species: Brimstone Butterfly, Azure Damselfly, and Roseate Hawkmoth.',
      faultType: 'MISMATCH',
    };
  }

  // Seed & Wing: 1 butterfly + 1 seed
  if (summary.butterflies.length === 1 && summary.seeds.length === 1) {
    const kind = Object.keys(summary.countsByKind)[0];
    const speciesName = SPECIES_NAMES[kind] || 'flier';
    return {
      valid: true,
      type: RECIPE_TYPES.SEED_AND_WING,
      title: 'Seed & Wing',
      detail: `A ${speciesName} meeting an airborne seed.`,
      score: 160,
      entities,
    };
  }

  // Seed & Trio: 3 distinct butterflies + 1 seed
  if (summary.butterflies.length === 3 && summary.seeds.length === 1) {
    if (summary.distinctButterflyKinds === 3) {
      return {
        valid: true,
        type: RECIPE_TYPES.SEED_AND_TRIO,
        title: 'Seed & Trio',
        detail: 'Three distinct species gathered around an airborne seed in a circle.',
        score: 360,
        entities,
      };
    }
    return {
      valid: false,
      reason: 'Seed & Trio requires three distinct species gathered around the airborne seed.',
      faultType: 'MISMATCH',
    };
  }

  // Detailed feedback for near-misses
  if (summary.butterflies.length === 1 && summary.seeds.length === 0) {
    return {
      valid: false,
      reason: 'A solitary flier needs a companion or a seed.',
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
    reason: 'Unrecognized arrangement: try a pair, trio, or insect with a seed.',
    faultType: 'IRREGULAR',
  };
}

/**
 * Evaluate full drawing result: pockets + stroke metrics
 */
export function evaluateDrawing(pocketsWithEntities, strokeLength, options = {}) {
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

    const allFlierKinds = new Set([...Object.keys(sumA.countsByKind), ...Object.keys(sumB.countsByKind)]);
    const totalSeeds = sumA.seeds.length + sumB.seeds.length;
    const totalFliers = sumA.butterflies.length + sumB.butterflies.length;

    // Reject similar fliers in a figure-eight (Kindred fliers belong together in a single loop)
    if (totalSeeds === 0 && allFlierKinds.size === 1 && totalFliers >= 2) {
      return {
        valid: false,
        status: 'SIMILAR_IN_FIGURE8',
        faultType: 'DIVIDED_KINDRED',
        message: 'Kindred fliers belong together in a single loop — do not divide them across a figure-eight.',
        pockets: pocketsWithEntities,
      };
    }

    // 1. SYMMETRIC CORRESPONDENCE (Twin Echoes Experiment)
    // Matching species compositions between Pocket A and Pocket B
    // Both pockets must have at least 1 creature
    const allKinds = new Set([...Object.keys(sumA.countsByKind), ...Object.keys(sumB.countsByKind)]);
    let isSymmetric = (sumA.total > 0 && sumB.total > 0 && sumA.seeds.length === sumB.seeds.length);
    if (isSymmetric) {
      for (const k of allKinds) {
        if ((sumA.countsByKind[k] || 0) !== (sumB.countsByKind[k] || 0)) {
          isSymmetric = false;
          break;
        }
      }
    }

    if (isSymmetric) {
      const creatureCount = allEntities.length;
      const score = Math.round((600 + creatureCount * 50) * bandMultiplier);
      return {
        valid: true,
        recipeType: RECIPE_TYPES.SYMMETRIC_CORRESPONDENCE,
        title: 'Twin Echo Correspondence',
        detail: 'Matching insect compositions mirrored across the figure-eight lobes.',
        baseScore: 600,
        finalScore: score,
        band: band.name,
        bandMultiplier,
        harmonizedEntities: allEntities,
        pockets: pocketsWithEntities,
      };
    }

    // 2. Nursery Polarity: Butterflies in A, Seeds in B (or vice versa)
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

    // 3. Cross-Meadow Correspondence: Kindred pair in A, Kindred pair in B
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

    // 4. Twin Seed & Wing: 1 butterfly + 1 seed in A, 1 butterfly + 1 seed in B
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

    // 5. Counterpart Pair / Dialogue: Dissimilar species partitioned across lobes
    // Pocket A has insect(s) of species X, Pocket B has insect(s) of species Y, X !== Y, 0 seeds
    const aOnlyInsects = sumA.butterflies.length > 0 && sumA.seeds.length === 0 && sumA.distinctButterflyKinds === 1;
    const bOnlyInsects = sumB.butterflies.length > 0 && sumB.seeds.length === 0 && sumB.distinctButterflyKinds === 1;

    if (aOnlyInsects && bOnlyInsects) {
      const kindA = Object.keys(sumA.countsByKind)[0];
      const kindB = Object.keys(sumB.countsByKind)[0];
      if (kindA !== kindB) {
        const nameA = SPECIES_NAMES[kindA] || kindA;
        const nameB = SPECIES_NAMES[kindB] || kindB;
        const totalCount = sumA.butterflies.length + sumB.butterflies.length;
        const isPair = (sumA.butterflies.length === 1 && sumB.butterflies.length === 1);
        const baseScore = isPair ? 320 : (300 + totalCount * 40);
        const score = Math.round(baseScore * bandMultiplier);
        return {
          valid: true,
          recipeType: RECIPE_TYPES.COUNTERPART_PAIR,
          title: isPair ? 'Counterpart Pair' : 'Counterpart Dialogue',
          detail: isPair
            ? `Two dissimilar species (${nameA} and ${nameB}) balanced across the crossing.`
            : `${nameA} and ${nameB} conversing across the crossing.`,
          baseScore,
          finalScore: score,
          band: band.name,
          bandMultiplier,
          harmonizedEntities: allEntities,
          pockets: pocketsWithEntities,
        };
      }
    }

    // 6. Both single pockets independently valid?
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
