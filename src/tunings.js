// One microtonal tuning per hour, for the hour's song and its chimes.
//
// Each is copied from a Scala file in tabota/scala/ (named in `scl`), not
// fetched from it: the game is exported and played offline, and a live import
// across repositories breaks silently when the other folder moves.
// test/test_music.js reads the .scl files when tabota/ sits beside this
// folder and fails if a copy here has drifted from its source.
//
// `cents`: the scale's degrees above the root, first degree 0, without the
// period. `period`: the interval in cents at which the scale repeats, 1200 for
// an octave. Bohlen-Pierce repeats at the tritave, 3/1.

export const TUNINGS = {
  dawn: {
    name: 'Harmonics 8 to 16',
    scl: 'just/harmonic_8_16.scl',
    // 9/8 10/8 11/8 12/8 13/8 14/8 15/8 over 8/8: pure, with the 11th and 13th
    // harmonics as the two notes no piano has.
    cents: [0, 203.91000, 386.31371, 551.31794, 701.95500, 840.52766, 968.82590, 1088.26871],
    period: 1200,
  },
  noon: {
    name: '19-EDO',
    scl: 'equal/19edo.scl',
    cents: Array.from({ length: 19 }, (_, i) => i * 1200 / 19),
    period: 1200,
  },
  dusk: {
    name: '5-EDO, slendro-like',
    scl: 'xenharmonic/wholetone_5edo.scl',
    cents: [0, 240, 480, 720, 960],
    period: 1200,
  },
  midnight: {
    name: 'Bohlen-Pierce, 13 equal divisions of 3/1',
    scl: 'xenharmonic/bohlen_pierce.scl',
    cents: Array.from({ length: 13 }, (_, i) => i * 1901.95500 / 13),
    period: 1901.95500,
  },
};

// The title shares Dawn's pitch collection while mixing the hours' instruments.
TUNINGS.title = TUNINGS.dawn;

/** Frequency of a degree counted across periods: degree 0 is the root, `cents.length` the root a period up. */
export function degreeHz(tuning, root, degree) {
  const n = tuning.cents.length;
  const period = Math.floor(degree / n);
  const step = degree - period * n;
  return root * 2 ** ((period * tuning.period + tuning.cents[step]) / 1200);
}
