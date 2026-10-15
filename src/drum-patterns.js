// Copied from dthdrums/src/patterns.js, 2026-10-16. Source unversioned.
// Source SHA-256: a71e620e703f60d70ffbaf5a680b0fdc5da143d06ae2c626e5060869c8dfa8b2
/**
 * Rhythmic patterns for Drawing the Hours found-object percussion.
 *
 * Characteristics:
 * - Subtle dynamics (sub-lullaby levels)
 * - Non-4/4 meters (5/8, 7/8, 11/16, polymetric)
 * - Euclidean distribution options
 * - Decoupled tempo / drift parameters
 */

export const EUCLIDEAN = (steps, pulses, rotate = 0) => {
  const pattern = new Array(steps).fill(0);
  let bucket = 0;
  for (let i = 0; i < steps; i++) {
    bucket += pulses;
    if (bucket >= steps) {
      bucket -= steps;
      pattern[i] = 1;
    }
  }
  if (rotate > 0) {
    const r = rotate % steps;
    return pattern.slice(r).concat(pattern.slice(0, r));
  }
  return pattern;
};

export const PATTERNS = {
  titleIntro: {
    id: 'titleIntro',
    name: 'Title Intro (5/8 Pocket Watch & Pencil Lilt)',
    kit: 'study_desk',
    meter: { beats: 5, division: 8 },
    steps: 5,
    baseBpm: 76,
    tempoDrift: {
      enabled: true,
      depth: 0.05,       // +/- 5% tempo fluctuation
      cycleSeconds: 28   // gentle 28-second breathing wave
    },
    humanizeMs: 8,        // +/- 8ms microtiming jitter
    subtletyGain: 0.18,   // quiet and delicate under xylophone
    layers: [
      // 3 + 2 lilt:
      // Steps 0, 1, 2 = 3 eighths; Steps 3, 4 = 2 eighths
      [0, 'pencil_wood', 0.75, 1.0],
      [0, 'tick_high', 0.55, 1.0],
      [1, 'tick_low', 0.40, 0.85],
      [2, 'nail_tap', 0.45, 0.90],
      [3, 'pencil_tip', 0.65, 0.95],
      [3, 'tick_high', 0.50, 0.85],
      [4, 'tick_low', 0.45, 0.85],
      [4, 'paper_snip', 0.30, 0.35],
      [4, 'match_slide', 0.25, 0.25]
    ]
  },

  studyDesk58: {
    id: 'studyDesk58',
    name: 'Study Desk 5/8 (3+2 Lilt)',
    kit: 'study_desk',
    meter: { beats: 5, division: 8 },
    steps: 5,
    baseBpm: 74,
    tempoDrift: {
      enabled: true,
      depth: 0.06,      // +/- 6% tempo fluctuation
      cycleSeconds: 24   // gentle 24-second breathing wave
    },
    humanizeMs: 8,       // +/- 8ms microtiming jitter
    subtletyGain: 0.22,  // master pattern gain
    layers: [
      // [step, voiceId, velocity, chance]
      // Steps 0, 1, 2 = group of 3; Steps 3, 4 = group of 2
      [0, 'pencil_wood', 0.85, 1.0],
      [0, 'tick_high', 0.60, 1.0],
      [1, 'tick_low', 0.45, 0.9],
      [2, 'tick_high', 0.55, 0.95],
      [3, 'pencil_tip', 0.70, 0.9],
      [3, 'tick_low', 0.50, 0.85],
      [4, 'nail_tap', 0.40, 0.75],
      [4, 'paper_snip', 0.35, 0.40]
    ]
  },

  abacusMarble78: {
    id: 'abacusMarble78',
    name: 'Abacus & Glass 7/8 (2+2+3 Balkan)',
    kit: 'glass_bead',
    meter: { beats: 7, division: 8 },
    steps: 7,
    baseBpm: 92,
    tempoDrift: {
      enabled: true,
      depth: 0.05,
      cycleSeconds: 32
    },
    humanizeMs: 10,
    subtletyGain: 0.20,
    layers: [
      // 2 + 2 + 3 accent grid: 0..1, 2..3, 4..5..6
      [0, 'abacus_clack_1', 0.80, 1.0],
      [1, 'marble_1', 0.45, 0.7],
      [2, 'abacus_clack_2', 0.70, 0.95],
      [3, 'marble_2', 0.50, 0.75],
      [4, 'cup_tap', 0.75, 0.9],
      [5, 'abacus_clack_1', 0.50, 0.85],
      [6, 'cup_ring', 0.45, 0.6],
      [6, 'marble_1', 0.35, 0.4]
    ]
  },

  duskDroplets1116: {
    id: 'duskDroplets1116',
    name: 'Dusk Droplets 11/16 (Euclidean 4 in 11)',
    kit: 'water_tactile',
    meter: { beats: 11, division: 16 },
    steps: 11,
    baseBpm: 108, // sixteenths bpm (approx 54 eighths bpm)
    tempoDrift: {
      enabled: true,
      depth: 0.08,
      cycleSeconds: 18
    },
    humanizeMs: 12,
    subtletyGain: 0.24,
    layers: [
      // Euclidean 4 in 11 on water_drop_high: hits on [0, 3, 6, 8]
      [0, 'water_drop_high', 0.85, 1.0],
      [1, 'button_click_a', 0.35, 0.6],
      [3, 'water_drop_high', 0.75, 0.95],
      [4, 'button_click_b', 0.40, 0.5],
      [6, 'water_drop_low', 0.80, 0.9],
      [7, 'button_click_a', 0.30, 0.65],
      [8, 'water_drop_high', 0.70, 0.85],
      [10, 'toy_ratchet', 0.35, 0.35]
    ]
  },

  phasingPendulum: {
    id: 'phasingPendulum',
    name: 'Phasing Desk Pendulum (5 against 6 Drift)',
    mode: 'phasing',
    subtletyGain: 0.18,
    streams: [
      {
        name: 'Stream A (Watch & Pencil)',
        kit: 'study_desk',
        steps: 5,
        stepDuration: 0.280, // seconds per step
        layers: [
          [0, 'tick_high', 0.7, 1.0],
          [2, 'pencil_tip', 0.6, 0.9],
          [3, 'tick_low', 0.5, 0.85]
        ]
      },
      {
        name: 'Stream B (Abacus & Marble)',
        kit: 'glass_bead',
        steps: 6,
        stepDuration: 0.286, // slightly slower, creates continuous Reichian phase drift
        layers: [
          [0, 'abacus_clack_1', 0.65, 0.9],
          [3, 'marble_1', 0.55, 0.8],
          [5, 'nail_tap', 0.40, 0.7]
        ]
      }
    ]
  },

  aleatoricFidgets: {
    id: 'aleatoricFidgets',
    name: 'Midnight Fidgets (Sporadic Deskside Bursts)',
    mode: 'aleatoric',
    kit: 'study_desk',
    subtletyGain: 0.25,
    minInterval: 8.0,    // seconds between bursts
    maxInterval: 20.0,
    burstCount: [3, 6],  // 3 to 6 hits per gesture
    burstSpan: [0.6, 1.8], // spread across 0.6s to 1.8s
    voices: ['pencil_wood', 'pencil_tip', 'tick_high', 'match_slide', 'nail_tap', 'paper_snip']
  }
};
