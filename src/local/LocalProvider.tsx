/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import { openDB, IDBPDatabase } from 'idb';
import { ImageSize } from '../common';
import { ImageType } from '../types';
import { generateLowResImage, LowResImageSize } from './resize';

export interface LocalImage {
  thumbnail?: Blob;
  preview?: Blob;
  full: Blob;
  type: ImageType;
  hash: string;
  name: string;
  id: string;
}

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

const LocalImagesContext = createContext<
  | {
      storeImage: (
        file: Blob,
        type: ImageType,
        name: string
      ) => Promise<LocalImage>;
      getImage: (id: string) => Promise<LocalImage | undefined>;
      resolveUrl: (url: string) => Promise<string>;
      removeImage: (id: string) => Promise<void>;
    }
  | undefined
>(undefined);

const generateImageId = (name: string, hash: string): string => {
  return `${name}-${hash}`;
};

const generateHash = async (file: Blob): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
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

  const storeImage = useCallback(
    async (file: Blob, type: ImageType, name: string) => {
      const db = await dbInit;

      const hash = await generateHash(file);
      const id = generateImageId(name, hash);

      const newImage: LocalImage = {
        full: file,
        type,
        hash,
        name,
        id,
      };

      const tx = db.transaction('images', 'readwrite');
      const store = tx.objectStore('images');
      await store.put(newImage);
      await tx.done;

      return newImage;
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

  const resolveUrl = useCallback(
    async (url: string): Promise<string> => {
      const db = await dbInit;

      const match = url.match(/^local:\/\/(thumbnail|preview|full)\/(.+)$/);

      if (!match) return url;

      const [, size, id] = match;

      const tx = db.transaction('images', 'readonly');
      const store = tx.objectStore('images');
      const image: LocalImage = await store.get(id);

      if (!image) throw new Error('Image not found in database');

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
          return URL.createObjectURL(image.thumbnail);
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
          return URL.createObjectURL(image.preview);
        case ImageSize.full:
          return URL.createObjectURL(image.full);
      }
    },
    [dbInit]
  );

  const removeImage = useCallback(
    async (id: string) => {
      const db = await dbInit;

      const tx = db.transaction('images', 'readwrite');
      const store = tx.objectStore('images');
      await store.delete(id);
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
