import { openDB, deleteDB } from 'idb';
import { ImageSize, ImageType } from '../assets';
import { generateLowResImage, LowResImageSize } from './resize';
import { PluginBytes } from '../bytes/store';
import SparkMD5 from 'spark-md5';

export interface LocalImage {
  type: ImageType;
  hash: string;
  name: string;
  id: string;
}

export interface LocalImageRequest {
  blob: Blob;
  type: ImageType;
  name: string;
}

type LegacyImage = LocalImage & {
  full: Blob;
  thumbnail?: Blob;
  preview?: Blob;
};

const fileKey = (id: string, size: ImageSize | `${ImageSize}`) =>
  `${id}/${size}`;

export class LocalImageService {
  private ready?: Promise<void>;
  private making = new Map<string, Promise<void>>();
  private persistRequested = false;

  constructor(
    private store: PluginBytes,
    private legacy = 'local-images'
  ) {}

  async url(
    id: string,
    size: ImageSize | `${ImageSize}`,
    type: ImageType
  ): Promise<string> {
    await this.migrated();
    if (size === ImageSize.full) return this.store.url(fileKey(id, size));
    const key = fileKey(id, size);
    const full = fileKey(id, ImageSize.full);
    if (!(await this.store.get(key))) {
      const blob = await this.store.get(full);
      if (!blob || !(await this.lowRes(key, blob, size, type)))
        return this.store.url(full);
    }
    return this.store.url(key);
  }

  async listIds(): Promise<string[]> {
    await this.migrated();
    const keys = await this.store.keys();
    return [...new Set(keys.map(key => key.slice(0, key.lastIndexOf('/'))))];
  }

  async storeImage<T extends LocalImageRequest | LocalImageRequest[]>(
    request: T
  ): Promise<T extends LocalImageRequest ? LocalImage : LocalImage[]> {
    await this.migrated();
    const requests: LocalImageRequest[] = Array.isArray(request)
      ? request
      : [request];

    this.persist();

    const stored: LocalImage[] = [];
    for (const { blob, type, name } of requests) {
      const hash = await this.generateHash(blob);
      const id = `${name}-${hash}`;
      await this.store.put(fileKey(id, ImageSize.full), blob);
      stored.push({ type, hash, name, id });
    }

    return (
      Array.isArray(request) ? stored : stored[0]
    ) as T extends LocalImageRequest ? LocalImage : LocalImage[];
  }

  async removeImage(id: string | string[]) {
    await this.migrated();
    const ids = Array.isArray(id) ? id : [id];
    for (const imageId of ids) {
      await this.store.delete(await this.store.keys(`${imageId}/`));
    }
  }

  free(id: string): void {
    for (const size of Object.values(ImageSize))
      this.store.free(fileKey(id, size));
  }

  private migrated(): Promise<void> {
    this.ready ??= this.migrate();
    return this.ready;
  }

  private async migrate(): Promise<void> {
    const names = (await indexedDB.databases?.())?.map(d => d.name);
    if (names && !names.includes(this.legacy)) return;
    const db = await openDB(this.legacy, 1, {
      upgrade(db) {
        db.createObjectStore('images', { keyPath: 'id' });
      },
    });
    const images: LegacyImage[] = await db.getAll('images');
    db.close();
    for (const image of images) {
      await this.store.put(fileKey(image.id, ImageSize.full), image.full);
      if (image.thumbnail)
        await this.store.put(
          fileKey(image.id, ImageSize.thumbnail),
          image.thumbnail
        );
      if (image.preview)
        await this.store.put(
          fileKey(image.id, ImageSize.preview),
          image.preview
        );
    }
    await deleteDB(this.legacy);
  }

  private persist() {
    const storage = navigator.storage;
    if (this.persistRequested || !storage?.persist) return;
    this.persistRequested = true;
    storage.persist().catch(() => undefined);
  }

  private async lowRes(
    key: string,
    full: Blob,
    size: `${ImageSize.thumbnail}` | `${ImageSize.preview}`,
    type: ImageType
  ): Promise<boolean> {
    let making = this.making.get(key);
    if (!making) {
      making = generateLowResImage(
        full,
        type,
        size as unknown as LowResImageSize
      ).then(blob => this.store.put(key, blob));
      this.making.set(key, making);
    }
    try {
      await making;
      return true;
    } catch (error) {
      console.warn(`Failed to resize ${key}, using the full file:`, error);
      return false;
    } finally {
      this.making.delete(key);
    }
  }

  private async generateHash(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    return SparkMD5.ArrayBuffer.hash(buffer);
  }
}
