import type { StateStorage } from 'zustand/middleware';

// Metro/React Native and web both provide a global `require`; Node/vitest may
// not. Declared so the lazy native lookup type-checks.
declare const require: ((module: string) => { default?: unknown }) | undefined;

const memory = new Map<string, string>();

/** Last-resort in-memory storage (used by the Node test environment). */
const memoryStorage: StateStorage = {
  getItem: (name) => memory.get(name) ?? null,
  setItem: (name, value) => {
    memory.set(name, value);
  },
  removeItem: (name) => {
    memory.delete(name);
  },
};

/** Synchronous web storage (browser + jsdom). */
function webStorage(): StateStorage | null {
  try {
    const ls = (globalThis as { localStorage?: Storage }).localStorage;
    if (
      ls &&
      typeof ls.getItem === 'function' &&
      typeof ls.setItem === 'function' &&
      typeof ls.removeItem === 'function'
    ) {
      // Probe: Node's experimental global localStorage can be present but
      // non-functional in the test environment, so confirm it actually works.
      const probe = '__kudoloop_probe__';
      ls.setItem(probe, '1');
      ls.removeItem(probe);
      return {
        getItem: (name) => ls.getItem(name),
        setItem: (name, value) => ls.setItem(name, value),
        removeItem: (name) => ls.removeItem(name),
      };
    }
  } catch {
    // not usable — fall through
  }
  return null;
}

/** True only inside a React Native runtime (not web, not Node). */
function isReactNative(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    (navigator as { product?: string }).product === 'ReactNative'
  );
}

/** React Native AsyncStorage, looked up lazily and only on a real device. */
function nativeStorage(): StateStorage | null {
  if (!isReactNative() || typeof require !== 'function') {
    return null;
  }
  try {
    const mod = require('@react-native-async-storage/async-storage');
    return ((mod.default ?? mod) as StateStorage) ?? null;
  } catch {
    return null;
  }
}

export const persistStorage: StateStorage = webStorage() ?? nativeStorage() ?? memoryStorage;
