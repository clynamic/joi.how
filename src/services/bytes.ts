import { openDB, IDBPDatabase } from 'idb';

interface BytesDB {
  blobs: {
    key: string;
    value: Blob;
  };
}

export class Bytes {
  private db: Promise<IDBPDatabase<BytesDB>>;

  constructor(name = 'bytes') {
    this.db = openDB<BytesDB>(name, 1, {
      upgrade(db) {
        db.createObjectStore('blobs');
      },
    });
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
    const db = await this.db;
    const tx = db.transaction('blobs', 'readwrite');
    for (const k of Array.isArray(key) ? key : [key]) {
      await tx.store.delete(k);
    }
    await tx.done;
  }

  async keys(prefix = ''): Promise<string[]> {
    const db = await this.db;
    const all = await db.getAllKeys('blobs');
    return all.map(String).filter(k => k.startsWith(prefix));
  }
}

export const bytes = new Bytes();
