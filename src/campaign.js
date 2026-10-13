/**
 * Drawing the Hours — Campaign Module
 * Defines the 24-visit authored campaign across Dawn, Noon, Dusk, and Midnight.
 * Implements objective tag derivation, progress evaluation, and persistence.
 * Based on CAMPAIGN.md, campaign-plan.json, and first12levels.md.
 */

import { storage } from './storage.js';

export const TRACE_FIREFLY = ['firefly', 'lacewing', 'firefly'];
const TRACE_LACEWING = ['lacewing', 'firefly', 'lacewing'];

const NOON_WIND = {
  periodSeconds: 12,
  warningSeconds: 2,
  gustSeconds: 2,
  directions: ['right', 'left'],
  seedSpeedPlayWidthsPerSecond: 0.08,
};

// Six visits an hour. A visit adds at most one thing, the visits between let it
// settle, and the sixth adds nothing: it asks for what the hour has taught.
export const CAMPAIGN_LEVELS = [
  // --- DAWN (Levels 1–6) ---
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
    instruction: 'Draw four loops, each around two insects of the same kind.',
    designNote: 'Two Brimstones make the first available pair; no hazards or seed distraction. The clock waits for the first loop.',
    gestures: ['string'],
    stringRules: true,
    wind: null,
    clockStartsOnFirstCombination: true,
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
      brimstone: 3,
      damselfly: 3,
      hawkmoth: 0,
      seed: 0,
      snail: 0,
      lacewing: 0,
      firefly: 0,
    },
    motionScale: 0.85,
    objectives: {
      pair: 5,
    },
    instruction: 'Draw five loops, each around two insects of the same kind.',
    designNote: 'Nothing new. The two kinds are now equal in number, so a matching pair has to be picked out of a mixed field, and the clock runs from the start.',
    gestures: ['string'],
    stringRules: true,
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
      hawkmoth: 0,
      seed: 3,
      snail: 0,
      lacewing: 0,
      firefly: 0,
    },
    motionScale: 0.85,
    objectives: {
      any: 5,
      seedWing: 2,
    },
    instruction: 'Make five combinations, including two loops with one insect and one seed.',
    designNote: 'Add airborne seeds on a field with no hazard, so Seed & Wing is learned before anything can spoil it.',
    gestures: ['string'],
    stringRules: true,
    wind: null,
  },
  {
    id: 'dawn-04',
    number: 4,
    title: 'In my thirties',
    hour: 'dawn',
    hourLabel: 'Dawn · Visit IV',
    scene: 'curb',
    transitionText: "In my thirties, I still don't feel like an adult sometimes.",
    durationSeconds: 85,
    population: {
      brimstone: 2,
      damselfly: 2,
      hawkmoth: 0,
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
    instruction: 'Make five combinations, including two loops with one insect and one seed. Draw around the snail.',
    designNote: 'Add a mid-field snail that spoils any loop holding it; the cast and the requirement repeat the visit before.',
    gestures: ['string'],
    stringRules: true,
    wind: null,
    snailRoute: 'seam',
  },
  {
    id: 'dawn-05',
    number: 5,
    title: 'Hard to save',
    hour: 'dawn',
    hourLabel: 'Dawn · Visit V',
    scene: 'curb',
    transitionText: "It's hard to save, and prices keep getting higher.",
    durationSeconds: 90,
    population: {
      brimstone: 2,
      damselfly: 2,
      hawkmoth: 2,
      seed: 0,
      snail: 1,
      lacewing: 0,
      firefly: 0,
    },
    motionScale: 0.85,
    objectives: {
      any: 4,
      trio: 2,
    },
    instruction: 'Make four combinations, including two loops with three different kinds of insect.',
    designNote: 'Introduce the Roseate Hawkmoth for wide trio loops while the mid-field snail keeps crawling.',
    gestures: ['string'],
    stringRules: true,
    wind: null,
    snailRoute: 'seam',
  },
  {
    id: 'dawn-06',
    number: 6,
    title: 'Not how I imagined',
    hour: 'dawn',
    hourLabel: 'Dawn · Visit VI',
    scene: 'curb',
    transitionText: 'This is not how I imagined adulthood.',
    durationSeconds: 100,
    population: {
      brimstone: 2,
      damselfly: 2,
      hawkmoth: 2,
      seed: 2,
      snail: 1,
      lacewing: 0,
      firefly: 0,
    },
    motionScale: 0.9,
    objectives: {
      any: 6,
      pair: 1,
      seedWing: 2,
      trio: 1,
    },
    instruction: 'Make six combinations, including a matching pair, two loops with one insect and one seed, and a loop with three different kinds.',
    designNote: 'Nothing new. Every Dawn figure on one field: three kinds, seeds, and the seam snail, so a trio has to be closed clear of the seeds.',
    gestures: ['string'],
    stringRules: true,
    wind: null,
    snailRoute: 'seam',
  },

  // --- NOON (Levels 7–12) ---
  {
    id: 'noon-01',
    number: 7,
    title: 'Lunch in the atrium',
    hour: 'noon',
    hourLabel: 'Noon · Visit VII',
    scene: 'atrium',
    transitionText: 'Today, for lunch, I bought myself a sandwich.',
    durationSeconds: 90,
    population: {
      brimstone: 2,
      damselfly: 0,
      hoverfly: 2,
      hawkmoth: 2,
      seed: 0,
      snail: 0,
      lacewing: 0,
      firefly: 0,
      bean: 1,
    },
    motionScale: 0.8,
    objectives: {
      any: 6,
      trio: 2,
    },
    instruction: 'Make six combinations, including two loops with three different kinds of insect. Draw over a flax flower to lengthen your next cord.',
    designNote: 'Teach the bean on a clear field. Noon asks for more drawings than Dawn in the same time: the pressure is the count, not the shape.',
    gestures: ['string'],
    stringRules: true,
    wind: null,
  },
  {
    id: 'noon-02',
    number: 8,
    title: 'For now',
    hour: 'noon',
    hourLabel: 'Noon · Visit VIII',
    scene: 'atrium',
    transitionText: "I don't know how much longer my job will exist.",
    durationSeconds: 110,
    population: {
      brimstone: 2,
      damselfly: 0,
      hoverfly: 2,
      hawkmoth: 0,
      seed: 3,
      snail: 0,
      lacewing: 0,
      firefly: 0,
      bean: 1,
    },
    motionScale: 0.85,
    objectives: {
      any: 6,
      seedWing: 3,
    },
    instruction: 'Make six combinations, including three loops with one insect and one seed. A gust carries the seeds sideways; streaks cross the field two seconds before it.',
    designNote: 'Introduce the two-second gusts alone. Nothing cuts the cord yet, so the only new judgement is when to close around a drifting seed.',
    gestures: ['string'],
    stringRules: true,
    wind: { ...NOON_WIND },
  },
  {
    id: 'noon-03',
    number: 9,
    title: 'The glass and the leaves',
    hour: 'noon',
    hourLabel: 'Noon · Visit IX',
    scene: 'atrium',
    transitionText: 'This atrium makes me feel calmer.',
    durationSeconds: 110,
    population: {
      brimstone: 2,
      damselfly: 0,
      hoverfly: 2,
      hawkmoth: 0,
      seed: 3,
      snail: 0,
      lacewing: 0,
      firefly: 0,
      hornet: 1,
      bean: 1,
    },
    motionScale: 0.85,
    objectives: {
      any: 6,
      seedWing: 3,
    },
    instruction: 'Make six combinations, including three loops with one insect and one seed. The hornet cuts a cord it touches.',
    designNote: 'Introduce the wandering hornet on the field the gusts were learned on. The recipes stay simple and the count rises, so the visit asks for speed rather than care.',
    gestures: ['string'],
    stringRules: true,
    wind: { ...NOON_WIND },
  },
  {
    id: 'noon-04',
    number: 10,
    title: 'At my age',
    hour: 'noon',
    hourLabel: 'Noon · Visit X',
    scene: 'atrium',
    transitionText: 'At my age, my mother already held a high company position.',
    durationSeconds: 110,
    population: {
      brimstone: 2,
      damselfly: 0,
      hoverfly: 2,
      hawkmoth: 2,
      seed: 2,
      snail: 0,
      lacewing: 0,
      firefly: 0,
      hornet: 1,
      bean: 1,
    },
    motionScale: 0.85,
    objectives: {
      any: 6,
      seedTrio: 1,
    },
    instruction: 'Make six combinations, including one loop with a seed and three different insects. Pick a flax flower first: the loop is a long one.',
    designNote: 'Introduce Seed & Trio, once, with the hornet and the gusts already familiar and no web. The bean is what makes the four-target loop reachable.',
    gestures: ['string'],
    stringRules: true,
    wind: { ...NOON_WIND },
  },
  {
    id: 'noon-05',
    number: 11,
    title: 'Six years old',
    hour: 'noon',
    hourLabel: 'Noon · Visit XI',
    scene: 'atrium',
    transitionText: 'I was already six years old.',
    durationSeconds: 105,
    population: {
      brimstone: 2,
      damselfly: 0,
      hoverfly: 2,
      hawkmoth: 2,
      seed: 2,
      snail: 0,
      lacewing: 0,
      firefly: 0,
      hornet: 1,
      web: 1,
      bean: 1,
    },
    motionScale: 0.85,
    objectives: {
      any: 6,
      seedWing: 2,
      trio: 1,
    },
    instruction: 'Make six combinations, including two loops with one insect and one seed, and one loop with three different kinds. The web cuts a cord that touches it.',
    designNote: 'Introduce the web under figures the player already draws quickly. It hangs where it will hang in the next visit.',
    webPatches: [[0.29, 0.31]],
    gestures: ['string'],
    stringRules: true,
    wind: { ...NOON_WIND },
  },
  {
    id: 'noon-06',
    number: 12,
    title: 'A future like that',
    hour: 'noon',
    hourLabel: 'Noon · Visit XII',
    scene: 'atrium',
    transitionText: "It's hard for me to think of a future like that.",
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
      hornet: 1,
      web: 1,
      bean: 1,
    },
    motionScale: 0.85,
    objectives: {
      any: 6,
      seedTrio: 2,
    },
    instruction: 'Make six combinations, including two loops with a seed and three different insects. The web and the hornet cut a cord they touch.',
    designNote: 'Nothing new. The longest loop of the day against the web, the hornet, and the breeze, and five more drawings around it.',
    webPatches: [[0.29, 0.31]],
    gestures: ['string'],
    stringRules: true,
    wind: { ...NOON_WIND },
  },

  // --- DUSK (Levels 13–18) ---
  {
    id: 'dusk-01',
    number: 13,
    title: 'The way through',
    hour: 'dusk',
    hourLabel: 'Dusk · Visit XIII',
    scene: 'passage',
    transitionText: 'I always find myself walking home through here.',
    durationSeconds: 100,
    population: {
      brimstone: 0,
      damselfly: 0,
      hoverfly: 2,
      hawkmoth: 0,
      seed: 0,
      snail: 0,
      lacewing: 2,
      firefly: 0,
    },
    motionScale: 0.85,
    objectives: {
      any: 5,
      lacewingCounterpart: 2,
    },
    instruction: 'Cross the cord to make two pockets. Make five combinations, including two figure-eights with a lacewing and a hoverfly in separate pockets.',
    designNote: 'Teach the waist crossing. A resting lacewing and a holding hoverfly are the stillest pair in the game, so the new shape is learned against targets that wait.',
    gestures: ['string'],
    stringRules: true,
    wind: null,
  },
  {
    id: 'dusk-02',
    number: 14,
    title: 'The gaps in the sound',
    hour: 'dusk',
    hourLabel: 'Dusk · Visit XIV',
    scene: 'passage',
    transitionText: "I can hear the cicadas. And sometimes I can't.",
    durationSeconds: 100,
    population: {
      brimstone: 2,
      damselfly: 0,
      hoverfly: 2,
      hawkmoth: 0,
      seed: 0,
      snail: 0,
      lacewing: 2,
      firefly: 0,
    },
    motionScale: 0.85,
    objectives: {
      any: 5,
      counterpartPair: 3,
    },
    instruction: 'Make five combinations, including three figure-eights with two different kinds in separate pockets.',
    designNote: 'Nothing new on the field. Brimstones join, so the figure-eight is drawn around a flier that does not wait. The cicada layer plays here.',
    gestures: ['string'],
    stringRules: true,
    wind: null,
    cicadas: true,
  },
  {
    id: 'dusk-03',
    number: 15,
    title: 'Carrying something home',
    hour: 'dusk',
    hourLabel: 'Dusk · Visit XV',
    scene: 'passage',
    transitionText: 'Bringing home medicine today.',
    durationSeconds: 100,
    population: {
      brimstone: 2,
      damselfly: 0,
      hoverfly: 2,
      hawkmoth: 0,
      seed: 3,
      snail: 0,
      lacewing: 2,
      firefly: 0,
    },
    motionScale: 0.85,
    objectives: {
      any: 5,
      nursery: 2,
    },
    instruction: 'Make five combinations, including two Nurseries: one flier in one pocket and one seed in the other.',
    designNote: 'Add seeds to the resting-insect field and introduce the Nursery, with no snail and no flax flower yet.',
    gestures: ['string'],
    stringRules: true,
    wind: null,
  },
  {
    id: 'dusk-04',
    number: 16,
    title: 'Almost nominal',
    hour: 'dusk',
    hourLabel: 'Dusk · Visit XVI',
    scene: 'passage',
    transitionText: 'Some health coverages are almost nominal.',
    durationSeconds: 95,
    population: {
      bean: 1,
      brimstone: 2,
      damselfly: 0,
      hoverfly: 2,
      hawkmoth: 0,
      seed: 3,
      snail: 1,
      lacewing: 2,
      firefly: 0,
    },
    beanRegrowSeconds: 24,
    motionScale: 0.85,
    objectives: {
      any: 5,
      nursery: 1,
      lacewingCounterpart: 1,
    },
    instruction: 'Make five combinations, including a Nursery (1 flier and 1 seed) and a lacewing Counterpart Pair. The snail and the flax flower are back.',
    designNote: 'The snail and the flax flower return to the Nursery field; defer mixed Echoes pending gesture calibration.',
    gestures: ['string'],
    stringRules: true,
    wind: null,
  },
  {
    id: 'dusk-05',
    number: 17,
    title: 'The long way home',
    hour: 'dusk',
    hourLabel: 'Dusk · Visit XVII',
    scene: 'passage',
    transitionText: 'The long way home, where I pass by tall grasses and scrap metal',
    durationSeconds: 100,
    population: {
      brimstone: 2,
      damselfly: 0,
      hoverfly: 2,
      hawkmoth: 0,
      seed: 2,
      snail: 1,
      lacewing: 2,
      firefly: 0,
    },
    motionScale: 0.9,
    objectives: {
      any: 5,
      single: 2,
      figure8: 2,
    },
    instruction: 'Make five combinations, including two single loops and two figure-eights.',
    designNote: 'First visit that asks for both shapes by name. Six fliers, so the switch is practised before the field fills.',
    gestures: ['string'],
    stringRules: true,
    wind: null,
  },
  {
    id: 'dusk-06',
    number: 18,
    title: 'What places absorb',
    hour: 'dusk',
    hourLabel: 'Dusk · Visit XVIII',
    scene: 'passage',
    transitionText: 'Some places absorb what developments expel.',
    durationSeconds: 100,
    population: {
      brimstone: 2,
      damselfly: 0,
      hoverfly: 2,
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
    designNote: 'Nothing new. Require switching gestures amid eight fliers.',
    gestures: ['string'],
    stringRules: true,
    wind: null,
  },

  // --- MIDNIGHT (Levels 19–24) ---
  {
    id: 'midnight-01',
    number: 19,
    title: 'Trying to sleep',
    hour: 'midnight',
    hourLabel: 'Midnight · Visit XIX',
    scene: 'window',
    transitionText: "I'm trying to sleep.",
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
    instruction: 'Thread firefly, lacewing, then another firefly. Release to complete the trace.',
    designNote: 'Introduce fireflies and Trace as threading in sequence under one-gesture string rules.',
    gestures: ['string'],
    stringRules: true,
    wind: null,
    traceSequence: TRACE_FIREFLY,
  },
  {
    id: 'midnight-02',
    number: 20,
    title: 'Rows of car lights',
    hour: 'midnight',
    hourLabel: 'Midnight · Visit XX',
    scene: 'window',
    transitionText: 'I dream about endless rows of car lights.',
    durationSeconds: 105,
    population: {
      brimstone: 0,
      damselfly: 0,
      hoverfly: 2,
      hawkmoth: 0,
      seed: 0,
      snail: 0,
      lacewing: 2,
      firefly: 3,
    },
    motionScale: 0.9,
    objectives: {
      trace: 4,
    },
    instruction: 'Make four traces: firefly, lacewing, then another firefly. A hoverfly threaded on the way spoils the trace.',
    designNote: 'Nothing new. Hoverflies stand in the way of the same trace, so the line has to be routed and not only ordered.',
    gestures: ['string'],
    stringRules: true,
    wind: null,
    traceSequence: TRACE_FIREFLY,
  },
  {
    id: 'midnight-03',
    number: 21,
    title: 'Day shift, night shift',
    hour: 'midnight',
    hourLabel: 'Midnight · Visit XXI',
    scene: 'window',
    transitionText: "I don't know if I like the day shift or night shift more.",
    durationSeconds: 110,
    population: {
      brimstone: 0,
      damselfly: 0,
      hoverfly: 2,
      hawkmoth: 0,
      seed: 2,
      snail: 0,
      lacewing: 2,
      firefly: 3,
    },
    motionScale: 0.95,
    objectives: {
      any: 6,
      pair: 1,
      seedWing: 1,
      figure8: 1,
      trace: 2,
    },
    instruction: 'Make six combinations: include a pair, Seed & Wing, a figure-eight, and two traces.',
    designNote: 'Add seeds to the familiar cast; combine looping and threading without mode switching. Xyh played it through without help.',
    gestures: ['string'],
    stringRules: true,
    wind: null,
    traceSequence: TRACE_FIREFLY,
  },
  {
    id: 'midnight-04',
    number: 22,
    title: 'The window corner',
    hour: 'midnight',
    hourLabel: 'Midnight · Visit XXII',
    scene: 'window',
    transitionText: "I wake up often, and there's always rustling in the corner.",
    durationSeconds: 110,
    population: {
      brimstone: 0,
      damselfly: 0,
      hoverfly: 2,
      hawkmoth: 0,
      seed: 2,
      snail: 0,
      lacewing: 2,
      firefly: 3,
    },
    motionScale: 0.95,
    objectives: {
      any: 5,
      lacewingTrace: 3,
    },
    instruction: 'A second trace: thread lacewing, firefly, then the other lacewing. Make five combinations, including three of these.',
    designNote: 'Introduce the second Trace recipe, the first one turned round: two resting ends and a moving middle, so the player waits for a firefly to pass between the leaves. Only this recipe scores as a trace here.',
    gestures: ['string'],
    stringRules: true,
    wind: null,
    traceSequence: TRACE_LACEWING,
  },
  {
    id: 'midnight-05',
    number: 23,
    title: 'Figures',
    hour: 'midnight',
    hourLabel: 'Midnight · Visit XXIII',
    scene: 'window',
    transitionText: 'Just tracing figures, while the world moves around me.',
    durationSeconds: 110,
    population: {
      brimstone: 0,
      damselfly: 0,
      hoverfly: 2,
      hawkmoth: 0,
      seed: 2,
      snail: 0,
      lacewing: 2,
      firefly: 3,
      jasmine: 1,
    },
    motionScale: 0.95,
    objectives: {
      any: 6,
      single: 2,
      figure8: 1,
      trace: 2,
      lacewingTrace: 1,
    },
    instruction: 'Make six combinations, including two single loops, a figure-eight, and two traces, one of them lacewing first. The jasmine settles one insect at a time.',
    designNote: 'Introduce the night jasmine on the cast of the two visits before. Both Trace recipes score from here on.',
    jasminePlaces: [[0.18, 0.4]],
    gestures: ['string'],
    stringRules: true,
    wind: null,
    traceSequence: TRACE_FIREFLY,
    traceSequences: [TRACE_FIREFLY, TRACE_LACEWING],
  },
  {
    id: 'midnight-06',
    number: 24,
    title: 'Tomorrow keeps happening',
    hour: 'midnight',
    hourLabel: 'Midnight · Visit XXIV',
    scene: 'window',
    transitionText: 'And the world does move. Because tomorrow keeps happening.',
    durationSeconds: 110,
    population: {
      bean: 1,
      brimstone: 2,
      damselfly: 0,
      hoverfly: 2,
      hawkmoth: 0,
      seed: 2,
      snail: 1,
      lacewing: 2,
      firefly: 3,
      jasmine: 1,
    },
    beanRegrowSeconds: 24,
    motionScale: 1.0,
    objectives: {
      any: 7,
      single: 2,
      figure8: 2,
      trace: 2,
      nursery: 1,
    },
    instruction: 'Make seven combinations, including two single loops, two figure-eights, two traces of either kind, and a Nursery.',
    designNote: 'Nothing new. Brimstones, one perimeter snail, and the flax flower return; every gesture of the day on the fullest field, with the jasmine to thin it.',
    jasminePlaces: [[0.18, 0.4]],
    gestures: ['string'],
    stringRules: true,
    wind: null,
    traceSequence: TRACE_FIREFLY,
    traceSequences: [TRACE_FIREFLY, TRACE_LACEWING],
  },
];

// Add an ID here only when its scene and mechanics are ready for campaign play.
export const PLAYABLE_LEVEL_IDS = new Set(
  ['dawn', 'noon', 'dusk', 'midnight'].flatMap(
    hour => [1, 2, 3, 4, 5, 6].map(n => `${hour}-0${n}`)
  )
);

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

PRACTICE_LEVELS.push({
  ...CAMPAIGN_LEVELS.find(level => level.id === 'dusk-01'),
  id: 'practice-dusk', title: 'The way through', hourLabel: 'Practice · Dusk',
});

PRACTICE_LEVELS.push({
  ...CAMPAIGN_LEVELS.find(level => level.id === 'midnight-01'),
  id: 'practice-midnight', title: 'The window corner', hourLabel: 'Practice · Midnight',
});

PRACTICE_LEVELS.push({
  id: 'practice-string',
  number: 'S',
  title: 'String sandbox',
  hour: 'dawn',
  hourLabel: 'Practice · String Sandbox',
  scene: 'curb',
  transitionText: 'An open sandbox practicing one-gesture string rules: cord walls, threading, and cord snapping.',
  durationSeconds: 120,
  population: {
    brimstone: 2,
    damselfly: 2,
    hawkmoth: 0,
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
  instruction: 'The held cord is a wall. Avoid threading insects as beads. Draw within the cord length limit.',
  designNote: 'String sandbox practice verge with Dawn II cast and one-gesture rules.',
  gestures: ['string'],
  stringRules: true,
  wind: null,
  snailRoute: 'seam',
});

PRACTICE_LEVELS.push({
  id: 'practice-string-trace',
  number: 'T',
  title: 'String Trace sandbox',
  hour: 'midnight',
  hourLabel: 'Practice · String Trace Sandbox',
  scene: 'window',
  transitionText: 'Practice threading in sequence under one-gesture string rules: firefly → lacewing → different firefly.',
  durationSeconds: 120,
  population: {
    brimstone: 0,
    damselfly: 0,
    hawkmoth: 0,
    seed: 0,
    snail: 1,
    lacewing: 2,
    firefly: 3,
  },
  motionScale: 0.85,
  objectives: {
    any: 4,
    trace: 3,
  },
  traceSequence: ['firefly', 'lacewing', 'firefly'],
  instruction: 'Thread three insects in sequence: Firefly → Lacewing → different Firefly. Avoid other contacts and the snail.',
  designNote: 'String sandbox practicing ordered trace threading with Window fireflies and Paper lacewings.',
  gestures: ['string'],
  stringRules: true,
  wind: null,
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
  lacewingTrace: 'Lacewing-First Traces',
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
  if (drawingResult.mode === 'trace' || drawingResult.recipeType === 'ORDERED_TRACE') {
    // Every ordered trace is a trace; the second recipe also carries its own tag.
    return drawingResult.traceSequence?.[0] === 'lacewing' ? ['any', 'trace', 'lacewingTrace'] : ['any', 'trace'];
  }
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

    // nursery: exactly 1 flier in one pocket, exactly 1 seed in the other
    if ((fliersA.length === 1 && seedsA.length === 0 && seedsB.length === 1 && fliersB.length === 0) ||
        (fliersB.length === 1 && seedsB.length === 0 && seedsA.length === 1 && fliersA.length === 0)) {
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

/**
 * True when the player has unlocked or completed at least one visit of that hour.
 * The visit list and the Field Book both use it, so a Dawn player is not shown
 * Midnight's species and figures before reaching them.
 */
export function isHourReached(saveState, hour) {
  if (hour === 'dawn') return true;
  const highest = saveState?.highestUnlockedIndex || 0;
  const completed = saveState?.completedLevelIds || [];
  return CAMPAIGN_LEVELS.some(
    (level, index) => level.hour === hour && (index <= highest || completed.includes(level.id))
  );
}

// v2: the campaign grew from twelve visits to twenty-four and the ids moved, so a v1 save points at the wrong visits.
const STORAGE_KEY = 'dth_campaign_save_v2';

export class CampaignSaveManager {
  static load() {
    try {
      const raw = storage.getItem(STORAGE_KEY);
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
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
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

  static unlockAll() {
    const state = this.load();
    state.highestUnlockedIndex = CAMPAIGN_LEVELS.length - 1;
    this.save(state);
    return state;
  }

  static reset() {
    try {
      storage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    return this.load();
  }
}

export class CampaignManager {
  constructor() {
    this.saveState = CampaignSaveManager.load();
    this.currentMode = 'campaign'; // 'campaign' | 'practice'
    // A reload resumes the saved visit (CAMPAIGN.md, save section). An unknown or
    // not-yet-playable saved ID falls back to the first visit.
    const saved = CAMPAIGN_LEVELS.find(
      level => level.id === this.saveState.currentLevelId && PLAYABLE_LEVEL_IDS.has(level.id)
    );
    this.resumedFromSave = Boolean(saved) && saved.id !== CAMPAIGN_LEVELS[0].id;
    this.currentLevel = saved || CAMPAIGN_LEVELS[0];
    // The untimed practice copy of a campaign visit, built on demand after a failure.
    this.practiceVisit = null;
    this.objectiveProgress = {};
    this.initProgress(this.currentLevel);
  }

  /**
   * Untimed practice copy of a campaign visit, offered after a failure.
   * It keeps the visit's cast and objectives, runs in practice mode, and so
   * writes no completion, unlock, or best score (CAMPAIGN.md, retry section).
   */
  startPracticeOf(levelId) {
    const source = CAMPAIGN_LEVELS.find(level => level.id === levelId);
    if (!source) return null;
    this.practiceVisit = {
      ...source,
      id: 'practice-visit',
      hourLabel: `Practice · ${source.hourLabel}`,
      practiceOf: source.id,
      untimed: true,
      clockStartsOnFirstCombination: false,
    };
    this.currentMode = 'practice';
    this.initProgress(this.practiceVisit);
    return this.practiceVisit;
  }

  unlockAll() {
    this.saveState = CampaignSaveManager.unlockAll();
    return this.saveState;
  }

  reset() {
    this.saveState = CampaignSaveManager.reset();
    return this.saveState;
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
    if (this.practiceVisit && id === this.practiceVisit.id) {
      this.currentMode = 'practice';
      this.initProgress(this.practiceVisit);
      return this.practiceVisit;
    }
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
