/** Six authored arrangements per hour. Visit I retains the original score.
 * Only phrasing and accompaniment change: instrument, tuning, tempo and gain
 * come from the hour. Midnight keeps its sounded-note pad/reed/brass cycle.
 */
import { SONGS } from './songs.js';

const VARIATIONS = {
  dawn: [
    // II: a descending answer, with the damped tines leaving more room.
    {
      bell: [[0, 12], [4, 10], [7, 9], [10, 8], [16, 12], [19, 11], [22, 10], [26, 9], [29, 8]],
      bass: [[0, 0], [12, 4], [24, 2]],
      layers: [{ voice: 'musicBoxDamped', level: 0.28, skip: 0.35, notes: [[6, 16], [14, 18], [23, 17], [30, 16]] }],
    },
    // III: two rising phrases, with silence between them.
    {
      bell: [[0, 8], [3, 10], [6, 12], [9, 10], [16, 9], [19, 11], [22, 14], [27, 12]],
      bass: [[0, 0], [16, 2], [28, 4]],
      layers: [{ voice: 'musicBoxDamped', level: 0.26, skip: 0.4, notes: [[12, 16], [24, 18], [30, 20]] }],
      perc: [[0, 'thump'], [16, 'thump', 0.65], [12, 'knock', 0.6], [28, 'knock', 0.6], [14, 'shaker', 0.35], [30, 'shaker', 0.35]],
    },
    // IV: shorter statements and a longer pause before each reply.
    {
      bell: [[0, 12], [4, 11], [8, 9], [14, 8], [18, 10], [22, 12], [28, 10], [30, 9]],
      bass: [[0, 0], [16, 4]],
      layers: [{ voice: 'musicBoxDamped', level: 0.25, skip: 0.4, notes: [[11, 17], [25, 18], [31, 16]] }],
      perc: [[0, 'thump'], [16, 'thump', 0.65], [12, 'knock', 0.5], [28, 'knock', 0.5]],
    },
    // V: three-note groups answer the opening motif.
    {
      bell: [[0, 12], [3, 10], [6, 9], [12, 10], [15, 12], [18, 14], [24, 12], [27, 10], [30, 8]],
      bass: [[0, 0], [12, 4], [24, 2]],
      layers: [{ voice: 'musicBoxDamped', level: 0.28, skip: 0.4, notes: [[8, 16], [20, 18], [28, 17]] }],
      perc: [[0, 'thump'], [16, 'thump', 0.7], [10, 'knock', 0.7], [22, 'knock', 0.6], [14, 'shaker', 0.4], [30, 'shaker', 0.4]],
    },
    // VI: the opening returns with a lower, more settled ending.
    {
      bell: [[0, 12], [3, 10], [6, 9], [8, 10], [12, 8], [16, 12], [20, 10], [24, 9], [28, 8]],
      bass: [[0, 0], [8, 4], [16, 0], [24, 0]],
      layers: [{ voice: 'musicBoxDamped', level: 0.26, skip: 0.4, notes: [[2, 16], [14, 18], [22, 17], [30, 16]] }],
    },
  ],
  noon: [
    // II: toy-key replies move off the opening's even groups.
    {
      bell: [[0, 19], [2, 25], [4, 30], [7, 33], [10, 30], [13, 25], [16, 22], [18, 25], [21, 30], [24, 33], [27, 25], [30, 22]],
      bass: [[0, 0], [7, 11], [16, -5], [25, 11]],
    },
    // III: a high answer separated from a lower opening.
    {
      bell: [[0, 19], [2, 22], [5, 25], [8, 30], [12, 25], [16, 30], [18, 33], [20, 38], [24, 33], [27, 30], [30, 25]],
      bass: [[0, 0], [12, 11], [20, -5], [28, 11]],
      perc: [[0, 'thump'], [16, 'thump'], [4, 'knock'], [12, 'knock', 0.7], [20, 'knock'], [28, 'knock', 0.7], [6, 'tick'], [14, 'tick'], [22, 'tick'], [30, 'tick'], [15, 'shaker', 0.4], [31, 'shaker', 0.4]],
    },
    // IV: leave a gap after each small run.
    {
      bell: [[0, 19], [1, 25], [3, 30], [8, 33], [11, 30], [16, 22], [17, 25], [19, 30], [24, 25], [28, 22]],
      bass: [[0, 0], [10, 11], [16, -5], [26, 11]],
      perc: [[0, 'thump'], [16, 'thump'], [4, 'knock', 0.8], [20, 'knock', 0.8], [6, 'tick'], [14, 'tick'], [22, 'tick'], [30, 'tick'], [7, 'shaker', 0.35], [23, 'shaker', 0.35]],
    },
    // V: a falling answer to the rising opening, without adding notes.
    {
      bell: [[0, 19], [2, 25], [3, 30], [6, 33], [10, 30], [13, 25], [16, 33], [18, 30], [21, 25], [24, 22], [28, 19], [30, 22]],
      bass: [[0, 0], [8, 11], [16, -5], [24, 11]],
    },
    // VI: reprise, with an answering phrase returning to the root.
    {
      bell: [[0, 19], [1, 25], [2, 30], [3, 33], [8, 38], [11, 33], [14, 30], [16, 22], [19, 25], [22, 30], [26, 25], [28, 22], [30, 19]],
      bass: [[0, 0], [6, 11], [16, -5], [26, 0]],
    },
  ],
  dusk: [
    // II: the struck metal answers a little later and lands lower.
    {
      bell: [[0, 7], [5, 8], [9, 7], [14, 5], [18, 8], [23, 7], [27, 6], [30, 5]],
      bass: [[0, 0], [18, -2]],
      layers: [{ voice: 'bowedBass', level: 0.16, skip: 0, passChance: 0.4, notes: [[16, -7]] }],
    },
    // III: an upward question, followed by a shorter falling answer.
    {
      bell: [[0, 5], [4, 6], [9, 7], [14, 8], [18, 9], [23, 7], [28, 5]],
      bass: [[0, 0], [16, -2]],
      layers: [{ voice: 'bowedBass', level: 0.16, skip: 0, passChance: 0.4, notes: [[0, -10]] }],
      perc: [[0, 'thump', 0.65], [20, 'knock', 0.5], [12, 'tick'], [28, 'tick'], [24, 'shaker', 0.25]],
    },
    // IV: separate strikes, with the tails carrying the gaps.
    {
      bell: [[0, 7], [6, 5], [12, 6], [18, 8], [24, 7], [29, 5]],
      bass: [[0, 0], [18, -2]],
      layers: [{ voice: 'bowedBass', level: 0.14, skip: 0, passChance: 0.35, notes: [[16, -7]] }],
      perc: [[0, 'thump', 0.6], [20, 'knock', 0.45], [12, 'tick'], [28, 'tick', 0.7]],
    },
    // V: a repeated middle note, then a more open descent.
    {
      bell: [[0, 7], [4, 8], [8, 7], [12, 7], [18, 9], [22, 8], [27, 6], [30, 5]],
      bass: [[0, 0], [16, -2]],
      layers: [{ voice: 'bowedBass', level: 0.16, skip: 0, passChance: 0.4, notes: [[0, -10], [16, -7]] }],
    },
    // VI: recall the opening and finish with two widely spaced lower strikes.
    {
      bell: [[0, 7], [4, 8], [6, 7], [10, 5], [16, 9], [20, 8], [25, 6], [29, 5]],
      bass: [[0, 0], [16, -2]],
      layers: [{ voice: 'bowedBass', level: 0.14, skip: 0, passChance: 0.35, notes: [[0, -10]] }],
      perc: [[0, 'thump', 0.65], [20, 'knock', 0.5], [12, 'tick'], [28, 'tick'], [24, 'shaker', 0.25]],
    },
  ],
  midnight: [
    // II: keep four swells, but let the middle register answer.
    {
      bell: [[0, 13], [8, 16], [16, 12], [26, 13]],
      layers: [{ voice: 'reedSlow', level: 0.09, skip: 0.6, notes: [[12, 18], [24, 16]] }],
    },
    // III: only three lead notes; no extra attack replaces the missing one.
    {
      bell: [[0, 13], [10, 16], [22, 12]],
      bass: [[0, 0], [18, -3]],
      layers: [{ voice: 'reedSlow', level: 0.08, skip: 0.65, notes: [[16, 18]] }],
      perc: [[0, 'tom', 0.2]],
    },
    // IV: a lower opening and one quiet reply, leaving the final swell alone.
    {
      bell: [[0, 12], [8, 13], [18, 16], [26, 10]],
      layers: [{ voice: 'reedSlow', level: 0.08, skip: 0.65, notes: [[13, 16]] }],
      perc: [[0, 'tom', 0.2], [20, 'tom', 0.1]],
    },
    // V: three lower swells with a long final rest.
    {
      bell: [[0, 13], [12, 10], [22, 12]],
      bass: [[0, 0], [18, -3]],
      layers: [{ voice: 'reedSlow', level: 0.08, skip: 0.65, notes: [[17, 16]] }],
      perc: [[0, 'tom', 0.15]],
    },
    // VI: return to the root without the opening's high reed note.
    {
      bell: [[0, 13], [8, 16], [16, 10], [26, 13]],
      layers: [{ voice: 'reedSlow', level: 0.08, skip: 0.65, notes: [[12, 18], [23, 16]] }],
      perc: [[0, 'tom', 0.2], [20, 'tom', 0.1]],
    },
  ],
};

// Cache score objects: checking the current stage each frame must not restart it.
export const STAGE_SONGS = Object.fromEntries(Object.entries(VARIATIONS).map(([hour, variants]) => [
  hour, [SONGS[hour], ...variants.map(variation => ({ ...SONGS[hour], ...variation }))],
]));

/** Authored stage IDs stay stable in both builds; practice copies use practiceOf.
 * Sandboxes and unknown IDs keep the hour's original arrangement. */
export function songForLevel(hour, level) {
  const match = /^(dawn|noon|dusk|midnight)-0([1-6])$/.exec(level?.practiceOf || level?.id || '');
  return match?.[1] === hour ? STAGE_SONGS[hour][Number(match[2]) - 1] : SONGS[hour];
}
