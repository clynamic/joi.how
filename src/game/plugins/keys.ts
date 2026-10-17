import { definePlugin } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { Pipe } from '../../engine/State';
import { Events } from '../../engine/pipes/Events';
import { Effects, type Inject } from '../../engine/pipes/Effects';

const PLUGIN_ID = 'core.keys';

export type KeyPress = {
  key: string;
  code: string;
  repeat: boolean;
  shift: boolean;
  ctrl: boolean;
  alt: boolean;
  meta: boolean;
};

export type KeyOptions = {
  repeat?: boolean;
  modified?: boolean;
};

const eventType = Events.getKeys(PLUGIN_ID, 'down');

const listen = Effects.define(PLUGIN_ID, 'listen');
const unlisten = Effects.define(PLUGIN_ID, 'unlisten');
const capture = Effects.define<{ key: string }>(PLUGIN_ID, 'capture');
const release = Effects.define<{ key: string }>(PLUGIN_ID, 'release');

let handler: ((e: KeyboardEvent) => void) | null = null;
const captured = new Map<string, number>();

const plain = (press: KeyPress) => !press.ctrl && !press.alt && !press.meta;

function attach(inject: Inject) {
  if (handler) return;
  handler = (e: KeyboardEvent) => {
    if (captured.has(e.key)) e.preventDefault();
    inject(
      Events.dispatch({
        type: eventType.down,
        payload: {
          key: e.key,
          code: e.code,
          repeat: e.repeat,
          shift: e.shiftKey,
          ctrl: e.ctrlKey,
          alt: e.altKey,
          meta: e.metaKey,
        },
      })
    );
  };
  window.addEventListener('keydown', handler);
}

function detach() {
  if (!handler) return;
  window.removeEventListener('keydown', handler);
  handler = null;
}

const Keys = definePlugin({
  sdk: 'Keys',
  id: PLUGIN_ID,
  meta: {
    name: 'Keys',
  },

  onKey: (
    key: string | string[],
    fn: (press: KeyPress) => Pipe,
    { repeat = false, modified = false }: KeyOptions = {}
  ): Pipe => {
    const keys = Array.isArray(key) ? key : [key];
    return Events.handle<KeyPress>(eventType.down, event => {
      const press = event.payload;
      if (!keys.includes(press.key)) return frame => frame;
      if (press.repeat && !repeat) return frame => frame;
      if (!plain(press) && !modified) return frame => frame;
      return fn(press);
    });
  },

  capture: (key: string): Pipe => capture.emit({ key }),

  release: (key: string): Pipe => release.emit({ key }),

  activate: listen.emit(),

  deactivate: Composer.pipe(unlisten.emit()),

  effects: [
    listen.perform((_, inject) => attach(inject)),
    unlisten.perform(() => detach()),
    capture.perform(({ key }) =>
      captured.set(key, (captured.get(key) ?? 0) + 1)
    ),
    release.perform(({ key }) => {
      const count = (captured.get(key) ?? 0) - 1;
      if (count > 0) captured.set(key, count);
      else captured.delete(key);
    }),
  ],
});

declare module '../../engine/sdk' {
  interface PluginSDK {
    Keys: typeof Keys;
  }
}

export default Keys;
