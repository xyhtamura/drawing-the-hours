import { CHAPTER_PALETTES } from './palettes.js';

const STORAGE_KEY = 'drawing-the-hours-color-mode';
let mode = 'default';
let hour = 'dawn';
try { if (globalThis.localStorage?.getItem(STORAGE_KEY) === 'light') mode = 'light'; } catch {}

export function themeColor(role, fallback) {
  return mode === 'light' ? fallback : CHAPTER_PALETTES[hour][role] ?? fallback;
}

export function themeKey() { return `${mode}:${hour}`; }
export function getColorMode() { return mode; }

export function setColorMode(value) {
  if (!['default', 'light'].includes(value)) return;
  mode = value;
  try { globalThis.localStorage?.setItem(STORAGE_KEY, mode); } catch {}
  applyTheme();
}

export function setThemeHour(value) {
  hour = Object.hasOwn(CHAPTER_PALETTES, value) ? value : 'dawn';
  applyTheme();
}

function applyTheme() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.colorMode = mode;
  root.dataset.hour = hour;
  const roles = {
    'bg-cream': 'bottom', 'panel-bg': 'panel', 'border-paper': 'edge',
    'text-dark': 'ink', 'text-muted': 'muted', 'accent-terracotta': 'balanced',
    'accent-blush': 'petite', 'accent-plum': 'extended', 'accent-green': 'vein',
  };
  for (const [variable, role] of Object.entries(roles)) {
    if (mode === 'light') root.style.removeProperty(`--${variable}`);
    else root.style.setProperty(`--${variable}`, CHAPTER_PALETTES[hour][role]);
  }
  const toggle = document.getElementById('btn-color-mode');
  if (toggle) {
    toggle.textContent = mode === 'light' ? 'Colors: Pure light' : 'Colors: Default';
    toggle.setAttribute('aria-pressed', String(mode === 'light'));
  }
}
