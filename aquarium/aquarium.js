import {LEVELS, SPECIES} from './levels.js';
import {judgeStroke} from './rules.js';
import {Aquarium} from './simulation.js';
import {StringGesture} from '../src/string.js';
import {getLengthBand} from '../src/geometry.js';

const $ = id => document.getElementById(id), canvas = $('field'), ctx = canvas.getContext('2d');
const portrait = matchMedia('(max-width:650px)').matches;
canvas.width = portrait ? 640 : 960; canvas.height = portrait ? 960 : 640;
const W = canvas.width, H = canvas.height;
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
let gesture = null, pointer = null, practice = false, last = 0, hudTime = 0, ripples = [], lastMode = '';
const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
function store() {if (!testMode) try {localStorage.setItem(SAVE_KEY, JSON.stringify(saved));} catch {}}
function cancel() {gesture?.releaseBeads(); gesture = null; pointer = null;}
function message(text) {$('status').textContent = text;}
function fishGlyph(kind) {
  const s = SPECIES[kind];
  return `<svg viewBox="0 0 60 28" aria-hidden="true"><path d="M20 14 4 3 4 25Z" fill="${s.trim}"/><ellipse cx="33" cy="14" rx="16" ry="7" fill="${s.color}" stroke="${s.trim}"/><circle cx="43" cy="12" r="2" fill="#34574f"/></svg>`;
}
function diagram() {
  const kinds = Object.keys(game.level.goals);
  return `<svg class="diagram" viewBox="0 0 340 115" role="img" aria-label="A closed loop around two matching fish"><path d="M65 90C15 30 80 3 152 25C213 44 188 97 114 97C87 97 65 90 51 77" fill="none" stroke="#af7376" stroke-width="3"/>${[85,130].map(x => `<g transform="translate(${x} 48)"><path d="M0 5 -10 -2 -10 12Z" fill="${SPECIES[kinds.at(-1)].trim}"/><ellipse cx="10" cy="5" rx="13" ry="6" fill="${SPECIES[kinds.at(-1)].color}" stroke="#527065"/></g>`).join('')}<path d="M226 54h60m-12-8 12 8-12 8" fill="none" stroke="#78938b" stroke-width="2"/></svg>`;
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
function start() {game.mode = 'play'; $('overlay').hidden = true; canvas.focus(); last = performance.now(); message('');}
function ready() {
  game.mode = 'ready';
  show(game.level.title, `${diagram()}<p>${game.level.instruction}</p><p>Cross the cord to close the loop, then lift. Draw around the fish.</p>`, [['Begin', start, true], ['Levels', map]]);
}
export function load(index) {
  cancel(); game.load(index); game.practice = practice; ripples = []; saved.visit = index; store();
  $('title').textContent = game.level.title; $('number').textContent = `${String(index + 1).padStart(2, '0')} / 08`;
  $('goals').innerHTML = Object.keys(game.level.goals).map(k => `<span class="goal" id="goal-${k}">${fishGlyph(k)}<span></span></span>`).join('');
  message(''); ready(); draw();
}
function map() {
  game.mode = 'map';
  show('Levels', '<div class="map"></div><p>Two of eight levels are playable.</p>', [['Return', ready]]);
  LEVELS.forEach((l, i) => {
    const b = document.createElement('button'); b.textContent = `${i + 1} · ${l.title}`;
    const s = document.createElement('small'); s.textContent = saved.done.includes(i) ? 'Complete' : 'Open'; b.append(s);
    b.onclick = () => load(i); $('card').querySelector('.map').append(b);
  });
}
function pause() {
  if (!['play', 'settling'].includes(game.mode)) return;
  const previous = game.mode; game.mode = 'paused';
  show('Paused', '', [['Resume', () => {game.mode = previous; $('overlay').hidden = true; last = performance.now(); canvas.focus();}, true], ['Retry', () => load(game.index)], ['Levels', map]]);
}
function completion() {
  if (!practice) {saved.done = [...new Set([...saved.done, game.index])]; store();}
  show('Level complete', '', game.index === 0 ? [['Next level', () => load(1), true], ['Play again', () => load(0)]] : [['Play again', () => load(1), true], ['Levels', map]]);
}
function failure() {
  cancel(); show('Time ended', '', [['Retry', () => load(game.index), true], ['Practice', () => {practice = true; practiceLabel(); load(game.index); start();}], ['Levels', map]]);
}
function practiceLabel() {$('practice').textContent = `Practice: ${practice ? 'on' : 'off'}`; $('practice').setAttribute('aria-pressed', String(practice));}
$('pause').onclick = pause; $('visits').onclick = map;
$('practice').onclick = () => {practice = !practice; practiceLabel(); load(game.index);};
document.addEventListener('visibilitychange', () => {if (document.hidden) pause();});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {e.preventDefault(); if (game.mode === 'paused') $('card').querySelector('.primary').click(); else pause();}
  if (e.key.toLowerCase() === 'r' && e.target === canvas) load(game.index);
});
const point = e => {const b = canvas.getBoundingClientRect(); return {x: Math.max(5, Math.min(W - 5, (e.clientX - b.left) * W / b.width)), y: Math.max(5, Math.min(H - 5, (e.clientY - b.top) * H / b.height))};};
canvas.addEventListener('pointerdown', e => {
  if (game.mode !== 'play' || pointer !== null || e.button !== 0) return;
  e.preventDefault(); pointer = e.pointerId; canvas.setPointerCapture(pointer);
  gesture = new StringGesture(point(e)); game.started = true;
});
function sample(e, force = false) {
  if (!gesture) return;
  const result = gesture.sample(point(e), game.fish, force);
  if (result.snapped) {cancel(); message('The cord snapped. Draw a smaller figure.');}
}
canvas.addEventListener('pointermove', e => {
  if (e.pointerId !== pointer) return;
  const samples = e.getCoalescedEvents?.();
  for (const event of samples?.length ? samples : [e]) sample(event);
});
canvas.addEventListener('pointerup', e => {
  if (e.pointerId !== pointer || !gesture) return;
  sample(e, true); if (!gesture) return;
  const result = judgeStroke(gesture.points, game.fish, gesture.hasBeads); cancel();
  if (result.error) {message(result.error); return;}
  game.accept(result); result.pockets.forEach(p => ripples.push({polygon: p.polygon, life: 1.2}));
  message(''); updateHud();
});
canvas.addEventListener('pointercancel', cancel); canvas.addEventListener('lostpointercapture', cancel);
function path(points) {ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));}
function fishArt(f) {
  const s = SPECIES[f.kind], n = s.size, beat = Math.sin(game.time * (f.kind === 'ricefish' ? 15 : 8) + f.phase);
  ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.heading);
  ctx.globalAlpha = f.state === 'departing' ? Math.max(0, 1 - f.departure / 1.5) : 1;
  ctx.fillStyle = '#3a6a5d18'; ctx.beginPath(); ctx.ellipse(3, 6, n * 1.2, n * .42, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = s.trim; ctx.beginPath(); ctx.moveTo(-n * .5, 0);
  if (f.kind === 'guppy') {ctx.bezierCurveTo(-n, -n * .35, -n * 1.9, -n * .65 + beat * 2, -n * 1.5, beat * 3); ctx.bezierCurveTo(-n * 1.9, n * .65 + beat * 2, -n, n * .35, -n * .5, 0);}
  else {ctx.lineTo(-n * 1.25, -n * .3 + beat * 2); ctx.lineTo(-n * 1.25, n * .3 + beat * 2);}
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = s.color; ctx.strokeStyle = '#496d5d90'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(0, 0, n * .85, n * (f.kind === 'guppy' ? .32 : .22), 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = s.trim + '70'; ctx.beginPath(); ctx.ellipse(-n * .1, -n * .3, n * .28, n * .16, -.3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fbf3daaa'; ctx.beginPath(); ctx.moveTo(-n * .5, -1); ctx.quadraticCurveTo(0, -n * .14, n * .55, -1); ctx.stroke();
  ctx.fillStyle = '#34564a'; for (const y of [-1, 1]) {ctx.beginPath(); ctx.arc(n * .56, y * n * .12, 1.3, 0, Math.PI * 2); ctx.fill();}
  if (f.isBead) {ctx.strokeStyle = '#a15e69'; ctx.beginPath(); ctx.arc(0, 0, n, 0, Math.PI * 2); ctx.stroke();}
  ctx.restore();
}
function draw() {
  ctx.fillStyle = game.level.wash; ctx.fillRect(0, 0, W, H);
  const wash = ctx.createRadialGradient(W * .38, H * .3, 30, W * .6, H * .45, W * .7);
  wash.addColorStop(0, '#f7ecd74a'); wash.addColorStop(1, '#456b5c21'); ctx.fillStyle = wash; ctx.fillRect(0, 0, W, H);
  // Indistinct paving and vegetation seen through water, without a horizon or tank rim.
  ctx.save(); ctx.globalAlpha = .16; ctx.strokeStyle = '#738477'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-40, H * .78); ctx.lineTo(W * .2, H * .68); ctx.lineTo(W * .19, H + 30); ctx.moveTo(W * .2, H * .68); ctx.lineTo(W + 50, H * .81); ctx.stroke();
  ctx.fillStyle = '#8eac81';
  for (let i = 0; i < 28; i++) {
    const x = i % 2 ? W - 12 - (i * 31 % 115) : 8 + (i * 43 % 100), y = 135 + i * 67 % (H - 120);
    ctx.save(); ctx.translate(x, y); ctx.rotate(i * .9 + Math.sin(game.time * .3 + i) * .06);
    ctx.beginPath(); ctx.ellipse(0, 0, 12 + i % 4 * 3, 45 + i % 5 * 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  ctx.restore();
  ctx.fillStyle = '#f7eed638'; for (let i = 0; i < 140; i++) {const x = (i * 137.3 + game.time * 1.5) % W, y = (i * 83.7) % H; ctx.fillRect(x, y, i % 3 ? 1 : 2, 1);}
  ctx.strokeStyle = '#f2f0d42b'; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {const x = W * (.2 + i * .2), y = H * (.29 + i % 2 * .24); ctx.beginPath(); ctx.ellipse(x, y, 95 + Math.sin(game.time * .5 + i) * 12, 20, -.35, 0, Math.PI * 2); ctx.stroke();}
  for (const r of ripples) {ctx.globalAlpha = r.life / 1.2; path(r.polygon); ctx.closePath(); ctx.fillStyle = '#f8efd320'; ctx.fill(); ctx.strokeStyle = '#f5ebc5'; ctx.lineWidth = 2; ctx.stroke();} ctx.globalAlpha = 1;
  game.fish.forEach(fishArt);
  if (gesture) {path(gesture.points); ctx.strokeStyle = getLengthBand(gesture.totalLength).cordHue; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();}
  // Visible bubble area is proportional to remaining time.
  const radius = 24 * Math.sqrt(game.practice ? 1 : game.remaining), bx = W - 46, by = 43;
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
    el.querySelector('span').textContent = `${SPECIES[k].name} ${game.progress[k]} / ${target}`;
    el.setAttribute('aria-label', `${SPECIES[k].name}: ${game.progress[k]} of ${target} matching pairs`);
    el.classList.toggle('done', game.progress[k] >= target);
  }
  $('clock').setAttribute('aria-label', practice ? 'Bubble timer: untimed practice' : `Bubble timer: ${Math.ceil(game.remaining * 100)} percent remaining`);
  $('pause').disabled = !['play', 'settling'].includes(game.mode);
}
function frame(now) {
  const dt = Math.min(.04, (now - (last || now)) / 1000); last = now;
  game.update(dt, gesture);
  if (['play', 'settling'].includes(game.mode)) {ripples.forEach(r => r.life -= dt); ripples = ripples.filter(r => r.life > 0);}
  if (game.mode !== lastMode) {if (game.mode === 'complete') completion(); if (game.mode === 'failed') failure(); lastMode = game.mode;}
  draw(); if (now - hudTime > 150) {updateHud(); hudTime = now;} requestAnimationFrame(frame);
}
load(saved.visit); requestAnimationFrame(frame);
