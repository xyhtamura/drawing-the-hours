/** Android home-screen installation; only started by the kiosk build. */
export async function setupOffline() {
  const status = document.getElementById('offline-status');
  const button = document.getElementById('btn-install');
  // index.html links the manifest early for ?somewarez; the exported copy has no
  // query, so it is linked here instead.
  if (!document.querySelector('link[rel="manifest"]')) {
    const manifest = document.createElement('link');
    manifest.rel = 'manifest';
    manifest.href = new URL('../manifest.webmanifest', import.meta.url).href;
    document.head.append(manifest);
  }
  let prompt;
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); prompt = event; button.hidden = false;
  });
  button.onclick = async () => {
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    prompt = null; button.hidden = true;
  };
  window.addEventListener('appinstalled', () => { button.hidden = true; });
  if (!isSecureContext || !('serviceWorker' in navigator)) {
    status.textContent = 'Offline setup needs HTTPS. Open the published game in Chrome.';
    return;
  }
  status.textContent = 'Downloading for offline play…';
  try {
    const registration = await navigator.serviceWorker.register(new URL('../offline-sw.js', import.meta.url), { updateViaCache: 'none' });
    const worker = registration.installing;
    if (worker) worker.addEventListener('statechange', () => {
      if (worker.state === 'redundant' && !registration.active) status.textContent = 'Offline download failed. Reconnect and reload to retry.';
    });
    await navigator.serviceWorker.ready;
    status.textContent = 'Offline ready. In Chrome’s ⋮ menu, choose Install app or Add to Home screen. Either icon opens the game offline.';
    if (window.matchMedia('(display-mode: standalone)').matches) status.textContent = 'Offline ready.';
  } catch {
    status.textContent = 'Offline download failed. Reconnect and reload to retry.';
  }
}
