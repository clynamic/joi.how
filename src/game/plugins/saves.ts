import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { GameFrame, Pipe } from '../../engine/State';
import { Events } from '../../engine/pipes/Events';
import { Effects } from '../../engine/pipes/Effects';
import { Scheduler } from '../../engine/pipes/Scheduler';
import { Log } from '../../engine/pipes/Log';
import { PLAY_TIMELINE } from '../timelines';
import { Sequence } from '../Sequence';
import pkg from '../../../package.json';

const PLUGIN_ID = 'core.saves';

export const AUTO_SLOT = 'auto';

export type SaveFile = {
  version: string;
  savedAt: number;
  blobs: Record<string, unknown>;
};

type Collecting = { slot: string; blobs: Record<string, unknown> };

export type Restored = {
  slot: string;
  savedAt: number;
};

type LoadPayload = {
  restored: Restored | null;
  blobs: Record<string, unknown>;
};

type SavesState = {
  collecting?: Collecting;
  restored: Restored | null;
};

type Getter = Composer<GameFrame>['get'];

const paths = pluginPaths<SavesState>(PLUGIN_ID);

const eventType = Events.getKeys(PLUGIN_ID, 'save', 'load');

const persist = Effects.define<Collecting>(PLUGIN_ID, 'persist');
const restore = Effects.define<{ slot: string }>(PLUGIN_ID, 'restore');
const drop = Effects.define<{ slot: string }>(PLUGIN_ID, 'drop');

const storageKey = (slot: string) => `${PLUGIN_ID}.${slot}`;

const save = (slot: string): Pipe =>
  Events.dispatch({ type: eventType.save, payload: slot });

const AUTOSAVE_INTERVAL = 10000;

const autosave = Sequence.for(PLUGIN_ID, 'autosave');

function readFile(slot: string): SaveFile | null {
  const raw = localStorage.getItem(storageKey(slot));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SaveFile;
  } catch {
    return null;
  }
}

const Saves = definePlugin({
  sdk: 'Saves',
  id: PLUGIN_ID,
  meta: {
    name: 'Saves',
  },

  save(slot = AUTO_SLOT): Pipe {
    return save(slot);
  },

  load(slot = AUTO_SLOT): Pipe {
    return restore.emit({ slot });
  },

  drop(slot = AUTO_SLOT): Pipe {
    return drop.emit({ slot });
  },

  onSave(id: string, fn: (get: Getter) => unknown): Pipe {
    return Events.handle<string>(eventType.save, event =>
      Composer.do(({ get, set }) => {
        const collecting = get(paths)?.collecting;
        set(paths.collecting, {
          slot: event.payload,
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
    Composer.set(paths, { restored: null }),
    restore.emit({ slot: AUTO_SLOT }),
    autosave.after(AUTOSAVE_INTERVAL, 'tick')
  ),

  update: Composer.pipe(
    Events.handle<LoadPayload>(eventType.load, event =>
      Composer.set(paths.restored, event.payload.restored)
    ),
    Events.handle<string>(eventType.save, event =>
      Composer.do(({ get, set }) => {
        const collecting = get(paths)?.collecting;
        set(paths.collecting, {
          slot: event.payload,
          blobs: collecting?.blobs ?? {},
        });
      })
    ),
    Scheduler.onStop(PLAY_TIMELINE, () => save(AUTO_SLOT)),
    autosave.on('tick', () =>
      Composer.pipe(save(AUTO_SLOT), autosave.after(AUTOSAVE_INTERVAL, 'tick'))
    )
  ),

  afterUpdate: Composer.do(({ get, set, pipe }) => {
    const collecting = get(paths)?.collecting;
    if (!collecting) return;
    set(paths.collecting, undefined);
    pipe(persist.emit(collecting));
  }),

  deactivate: Composer.pipe(autosave.cancel(), Composer.set(paths, undefined)),

  get paths() {
    return paths;
  },

  effects: [
    persist.perform(({ slot, blobs }) => {
      const file: SaveFile = {
        version: pkg.version,
        savedAt: Date.now(),
        blobs,
      };
      localStorage.setItem(storageKey(slot), JSON.stringify(file));
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
            restored: { slot, savedAt: file.savedAt },
            blobs: file.blobs,
          },
        })
      );
    }),
    drop.perform(({ slot }) => localStorage.removeItem(storageKey(slot))),
  ],
});

declare module '../../engine/sdk' {
  interface PluginSDK {
    Saves: typeof Saves;
  }
}

export default Saves;
