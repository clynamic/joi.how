import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { GameFrame, Pipe } from '../../engine/State';
import { Events } from '../../engine/pipes/Events';
import {
  Slots,
  SlotFile,
  SlotInfo,
  SlotsState,
} from '../../engine/plugins/Slots';

const PLUGIN_ID = 'core.saves';

export type SaveFile = SlotFile;

export type SaveInfo = SlotInfo;

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

type SavesState = SlotsState & {
  collecting?: Collecting[];
  restored: Restored | null;
};

type Getter = Composer<GameFrame>['get'];

const paths = pluginPaths<SavesState>(PLUGIN_ID);

const slots = Slots.define(PLUGIN_ID, paths);

const eventType = Events.getKeys(PLUGIN_ID, 'save', 'load');

const collect = (
  list: Collecting[] | undefined,
  { slot, meta }: SavePayload,
  blobs: Record<string, unknown>
): Collecting[] => {
  const rest = (list ?? []).filter(c => c.slot !== slot);
  const existing = (list ?? []).find(c => c.slot === slot);
  return [...rest, { slot, meta, blobs: { ...existing?.blobs, ...blobs } }];
};

const Saves = definePlugin({
  sdk: 'Saves',
  id: PLUGIN_ID,
  meta: {
    name: 'Saves',
  },

  save: (slot: string, meta?: unknown): Pipe =>
    Events.dispatch({ type: eventType.save, payload: { slot, meta } }),

  load: (slot: string): Pipe => slots.read(slot),

  drop: (slot: string): Pipe => slots.drop(slot),

  list: (): Pipe => slots.list(),

  find: (frame: GameFrame, prefix: string): SaveInfo[] =>
    slots.find(frame, prefix),

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

  activate: Composer.pipe(slots.activate, Composer.set(paths.restored, null)),

  update: Composer.pipe(
    slots.update,
    slots.onRead((slot, file) =>
      file === null
        ? frame => frame
        : Events.dispatch({
            type: eventType.load,
            payload: {
              restored: {
                slot,
                savedAt: file.savedAt,
                ...(file.meta !== undefined && { meta: file.meta }),
              },
              blobs: (file.data ?? {}) as Record<string, unknown>,
            },
          })
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
      set(paths.restored, {
        slot,
        savedAt,
        ...(meta !== undefined && { meta }),
      });
      pipe(slots.write(slot, blobs, meta, savedAt));
    }
  }),

  deactivate: slots.deactivate,

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
