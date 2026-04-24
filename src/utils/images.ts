import { useEffect } from 'react';
import { ImageItem, ImageSize, ImageType } from '../types';
import { useLocalImages } from '../local/LocalProvider';

interface PreloadItem {
  src: string;
  type: 'image' | 'video';
}

const usePreloadItems = () => {
  const { resolveUrl } = useLocalImages();

  return async (items: PreloadItem[]) => {
    for (const item of items) {
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
  };
};

export const useImagePreloader = (imageItems: ImageItem[], size: ImageSize) => {
  const preloadItems = usePreloadItems();

  useEffect(() => {
    const items: PreloadItem[] = [];

    imageItems.forEach(item => {
      if (size === ImageSize.thumbnail) {
        items.push({ src: item.thumbnail, type: 'image' });
      } else if (size === ImageSize.preview) {
        items.push({ src: item.preview, type: 'image' });
      } else if (size === ImageSize.full) {
        if (item.type === ImageType.video) {
          items.push({ src: item.full, type: 'video' });
        } else {
          items.push({ src: item.full, type: 'image' });
        }
      }
    });

    preloadItems(items);
  }, [imageItems, preloadItems, size]);
};
