import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { GameFrame, Pipe } from '../../engine/State';
import { Events } from '../../engine/pipes/Events';
import { Effects } from '../../engine/pipes/Effects';
import { Log } from '../../engine/pipes/Log';
import pkg from '../../../package.json';

const PLUGIN_ID = 'core.saves';

export const AUTO_SLOT = 'auto';

export type SaveFile = {
  version: string;
  savedAt: number;
  meta?: unknown;
  blobs: Record<string, unknown>;
};

export type SaveInfo = {
  slot: string;
  version: string;
  savedAt: number;
  meta?: unknown;
};

type Collecting = {
  slot: string;
  meta?: unknown;
  blobs: Record<string, unknown>;
};

export type Restored = {
  slot: string;
  savedAt: number;
  meta?: unknown;
};

type SavePayload = { slot: string; meta?: unknown };

type LoadPayload = {
  restored: Restored | null;
  blobs: Record<string, unknown>;
};

type SavesState = {
  collecting?: Collecting;
  restored: Restored | null;
  slots: SaveInfo[];
};

type Getter = Composer<GameFrame>['get'];

const paths = pluginPaths<SavesState>(PLUGIN_ID);

const eventType = Events.getKeys(PLUGIN_ID, 'save', 'load', 'listed');

const persist = Effects.define<Collecting>(PLUGIN_ID, 'persist');
const restore = Effects.define<{ slot: string }>(PLUGIN_ID, 'restore');
const drop = Effects.define<{ slot: string }>(PLUGIN_ID, 'drop');
const list = Effects.define(PLUGIN_ID, 'list');

const KEY_PREFIX = `${PLUGIN_ID}.`;

const storageKey = (slot: string) => `${KEY_PREFIX}${slot}`;

function readFile(slot: string): SaveFile | null {
  const raw = localStorage.getItem(storageKey(slot));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SaveFile;
  } catch {
    return null;
  }
}

function listFiles(): SaveInfo[] {
  const slots: SaveInfo[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(KEY_PREFIX)) continue;
    const slot = key.slice(KEY_PREFIX.length);
    const file = readFile(slot);
    if (!file) continue;
    const { version, savedAt, meta } = file;
    slots.push({ slot, version, savedAt, ...(meta !== undefined && { meta }) });
  }
  return slots.sort((a, b) => b.savedAt - a.savedAt);
}

const listed = (): Pipe =>
  Events.dispatch({ type: eventType.listed, payload: listFiles() });

const Saves = definePlugin({
  sdk: 'Saves',
  id: PLUGIN_ID,
  meta: {
    name: 'Saves',
  },

  save(slot = AUTO_SLOT, meta?: unknown): Pipe {
    return Events.dispatch({ type: eventType.save, payload: { slot, meta } });
  },

  load(slot = AUTO_SLOT): Pipe {
    return restore.emit({ slot });
  },

  drop(slot = AUTO_SLOT): Pipe {
    return drop.emit({ slot });
  },

  list(): Pipe {
    return list.emit();
  },

  onSave(id: string, fn: (get: Getter) => unknown): Pipe {
    return Events.handle<SavePayload>(eventType.save, event =>
      Composer.do(({ get, set }) => {
        const collecting = get(paths)?.collecting;
        set(paths.collecting, {
          slot: event.payload.slot,
          meta: event.payload.meta,
          blobs: { ...collecting?.blobs, [id]: fn(get) },
        });
      })
    );
  },

  onLoad<T>(id: string, fn: (data: T | undefined) => Pipe): Pipe {
    return Events.handle<LoadPayload>(eventType.load, event =>
      fn(event.payload.blobs[id] as T | undefined)
    );
  },

  reset(): Pipe {
    return Events.dispatch({
      type: eventType.load,
      payload: { restored: null, blobs: {} },
    });
  },

  fresh(): Pipe {
    return Composer.pipe(drop.emit({ slot: AUTO_SLOT }), Saves.reset());
  },

  activate: Composer.pipe(
    Composer.set(paths, { restored: null, slots: [] }),
    restore.emit({ slot: AUTO_SLOT }),
    list.emit()
  ),

  update: Composer.pipe(
    Events.handle<LoadPayload>(eventType.load, event =>
      Composer.set(paths.restored, event.payload.restored)
    ),
    Events.handle<SaveInfo[]>(eventType.listed, event =>
      Composer.set(paths.slots, event.payload)
    ),
    Events.handle<SavePayload>(eventType.save, event =>
      Composer.do(({ get, set }) => {
        const collecting = get(paths)?.collecting;
        set(paths.collecting, {
          slot: event.payload.slot,
          meta: event.payload.meta,
          blobs: collecting?.blobs ?? {},
        });
      })
    )
  ),

  afterUpdate: Composer.do(({ get, set, pipe }) => {
    const collecting = get(paths)?.collecting;
    if (!collecting) return;
    set(paths.collecting, undefined);
    pipe(persist.emit(collecting));
  }),

  deactivate: Composer.set(paths, undefined),

  get paths() {
    return paths;
  },

  effects: [
    persist.perform(({ slot, meta, blobs }, inject) => {
      const file: SaveFile = {
        version: pkg.version,
        savedAt: Date.now(),
        ...(meta !== undefined && { meta }),
        blobs,
      };
      localStorage.setItem(storageKey(slot), JSON.stringify(file));
      inject(listed());
    }),
    restore.perform(({ slot }, inject) => {
      const file = readFile(slot);
      if (!file) return;
      if (file.version !== pkg.version) {
        inject(
          Log.warn(PLUGIN_ID, 'ignored save {slot} from version {version}', {
            slot,
            version: file.version,
          })
        );
        return;
      }
      inject(
        Events.dispatch({
          type: eventType.load,
          payload: {
            restored: {
              slot,
              savedAt: file.savedAt,
              ...(file.meta !== undefined && { meta: file.meta }),
            },
            blobs: file.blobs,
          },
        })
      );
    }),
    drop.perform(({ slot }, inject) => {
      localStorage.removeItem(storageKey(slot));
      inject(listed());
    }),
    list.perform((_, inject) => inject(listed())),
  ],
});

declare module '../../engine/sdk' {
  interface PluginSDK {
    Saves: typeof Saves;
  }
}

export default Saves;
