import { ImageItem, ImageSize, ImageType } from '../../types';

export interface PreloadItem {
  src: string;
  type: 'image' | 'video';
}

export const preloadItemsFor = (
  imageItems: ImageItem[],
  size: ImageSize
): PreloadItem[] =>
  imageItems.flatMap(item => {
    const video = item.type === ImageType.video;
    switch (size) {
      case ImageSize.thumbnail:
        return [{ src: item.thumbnail, type: 'image' }];
      case ImageSize.preview:
        return video
          ? [
              { src: item.preview, type: 'image' },
              { src: item.full, type: 'video' },
            ]
          : [{ src: item.preview, type: 'image' }];
      case ImageSize.full:
        return [{ src: item.full, type: video ? 'video' : 'image' }];
    }
  });
