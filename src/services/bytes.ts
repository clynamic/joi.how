import { openDB, IDBPDatabase } from 'idb';

interface BytesDB {
  blobs: {
    key: string;
    value: Blob;
  };
}

export type PluginBytes = {
  put: (key: string, blob: Blob) => Promise<void>;
  get: (key: string) => Promise<Blob | undefined>;
  keys: (prefix?: string) => Promise<string[]>;
  delete: (key: string | string[]) => Promise<void>;
  url: (key: string) => Promise<string>;
  free: (key: string) => void;
};

export class Bytes {
  private opened?: Promise<IDBPDatabase<BytesDB>>;
  private urls = new Map<string, string>();
  private pending = new Map<string, Promise<string>>();

  constructor(private name = 'bytes') {}

  private get db(): Promise<IDBPDatabase<BytesDB>> {
    this.opened ??= openDB<BytesDB>(this.name, 1, {
      upgrade(db) {
        db.createObjectStore('blobs');
      },
    });
    return this.opened;
  }

  async put(key: string, blob: Blob): Promise<void> {
    const db = await this.db;
    await db.put('blobs', blob, key);
  }

  async get(key: string): Promise<Blob | undefined> {
    const db = await this.db;
    return db.get('blobs', key);
  }

  async delete(key: string | string[]): Promise<void> {
    const keys = Array.isArray(key) ? key : [key];
    for (const k of keys) this.free(k);
    const db = await this.db;
    const tx = db.transaction('blobs', 'readwrite');
    for (const k of keys) {
      await tx.store.delete(k);
    }
    await tx.done;
  }

  async url(key: string): Promise<string> {
    const made = this.urls.get(key);
    if (made) return made;
    const waiting = this.pending.get(key);
    if (waiting) return waiting;
    const promise = this.make(key);
    this.pending.set(key, promise);
    try {
      const url = await promise;
      if (this.pending.get(key) === promise) this.urls.set(key, url);
      else URL.revokeObjectURL(url);
      return url;
    } finally {
      if (this.pending.get(key) === promise) this.pending.delete(key);
    }
  }

  private async make(key: string): Promise<string> {
    const blob = await this.get(key);
    if (!blob) throw new Error(`nothing stored under ${key}`);
    return URL.createObjectURL(blob);
  }

  free(key: string): void {
    this.pending.delete(key);
    const url = this.urls.get(key);
    if (!url) return;
    URL.revokeObjectURL(url);
    this.urls.delete(key);
  }

  for(plugin: string): PluginBytes {
    const at = (key: string) => `${plugin}/${key}`;
    return {
      put: (key, blob) => this.put(at(key), blob),
      get: key => this.get(at(key)),
      keys: async (prefix = '') =>
        (await this.keys(at(prefix))).map(key => key.slice(plugin.length + 1)),
      delete: key => this.delete(Array.isArray(key) ? key.map(at) : at(key)),
      url: key => this.url(at(key)),
      free: key => this.free(at(key)),
    };
  }

  async keys(prefix = ''): Promise<string[]> {
    const db = await this.db;
    const all = await db.getAllKeys('blobs');
    return all.map(String).filter(k => k.startsWith(prefix));
  }
}

export const bytes = new Bytes();
