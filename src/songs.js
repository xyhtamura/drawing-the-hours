// One song per hour: sparse, toy-like, looping under the visit.
//
// A song is data. Degrees count steps of the hour's tuning (src/tunings.js),
// across periods, from `root`: in Dusk's 5-EDO, degree 5 is the octave; in
// Midnight's Bohlen-Pierce, degree 13 is the tritave. Each part is a list of
// [step, degree] on a grid of `steps` eighth notes at `bpm`.
//
//   bell    the melody, on the song's `voice`
//   bass    low plucks
//   tick    soft clicks, no pitch; [step] only
//   drone   degrees held under the whole song; Midnight only
//   chords  one chord per bar, the degrees the chimes are drawn from
//
// `skip` is the chance a melody note is left out on any pass after the first,
// so a loop does not repeat exactly. Voices are defined in src/music.js.
// Agent drafts, 2026-10-15: for Xyh to rewrite by ear.

export const SONGS = {
  dawn: {
    title: 'Before the bus',
    root: 196,            // G3
    bpm: 72,
    steps: 32,
    voice: 'musicBox',
    gain: 0.9,
    skip: 0.15,
    // Harmonics 8-16 has eight degrees an octave: 8 means the root an octave up.
    bell: [[0, 12], [3, 10], [6, 9], [8, 10], [12, 8], [16, 12], [18, 14], [20, 12], [24, 10], [27, 11], [28, 9]],
    bass: [[0, 0], [8, 4], [16, 0], [24, 2]],
    tick: [[4], [12], [20], [28]],
    chords: [[0, 2, 4], [0, 2, 4], [0, 4, 6], [1, 4, 6]],
  },
  noon: {
    title: 'Lunch in the atrium',
    root: 261.63,         // C4
    bpm: 96,
    steps: 32,
    voice: 'toyPiano',
    gain: 0.75,
    skip: 0.2,
    // 19-EDO, pentatonic from it: 0, 3, 6, 11, 14 (steps of about 63 cents).
    bell: [[0, 19], [1, 25], [2, 30], [3, 33], [8, 38], [10, 33], [12, 30], [16, 22], [17, 25], [18, 30], [19, 33], [24, 30], [26, 25], [28, 22]],
    bass: [[0, 0], [6, 11], [16, -5], [22, 11]],
    tick: [[2], [6], [10], [14], [18], [22], [26], [30]],
    chords: [[0, 6, 11], [0, 6, 11], [-5, 3, 11], [-5, 3, 14]],
  },
  dusk: {
    title: 'The way through',
    root: 220,            // A3
    bpm: 64,
    steps: 32,
    voice: 'bonang',
    gain: 0.85,
    skip: 0.15,
    // 5-EDO: five equal steps of 240 cents.
    bell: [[0, 7], [4, 8], [6, 7], [8, 5], [14, 6], [16, 9], [20, 8], [22, 7], [26, 6], [28, 5]],
    bass: [[0, 0], [16, -2]],
    gong: [[0, 0]],
    tick: [[12], [28]],
    chords: [[0, 2, 4], [0, 2, 4], [-2, 1, 3], [-2, 1, 3]],
  },
  midnight: {
    title: 'Trying to sleep',
    root: 174.61,         // F3
    bpm: 56,
    steps: 32,
    voice: 'reed',
    gain: 0.8,
    skip: 0.25,
    // Bohlen-Pierce: 13 steps to the tritave. 0, 6, 10 is its 3:5:7 triad.
    bell: [[0, 13], [4, 16], [8, 19], [14, 17], [16, 13], [22, 10], [26, 12], [28, 13]],
    bass: [[0, 0], [16, -3]],
    drone: [0, 6],
    tick: [],
    chords: [[0, 6, 10], [0, 6, 10], [-3, 3, 7], [-3, 3, 7]],
  },
};
