import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { GameFrame, Pipe } from '../../engine/State';
import { Events } from '../../engine/pipes/Events';
import { Log } from '../../engine/pipes/Log';
import Storage, { StoredEntry } from '../../engine/plugins/Storage';
import pkg from '../../../package.json';

const PLUGIN_ID = 'core.saves';

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
  collecting?: Collecting[];
  restored: Restored | null;
  slots: SaveInfo[];
};

type Getter = Composer<GameFrame>['get'];

const paths = pluginPaths<SavesState>(PLUGIN_ID);

const eventType = Events.getKeys(PLUGIN_ID, 'save', 'load');

const KEY_PREFIX = `${PLUGIN_ID}.`;

const storageKey = (slot: string) => `${KEY_PREFIX}${slot}`;
const slotOf = (key: string) => key.slice(KEY_PREFIX.length);

const isFile = (value: unknown): value is SaveFile =>
  typeof value === 'object' &&
  value !== null &&
  'version' in value &&
  'blobs' in value;

const majorOf = (version: string) => version.split('.')[0];

const compatible = (version: string) =>
  majorOf(version) === majorOf(pkg.version);

const collect = (
  list: Collecting[] | undefined,
  { slot, meta }: SavePayload,
  blobs: Record<string, unknown>
): Collecting[] => {
  const rest = (list ?? []).filter(c => c.slot !== slot);
  const existing = (list ?? []).find(c => c.slot === slot);
  return [...rest, { slot, meta, blobs: { ...existing?.blobs, ...blobs } }];
};

function toInfo(entries: StoredEntry[]): SaveInfo[] {
  return entries
    .filter((entry): entry is StoredEntry & { value: SaveFile } =>
      isFile(entry.value)
    )
    .map(({ key, value }) => ({
      slot: slotOf(key),
      version: value.version,
      savedAt: value.savedAt,
      ...(value.meta !== undefined && { meta: value.meta }),
    }))
    .sort((a, b) => b.savedAt - a.savedAt);
}

const refresh = (): Pipe => Storage.list(KEY_PREFIX);

const Saves = definePlugin({
  sdk: 'Saves',
  id: PLUGIN_ID,
  meta: {
    name: 'Saves',
  },

  save: (slot: string, meta?: unknown): Pipe =>
    Events.dispatch({ type: eventType.save, payload: { slot, meta } }),

  load: (slot: string): Pipe => Storage.read(storageKey(slot)),

  drop: (slot: string): Pipe =>
    Composer.pipe(Storage.remove(storageKey(slot)), refresh()),

  list: (): Pipe => refresh(),

  find: (frame: GameFrame, prefix: string): SaveInfo[] =>
    (Composer.get(paths.slots)(frame) ?? []).filter(info =>
      info.slot.startsWith(prefix)
    ),

  onSave: (id: string, fn: (get: Getter) => unknown): Pipe =>
    Events.handle<SavePayload>(eventType.save, event =>
      Composer.do(({ get, set }) => {
        set(
          paths.collecting,
          collect(get(paths)?.collecting, event.payload, { [id]: fn(get) })
        );
      })
    ),

  onLoad: <T>(id: string, fn: (data: T | undefined) => Pipe): Pipe =>
    Events.handle<LoadPayload>(eventType.load, event =>
      fn(event.payload.blobs[id] as T | undefined)
    ),

  reset: (): Pipe =>
    Events.dispatch({
      type: eventType.load,
      payload: { restored: null, blobs: {} },
    }),

  fresh: (slot: string): Pipe => Composer.pipe(Saves.drop(slot), Saves.reset()),

  activate: Composer.pipe(
    Composer.set(paths, { restored: null, slots: [] }),
    refresh()
  ),

  update: Composer.pipe(
    Storage.onReadPrefix(KEY_PREFIX, (value, key) =>
      Composer.do(({ pipe }) => {
        if (value === null) return;
        const slot = slotOf(key);
        if (!isFile(value)) {
          pipe(
            Log.warn(PLUGIN_ID, 'ignored save {slot}, not a save file', {
              slot,
            })
          );
          return;
        }
        if (!compatible(value.version)) {
          pipe(
            Log.warn(PLUGIN_ID, 'ignored save {slot} from version {version}', {
              slot,
              version: value.version,
            })
          );
          return;
        }
        pipe(
          Events.dispatch({
            type: eventType.load,
            payload: {
              restored: {
                slot,
                savedAt: value.savedAt,
                ...(value.meta !== undefined && { meta: value.meta }),
              },
              blobs: value.blobs,
            },
          })
        );
      })
    ),
    Storage.onList(KEY_PREFIX, entries =>
      Composer.set(paths.slots, toInfo(entries))
    ),
    Events.handle<LoadPayload>(eventType.load, event =>
      Composer.set(paths.restored, event.payload.restored)
    ),
    Events.handle<SavePayload>(eventType.save, event =>
      Composer.do(({ get, set }) => {
        set(
          paths.collecting,
          collect(get(paths)?.collecting, event.payload, {})
        );
      })
    )
  ),

  afterUpdate: Composer.do(({ get, set, pipe }) => {
    const collecting = get(paths)?.collecting;
    if (!collecting?.length) return;
    set(paths.collecting, undefined);
    const savedAt = Date.now();
    for (const { slot, meta, blobs } of collecting) {
      const file: SaveFile = {
        version: pkg.version,
        savedAt,
        ...(meta !== undefined && { meta }),
        blobs,
      };
      set(paths.restored, {
        slot,
        savedAt,
        ...(meta !== undefined && { meta }),
      });
      pipe(Storage.write(storageKey(slot), file));
    }
    pipe(refresh());
  }),

  deactivate: Composer.set(paths, undefined),

  get paths() {
    return paths;
  },
});

declare module '../../engine/sdk' {
  interface PluginSDK {
    Saves: typeof Saves;
  }
}

export default Saves;
