/**
 * Drawing the Hours — Campaign Module
 * Defines the 12-visit authored campaign across Dawn, Noon, Dusk, and Midnight.
 * Implements objective tag derivation, progress evaluation, and persistence.
 * Based on CAMPAIGN.md, campaign-plan.json, and first12levels.md.
 */

export const CAMPAIGN_LEVELS = [
  // --- DAWN (Levels 1–3) ---
  {
    id: 'dawn-01',
    number: 1,
    title: 'Before the bus',
    hour: 'dawn',
    hourLabel: 'Dawn · Visit I',
    scene: 'curb',
    transitionText: 'Another morning of standing, waiting for the bus.',
    durationSeconds: 75,
    population: {
      brimstone: 4,
      damselfly: 2,
      hawkmoth: 0,
      seed: 0,
      snail: 0,
      lacewing: 0,
      firefly: 0,
    },
    motionScale: 0.8,
    objectives: {
      single: 4,
    },
    instruction: 'Draw four single-loop combinations. Matching pairs count.',
    designNote: 'Two Brimstones make the first available pair; no hazards or seed distraction.',
    gestures: ['enclose'],
    wind: null,
  },
  {
    id: 'dawn-02',
    number: 2,
    title: 'The curbside patch',
    hour: 'dawn',
    hourLabel: 'Dawn · Visit II',
    scene: 'curb',
    transitionText: 'I like to watch the insects here, in this patch by the curbside.',
    durationSeconds: 80,
    population: {
      brimstone: 2,
      damselfly: 2,
      hawkmoth: 2,
      seed: 0,
      snail: 0,
      lacewing: 0,
      firefly: 0,
    },
    motionScale: 0.85,
    objectives: {
      any: 4,
      trio: 2,
    },
    instruction: 'Make four combinations, including two three-species trios.',
    designNote: 'Introduce the third silhouette (Roseate Hawkmoth); keep the same curb.',
    gestures: ['enclose'],
    wind: null,
  },
  {
    id: 'dawn-03',
    number: 3,
    title: 'Something in the air',
    hour: 'dawn',
    hourLabel: 'Dawn · Visit III',
    scene: 'curb',
    transitionText: 'Maybe I have an overactive imagination.',
    durationSeconds: 85,
    population: {
      brimstone: 2,
      damselfly: 2,
      hawkmoth: 2,
      seed: 3,
      snail: 1,
      lacewing: 0,
      firefly: 0,
    },
    motionScale: 0.85,
    objectives: {
      any: 5,
      seedWing: 2,
    },
    instruction: 'Make five combinations, including two Seed & Wing loops.',
    designNote: 'Add airborne seeds and one bottom-edge snail; matching arcs create the ambiguity of magic.',
    gestures: ['enclose'],
    wind: null,
  },

  // --- NOON (Levels 4–6) ---
  {
    id: 'noon-01',
    number: 4,
    title: 'Lunch in the atrium',
    hour: 'noon',
    hourLabel: 'Noon · Visit IV',
    scene: 'atrium',
    transitionText: 'Today, for lunch, I bought myself a sandwich.',
    durationSeconds: 90,
    population: {
      brimstone: 3,
      damselfly: 0,
      hoverfly: 3,
      hawkmoth: 0,
      seed: 0,
      snail: 0,
      lacewing: 0,
      firefly: 0,
    },
    motionScale: 0.8,
    objectives: {
      any: 4,
      counterpartPair: 3,
    },
    instruction: 'Make four combinations, including three figure-eights with one different insect in each pocket.',
    designNote: 'Teach the waist crossing using two kinds and open drawing space.',
    gestures: ['enclose'],
    wind: null,
  },
  {
    id: 'noon-02',
    number: 5,
    title: 'For now',
    hour: 'noon',
    hourLabel: 'Noon · Visit V',
    scene: 'atrium',
    transitionText: "I don't know how much longer my job will exist.",
    durationSeconds: 110,
    population: {
      brimstone: 2,
      damselfly: 0,
      hoverfly: 2,
      hawkmoth: 2,
      seed: 3,
      snail: 1,
      lacewing: 0,
      firefly: 0,
    },
    motionScale: 0.85,
    objectives: {
      figure8: 4,
      nursery: 2,
    },
    instruction: 'Make four figure-eights, including two with insects and seeds in separate pockets.',
    designNote: 'Introduce a two-second seed-moving gust after a visible warning.',
    gestures: ['enclose'],
    wind: {
      periodSeconds: 12,
      warningSeconds: 2,
      gustSeconds: 2,
      direction: 'right',
      seedSpeedPlayWidthsPerSecond: 0.08,
    },
  },
  {
    id: 'noon-03',
    number: 6,
    title: 'The glass and the leaves',
    hour: 'noon',
    hourLabel: 'Noon · Visit VI',
    scene: 'atrium',
    transitionText: 'This atrium makes me feel calmer.',
    durationSeconds: 100,
    population: {
      brimstone: 2,
      damselfly: 0,
      hoverfly: 2,
      hawkmoth: 2,
      seed: 2,
      snail: 0,
      lacewing: 0,
      firefly: 0,
    },
    motionScale: 0.85,
    objectives: {
      any: 4,
      seedTrio: 2,
    },
    instruction: 'Make four combinations, including two loops with a seed and three different insects.',
    designNote: 'Introduce the Seed & Trio circle (1 seed + 3 different species) in the sunlit atrium breeze.',
    gestures: ['enclose'],
    wind: {
      periodSeconds: 12,
      warningSeconds: 2,
      gustSeconds: 2,
      direction: 'right',
      seedSpeedPlayWidthsPerSecond: 0.08,
    },
  },

  // --- DUSK (Levels 7–9) ---
  {
    id: 'dusk-01',
    number: 7,
    title: 'The way through',
    hour: 'dusk',
    hourLabel: 'Dusk · Visit VII',
    scene: 'passage',
    transitionText: 'I always find myself walking home through here.',
    durationSeconds: 85,
    population: {
      brimstone: 2,
      damselfly: 2,
      hawkmoth: 0,
      seed: 2,
      snail: 1,
      lacewing: 2,
      firefly: 0,
    },
    motionScale: 0.95,
    objectives: {
      any: 5,
      lacewingCounterpart: 2,
    },
    instruction: 'Make five combinations, including two Counterpart Pairs containing a lacewing.',
    designNote: 'Introduce paper lacewings that pause at visible leaf anchors.',
    gestures: ['enclose'],
    wind: null,
  },
  {
    id: 'dusk-02',
    number: 8,
    title: 'The gaps in the sound',
    hour: 'dusk',
    hourLabel: 'Dusk · Visit VIII',
    scene: 'passage',
    transitionText: "I can hear the cicadas. And sometimes I can't.",
    durationSeconds: 95,
    population: {
      brimstone: 2,
      damselfly: 2,
      hawkmoth: 0,
      seed: 3,
      snail: 1,
      lacewing: 2,
      firefly: 0,
    },
    motionScale: 0.95,
    objectives: {
      any: 5,
      nursery: 1,
      mixedEcho: 1,
    },
    instruction: 'Make five combinations, including a Nursery and a matching mixed figure-eight.',
    designNote: 'Use lacewing rest intervals to arrange a Nursery and mixed Echo.',
    gestures: ['enclose'],
    wind: null,
  },
  {
    id: 'dusk-03',
    number: 9,
    title: 'Carrying something home',
    hour: 'dusk',
    hourLabel: 'Dusk · Visit IX',
    scene: 'passage',
    transitionText: 'Bringing home medicine today.',
    durationSeconds: 100,
    population: {
      brimstone: 2,
      damselfly: 2,
      hawkmoth: 2,
      seed: 2,
      snail: 1,
      lacewing: 2,
      firefly: 0,
    },
    motionScale: 1.0,
    objectives: {
      any: 6,
      single: 3,
      figure8: 2,
    },
    instruction: 'Make six combinations, including three single loops and two figure-eights.',
    designNote: 'Require switching gestures amid eight fliers.',
    gestures: ['enclose'],
    wind: null,
  },

  // --- MIDNIGHT (Levels 10–12) ---
  {
    id: 'midnight-01',
    number: 10,
    title: 'The window corner',
    hour: 'midnight',
    hourLabel: 'Midnight · Visit X',
    scene: 'window',
    transitionText: "I wake up often, and there's always rustling in the corner.",
    durationSeconds: 95,
    population: {
      brimstone: 0,
      damselfly: 0,
      hawkmoth: 0,
      seed: 0,
      snail: 0,
      lacewing: 2,
      firefly: 3,
    },
    motionScale: 0.85,
    objectives: {
      trace: 3,
    },
    instruction: 'Trace through firefly, lacewing, then another firefly. Release to complete the sequence.',
    designNote: 'Introduce fireflies and Trace mode with a sparse cast.',
    gestures: ['trace'],
    wind: null,
    traceSequence: ['firefly', 'lacewing', 'firefly'],
  },
  {
    id: 'midnight-02',
    number: 11,
    title: 'Figures',
    hour: 'midnight',
    hourLabel: 'Midnight · Visit XI',
    scene: 'window',
    transitionText: 'I trace figures, while the world moves around me.',
    durationSeconds: 110,
    population: {
      brimstone: 2,
      damselfly: 2,
      hawkmoth: 0,
      seed: 2,
      snail: 1,
      lacewing: 2,
      firefly: 2,
    },
    motionScale: 0.95,
    objectives: {
      any: 6,
      pair: 1,
      seedWing: 1,
      mixedEcho: 1,
      trace: 2,
    },
    instruction: 'Make six combinations: include a pair, Seed & Wing, a matching mixed figure, and two traces.',
    designNote: 'Explicit Enclose/Trace switching.',
    gestures: ['enclose', 'trace'],
    wind: null,
    traceSequence: ['firefly', 'lacewing', 'firefly'],
  },
  {
    id: 'midnight-03',
    number: 12,
    title: 'Tomorrow keeps happening',
    hour: 'midnight',
    hourLabel: 'Midnight · Visit XII',
    scene: 'window',
    transitionText: 'And the world does move. Because tomorrow keeps happening.',
    durationSeconds: 110,
    population: {
      brimstone: 2,
      damselfly: 2,
      hawkmoth: 0,
      seed: 3,
      snail: 1,
      lacewing: 2,
      firefly: 2,
    },
    motionScale: 1.0,
    objectives: {
      any: 7,
      single: 2,
      figure8: 2,
      trace: 2,
      nursery: 1,
      mixedEcho: 1,
    },
    instruction: 'Make seven combinations, including two single loops, two figure-eights, two traces, a Nursery, and a matching mixed figure.',
    designNote: 'Synthesize enclosure, partition, and ordered contact.',
    gestures: ['enclose', 'trace'],
    wind: null,
    traceSequence: ['firefly', 'lacewing', 'firefly'],
  },
];

// Add an ID here only when its scene and mechanics are ready for campaign play.
export const PLAYABLE_LEVEL_IDS = new Set([
  'dawn-01',
  'dawn-02',
  'dawn-03',
  'noon-01',
  'noon-02',
  'noon-03',
]);

export const PRACTICE_LEVELS = [
  {
    id: 'practice-01',
    number: 1,
    title: 'Morning Verge (Sandbox)',
    hour: 'dawn',
    hourLabel: 'Practice · Wave 1',
    scene: 'meadow',
    transitionText: 'Return to the open morning verge for quiet practice.',
    durationSeconds: 60,
    population: {
      brimstone: 3,
      damselfly: 2,
      hawkmoth: 2,
      seed: 2,
      snail: 1,
      lacewing: 0,
      firefly: 0,
    },
    motionScale: 1.0,
    objectives: {
      any: 5,
    },
    instruction: 'Gather five harmonious combinations of any kind.',
    designNote: 'Open sandbox wave 1.',
    gestures: ['enclose'],
    wind: null,
  },
  {
    id: 'practice-02',
    number: 2,
    title: 'Twin Echoes (Sandbox)',
    hour: 'dawn',
    hourLabel: 'Practice · Wave 2',
    scene: 'meadow',
    transitionText: 'Practice bilateral symmetry across two-pocket figure-eights.',
    durationSeconds: 60,
    population: {
      brimstone: 2,
      damselfly: 3,
      hawkmoth: 3,
      seed: 2,
      snail: 1,
      lacewing: 0,
      firefly: 0,
    },
    motionScale: 1.0,
    objectives: {
      any: 4,
    },
    instruction: 'Gather four harmonious combinations: try mirroring species across lobes!',
    designNote: 'Open sandbox wave 2.',
    gestures: ['enclose'],
    wind: null,
  },
];

// A direct test route with the same data, without changing campaign progress.
PRACTICE_LEVELS.push({
  ...CAMPAIGN_LEVELS.find(level => level.id === 'noon-01'),
  id: 'practice-noon',
  title: 'Lunch in the atrium',
  hourLabel: 'Practice · Noon',
});

export const OBJECTIVE_LABELS = {
  any: 'Combinations',
  single: 'Single Loops',
  figure8: 'Figure-Eights',
  pair: 'Kindred Pairs',
  trio: 'Trios of Flight',
  seedWing: 'Seed & Wing Loops',
  counterpartPair: 'Counterpart Pairs',
  lacewingCounterpart: 'Lacewing Counterparts',
  nursery: 'Nursery Polarities',
  mixedEcho: 'Mixed Echoes',
  seedTrio: 'Seed & Trio Loops',
  twinSeedWing: 'Twin Seed & Wings',
  trace: 'Traces',
};

function normalizeKind(kind) {
  if (kind === 'azure') return 'damselfly';
  if (kind === 'roseate') return 'hawkmoth';
  return kind;
}

/**
 * Pure function: derive objective tags from an accepted drawing evaluation
 * per CAMPAIGN.md §5.
 */
export function deriveObjectiveTags(drawingResult, pockets) {
  if (!drawingResult || !drawingResult.valid) return [];
  const tags = ['any'];
  const pCount = pockets ? pockets.length : 0;

  if (pCount === 1) {
    tags.push('single');
    const p = pockets[0];
    const fliers = p.entities.filter(e => e.type === 'butterfly' || e.type === 'insect');
    const seeds = p.entities.filter(e => e.type === 'seed');

    // pair: exactly 2 same-kind fliers and no seeds
    if (fliers.length === 2 && seeds.length === 0) {
      const k1 = normalizeKind(fliers[0].kind);
      const k2 = normalizeKind(fliers[1].kind);
      if (k1 === k2) tags.push('pair');
    }

    // trio: exactly 3 fliers of 3 distinct kinds and no seeds
    if (fliers.length === 3 && seeds.length === 0) {
      const kinds = new Set(fliers.map(f => normalizeKind(f.kind)));
      if (kinds.size === 3) tags.push('trio');
    }

    // seedWing: exactly 1 flier and 1 seed
    if (fliers.length === 1 && seeds.length === 1) {
      tags.push('seedWing');
    }

    // seedTrio: exactly 3 fliers of 3 distinct kinds and 1 seed
    if (fliers.length === 3 && seeds.length === 1) {
      const kinds = new Set(fliers.map(f => normalizeKind(f.kind)));
      if (kinds.size === 3) tags.push('seedTrio');
    }
  } else if (pCount === 2) {
    tags.push('figure8');
    const pA = pockets[0];
    const pB = pockets[1];
    const fliersA = pA.entities.filter(e => e.type === 'butterfly' || e.type === 'insect');
    const seedsA = pA.entities.filter(e => e.type === 'seed');
    const fliersB = pB.entities.filter(e => e.type === 'butterfly' || e.type === 'insect');
    const seedsB = pB.entities.filter(e => e.type === 'seed');

    // nursery: one pocket fliers only (>=1), other seeds only (>=1)
    if ((fliersA.length >= 1 && seedsA.length === 0 && seedsB.length >= 1 && fliersB.length === 0) ||
        (fliersB.length >= 1 && seedsB.length === 0 && seedsA.length >= 1 && fliersA.length === 0)) {
      tags.push('nursery');
    }

    // counterpartPair: each pocket has exactly 1 flier, different kinds, 0 seeds
    if (fliersA.length === 1 && seedsA.length === 0 && fliersB.length === 1 && seedsB.length === 0) {
      const kA = normalizeKind(fliersA[0].kind);
      const kB = normalizeKind(fliersB[0].kind);
      if (kA !== kB) {
        tags.push('counterpartPair');
        if (kA === 'lacewing' || kB === 'lacewing') {
          tags.push('lacewingCounterpart');
        }
      }
    }

    // twinSeedWing: each pocket has exactly 1 flier and 1 seed
    if (fliersA.length === 1 && seedsA.length === 1 && fliersB.length === 1 && seedsB.length === 1) {
      tags.push('twinSeedWing');
    }

    // mixedEcho: identical flier counts by kind, >= 2 distinct kinds in each, 0 seeds
    if (seedsA.length === 0 && seedsB.length === 0 && fliersA.length >= 2 && fliersB.length >= 2) {
      const countsA = {}, countsB = {};
      for (const f of fliersA) {
        const k = normalizeKind(f.kind);
        countsA[k] = (countsA[k] || 0) + 1;
      }
      for (const f of fliersB) {
        const k = normalizeKind(f.kind);
        countsB[k] = (countsB[k] || 0) + 1;
      }
      const kindsA = Object.keys(countsA);
      if (kindsA.length >= 2) {
        let match = true;
        const allKinds = new Set([...kindsA, ...Object.keys(countsB)]);
        for (const k of allKinds) {
          if ((countsA[k] || 0) !== (countsB[k] || 0)) {
            match = false;
            break;
          }
        }
        if (match) tags.push('mixedEcho');
      }
    }
  }

  return tags;
}

const STORAGE_KEY = 'dth_campaign_save_v1';

export class CampaignSaveManager {
  static load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          completedLevelIds: Array.isArray(parsed.completedLevelIds) ? parsed.completedLevelIds : [],
          highestUnlockedIndex: typeof parsed.highestUnlockedIndex === 'number' ? parsed.highestUnlockedIndex : 0,
          bestScores: typeof parsed.bestScores === 'object' && parsed.bestScores !== null ? parsed.bestScores : {},
          currentLevelId: typeof parsed.currentLevelId === 'string' ? parsed.currentLevelId : 'dawn-01',
        };
      }
    } catch {
      // Ignore storage errors
    }
    return {
      completedLevelIds: [],
      highestUnlockedIndex: 0,
      bestScores: {},
      currentLevelId: 'dawn-01',
    };
  }

  static save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage unavailable or full
    }
  }

  static recordVictory(levelId, levelNumber, score) {
    const state = this.load();
    if (!state.completedLevelIds.includes(levelId)) {
      state.completedLevelIds.push(levelId);
    }
    state.bestScores[levelId] = Math.max(state.bestScores[levelId] || 0, score);
    if (levelNumber !== undefined && levelNumber > state.highestUnlockedIndex) {
      state.highestUnlockedIndex = Math.min(CAMPAIGN_LEVELS.length - 1, levelNumber);
    }
    this.save(state);
    return state;
  }
}

export class CampaignManager {
  constructor() {
    this.saveState = CampaignSaveManager.load();
    this.currentMode = 'campaign'; // 'campaign' | 'practice'
    this.currentLevel = CAMPAIGN_LEVELS[0];
    this.objectiveProgress = {};
    this.initProgress(this.currentLevel);
  }

  initProgress(level) {
    this.currentLevel = level;
    this.objectiveProgress = {};
    for (const [key, target] of Object.entries(level.objectives)) {
      this.objectiveProgress[key] = {
        current: 0,
        target,
        label: OBJECTIVE_LABELS[key] || key,
      };
    }
  }

  setLevelById(id) {
    const foundCamp = CAMPAIGN_LEVELS.find(l => l.id === id);
    if (foundCamp && PLAYABLE_LEVEL_IDS.has(foundCamp.id)) {
      this.currentMode = 'campaign';
      this.initProgress(foundCamp);
      this.saveState.currentLevelId = id;
      CampaignSaveManager.save(this.saveState);
      return foundCamp;
    }
    const foundPrac = PRACTICE_LEVELS.find(l => l.id === id);
    if (foundPrac) {
      this.currentMode = 'practice';
      this.initProgress(foundPrac);
      return foundPrac;
    }
    return this.currentLevel;
  }

  getNextLevel() {
    if (this.currentMode === 'practice') {
      return null;
    }
    const idx = CAMPAIGN_LEVELS.findIndex(l => l.id === this.currentLevel.id);
    if (idx >= 0 && idx < CAMPAIGN_LEVELS.length - 1) {
      const next = CAMPAIGN_LEVELS[idx + 1];
      return PLAYABLE_LEVEL_IDS.has(next.id) ? next : null;
    }
    return null;
  }

  processDrawing(evalResult, pockets, clock) {
    const tags = deriveObjectiveTags(evalResult, pockets);
    let advancedObjective = false;

    for (const [key, obj] of Object.entries(this.objectiveProgress)) {
      if (tags.includes(key) && obj.current < obj.target) {
        obj.current += 1;
        advancedObjective = true;
      }
    }

    if (advancedObjective && clock) {
      // Award time bonus once per qualifying drawing
      clock.addTime(4);
    }

    const allComplete = this.isComplete();
    return {
      advancedObjective,
      tags,
      allComplete,
    };
  }

  isComplete() {
    return Object.values(this.objectiveProgress).every(obj => obj.current >= obj.target);
  }

  recordVictory(score) {
    if (this.currentMode === 'campaign') {
      this.saveState = CampaignSaveManager.recordVictory(
        this.currentLevel.id,
        this.currentLevel.number,
        score
      );
    }
  }
}
