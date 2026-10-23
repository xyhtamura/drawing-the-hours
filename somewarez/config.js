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
 * Clips of the other multicart works, played after the demonstration, in order.
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

/** Seconds. `?idle=`, `?title=`, `?demo=`, `?ad=`, and `?clip=` on the page URL override them. */
export const TIMING = {
  idle: 90,   // no touch during play or in a menu: back to the title screen
  title: 20,  // title screen left alone: the idle loop starts, and its title scene lasts this long
  demo: 45,   // the game playing itself
  clip: 12,   // longest any one clip may run, if its video stalls or never ends
  ad: 18,     // the multicart card
  line: 7,    // each line of STATEMENT over the demonstration
};

/**
 * Visits the demonstration plays, in rotation. Each is one the scripted player
 * gathers in reliably; test/test_somewarez.js fails if one stops scoring.
 */
export const DEMO_VISITS = ['dawn-06', 'noon-04', 'dusk-03', 'midnight-03'];

/**
 * Xyh's narration or artist statement, one string per line shown over the
 * demonstration. Empty until written: the demonstration then runs without text.
 */
export const STATEMENT = [];
