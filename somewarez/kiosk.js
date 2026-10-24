/**
 * SOMEWAREZ kiosk build: a tablet in a venue, played by one visitor after another.
 *
 * - Three controls at the foot of the field: Main menu, Level card, Reset.
 *   Nothing is drawn outside the field.
 * - Reset returns to the title screen and drops the session: progress, scores,
 *   settings. Nothing is written to the device (src/storage.js).
 * - Left alone, the page resets itself, then runs an idle loop: the game playing
 *   itself across four hours with statement captions and title interludes, then
 *   a brief QR card for the multicart. A touch anywhere ends the loop at the title screen.
 *
 * Timings, the demonstration visits, the multicart URL, and the statement lines
 * are in config.js.
 */

import { audio } from '../src/audio.js';
import { music } from '../src/music.js';
import { storage } from '../src/storage.js';
import { setColorMode } from '../src/theme.js';
import { CAMPAIGN_LEVELS } from '../src/campaign.js';
import { createAutoplay } from './autoplay.js';
import { MULTICART_URL, MULTICART_GAMES, TIMING, DEMO_VISITS, STATEMENTS, IDLE_SCENES, captionSeconds } from './config.js';

const SCENES = IDLE_SCENES;

function element(tag, attributes = {}, children = []) {
  const node = Object.assign(document.createElement(tag), attributes);
  node.append(...children);
  return node;
}

export function startKiosk({ game, canvas, showPanel, openMenu, showVisitCard, getActivePanel, syncSettings }) {
  const timing = { ...TIMING };
  const query = new URLSearchParams(location.search);
  for (const key of Object.keys(timing)) {
    const seconds = Number(query.get(key));
    if (query.has(key) && seconds > 0) timing[key] = seconds;
  }

  document.head.append(element('link', { rel: 'stylesheet', href: new URL('./kiosk.css', import.meta.url).href }));
  document.body.classList.add('kiosk');
  // Between Banks is another page, without this bar or the idle reset.
  const elsewhere = document.querySelector('#pause-menu a[href*="between-banks"]');
  if (elsewhere) elsewhere.closest('p').hidden = true;
  window.addEventListener('contextmenu', e => e.preventDefault());

  // --- Control bar ---
  const btnMenu = element('button', { type: 'button', textContent: 'Main menu' });
  const btnCard = element('button', { type: 'button', textContent: 'Level card' });
  const btnReset = element('button', { type: 'button', textContent: 'Reset' });
  const bar = element('nav', { id: 'kiosk-bar', ariaLabel: 'Game controls' }, [btnMenu, btnCard, btnReset]);

  // --- Idle loop layer: takes the touch that ends the loop, so it reaches nothing under it ---
  const statement = element('p', { className: 'kiosk-statement', hidden: true });
  const caption = element('p', { className: 'kiosk-caption', textContent: 'The game is playing itself. Touch the screen to play.' });
  const address = MULTICART_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
  // The card follows the multicart page: coral ground, cream sheet, the 5 IN 1 masthead.
  const ad = element('section', { className: 'kiosk-ad', hidden: true }, [
    element('div', { className: 'kiosk-ad-sheet' }, [
      element('p', { className: 'kiosk-ad-issue' }, [
        element('span', { textContent: 'SCAN TO PLAY ON YOUR PHONE' }),
        element('span', { textContent: 'EDITION 2026-11' }),
      ]),
      element('header', { className: 'kiosk-ad-heading' }, [
        element('h2', {}, ['5 ', element('small', { textContent: 'IN' }), ' 1']),
        element('p', { className: 'kiosk-ad-maker' }, ['XYH MULTICART', element('span', { textContent: 'TOUCH-SCREEN / 2026' })]),
      ]),
      element('div', { className: 'kiosk-ad-body' }, [
        element('figure', { className: 'kiosk-ad-code' }, [
          element('img', { src: new URL('./multicart-qr.svg', import.meta.url).href, alt: `QR code for ${address}` }),
          // Host and path each stay whole, so a narrow caption breaks at the slash.
          element('figcaption', {}, address.split(/(?<=\/)/).map(part => element('span', { textContent: part }))),
        ]),
        element('ol', { className: 'kiosk-ad-games' }, MULTICART_GAMES.map(([title, line], index) => element('li', {}, [
          element('span', { className: 'kiosk-ad-number', textContent: String(index + 1).padStart(2, '0') }),
          element('strong', { textContent: title }),
          element('span', { textContent: title === 'Drawing the Hours' ? 'On this screen' : line }),
        ]))),
      ]),
      element('p', { className: 'kiosk-ad-touch', textContent: 'TOUCH THE SCREEN TO PLAY DRAWING THE HOURS' }),
    ]),
  ]);
  const layer = element('div', { id: 'kiosk-attract', hidden: true }, [statement, caption, ad]);
  // Both sit inside the field's own box, so nothing is drawn outside it.
  canvas.parentElement.append(layer, bar);

  // --- The demonstration draws through the game's own pointer handlers ---
  const demoEvents = new WeakSet();
  const send = (type, [x, y]) => {
    const rect = canvas.getBoundingClientRect();
    const event = new PointerEvent(type, {
      pointerId: 9001, isPrimary: true, button: 0, bubbles: true, cancelable: true,
      clientX: rect.left + x * rect.width / game.width,
      clientY: rect.top + y * rect.height / game.height,
    });
    demoEvents.add(event);
    (type === 'pointerdown' ? canvas : window).dispatchEvent(event);
  };
  const player = createAutoplay(game, send, { screensaver: true });

  const state = { mode: 'live', scene: null, idleFor: 0, sceneTime: 0, sceneLength: 0, sceneIndex: 0, hour: 0, lines: [] };

  /** Back to the title screen with nothing kept from the session. */
  function reset() {
    game.musicIdle = state.mode === 'attract' && state.scene !== 'title';
    player.stop();
    game.cancelStroke();
    storage.clearMemory();
    game.campaign.reset();
    game.campaign.practiceVisit = null;
    setColorMode('default');
    audio.isMuted = false;
    music.setEnabled(true);
    game.startLevel(CAMPAIGN_LEVELS[0].id);
    for (const card of document.querySelectorAll('.recipe-card')) card.scrollTop = 0;
    syncSettings();
    showPanel('title-screen');
    state.idleFor = 0;
  }

  function enterScene(entry) {
    const { scene } = entry;
    state.hour = entry.hour ?? state.hour;
    state.scene = scene;
    state.sceneTime = 0;
    state.sceneLength = scene === 'title' ? (entry.opening ? timing.title : timing.interlude) : timing[scene];
    reset();
    layer.hidden = scene === 'title';
    ad.hidden = scene !== 'ad';
    caption.hidden = scene !== 'demo';
    statement.hidden = true;
    if (scene === 'demo') {
      // Silent: nobody is playing.
      audio.isMuted = true;
      game.startLevel(DEMO_VISITS[state.hour]);
      game.state = 'PLAYING';
      showPanel(null);
      state.lines = STATEMENTS[state.hour];
      state.sceneLength = Math.max(timing.demo, state.lines.reduce((sum, line) => sum + captionSeconds(line, timing.line), 0));
      statement.textContent = state.lines[0];
      statement.hidden = false;
    }
  }

  function nextScene() {
    state.sceneIndex = (state.sceneIndex + 1) % SCENES.length;
    enterScene(SCENES[state.sceneIndex]);
  }

  function startIdleLoop() {
    state.mode = 'attract';
    state.sceneIndex = 0;
    enterScene(SCENES[0]);
  }

  /** A visitor touched the screen: end the idle loop at the title screen. */
  function wake() {
    const covered = !layer.hidden;
    state.mode = 'live';
    state.scene = null;
    reset();
    ad.hidden = true; caption.hidden = true; statement.hidden = true;
    // Keep the layer up for the rest of this touch, so its release presses nothing.
    if (covered) setTimeout(() => { if (state.mode === 'live') layer.hidden = true; }, 350);
  }

  /** Advance the kiosk clock by dt seconds. The frame loop calls it; so can a test. */
  function step(dt) {
    if (state.mode === 'live') {
      state.idleFor += dt;
      const onTitle = getActivePanel() === 'title-screen';
      if (onTitle && state.idleFor >= timing.title) startIdleLoop();
      else if (!onTitle && state.idleFor >= timing.idle) reset();
      return;
    }
    state.sceneTime += dt;
    if (state.scene === 'demo') {
      player.step(dt);
      let remaining = state.sceneTime;
      let line = state.lines.at(-1);
      for (const candidate of state.lines) {
        remaining -= captionSeconds(candidate, timing.line);
        if (remaining < 0) { line = candidate; break; }
      }
      statement.hidden = !line;
      if (line) statement.textContent = line;
      // Keep the paragraph on screen even if a visit ends before its reading time.
      if (game.state !== 'PLAYING') {
        player.stop();
        game.startLevel(DEMO_VISITS[state.hour]);
        game.state = 'PLAYING';
      }
    }
    if (state.sceneTime >= state.sceneLength) nextScene();
  }

  const onInput = e => {
    if (demoEvents.has(e)) return;
    state.idleFor = 0;
    if (state.mode !== 'attract') return;
    if (!layer.hidden) { e.preventDefault(); e.stopPropagation(); }
    wake();
  };
  for (const type of ['pointerdown', 'keydown', 'wheel']) {
    window.addEventListener(type, onInput, { capture: true, passive: false });
  }

  btnMenu.onclick = openMenu;
  btnCard.onclick = () => {
    showVisitCard();
    // From the title screen or a story card, go on to the card with the requirements.
    if (game.state === 'TRANSITION') game.advance();
  };
  btnReset.onclick = reset;

  let last = performance.now();
  const frame = now => {
    step(Math.min(0.1, (now - last) / 1000));
    last = now;
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  // Handle for checking from the console and from tests.
  window.kiosk = { state, timing, step, reset, wake, startIdleLoop, player };
  return window.kiosk;
}
