const { jsdom } = globalThis as typeof globalThis & {
  jsdom?: { window: { localStorage: Storage } };
};

if (jsdom && typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: jsdom.window.localStorage,
  });
}
