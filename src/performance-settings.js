import { paperStyle, paperChanged } from './paper.js';

/** Session settings survive kiosk resets; gameplay geometry stays in logical pixels. */
export function setupPerformanceSettings(game) {
  const textures = document.getElementById('btn-textures');
  const shadows = document.getElementById('btn-paper-shadows');
  const resolution = document.getElementById('btn-resolution');
  const frames = document.getElementById('btn-frame-rate');
  let reduced = false;
  const sync = () => {
    textures.textContent = `Paper textures: ${paperStyle.textures ? 'On' : 'Off'}`;
    shadows.textContent = `Paper shadows: ${paperStyle.shadows ? 'On' : 'Off'}`;
    resolution.textContent = `Drawing resolution: ${reduced ? 'Reduced' : 'Full'}`;
    frames.textContent = `Frame rate: ${game.renderInterval ? '30 fps' : 'Display rate'}`;
    textures.setAttribute('aria-pressed', String(paperStyle.textures));
    shadows.setAttribute('aria-pressed', String(paperStyle.shadows));
    resolution.setAttribute('aria-pressed', String(reduced));
    frames.setAttribute('aria-pressed', String(Boolean(game.renderInterval)));
  };
  const updatePaper = () => { paperChanged(); game.render(); sync(); };
  textures.onclick = () => { paperStyle.textures = !paperStyle.textures; updatePaper(); };
  shadows.onclick = () => { paperStyle.shadows = !paperStyle.shadows; updatePaper(); };
  resolution.onclick = () => {
    reduced = !reduced;
    game.dpr = reduced ? 1 : (window.devicePixelRatio || 1);
    game.resize(); game.render(); sync();
  };
  frames.onclick = () => {
    game.renderInterval = game.renderInterval ? 0 : 1000 / 30;
    game.lastRenderTime = undefined;
    sync();
  };
  sync();
}
