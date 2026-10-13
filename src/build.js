// Which build of the page is running. The SOMEWAREZ kiosk build is the same page
// opened as index.html?somewarez (somewarez/ forwards there): it keeps saves in
// memory and adds the control bar and idle loop in somewarez/kiosk.js.

export const KIOSK = (() => {
  try { return new URLSearchParams(globalThis.location?.search || '').has('somewarez'); }
  catch { return false; }
})();

/** CSS pixels the kiosk's control bar takes below the field. */
export const KIOSK_BAR = KIOSK ? 64 : 0;
