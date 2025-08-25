/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react';
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

const initDB = async (): Promise<IDBPDatabase<LocalImagesDB>> => {
  return openDB<LocalImagesDB>('local-images', 1, {
    upgrade(db) {
      const store = db.createObjectStore('images', { keyPath: 'id' });
      store.createIndex('by-id', 'id');
    },
  });
};

export interface LocalImageRequest {
  blob: Blob;
  type: ImageType;
  name: string;
}

const LocalImagesContext = createContext<
  | {
      storeImage: <T extends LocalImageRequest | LocalImageRequest[]>(
        request: T
      ) => Promise<T extends LocalImageRequest ? LocalImage : LocalImage[]>;
      getImage: (id: string) => Promise<LocalImage | undefined>;
      resolveUrl: (url: string) => Promise<string>;
      removeImage: (id: string | string[]) => Promise<void>;
    }
  | undefined
>(undefined);

const generateImageId = (name: string, hash: string): string => {
  return `${name}-${hash}`;
};

const generateHash = async (blob: Blob): Promise<string> => {
  const buffer = await blob.arrayBuffer();
  const hash = SparkMD5.ArrayBuffer.hash(buffer);
  return hash;
};

const createThumbnailOrPreview = async (
  image: LocalImage,
  size: ImageSize
): Promise<Blob> => {
  if (size === ImageSize.full) throw new Error('Invalid image size provided');
  return generateLowResImage(
    image.full,
    image.type,
    size as unknown as LowResImageSize
  );
};

export const LocalImageProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const dbInit = useMemo<Promise<IDBPDatabase<LocalImagesDB>>>(async () => {
    return initDB();
  }, []);
  const resolveRequests = useRef<Map<string, Promise<string>>>(new Map());

  const resolveUrl = useCallback(
    async (url: string): Promise<string> => {
      const db = await dbInit;

      const match = url.match(/^local:\/\/(thumbnail|preview|full)\/(.+)$/);

      if (!match) return url;

      const [, size, id] = match;
      const key = `${size}-${id}`;

      if (resolveRequests.current.has(key)) {
        return resolveRequests.current.get(key)!;
      }

      const requestPromise = (async () => {
        const tx = db.transaction('images', 'readonly');
        const store = tx.objectStore('images');
        const image: LocalImage = await store.get(id);

        if (!image) throw new Error('Image not found in database');

        let blob: Blob | undefined;

        switch (size as ImageSize) {
          case ImageSize.thumbnail:
            if (!image.thumbnail) {
              const thumbnail = await createThumbnailOrPreview(
                image,
                ImageSize.thumbnail
              );
              image.thumbnail = thumbnail;
              const updateTx = db.transaction('images', 'readwrite');
              const updateStore = updateTx.objectStore('images');
              await updateStore.put(image);
              await updateTx.done;
            }
            blob = image.thumbnail;
            break;
          case ImageSize.preview:
            if (!image.preview) {
              const preview = await createThumbnailOrPreview(
                image,
                ImageSize.preview
              );
              image.preview = preview;
              const updateTx = db.transaction('images', 'readwrite');
              const updateStore = updateTx.objectStore('images');
              await updateStore.put(image);
              await updateTx.done;
            }
            blob = image.preview;
            break;
          case ImageSize.full:
            blob = image.full;
            break;
        }

        if (!blob) throw new Error('Failed to resolve image blob');
        return URL.createObjectURL(blob);
      })();

      resolveRequests.current.set(key, requestPromise);

      try {
        const result = await requestPromise;
        return result;
      } finally {
        resolveRequests.current.delete(key);
      }
    },
    [dbInit]
  );

  const getImage = useCallback(
    async (id: string): Promise<LocalImage | undefined> => {
      const db = await dbInit;

      const tx = db.transaction('images', 'readonly');
      const store = tx.objectStore('images');
      return store.get(id);
    },
    [dbInit]
  );

  const storeImage = useCallback(
    async <T extends LocalImageRequest | LocalImageRequest[]>(
      request: T
    ): Promise<T extends LocalImageRequest ? LocalImage : LocalImage[]> => {
      const db = await dbInit;
      const requests: LocalImageRequest[] = Array.isArray(request)
        ? request
        : [request];

      const preparedImages: LocalImage[] = [];
      for (const { blob, type, name } of requests) {
        const hash = await generateHash(blob);
        const id = generateImageId(name, hash);

        const newImage: LocalImage = {
          full: blob,
          type,
          hash,
          name,
          id,
        };

        preparedImages.push(newImage);
      }

      const tx = db.transaction('images', 'readwrite');
      const store = tx.objectStore('images');

      for (const image of preparedImages) {
        await store.put(image);
      }

      await tx.done;

      return preparedImages as T extends LocalImageRequest
        ? LocalImage
        : LocalImage[];
    },
    [dbInit]
  );

  const removeImage = useCallback(
    async (id: string | string[]) => {
      const db = await dbInit;

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
    },
    [dbInit]
  );

  return (
    <LocalImagesContext.Provider
      value={{ storeImage, getImage, resolveUrl, removeImage }}
    >
      {children}
    </LocalImagesContext.Provider>
  );
};

export const useLocalImages = () => {
  const context = useContext(LocalImagesContext);
  if (!context) {
    throw new Error('useLocalImages must be used within a LocalImagesProvider');
  }
  return context;
};
