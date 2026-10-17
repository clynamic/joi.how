/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { localImageService, LocalImageRequest } from './LocalImageService';
import { LocalImage, withoutMissingLocals } from './files';
import { useImages } from '../settings/ImageProvider';

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

export const LocalImageProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [, setImages] = useImages();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    localImageService
      .listIds()
      .then(ids => {
        const present = new Set(ids);
        setImages(prev => {
          const kept = withoutMissingLocals(prev, present);
          if (kept.length === prev.length) return prev;
          console.warn(
            `Dropped ${prev.length - kept.length} local images whose files are gone`
          );
          return kept;
        });
      })
      .catch(error => console.error('Failed to read local images:', error))
      .finally(() => setChecked(true));
  }, [setImages]);

  const resolveUrl = useCallback(async (url: string): Promise<string> => {
    return localImageService.resolveUrl(url);
  }, []);

  const getImage = useCallback(
    async (id: string): Promise<LocalImage | undefined> => {
      return localImageService.getImage(id);
    },
    []
  );

  const storeImage = useCallback(
    async <T extends LocalImageRequest | LocalImageRequest[]>(
      request: T
    ): Promise<T extends LocalImageRequest ? LocalImage : LocalImage[]> => {
      return localImageService.storeImage(request);
    },
    []
  );

  const removeImage = useCallback(async (id: string | string[]) => {
    return localImageService.removeImage(id);
  }, []);

  return (
    <LocalImagesContext.Provider
      value={{ storeImage, getImage, resolveUrl, removeImage }}
    >
      {checked ? children : null}
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
