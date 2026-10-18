import { describe, it, expect } from 'vitest';
import { preloadItemsFor } from '../../../src/game/components/preloadItems';
import {
  ImageItem,
  ImageServiceType,
  ImageSize,
  ImageType,
} from '../../../src/types';

const item = (type: ImageType): ImageItem => ({
  id: type,
  service: ImageServiceType.e621,
  source: `https://e621.net/posts/${type}`,
  thumbnail: `${type}-thumb.jpg`,
  preview: `${type}-preview.jpg`,
  full: type === ImageType.video ? 'video-full.webm' : `${type}-full.png`,
  type,
});

describe('preloadItemsFor', () => {
  it('should preload what the play page shows at each size', () => {
    const items = [item(ImageType.image), item(ImageType.video)];

    expect(preloadItemsFor(items, ImageSize.thumbnail)).toEqual([
      { src: 'image-thumb.jpg', type: 'image' },
      { src: 'video-thumb.jpg', type: 'image' },
    ]);
    expect(preloadItemsFor(items, ImageSize.preview)).toEqual([
      { src: 'image-preview.jpg', type: 'image' },
      { src: 'video-preview.jpg', type: 'image' },
      { src: 'video-full.webm', type: 'video' },
    ]);
    expect(preloadItemsFor(items, ImageSize.full)).toEqual([
      { src: 'image-full.png', type: 'image' },
      { src: 'video-full.webm', type: 'video' },
    ]);
  });
});
