// One reading of where saves and settings go. The SOMEWAREZ kiosk build keeps
// them in memory, so a reset or a reload leaves nothing behind for the next
// visitor. Every other build uses localStorage.

import { KIOSK } from './build.js';

let memory = KIOSK ? new Map() : null;

/** Switch to memory-only storage. Tests use it; the kiosk build starts in it. */
export function useMemoryStorage() { memory = new Map(); }

// Callers wrap these in try/catch: localStorage can be missing or refuse access.
export const storage = {
  getItem: key => (memory ? memory.get(key) ?? null : globalThis.localStorage.getItem(key)),
  setItem: (key, value) => { if (memory) memory.set(key, String(value)); else globalThis.localStorage.setItem(key, value); },
  removeItem: key => { if (memory) memory.delete(key); else globalThis.localStorage.removeItem(key); },
  /** Drops everything held in memory. Does nothing to localStorage. */
  clearMemory: () => { memory?.clear(); },
};
