import { Composer } from '../Composer';
import { TypedPath } from '../Lens';
import { GameFrame, Pipe } from '../State';
import { Log } from '../pipes/Log';
import Storage, { StoredEntry } from './Storage';
import pkg from '../../../package.json';

export type SlotFile = {
  version: string;
  savedAt: number;
  meta?: unknown;
  data: unknown;
};

export type SlotInfo = {
  slot: string;
  version: string;
  savedAt: number;
  meta?: unknown;
};

export type SlotsState = {
  slots: SlotInfo[];
  current: string | null;
};

const majorOf = (version: string) => version.split('.')[0];

const compatible = (version: string) =>
  majorOf(version) === majorOf(pkg.version);

const asFile = (value: unknown): SlotFile | null => {
  if (typeof value !== 'object' || value === null) return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.version !== 'string') return null;
  const data = 'data' in raw ? raw.data : raw.blobs;
  if (data === undefined) return null;
  return {
    version: raw.version,
    savedAt: typeof raw.savedAt === 'number' ? raw.savedAt : 0,
    ...(raw.meta !== undefined && { meta: raw.meta }),
    data,
  };
};

const info = (slot: string, file: SlotFile): SlotInfo => ({
  slot,
  version: file.version,
  savedAt: file.savedAt,
  ...(file.meta !== undefined && { meta: file.meta }),
});

export const Slots = {
  version: pkg.version,

  define(
    kind: string,
    paths: TypedPath<SlotsState>,
    options: { current?: string } = {}
  ) {
    const prefix = `${kind}.`;
    const currentKey = `${kind}:current`;
    const keyOf = (slot: string) => `${prefix}${slot}`;
    const slotOf = (key: string) => key.slice(prefix.length);
    const refresh = (): Pipe => Storage.list(prefix);

    const toInfo = (entries: StoredEntry[]): SlotInfo[] =>
      entries
        .flatMap(({ key, value }) => {
          const file = asFile(value);
          return file ? [info(slotOf(key), file)] : [];
        })
        .sort((a, b) => b.savedAt - a.savedAt);

    return {
      kind,
      prefix,

      write: (
        slot: string,
        data: unknown,
        meta?: unknown,
        savedAt: number = Date.now()
      ): Pipe => {
        const file: SlotFile = {
          version: pkg.version,
          savedAt,
          ...(meta !== undefined && { meta }),
          data,
        };
        return Composer.pipe(Storage.write(keyOf(slot), file), refresh());
      },

      read: (slot: string): Pipe => Storage.read(keyOf(slot)),

      drop: (slot: string): Pipe =>
        Composer.pipe(Storage.remove(keyOf(slot)), refresh()),

      list: (): Pipe => refresh(),

      select: (slot: string): Pipe =>
        Composer.pipe(
          Composer.set(paths.current, slot),
          Storage.write(currentKey, slot),
          options.current ? Storage.read(keyOf(slot)) : frame => frame
        ),

      find: (frame: GameFrame, slotPrefix: string): SlotInfo[] =>
        (Composer.get(paths.slots)(frame) ?? []).filter(entry =>
          entry.slot.startsWith(slotPrefix)
        ),

      onRead: (fn: (slot: string, file: SlotFile | null) => Pipe): Pipe =>
        Storage.onReadPrefix(prefix, (value, key) =>
          Composer.do(({ pipe }) => {
            const slot = slotOf(key);
            if (value === null) {
              pipe(fn(slot, null));
              return;
            }
            const file = asFile(value);
            const setAside = (suffix: string): Pipe =>
              Composer.pipe(
                Storage.write(`${key}~${suffix}`, value),
                Storage.remove(key),
                fn(slot, null)
              );
            if (!file) {
              pipe(
                Log.warn(kind, 'set aside slot {slot}, not a slot file', {
                  slot,
                }),
                setAside('unreadable')
              );
              return;
            }
            if (!compatible(file.version)) {
              pipe(
                Log.warn(kind, 'set aside slot {slot} from version {version}', {
                  slot,
                  version: file.version,
                }),
                setAside(file.version)
              );
              return;
            }
            pipe(fn(slot, file));
          })
        ),

      activate: Composer.pipe(
        Composer.set(paths, { slots: [], current: null }),
        refresh(),
        Storage.read(currentKey)
      ),

      update: Composer.pipe(
        Storage.onList(prefix, entries =>
          Composer.set(paths.slots, toInfo(entries))
        ),
        Storage.onRead(currentKey, value => {
          const slot = typeof value === 'string' ? value : options.current;
          if (!slot) return frame => frame;
          return Composer.pipe(
            Composer.set(paths.current, slot),
            options.current ? Storage.read(keyOf(slot)) : frame => frame
          );
        })
      ),

      deactivate: Composer.set(paths, undefined),
    };
  },
};

export type SlotKind = ReturnType<typeof Slots.define>;
