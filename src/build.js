// Which build of the page is running. The SOMEWAREZ kiosk build is the same page
// opened as index.html?somewarez (somewarez/ forwards there): it keeps saves in
// memory and adds the controls and idle loop in somewarez/kiosk.js.

export const KIOSK = (() => {
  try { return new URLSearchParams(globalThis.location?.search || '').has('somewarez'); }
  catch { return false; }
})();
