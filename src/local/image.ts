import { ImageItem, ImageServiceType, ImageType } from '../types';

//simplify the process of creating a imageitem
export function createImageItem(
  thumbnail: string,
  preview: string,
  full: string,
  fileName: string,
  extension: string
): ImageItem {
  return {
    thumbnail: thumbnail,
    preview: preview,
    full: full,
    type: (() => {
      switch (extension) {
        case 'webm':
        case 'mp4':
          return ImageType.video;
        case 'gif':
          return ImageType.gif;
        default:
          return ImageType.image;
      }
    })(),
    source: fileName,
    service: ImageServiceType.local,
    id: fileName,
  };
}
