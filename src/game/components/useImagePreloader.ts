import { useCallback, useEffect } from 'react';
import { ImageItem, ImageSize } from '../../types';
import { PreloadItem, preloadItemsFor } from './preloadItems';
import { useLocalImages } from '../../local/LocalProvider';

const usePreloadItems = () => {
  const { resolveUrl } = useLocalImages();

  return useCallback(
    async (items: PreloadItem[]) => {
      for (const item of items) {
        if (!item.src) continue;
        switch (item.type) {
          case 'image': {
            const img = new Image();
            img.src = await resolveUrl(item.src);
            break;
          }
          case 'video': {
            const video = document.createElement('video');
            video.src = await resolveUrl(item.src);
            break;
          }
        }
      }
    },
    [resolveUrl]
  );
};

export const useImagePreloader = (imageItems: ImageItem[], size: ImageSize) => {
  const preloadItems = usePreloadItems();

  useEffect(() => {
    preloadItems(preloadItemsFor(imageItems, size));
  }, [imageItems, preloadItems, size]);
};
