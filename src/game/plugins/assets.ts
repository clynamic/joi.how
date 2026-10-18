import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { GameFrame, Pipe } from '../../engine/State';
import { Effects } from '../../engine/pipes/Effects';
import { Events } from '../../engine/pipes/Events';
import { Done, Failed, Requests } from '../../engine/pipes/Requests';
import Storage, { StoredEntry } from '../../engine/plugins/Storage';

const PLUGIN_ID = 'core.assets';

export type AssetKind = 'image' | 'gif' | 'video' | 'audio' | 'text';

export type AssetSize = 'thumbnail' | 'preview' | 'full';

export type AssetRecord = {
  kind: AssetKind;
  sizes: AssetSize[];
  name?: string;
  meta?: Record<string, unknown>;
};

export type AssetKey = string;

export type LibraryEntry = {
  source: string;
  id: string;
  record: AssetRecord;
  holders: string[];
};

export type AssetState = 'listed' | 'loading' | 'loaded' | 'failed';

export type AssetEntry = {
  key: AssetKey;
  state: AssetState;
  urls: Partial<Record<AssetSize, string>>;
  wanted?: AssetSize[];
  reason?: string;
};

export type AssetsState = {
  library: Record<AssetKey, LibraryEntry>;
  inUse: Record<AssetKey, AssetEntry>;
};

export type ResolvePayload = {
  id: string;
  record: AssetRecord;
  size: AssetSize;
};
export type DropPayload = { id: string; record: AssetRecord };

const paths = pluginPaths<AssetsState>(PLUGIN_ID);

const STORAGE_PREFIX = `${PLUGIN_ID}.`;

export const assetKey = (source: string, id: string): AssetKey =>
  `${source}:${id}`;

export const parseKey = (key: AssetKey): { source: string; id: string } => {
  const at = key.indexOf(':');
  return { source: key.slice(0, at), id: key.slice(at + 1) };
};

const storageKey = (key: AssetKey) => `${STORAGE_PREFIX}${key}`;

const sources = new Map<
  string,
  {
    resolve: ReturnType<typeof Requests.define<ResolvePayload, string>>;
    drop: ReturnType<typeof Effects.define<DropPayload>>;
  }
>();

const sourceOf = (source: string) => {
  let def = sources.get(source);
  if (!def) {
    def = {
      resolve: Requests.define<ResolvePayload, string>(
        PLUGIN_ID,
        `resolve/${source}`
      ),
      drop: Effects.define<DropPayload>(PLUGIN_ID, `drop/${source}`),
    };
    sources.set(source, def);
  }
  return def;
};

const isLibraryEntry = (value: unknown): value is LibraryEntry =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as LibraryEntry).source === 'string' &&
  typeof (value as LibraryEntry).id === 'string' &&
  typeof (value as LibraryEntry).record === 'object' &&
  Array.isArray((value as LibraryEntry).holders);

const fromStorage = (entries: StoredEntry[]): Record<AssetKey, LibraryEntry> =>
  Object.fromEntries(
    entries.flatMap(({ key, value }) =>
      isLibraryEntry(value) ? [[key.slice(STORAGE_PREFIX.length), value]] : []
    )
  );

const resolve = (key: AssetKey, library: LibraryEntry, size: AssetSize): Pipe =>
  Composer.do<GameFrame>(({ get, set, pipe }) => {
    const entry = get(paths.inUse)?.[key];
    if (!entry || entry.urls[size]) return;
    const wanted = (entry.wanted ?? []).filter(s => s !== size);
    const next: AssetEntry = { key, state: 'loading', urls: entry.urls };
    if (wanted.length) next.wanted = wanted;
    set(paths.inUse, { ...get(paths.inUse), [key]: next });
    pipe(
      sourceOf(library.source).resolve.start({
        id: library.id,
        record: library.record,
        size,
      })
    );
  });

const flushWanted = (): Pipe =>
  Composer.do<GameFrame>(({ get, pipe }) => {
    const inUse = get(paths.inUse) ?? {};
    const library = get(paths.library) ?? {};
    for (const entry of Object.values(inUse)) {
      const record = library[entry.key];
      if (!record || !entry.wanted?.length) continue;
      for (const size of entry.wanted) pipe(resolve(entry.key, record, size));
    }
  });

const Assets = definePlugin({
  sdk: 'Assets',
  id: PLUGIN_ID,
  meta: {
    name: 'Assets',
  },

  key: assetKey,

  source: sourceOf,

  declare(source: string, id: string, record: AssetRecord): Pipe {
    const key = assetKey(source, id);
    return Composer.do<GameFrame>(({ get, set, pipe }) => {
      if (!get(paths)) return;
      const existing = get(paths.library)?.[key];
      set(paths.library, {
        ...(get(paths.library) ?? {}),
        [key]: { source, id, record, holders: existing?.holders ?? [] },
      });
      pipe(flushWanted());
    });
  },

  keep(source: string, id: string, record: AssetRecord, holder: string): Pipe {
    const key = assetKey(source, id);
    return Composer.do<GameFrame>(({ get, set, pipe }) => {
      if (!get(paths)) return;
      const existing = get(paths.library)?.[key];
      const holders = existing?.holders.includes(holder)
        ? existing.holders
        : [...(existing?.holders ?? []), holder];
      const entry: LibraryEntry = { source, id, record, holders };
      set(paths.library, { ...(get(paths.library) ?? {}), [key]: entry });
      pipe(Storage.write(storageKey(key), entry), flushWanted());
    });
  },

  release(key: AssetKey, holder: string): Pipe {
    return Composer.do<GameFrame>(({ get, set, pipe }) => {
      const library = get(paths.library);
      const existing = library?.[key];
      if (!existing) return;
      const holders = existing.holders.filter(h => h !== holder);
      if (holders.length > 0) {
        const entry = { ...existing, holders };
        set(paths.library, { ...library, [key]: entry });
        pipe(Storage.write(storageKey(key), entry));
        return;
      }
      const rest = { ...library };
      delete rest[key];
      set(paths.library, rest);
      const entries = { ...(get(paths.inUse) ?? {}) };
      delete entries[key];
      set(paths.inUse, entries);
      pipe(
        Storage.remove(storageKey(key)),
        sourceOf(existing.source).drop.emit({
          id: existing.id,
          record: existing.record,
        })
      );
    });
  },

  use(keys: AssetKey[]): Pipe {
    return Composer.do<GameFrame>(({ get, set }) => {
      if (!get(paths)) return;
      const entries = { ...(get(paths.inUse) ?? {}) };
      for (const key of keys) {
        if (!entries[key]) entries[key] = { key, state: 'listed', urls: {} };
      }
      set(paths.inUse, entries);
    });
  },

  unuse(keys: AssetKey[]): Pipe {
    return Composer.do<GameFrame>(({ get, set }) => {
      if (!get(paths)) return;
      const entries = { ...(get(paths.inUse) ?? {}) };
      for (const key of keys) delete entries[key];
      set(paths.inUse, entries);
    });
  },

  load(key: AssetKey, size: AssetSize): Pipe {
    return Composer.do<GameFrame>(({ get, set, pipe }) => {
      const entry = get(paths.inUse)?.[key];
      if (!entry) return;
      if (entry.urls[size]) return;
      const library = get(paths.library)?.[key];
      if (!library) {
        const wanted = entry.wanted ?? [];
        if (!wanted.includes(size)) {
          set(paths.inUse, {
            ...get(paths.inUse),
            [key]: { ...entry, wanted: [...wanted, size] },
          });
        }
        return;
      }
      pipe(resolve(key, library, size));
    });
  },

  entry(frame: GameFrame, key: AssetKey): AssetEntry | undefined {
    return Composer.get(paths.inUse)(frame)?.[key];
  },

  find(
    frame: GameFrame,
    match: { source?: string; name?: string }
  ): LibraryEntry[] {
    return Object.values(Composer.get(paths.library)(frame) ?? {}).filter(
      entry =>
        (match.source === undefined || entry.source === match.source) &&
        (match.name === undefined || entry.record.name === match.name)
    );
  },

  activate: Composer.pipe(
    Composer.set(paths, { library: {}, inUse: {} }),
    Storage.list(STORAGE_PREFIX)
  ),

  update: Composer.pipe(
    Storage.onList(STORAGE_PREFIX, entries =>
      Composer.pipe(
        Composer.over(paths.library, library => ({
          ...fromStorage(entries),
          ...library,
        })),
        flushWanted()
      )
    ),
    Events.handle<Done<string, ResolvePayload>>(Requests.doneType, event =>
      Composer.do<GameFrame>(({ get, set }) => {
        const match = /^core\.assets\/resolve\/(.+)$/.exec(event.payload.type);
        if (!match) return;
        const { payload } = event.payload;
        const key = assetKey(match[1], payload.id);
        const entry = get(paths.inUse)?.[key];
        if (!entry) return;
        set(paths.inUse, {
          ...get(paths.inUse),
          [key]: {
            ...entry,
            state: 'loaded',
            urls: { ...entry.urls, [payload.size]: event.payload.result },
          },
        });
      })
    ),
    Events.handle<Failed<ResolvePayload>>(Requests.failedType, event =>
      Composer.do<GameFrame>(({ get, set }) => {
        const match = /^core\.assets\/resolve\/(.+)$/.exec(event.payload.type);
        if (!match) return;
        const key = assetKey(match[1], event.payload.payload.id);
        const entry = get(paths.inUse)?.[key];
        if (!entry) return;
        set(paths.inUse, {
          ...get(paths.inUse),
          [key]: { ...entry, state: 'failed', reason: event.payload.reason },
        });
      })
    )
  ),

  deactivate: Composer.set(paths, undefined),

  get paths() {
    return paths;
  },
});

declare module '../../engine/sdk' {
  interface PluginSDK {
    Assets: typeof Assets;
  }
}

export default Assets;
