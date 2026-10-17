import { openDB, IDBPDatabase } from 'idb';
import { ImageSize, ImageType } from '../types';
import { generateLowResImage, LowResImageSize } from './resize';
import SparkMD5 from 'spark-md5';
import { LocalImage } from './files';

interface LocalImagesDB {
  images: {
    key: string;
    value: LocalImage;
  };
}

export interface LocalImageRequest {
  blob: Blob;
  type: ImageType;
  name: string;
}

class LocalImageService {
  private dbPromise: Promise<IDBPDatabase<LocalImagesDB>>;
  private resolveRequests = new Map<string, Promise<string>>();
  private persistRequested = false;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private async initDB(): Promise<IDBPDatabase<LocalImagesDB>> {
    return openDB<LocalImagesDB>('local-images', 1, {
      upgrade(db) {
        const store = db.createObjectStore('images', { keyPath: 'id' });
        store.createIndex('by-id', 'id');
      },
    });
  }

  async resolveUrl(url: string): Promise<string> {
    const db = await this.dbPromise;

    const match = url.match(/^local:\/\/(thumbnail|preview|full)\/(.+)$/);

    if (!match) return url;

    const [, size, id] = match;
    const key = `${size}-${id}`;

    if (this.resolveRequests.has(key)) {
      return this.resolveRequests.get(key)!;
    }

    const requestPromise = (async () => {
      const tx = db.transaction('images', 'readonly');
      const store = tx.objectStore('images');
      const image: LocalImage = await store.get(id);

      if (!image) throw new Error('Image not found in database');

      let blob: Blob | undefined;

      switch (size as ImageSize) {
        case ImageSize.thumbnail:
          blob = await this.lowRes(db, image, ImageSize.thumbnail);
          break;
        case ImageSize.preview:
          blob = await this.lowRes(db, image, ImageSize.preview);
          break;
        case ImageSize.full:
          blob = image.full;
          break;
      }

      if (!blob) throw new Error('Failed to resolve image blob');
      return URL.createObjectURL(blob);
    })();

    this.resolveRequests.set(key, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.resolveRequests.delete(key);
    }
  }

  async listIds(): Promise<string[]> {
    const db = await this.dbPromise;
    const keys = await db.getAllKeys('images');
    return keys.map(String);
  }

  async getImage(id: string): Promise<LocalImage | undefined> {
    const db = await this.dbPromise;

    const tx = db.transaction('images', 'readonly');
    const store = tx.objectStore('images');
    return store.get(id);
  }

  async storeImage<T extends LocalImageRequest | LocalImageRequest[]>(
    request: T
  ): Promise<T extends LocalImageRequest ? LocalImage : LocalImage[]> {
    const db = await this.dbPromise;
    const requests: LocalImageRequest[] = Array.isArray(request)
      ? request
      : [request];

    const preparedImages: LocalImage[] = [];
    for (const { blob, type, name } of requests) {
      const hash = await this.generateHash(blob);
      const id = this.generateImageId(name, hash);

      const newImage: LocalImage = {
        full: blob,
        type,
        hash,
        name,
        id,
      };

      preparedImages.push(newImage);
    }

    this.persist();

    const tx = db.transaction('images', 'readwrite');
    const store = tx.objectStore('images');

    for (const image of preparedImages) {
      await store.put(image);
    }

    await tx.done;

    return (
      Array.isArray(request) ? preparedImages : preparedImages[0]
    ) as T extends LocalImageRequest ? LocalImage : LocalImage[];
  }

  async removeImage(id: string | string[]) {
    const db = await this.dbPromise;

    const tx = db.transaction('images', 'readwrite');
    const store = tx.objectStore('images');
    if (Array.isArray(id)) {
      for (const imageId of id) {
        await store.delete(imageId);
      }
    } else {
      await store.delete(id);
    }
    await tx.done;
  }

  private persist() {
    const storage = navigator.storage;
    if (this.persistRequested || !storage?.persist) return;
    this.persistRequested = true;
    storage.persist().catch(() => undefined);
  }

  private async lowRes(
    db: IDBPDatabase<LocalImagesDB>,
    image: LocalImage,
    size: ImageSize.thumbnail | ImageSize.preview
  ): Promise<Blob> {
    const cached = image[size];
    if (cached) return cached;
    try {
      const blob = await this.createThumbnailOrPreview(image, size);
      image[size] = blob;
      await db.put('images', image);
      return blob;
    } catch (error) {
      console.warn(
        `Failed to resize ${image.name}, using the full file:`,
        error
      );
      return image.full;
    }
  }

  private generateImageId(name: string, hash: string): string {
    return `${name}-${hash}`;
  }

  private async generateHash(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const hash = SparkMD5.ArrayBuffer.hash(buffer);
    return hash;
  }

  private async createThumbnailOrPreview(
    image: LocalImage,
    size: ImageSize
  ): Promise<Blob> {
    if (size === ImageSize.full) throw new Error('Invalid image size provided');
    return generateLowResImage(
      image.full,
      image.type,
      size as unknown as LowResImageSize
    );
  }
}

export const localImageService = new LocalImageService();
