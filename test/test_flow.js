/**
 * Tests for the failure flow, the stalled-play hint, save resume, and the
 * progress gates on the visit list and the Field Book (CAMPAIGN.md).
 *
 * 1. isHourReached gates by unlocked index and completed IDs
 * 2. A save resumes its recorded visit; an unknown or unplayable ID falls back
 * 3. Untimed practice of a visit runs without the clock and writes no progress
 * 4. The hint appears after twelve seconds without objective progress
 * 5. The failure card offers Retry, Practice this visit, and Level select
 * 6. The failure line follows the hour
 * 7. index.html hides the save controls and the unreached Field Book entries
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';

function makeCanvas() {
  const calls = [];
  const ctx = {
    calls,
    clearRect: () => {}, beginPath: () => {}, moveTo: () => {}, lineTo: () => {},
    arc: () => {}, ellipse: () => {}, quadraticCurveTo: () => {}, bezierCurveTo: () => {},
    closePath: () => {}, rect: () => {}, roundRect: () => {}, arcTo: () => {},
    fillRect: () => {}, strokeRect: () => {},
    stroke: () => {}, fill: () => {}, save: () => {}, restore: () => {}, scale: () => {},
    translate: () => {}, rotate: () => {}, clip: () => {}, setLineDash: () => {},
    createLinearGradient: () => ({ addColorStop: () => {} }),
    fillText: (text) => { calls.push(String(text)); },
    measureText: (text) => ({ width: String(text).length * 6 }),
    drawImage: () => {},
  };
  return {
    ctx,
    getContext: () => ctx,
    addEventListener: () => {},
    removeEventListener: () => {},
    setPointerCapture: () => {},
    releasePointerCapture: () => {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 640 }),
  };
}

/** Minimal localStorage so the save manager can be exercised under node. */
function installStorage(initial) {
  const store = new Map(Object.entries(initial || {}));
  globalThis.localStorage = {
    getItem: key => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { store.set(key, String(value)); },
    removeItem: key => { store.delete(key); },
  };
  return store;
}

const SAVE_KEY = 'dth_campaign_save_v1';

console.log('--- Running Flow Test Suite (failure, hint, resume, gates) ---');

const { CAMPAIGN_LEVELS, CampaignManager, isHourReached } = await import('../src/campaign.js');
const { Game } = await import('../src/game.js');

// 1. Hour gates
{
  const fresh = { completedLevelIds: [], highestUnlockedIndex: 0, bestScores: {}, currentLevelId: 'dawn-01' };
  assert.equal(isHourReached(fresh, 'dawn'), true, 'Dawn is always reached');
  assert.equal(isHourReached(fresh, 'noon'), false, 'Noon is not reached from a fresh save');
  assert.equal(isHourReached(fresh, 'midnight'), false, 'Midnight is not reached from a fresh save');

  const afterDawn = { ...fresh, highestUnlockedIndex: 3 };
  assert.equal(isHourReached(afterDawn, 'noon'), true, 'Unlocking visit IV reaches Noon');
  assert.equal(isHourReached(afterDawn, 'dusk'), false, 'Dusk stays unreached at visit IV');

  const completedDusk = { ...fresh, completedLevelIds: ['dusk-01'] };
  assert.equal(isHourReached(completedDusk, 'dusk'), true, 'A completed Dusk visit reaches Dusk');

  console.log('✔ Hour gates follow unlocked index and completed IDs.');
}

// 2. Resume from save
{
  installStorage({
    [SAVE_KEY]: JSON.stringify({
      completedLevelIds: ['dawn-01', 'dawn-02'],
      highestUnlockedIndex: 2,
      bestScores: { 'dawn-01': 400 },
      currentLevelId: 'dawn-03',
    }),
  });
  const resumed = new CampaignManager();
  assert.equal(resumed.currentLevel.id, 'dawn-03', 'A reload resumes the saved visit');
  assert.equal(resumed.resumedFromSave, true, 'A resumed visit is flagged so the ready screen is shown');

  installStorage({ [SAVE_KEY]: JSON.stringify({ currentLevelId: 'not-a-visit' }) });
  const unknown = new CampaignManager();
  assert.equal(unknown.currentLevel.id, 'dawn-01', 'An unknown saved ID falls back to the first visit');
  assert.equal(unknown.resumedFromSave, false, 'The first visit is not treated as a resume');

  installStorage({});
  const blank = new CampaignManager();
  assert.equal(blank.currentLevel.id, 'dawn-01', 'A blank save starts at the first visit');

  console.log('✔ Save resume, unknown-ID fallback, and blank save verified.');
}

// 3. Untimed practice of a visit
{
  installStorage({});
  const canvas = makeCanvas();
  const game = new Game(canvas);
  game.initLevel('dawn-02');
  const timedDuration = game.clock.remainingSeconds;

  assert.equal(game.startPracticeOfCurrent(), true, 'Practice of a campaign visit starts');
  assert.equal(game.currentLevel.id, 'practice-visit', 'Practice runs its own level ID');
  assert.equal(game.currentLevel.practiceOf, 'dawn-02', 'Practice records the visit it copies');
  assert.equal(game.isUntimed(), true, 'Practice of a visit is untimed');
  assert.equal(game.state, 'READY', 'Practice opens at the ready screen, not the story card');
  assert.deepEqual(game.currentLevel.objectives, CAMPAIGN_LEVELS.find(l => l.id === 'dawn-02').objectives,
    'Practice keeps the visit objectives');

  game.state = 'PLAYING';
  for (let i = 0; i < 1200; i++) game.update(0.1); // two minutes of play
  assert.equal(game.clock.remainingSeconds, timedDuration, 'The clock does not run in untimed practice');
  assert.equal(game.state, 'PLAYING', 'Untimed practice never reaches the failure screen');

  game.campaign.recordVictory(900);
  assert.equal(game.campaign.saveState.completedLevelIds.includes('dawn-02'), false,
    'Practice writes no completion');
  assert.equal(game.campaign.saveState.bestScores['dawn-02'], undefined, 'Practice writes no best score');
  assert.equal(game.campaign.saveState.highestUnlockedIndex, 0, 'Practice unlocks nothing');

  console.log('✔ Untimed practice of a visit runs without a clock and writes no progress.');
}

// 4. The stalled-play hint
{
  installStorage({});
  const canvas = makeCanvas();
  const game = new Game(canvas);
  game.initLevel('dawn-01');
  game.state = 'PLAYING';

  for (let i = 0; i < 110; i++) game.update(0.1); // 11 seconds
  assert.equal(game.hint, null, 'No hint before twelve seconds');

  for (let i = 0; i < 20; i++) game.update(0.1); // past twelve seconds
  assert.ok(game.hint, 'A hint appears after twelve seconds without progress');
  assert.equal(game.hint.key, 'single', "Dawn I's unfinished requirement is its single loops");
  assert.equal(game.hint.remaining, 4, 'The hint counts what is left');
  assert.match(game.hint.text, /loop/i, 'The hint names the figure to draw');

  game.drawHint(game.ctx);
  assert.ok(game.hintRect && game.hintRect.w > 0, 'The hint card records a rectangle to dismiss');
  const r = game.hintRect;
  assert.equal(game.handleOverlayClick(r.x + r.w / 2, r.y + r.h / 2), true, 'A click on the card is used');
  assert.equal(game.hint, null, 'The hint dismisses');
  assert.equal(game.hintTimer, 0, 'Dismissing starts the twelve seconds again');

  // Objective progress clears a pending hint as well.
  for (let i = 0; i < 130; i++) game.update(0.1);
  assert.ok(game.hint, 'The hint returns after another stalled twelve seconds');
  game.campaign.objectiveProgress.single.current = 1;
  game.dismissHint();
  for (let i = 0; i < 130; i++) game.update(0.1);
  assert.equal(game.hint.remaining, 3, 'The hint counts progress already made');

  console.log('✔ Hint timing, contents, dismissal, and re-arming verified.');
}

// 5. Failure-screen options
{
  installStorage({});
  const canvas = makeCanvas();
  const game = new Game(canvas);
  game.initLevel('dusk-01');
  game.state = 'GAMEOVER';
  game.drawGameOverModal(canvas.ctx);

  const actions = game.gameOverOptions.map(o => o.action);
  assert.deepEqual(actions, ['retry', 'practice', 'select'],
    'Failure offers Retry, untimed Practice, and Level select');
  for (const option of game.gameOverOptions) {
    assert.ok(option.w > 0 && option.h > 0, 'Each option has a clickable rectangle');
    assert.ok(option.y >= 0 && option.y + option.h <= 640, 'Each option sits inside the canvas');
  }

  const hit = option => ({ x: option.x + option.w / 2, y: option.y + option.h / 2 });

  const retry = hit(game.gameOverOptions[0]);
  assert.equal(game.handleOverlayClick(retry.x, retry.y), true, 'Retry takes the click');
  assert.equal(game.state, 'READY', 'Retry returns to the ready screen, not the story card');
  assert.equal(game.currentLevel.id, 'dusk-01', 'Retry keeps the same visit');

  game.state = 'GAMEOVER';
  game.drawGameOverModal(canvas.ctx);
  const practice = hit(game.gameOverOptions[1]);
  game.handleOverlayClick(practice.x, practice.y);
  assert.equal(game.currentLevel.id, 'practice-visit', 'Practice this visit starts the untimed copy');
  assert.equal(game.currentLevel.practiceOf, 'dusk-01', 'The untimed copy is of the failed visit');

  // The untimed copy itself offers only Retry and Level select.
  game.state = 'GAMEOVER';
  game.drawGameOverModal(canvas.ctx);
  assert.deepEqual(game.gameOverOptions.map(o => o.action), ['retry', 'select'],
    'Untimed practice does not offer practice of itself');

  let opened = 0;
  game.onOpenVisitModal = () => { opened += 1; };
  const select = hit(game.gameOverOptions[1]);
  game.handleOverlayClick(select.x, select.y);
  assert.equal(opened, 1, 'Level select opens the visit list');

  // A click away from the options does not advance the failure screen.
  game.state = 'GAMEOVER';
  game.drawGameOverModal(canvas.ctx);
  assert.equal(game.handleOverlayClick(4, 4), false, 'A click outside the options is not used');

  console.log('✔ Failure options, their rectangles, and their actions verified.');
}

// 6. The failure line follows the hour
{
  installStorage({});
  const canvas = makeCanvas();
  const game = new Game(canvas);
  const expected = {
    'dawn-01': /morning breeze/,
    'noon-01': /midday atrium/,
    'dusk-01': /evening air/,
    'midnight-01': /into the dark/,
  };
  for (const [id, pattern] of Object.entries(expected)) {
    game.initLevel(id);
    game.state = 'GAMEOVER';
    canvas.ctx.calls.length = 0;
    game.drawGameOverModal(canvas.ctx);
    const text = canvas.ctx.calls.join(' | ');
    assert.match(text, pattern, `${id} uses its own failure line`);
    if (id !== 'dawn-01') {
      assert.equal(/morning breeze/.test(text), false, `${id} does not say morning breeze`);
    }
  }

  console.log('✔ The failure line differs by hour.');
}

// 7. Page gates
{
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="btn-unlock-all-visits" hidden/, 'The save control is hidden by default');
  assert.match(html, /URLSearchParams\(location\.search\)\.has\('dev'\)/, '?dev reveals the save control');
  assert.match(html, /data-reveal-hour="midnight"[\s\S]*?Window Firefly/, 'Firefly and Trace are Midnight entries');
  assert.match(html, /data-reveal-hour="dusk"[\s\S]*?Paper Lacewing/, 'The lacewing is a Dusk entry');
  assert.match(html, /data-reveal-hour="noon"[\s\S]*?Amber Hoverfly/, 'The hoverfly is a Noon entry');
  assert.match(html, /applyFieldBookReveal/, 'The Field Book is filtered by hour reached');
  assert.equal(/All 12 visits are playable/.test(html), false, 'The visit list no longer claims every visit is open');
  assert.match(html, /game\.handleOverlayClick/, 'Canvas clicks route to the overlay controls first');

  console.log('✔ Page gates for the save control, Field Book, and visit list verified.');
}

// 8. Visit complete Continue button and accidental advance prevention
{
  installStorage({});
  const canvas = makeCanvas();
  const game = new Game(canvas);
  game.initLevel('dawn-01');
  game.state = 'LEVEL_COMPLETE';
  game.drawLevelCompleteModal(canvas.ctx);

  assert.ok(game.levelCompleteButton, 'Visit complete modal records a Continue button rectangle');
  const btn = game.levelCompleteButton;
  assert.ok(btn.w > 0 && btn.h > 0, 'The Continue button has width and height');
  assert.ok(btn.y >= 0 && btn.y + btn.h <= 640, 'The Continue button sits inside the canvas bounds');

  // A click outside the button is swallowed (returns true) so the canvas listener does not advance
  const oldLevel = game.currentLevel.id;
  const swallowed = game.handleOverlayClick(10, 10);
  assert.equal(swallowed, true, 'Click outside Continue button is swallowed on LEVEL_COMPLETE');
  assert.equal(game.state, 'LEVEL_COMPLETE', 'Click outside Continue button does not advance state');
  assert.equal(game.currentLevel.id, oldLevel, 'Level remains unchanged after click outside button');

  // A click inside the Continue button advances the level
  const btnHitX = btn.x + btn.w / 2;
  const btnHitY = btn.y + btn.h / 2;
  const used = game.handleOverlayClick(btnHitX, btnHitY);
  assert.equal(used, true, 'Click inside Continue button is handled');
  assert.notEqual(game.state, 'LEVEL_COMPLETE', 'Clicking Continue advances beyond LEVEL_COMPLETE');
  assert.equal(game.currentLevel.id, 'dawn-02', 'Clicking Continue advances to the next visit');

  console.log('✔ Visit complete Continue button and click swallowing verified.');
}

console.log('--- All flow tests passed! ---');
