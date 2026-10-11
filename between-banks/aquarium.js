import {LEVELS, SPECIES, recipeSize} from './levels.js';
import {judgeStroke, strokeDisruption} from './rules.js';
import {Aquarium, shadePatches} from './simulation.js';
import {StringGesture} from '../src/string.js';
import {getLengthBand} from '../src/geometry.js';
import {fitField} from '../src/viewport.js';
import {paperTile, loadPaper} from '../src/paper.js';
import {audio} from '../src/audio.js';

const FISH_PAPER = {
  ricefish: {paper: 'mulberry', relief: .075, keep: .6, split: 12},
  goby: {paper: 'coir', relief: .075, keep: .6, split: 12},
  barb: {paper: 'tissueGold', relief: .08, keep: .7, split: 14},
  halfbeak: {paper: 'fibre', relief: .075, keep: .6, split: 14},
};
Object.values(FISH_PAPER).forEach(settings => loadPaper(settings.paper));

const $ = id => document.getElementById(id), canvas = $('field'), ctx = canvas.getContext('2d');
let portrait, W, H;
function layout() {
  const field = fitField(innerWidth, innerHeight);
  W = field.width; H = field.height; portrait = H > W;
  canvas.width = W; canvas.height = H;
  const water = document.querySelector('.water');
  water.style.width = `${field.displayWidth}px`; water.style.height = `${field.displayHeight}px`;
  water.classList.toggle('portrait', portrait);
  water.classList.toggle('compact', field.displayWidth < 560);
}
layout();
const waterArt = new Map();
function waterFor(color) {
  const orientation = portrait ? 'portrait' : 'landscape', key = `${color}-${orientation}`;
  if (!waterArt.has(key)) {
    const image = new Image();
    waterArt.set(key, image);
    image.src = new URL(`./water/${color.slice(1)}-${orientation}.webp`, import.meta.url).href;
  }
  const image = waterArt.get(key);
  return image.complete && image.naturalWidth > 0 ? image : null;
}
const SAVE_KEY = 'drawing-hours-aquarium-v2';
const testMode = new URLSearchParams(location.search).has('test');
let saved = {visit: 0, done: []};
try {
  const value = !testMode && JSON.parse(localStorage.getItem(SAVE_KEY));
  if (value && Number.isInteger(value.visit) && value.visit >= 0 && value.visit < LEVELS.length && Array.isArray(value.done)) {
    saved = {visit: value.visit, done: value.done.filter(n => Number.isInteger(n) && n >= 0 && n < LEVELS.length)};
  }
} catch {}
export const game = new Aquarium(W, H);
let gesture = null, pointer = null, practice = false, last = 0, hudTime = 0, ripples = [], lastMode = '', lastPointerTime = 0;
const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
function store() {if (!testMode) try {localStorage.setItem(SAVE_KEY, JSON.stringify(saved));} catch {}}
function cancel() {audio.stopDrawingRustle(); gesture?.releaseBeads(); gesture = null; pointer = null;}
window.addEventListener('resize', () => {
  cancel(); const oldW = W, oldH = H, oldTop = game.top; layout();
  if (W !== oldW || H !== oldH) {
    game.width = W; game.height = H;
    game.top = portrait ? (Object.keys(game.level.goals).length > 2 ? 240 : 180) : 110;
    for (const entity of [...game.fish, ...game.rocks, ...game.leafClumps, ...game.leafDisks, ...game.beetles, ...game.bubbles]) {
      entity.x *= W / oldW;
      entity.y = game.top + (entity.y - oldTop) * (H - game.top - 48) / (oldH - oldTop - 48);
    }
    ripples = [];
  }
  draw();
});
function message(text) {$('status').textContent = text;}
function fishGlyph(kind) {
  const s = SPECIES[kind];
  return `<svg viewBox="0 0 60 28" aria-hidden="true"><path d="M20 14 7 8 7 20Z" fill="${s.trim}"/><ellipse cx="33" cy="14" rx="16" ry="${kind === 'goby' ? 8 : 5}" fill="${s.color}" stroke="${s.trim}"/>${kind === 'barb' ? '<g fill="#586554"><circle cx="25" cy="14" r="2"/><circle cx="33" cy="14" r="2"/><circle cx="40" cy="14" r="2"/></g>' : ''}${kind === 'goby' ? '<path d="M23 12h18" stroke="#71bec5" stroke-width="2"/>' : ''}${kind === 'halfbeak' ? '<path d="M43 15h16" stroke="#8a9c80" stroke-width="2"/>' : ''}<circle cx="43" cy="12" r="2" fill="#34574f"/></svg>`;
}
function diagram() {
  const kinds = Object.keys(game.level.goals);
  if (game.level.separateKinds) {
    const groups = kinds.map((kind, i) => {
      const count = recipeSize(game.level, kind), x = i ? 243 : 91;
      const positions = count === 3 ? [{x:x-20,y:43},{x:x+20,y:43},{x,y:66}] : [{x:x-20,y:54},{x:x+20,y:54}];
      return positions.map(p => `<g transform="translate(${p.x-20} ${p.y-10})">${fishGlyph(kind).replace('viewBox=', 'width="40" height="20" viewBox=')}</g>`).join('');
    }).join('');
    return `<svg class="diagram" viewBox="0 0 340 115" role="img" aria-label="A figure eight containing ${kinds.map(k => `${recipeSize(game.level,k)} ${SPECIES[k].name.toLowerCase()}`).join(' and ')} in separate pockets"><path d="M167 57C105-15 12 11 35 64C58 118 126 98 167 57C208 16 278-6 304 44C333 103 230 117 167 57" fill="none" stroke="#af7376" stroke-width="3"/>${groups}</svg>`;
  }
  const kind = kinds.find(k => recipeSize(game.level, k) > 2) ?? kinds[0], count = recipeSize(game.level, kind);
  const positions = count === 3 ? [{x:76,y:45},{x:124,y:42},{x:104,y:71}] : [{x:85,y:48},{x:130,y:48}];
  return `<svg class="diagram" viewBox="0 0 340 115" role="img" aria-label="A closed loop containing ${count} fish of the same kind"><path d="M65 90C15 30 80 3 152 25C213 44 188 97 114 97C87 97 65 90 51 77" fill="none" stroke="#af7376" stroke-width="3"/>${positions.map(p => `<g transform="translate(${p.x} ${p.y})"><path d="M0 5 -10 -2 -10 12Z" fill="${SPECIES[kind].trim}"/><ellipse cx="10" cy="5" rx="13" ry="6" fill="${SPECIES[kind].color}" stroke="#527065"/></g>`).join('')}<path d="M226 54h60m-12-8 12 8-12 8" fill="none" stroke="#78938b" stroke-width="2"/></svg>`;
}
function show(title, content, buttons) {
  cancel(); $('overlay').hidden = false;
  $('card').innerHTML = `<p class="card-number">${String(game.index + 1).padStart(2, '0')} / 08</p><h2>${title}</h2>${content}<div class="actions"></div>`;
  for (const [label, action, primary] of buttons) {
    const b = document.createElement('button'); b.textContent = label; b.onclick = action;
    if (primary) b.className = 'primary'; $('card').querySelector('.actions').append(b);
  }
  $('card').focus(); updateHud();
}
function start() {audio.ensureContext(); game.mode = 'play'; $('overlay').hidden = true; canvas.focus(); last = performance.now(); message('');}
function ready() {
  game.mode = 'ready';
  show(game.level.title, `${diagram()}<p>${game.level.instruction}</p><p>Cross the cord to close the loop, then lift. Draw around the fish.</p>`, [['Begin', start, true], ['Levels', map]]);
  const story = document.createElement('p');
  story.className = 'level-story';
  const text = game.level.storyItalic === false ? story : story.appendChild(document.createElement('em'));
  text.textContent = game.level.story;
  $('card').querySelector('h2').after(story);
}
export function load(index) {
  cancel(); game.load(index); game.practice = practice; ripples = []; saved.visit = index; store();
  $('title').textContent = game.level.title; $('number').textContent = `${String(index + 1).padStart(2, '0')} / 08`;
  canvas.setAttribute('aria-label', `${game.level.instruction} Cross the cord to close a loop, then lift.`);
  $('goals').innerHTML = Object.keys(game.level.goals).map(k => `<span class="goal ui-pill" id="goal-${k}">${fishGlyph(k)}<span></span></span>`).join('');
  message(''); ready(); draw();
}
function map() {
  game.mode = 'map';
  show('Levels', `<div class="map"></div><p>${LEVELS.length} of 8 levels are playable.</p>`, [['Return', ready]]);
  LEVELS.forEach((l, i) => {
    const b = document.createElement('button'); b.textContent = `${i + 1} · ${l.title}`;
    const s = document.createElement('small'); s.textContent = saved.done.includes(i) ? 'Complete' : 'Open'; b.append(s);
    b.onclick = () => load(i); $('card').querySelector('.map').append(b);
  });
}
function pause() {
  if (!['play', 'settling'].includes(game.mode)) return;
  const previous = game.mode; game.mode = 'paused';
  show('Paused', '', [['Resume', () => {game.mode = previous; $('overlay').hidden = true; last = performance.now(); canvas.focus();}, true], ['Retry', () => load(game.index)], ['Levels', map], [audio.isMuted ? 'Sound: Off' : 'Sound: On', toggleSound]]);
  const sound = [...$('card').querySelectorAll('button')].find(b => b.textContent.startsWith('Sound:'));
  sound.id = 'sound'; sound.setAttribute('aria-pressed', String(!audio.isMuted));
}
function toggleSound() {
  audio.toggleMute();
  const sound = $('sound');
  if (sound) {sound.textContent = audio.isMuted ? 'Sound: Off' : 'Sound: On'; sound.setAttribute('aria-pressed', String(!audio.isMuted));}
  if (!audio.isMuted && gesture) audio.startDrawingRustle();
}
function completion() {
  if (!practice) {saved.done = [...new Set([...saved.done, game.index])]; store();}
  const index = game.index;
  show(index === LEVELS.length - 1 ? 'Chapter complete' : 'Level complete', '', index < LEVELS.length - 1 ? [['Next level', () => load(index + 1), true], ['Play again', () => load(index)]] : [['Play again', () => load(index), true], ['Levels', map]]);
}
function failure() {
  cancel(); show('Time ended', '', [['Retry', () => load(game.index), true], ['Practice', () => {practice = true; practiceLabel(); load(game.index); start();}], ['Levels', map]]);
}
function practiceLabel() {$('practice').textContent = `Practice: ${practice ? 'on' : 'off'}`; $('practice').setAttribute('aria-pressed', String(practice));}
$('pause').onclick = pause; $('visits').onclick = map;
$('practice').onclick = () => {practice = !practice; practiceLabel(); load(game.index);};
document.addEventListener('visibilitychange', () => {if (document.hidden) pause();});
window.addEventListener('blur', pause);
window.addEventListener('pagehide', cancel);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {e.preventDefault(); if (game.mode === 'paused') $('card').querySelector('.primary').click(); else pause();}
  if (e.key.toLowerCase() === 'r' && e.target === canvas) load(game.index);
  if (e.key.toLowerCase() === 'm' && !e.repeat) {e.preventDefault(); toggleSound();}
});
const point = e => {const b = canvas.getBoundingClientRect(); return {x: Math.max(5, Math.min(W - 5, (e.clientX - b.left) * W / b.width)), y: Math.max(5, Math.min(H - 5, (e.clientY - b.top) * H / b.height))};};
canvas.addEventListener('pointerdown', e => {
  if (game.mode !== 'play' || pointer !== null || e.button !== 0) return;
  e.preventDefault(); pointer = e.pointerId; canvas.setPointerCapture(pointer);
  gesture = new StringGesture(point(e)); game.started = true;
  lastPointerTime = performance.now(); audio.startDrawingRustle();
});
function sample(e, force = false) {
  if (!gesture) return;
  const length = gesture.totalLength, now = performance.now();
  const result = gesture.sample(point(e), game.fish, force);
  const dt = (now - lastPointerTime) / 1000; lastPointerTime = now;
  audio.updateDrawingSpeed(dt > 0 ? (gesture.totalLength - length) / dt : 0);
  if (result.snapped) {audio.playFrayFault(); cancel(); message('The cord snapped. Draw a smaller figure.');}
  else {const disruption=strokeDisruption(gesture.points,game.leafDisks,game.beetles);if(disruption){audio.playFrayFault();cancel();message(disruption);}}
}
canvas.addEventListener('pointermove', e => {
  if (e.pointerId !== pointer) return;
  const samples = e.getCoalescedEvents?.();
  for (const event of samples?.length ? samples : [e]) sample(event);
});
canvas.addEventListener('pointerup', e => {
  if (e.pointerId !== pointer || !gesture) return;
  sample(e, true); if (!gesture) return;
  const band = getLengthBand(gesture.totalLength).name;
  const result = judgeStroke(gesture.points, game.fish, gesture.hasBeads, game.level, game.leafDisks, game.beetles); cancel();
  audio.playCordPluck(band === 'Petite' ? 320 : band === 'Balanced' ? 240 : 180);
  if (result.error) {audio.playFrayFault(); message(result.error); return;}
  audio.playHarmonyChord(result.groups.length === 2 ? 'CROSS_MEADOW_CORRESPONDENCE' : result.groups[0].length === 3 ? 'TRIO_OF_FLIGHT' : 'KINDRED_PAIR', band);
  game.accept(result); result.pockets.forEach(p => ripples.push({polygon: p.polygon, life: 1.2}));
  message(''); updateHud();
});
canvas.addEventListener('pointercancel', cancel); canvas.addEventListener('lostpointercapture', cancel);
function path(points) {ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));}
function fishPaper(kind) {
  const tile = paperTile('default', ctx.fillStyle, FISH_PAPER[kind]);
  if (!tile) {ctx.fill(); return;}
  if (!tile.pattern) {
    tile.pattern = ctx.createPattern(tile.canvas, 'repeat');
    tile.pattern.setTransform(new DOMMatrix().translate(-64, -64).scale(.5));
  }
  ctx.save(); ctx.fillStyle = tile.pattern; ctx.fill(); ctx.restore();
}
function fishArt(f) {
  const s = SPECIES[f.kind], n = s.size, beat = Math.sin(game.time * (f.kind === 'goby' ? 15 : 8) + f.phase);
  ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.heading);
  // Enlarge the artwork without changing cord contact or school spacing.
  ctx.scale(1.18, 1.18);
  ctx.globalAlpha = f.state === 'departing' ? Math.max(0, 1 - f.departure / 1.5) : 1;
  ctx.fillStyle = '#3a6a5d24'; ctx.beginPath(); ctx.ellipse(3, 6, n * 1.2, n * .42, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = s.trim; ctx.beginPath(); ctx.moveTo(-n * .5, 0);
  ctx.lineTo(-n * 1.15, -n * .24 + beat * 1.5); ctx.lineTo(-n * 1.15, n * .24 + beat * 1.5);
  ctx.closePath(); fishPaper(f.kind);
  ctx.fillStyle = s.color; ctx.strokeStyle = '#496d5d70'; ctx.lineWidth = .9;
  ctx.beginPath(); ctx.ellipse(0, 0, n * .85, n * (f.kind === 'goby' ? .34 : f.kind === 'halfbeak' ? .16 : f.kind === 'barb' ? .28 : .22), 0, 0, Math.PI * 2); fishPaper(f.kind); ctx.stroke();
  if (f.kind === 'barb') {
    ctx.fillStyle = '#59614f'; for (const x of [-.45, -.1, .28]) {ctx.beginPath(); ctx.arc(n * x, 0, 1.8, 0, Math.PI * 2); ctx.fill();}
  }
  if (f.kind === 'goby') {
    ctx.strokeStyle = '#71bec5'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-n * .55, -1); ctx.lineTo(n * .5, -1); ctx.stroke();
    ctx.fillStyle = '#5b8d85aa'; for (const y of [-1, 1]) {ctx.beginPath(); ctx.ellipse(n * .1, n * .35 * y, n * .28, n * .15, y * .4, 0, Math.PI * 2); fishPaper(f.kind);}
  }
  if (f.kind === 'halfbeak') {
    ctx.strokeStyle = '#edf5e4'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-n * .55, 0); ctx.lineTo(n * .6, 0); ctx.stroke();
    ctx.strokeStyle = '#809375'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(n * .6, 2); ctx.lineTo(n * 1.45, 2); ctx.stroke();
  }
  ctx.fillStyle = s.trim + '70'; ctx.beginPath(); ctx.ellipse(-n * .1, -n * .3, n * .28, n * .16, -.3, 0, Math.PI * 2); fishPaper(f.kind);
  ctx.strokeStyle = '#fbf3daaa'; ctx.beginPath(); ctx.moveTo(-n * .5, -1); ctx.quadraticCurveTo(0, -n * .14, n * .55, -1); ctx.stroke();
  ctx.fillStyle = '#34564a'; for (const y of [-1, 1]) {ctx.beginPath(); ctx.arc(n * .56, y * n * .12, 1.3, 0, Math.PI * 2); ctx.fill();}
  if (f.isBead) {ctx.strokeStyle = '#a15e69'; ctx.beginPath(); ctx.arc(0, 0, n, 0, Math.PI * 2); ctx.stroke();}
  ctx.restore();
}
function draw() {
  ctx.fillStyle = game.level.wash; ctx.fillRect(0, 0, W, H);
  const water = waterFor(game.level.wash);
  if (water) ctx.drawImage(water, 0, 0, W, H);
  const wash = ctx.createRadialGradient(W * .38, H * .3, 30, W * .6, H * .45, W * .7);
  wash.addColorStop(0, '#f7ecd74a'); wash.addColorStop(1, '#456b5c21'); ctx.fillStyle = wash; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = .16;
  ctx.fillStyle = '#8eac81';
  for (let i = 0; i < 28; i++) {
    const x = i % 2 ? W - 12 - (i * 31 % 115) : 8 + (i * 43 % 100), y = 135 + i * 67 % (H - 120);
    ctx.save(); ctx.translate(x, y); ctx.rotate(i * .9 + Math.sin(game.time * .3 + i) * .06);
    ctx.beginPath(); ctx.ellipse(0, 0, 12 + i % 4 * 3, 45 + i % 5 * 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  ctx.restore();
  for (const rock of game.rocks) {
    ctx.save(); ctx.translate(rock.x, rock.y); ctx.rotate(rock.x * .01);
    ctx.fillStyle = '#6e827c20'; ctx.beginPath(); ctx.ellipse(3, 5, rock.radius * 1.3, rock.radius * .82, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#96a797'; ctx.strokeStyle = '#bcc7ad'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, 0, rock.radius * 1.2, rock.radius * .76, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7e9b764a'; ctx.beginPath(); ctx.ellipse(-5, -2, rock.radius * .55, rock.radius * .38, -.4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  if (game.level.shade) {
    for (const p of shadePatches(W, H, game.time)) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.scale(p.rx, p.ry);
      const shade = ctx.createRadialGradient(0, 0, 0, 0, 0, 1); shade.addColorStop(0, '#375d5b75'); shade.addColorStop(1, '#375d5b00');
      ctx.fillStyle = shade; ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
  }
  for (const leaf of game.leafDisks) {
    ctx.save();ctx.translate(leaf.x,leaf.y);ctx.rotate(leaf.angle);
    ctx.fillStyle='#425b4520';ctx.beginPath();ctx.arc(3,4,leaf.radius,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#769267';ctx.strokeStyle='#526f50';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.arc(0,0,leaf.radius,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.strokeStyle='#afbf83';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-17,0);ctx.lineTo(17,0);
    for(const x of [-9,0,9]){ctx.moveTo(x,0);ctx.lineTo(x-5,-11);ctx.moveTo(x,0);ctx.lineTo(x-5,11);}ctx.stroke();ctx.restore();
  }
  for(const bubble of game.bubbles) {
    ctx.save();ctx.globalAlpha=Math.min(1,bubble.age*2)*Math.min(1,(3.2-bubble.age)*2);
    ctx.strokeStyle='#edf1dfb0';ctx.lineWidth=1.5;ctx.fillStyle='#e7efdc20';
    ctx.beginPath();ctx.arc(bubble.x,bubble.y,bubble.radius,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.arc(bubble.x-bubble.radius*.2,bubble.y-bubble.radius*.2,bubble.radius*.45,Math.PI,Math.PI*1.5);ctx.stroke();ctx.restore();
  }
  ctx.fillStyle = '#f7eed638'; for (let i = 0; i < 140; i++) {const x = (i * 137.3 + game.time * 1.5) % W, y = (i * 83.7) % H; ctx.fillRect(x, y, i % 3 ? 1 : 2, 1);}
  ctx.strokeStyle = '#f2f0d42b'; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {const x = W * (.2 + i * .2), y = H * (.29 + i % 2 * .24); ctx.beginPath(); ctx.ellipse(x, y, 95 + Math.sin(game.time * .5 + i) * 12, 20, -.35, 0, Math.PI * 2); ctx.stroke();}
  for (const r of ripples) {ctx.globalAlpha = r.life / 1.2; path(r.polygon); ctx.closePath(); ctx.fillStyle = '#f8efd320'; ctx.fill(); ctx.strokeStyle = '#f5ebc5'; ctx.lineWidth = 2; ctx.stroke();} ctx.globalAlpha = 1;
  game.fish.forEach(fishArt);
  for(const beetle of game.beetles) {
    ctx.save();ctx.translate(beetle.x,beetle.y);ctx.rotate(beetle.heading);
    const paddle=reduced?0:Math.sin(beetle.clock*12)*3;
    ctx.strokeStyle='#48605b';ctx.lineWidth=2;
    for(const side of [-1,1])for(const x of [-8,0,7]){ctx.beginPath();ctx.moveTo(x,side*7);ctx.lineTo(x-5+paddle,side*15);ctx.lineTo(x-9+paddle,side*17);ctx.stroke();}
    ctx.fillStyle='#394f49';ctx.strokeStyle='#b9c7a0';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.ellipse(0,0,14,9,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.ellipse(12,0,5,6,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.strokeStyle='#8caa87';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(8,0);ctx.stroke();
    ctx.fillStyle='#e3d9a6';for(const y of [-3,3]){ctx.beginPath();ctx.arc(15,y,1,0,Math.PI*2);ctx.fill();}ctx.restore();
  }
  if (gesture) {path(gesture.points); ctx.strokeStyle = getLengthBand(gesture.totalLength).cordHue; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();}
  // Visible bubble area is proportional to remaining time.
  const radius = 24 * Math.sqrt(game.practice ? 1 : game.remaining), bx = W - 46, by = 70;
  if (radius > 0) {
    ctx.save(); ctx.translate(bx, by); ctx.beginPath();
    for (let i = 0; i <= 64; i++) {const a = i / 64 * Math.PI * 2, r = radius * (1 + (reduced ? 0 : .025 * Math.sin(a * 3 + game.time * .7))); const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);}
    ctx.closePath(); ctx.fillStyle = '#edf6e544'; ctx.fill(); ctx.strokeStyle = game.remaining < .2 && !practice ? '#9a6574' : '#f5f2d6'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(-radius * .27, -radius * .3, radius * .24, Math.PI, Math.PI * 1.6); ctx.strokeStyle = '#fff8e7'; ctx.stroke(); ctx.restore();
  }
}
function updateHud() {
  for (const [k, target] of Object.entries(game.level.goals)) {
    const el = $(`goal-${k}`); if (!el) continue;
    const size = recipeSize(game.level, k);
    el.querySelector('span').textContent = `${SPECIES[k].name}${size > 2 ? ` ×${size}` : ''} ${game.progress[k]} / ${target}`;
    el.setAttribute('aria-label', `${SPECIES[k].name}: ${game.progress[k]} of ${target} ${size === 2 ? 'matching pairs' : `schools of ${size}`}`);
    el.classList.toggle('done', game.progress[k] >= target);
  }
  $('clock').setAttribute('aria-label', practice ? 'Bubble timer: untimed practice' : `Bubble timer: ${Math.ceil(game.remaining * 100)} percent remaining`);
  $('pause').disabled = !['play', 'settling'].includes(game.mode);
}
function frame(now) {
  const dt = Math.min(.04, (now - (last || now)) / 1000); last = now;
  const disruption=game.update(dt, gesture);
  if(disruption && gesture && game.mode==='play'){audio.playFrayFault();cancel();message(disruption);}
  if (['play', 'settling'].includes(game.mode)) {ripples.forEach(r => r.life -= dt); ripples = ripples.filter(r => r.life > 0);}
  if (game.mode !== lastMode) {if (game.mode === 'complete') completion(); if (game.mode === 'failed') failure(); lastMode = game.mode;}
  draw(); if (now - hudTime > 150) {updateHud(); hudTime = now;} requestAnimationFrame(frame);
}
load(saved.visit); requestAnimationFrame(frame);
