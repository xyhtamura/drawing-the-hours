// Settings for the SOMEWAREZ kiosk build. No DOM here, so the tests read it too.

/** Where the QR card sends a phone. scripts/make_qr.py draws multicart-qr.svg from this. */
export const MULTICART_URL = 'https://xyhtamura.github.io/somewarez-multicart/';

/** The five works on the multicart, as its menu lists them: title and one line each. */
export const MULTICART_GAMES = [
  ['Cornice', 'Glyph terrarium'],
  ['Ombak Lock', 'Tune by ear'],
  ['Foam Green City', 'Domestic walkthrough'],
  ['Drawing the Hours', 'Draw among insects'],
  ['Sulat', 'Type a landscape'],
];

/**
 * Archived clips of the other multicart works; not part of the current idle loop.
 * Each title must be one of MULTICART_GAMES; its line there is shown under it.
 * Paths are relative to this folder. Cut from a browser capture with the
 * browser bar cropped off; see NOTES.md, 2026-10-24.
 */
export const ATTRACT_CLIPS = [
  ['Cornice', 'video/cornice.mp4'],
  ['Ombak Lock', 'video/ombak-lock.mp4'],
  ['Foam Green City', 'video/foam-green-city.mp4'],
  ['Sulat', 'video/sulat.mp4'],
];

/** Seconds. `?idle=`, `?title=`, `?demo=`, `?ad=`, and `?interlude=` on the page URL override them. */
export const TIMING = {
  idle: 90,   // no touch during play or in a menu: back to the title screen
  title: 60,  // title screen left alone: the idle loop starts, and its title scene lasts this long
  interlude: 30, // title screen between hours
  demo: 45,   // the game playing itself
  ad: 12,     // the multicart card
  line: 7,    // each sentence of STATEMENTS over the demonstration
};

/**
 * Visits the demonstration plays, in rotation. Each is one the scripted player
 * gathers in reliably; test/test_somewarez.js fails if one stops scoring.
 */
export const DEMO_VISITS = ['dawn-06', 'noon-04', 'dusk-03', 'midnight-03'];

/** One paragraph per hour, in sentence-sized captions. The final paragraph remains in About. */
export const STATEMENTS = [
  [
    "Drawing the Hours is a drawing game set among insects and plants in the small spaces of a working day.",
    "Its speaker waits for transport, takes a lunch break, brings home medicine, and tries to sleep.",
    "During these intervals, the player draws cords around moving creatures, threads them in sequence, and learns combinations."
  ],
  [
    "I remember visiting my mother’s office and seeing a flower doodle among the papers she had to sign and the ledgers she had to look at.",
    "She had a moment for whatever reason, to doodle a flower while dealing with paperwork.",
    "The speaker here, as well, takes time to doodle through little ecologies.",
    "The plants and insects in the game are often set in manmade environments, suggesting an urban space, occupying patches between roads and buildings.",
    "I wanted to bring these overlooked ecologies into view and make their movements something a player could think with."
  ],
  [
    "The game began with the looping mechanic of the Flash game Loop.",
    "Fruit Ninja informed its cutting and threading gestures, while Candy Crush was another reference for its sequence of short levels.",
    "I'm interested in these casual games that fit into waiting and travel, that someone can pick up, pause, and return to as circumstances allow.",
    "The mobile and casualness of these games connects these habits of play to the intervals described by the speaker."
  ],
  [
    "Casual and childlike games are often seen as simple, but I wanted to push one to become quite complicated, as childhood and idle thoughts can become.",
    "The cords also suggest cat’s cradle, sewing, and needlework, threading activities which all have associations with domestic life, childhood, and activities seen as feminine.",
    "The game also asks for different ways of playing, like speed at some moments or patience at others, or carefulness."
  ]
];
export const STATEMENT = STATEMENTS[0];

/** The opening title is also the idle wait before the first demonstration. */
export const IDLE_SCENES = [
  { scene: 'demo', hour: 0 },
  { scene: 'title' }, { scene: 'demo', hour: 1 },
  { scene: 'title' }, { scene: 'demo', hour: 2 },
  { scene: 'title' }, { scene: 'demo', hour: 3 },
  { scene: 'ad' }, { scene: 'title', opening: true },
];
export const captionSeconds = (line, minimum = TIMING.line) => Math.max(minimum, line.split(/\s+/).length / 3);
