import { definePlugin } from './Plugins';
import { Pipe } from '../State';
import { Events } from '../pipes/Events';
import { Effects } from '../pipes/Effects';

const PLUGIN_ID = 'core.storage';

export type StoredEntry = { key: string; value: unknown };

type ReadPayload = { key: string; value: unknown | null };
type ListedPayload = { prefix: string; entries: StoredEntry[] };

const eventType = Events.getKeys(PLUGIN_ID, 'read', 'listed');

const write = Effects.define<StoredEntry>(PLUGIN_ID, 'write');
const remove = Effects.define<{ key: string }>(PLUGIN_ID, 'remove');
const read = Effects.define<{ key: string }>(PLUGIN_ID, 'read');
const list = Effects.define<{ prefix: string }>(PLUGIN_ID, 'list');

function parse(raw: string | null): unknown | null {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readAll(prefix: string): StoredEntry[] {
  const entries: StoredEntry[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(prefix)) continue;
    const value = parse(localStorage.getItem(key));
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

  onRead: (
    keyOrPrefix: string,
    fn: (value: unknown | null, key: string) => Pipe
  ): Pipe =>
    Events.handle<ReadPayload>(eventType.read, event =>
      event.payload.key.startsWith(keyOrPrefix)
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
          payload: { key, value: parse(localStorage.getItem(key)) },
        })
      )
    ),
    list.perform(({ prefix }, inject) =>
      inject(
        Events.dispatch({
          type: eventType.listed,
          payload: { prefix, entries: readAll(prefix) },
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
