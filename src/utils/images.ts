import { useEffect } from 'react';
import { ImageSize } from '../common';
import { ImageItem, ImageType } from '../types';

interface PreloadItem {
  src: string;
  type: 'image' | 'video';
}

const preloadItems = (items: PreloadItem[]) => {
  items.forEach(item => {
    switch (item.type) {
      case 'image': {
        const img = new Image();
        img.src = item.src;
        break;
      }
      case 'video': {
        const video = document.createElement('video');
        video.src = item.src;
        break;
      }
    }
  });
};

export const useImagePreloader = (imageItems: ImageItem[], size: ImageSize) => {
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
  }, [imageItems, size]);
};
