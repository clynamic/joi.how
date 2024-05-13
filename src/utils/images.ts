import { useEffect } from 'react';
import { ImageSize } from '../common';
import { ImageItem } from '../types';

export const useImagePreloader = (imageItems: ImageItem[], size: ImageSize) => {
  useEffect(() => {
    const loadImages = (urls: string[]) => {
      urls.forEach(url => {
        const img = new Image();
        img.src = url;
      });
    };

    const urls: string[] = [];

    imageItems.forEach(item => {
      if (size === ImageSize.thumbnail) {
        urls.push(item.thumbnail);
      } else if (size === ImageSize.preview) {
        urls.push(item.thumbnail, item.preview);
      } else if (size === ImageSize.full) {
        urls.push(item.thumbnail, item.preview, item.full);
      }
    });

    loadImages(urls);
  }, [imageItems, size]);
};
