import { definePlugin } from './Plugins';
import { Pipe } from '../State';
import { Events } from '../pipes/Events';
import { Effects, type Inject } from '../pipes/Effects';
import { Log } from '../pipes/Log';

const PLUGIN_ID = 'core.storage';

export type StoredEntry = { key: string; value: unknown };

type ReadPayload = { key: string; value: unknown | null };
type ListedPayload = { prefix: string; entries: StoredEntry[] };

const eventType = Events.getKeys(PLUGIN_ID, 'read', 'listed');

const write = Effects.define<StoredEntry>(PLUGIN_ID, 'write');
const remove = Effects.define<{ key: string }>(PLUGIN_ID, 'remove');
const read = Effects.define<{ key: string }>(PLUGIN_ID, 'read');
const list = Effects.define<{ prefix: string }>(PLUGIN_ID, 'list');

const unreadable = (key: string): Pipe =>
  Log.warn(PLUGIN_ID, 'ignored {key}, not valid JSON', { key });

function parse(
  raw: string | null,
  key: string,
  inject: Inject
): unknown | null {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    inject(unreadable(key));
    return null;
  }
}

function readAll(prefix: string, inject: Inject): StoredEntry[] {
  const entries: StoredEntry[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(prefix)) continue;
    const value = parse(localStorage.getItem(key), key, inject);
    if (value === null) continue;
    entries.push({ key, value });
  }
  return entries;
}

const Storage = definePlugin({
  sdk: 'Storage',
  id: PLUGIN_ID,
  meta: {
    name: 'Storage',
  },

  write: (key: string, value: unknown): Pipe => write.emit({ key, value }),

  remove: (key: string): Pipe => remove.emit({ key }),

  read: (key: string): Pipe => read.emit({ key }),

  list: (prefix: string): Pipe => list.emit({ prefix }),

  onRead: (key: string, fn: (value: unknown | null) => Pipe): Pipe =>
    Events.handle<ReadPayload>(eventType.read, event =>
      event.payload.key === key ? fn(event.payload.value) : frame => frame
    ),

  onReadPrefix: (
    prefix: string,
    fn: (value: unknown | null, key: string) => Pipe
  ): Pipe =>
    Events.handle<ReadPayload>(eventType.read, event =>
      event.payload.key.startsWith(prefix)
        ? fn(event.payload.value, event.payload.key)
        : frame => frame
    ),

  onList: (prefix: string, fn: (entries: StoredEntry[]) => Pipe): Pipe =>
    Events.handle<ListedPayload>(eventType.listed, event =>
      event.payload.prefix === prefix
        ? fn(event.payload.entries)
        : frame => frame
    ),

  effects: [
    write.perform(({ key, value }) =>
      localStorage.setItem(key, JSON.stringify(value))
    ),
    remove.perform(({ key }) => localStorage.removeItem(key)),
    read.perform(({ key }, inject) =>
      inject(
        Events.dispatch({
          type: eventType.read,
          payload: {
            key,
            value: parse(localStorage.getItem(key), key, inject),
          },
        })
      )
    ),
    list.perform(({ prefix }, inject) =>
      inject(
        Events.dispatch({
          type: eventType.listed,
          payload: { prefix, entries: readAll(prefix, inject) },
        })
      )
    ),
  ],
});

declare module '../sdk' {
  interface PluginSDK {
    Storage: typeof Storage;
  }
}

export default Storage;
