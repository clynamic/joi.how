import { ImageItem, ImageServiceType, ImageType } from '../types';

export interface LocalImage {
  thumbnail?: Blob;
  preview?: Blob;
  full: Blob;
  type: ImageType;
  hash: string;
  name: string;
  id: string;
}

export const itemExtensions = [
  'gif',
  'bmp',
  'jpg',
  'jpeg',
  'webp',
  'png',
  'svg',
  'mp4',
  'webm',
  'mov',
  'avi',
  'mkv',
];

export const videoExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv'];

export const imageTypeFromExtension = (extension: string): ImageType => {
  switch (extension) {
    case 'webm':
    case 'mp4':
    case 'mov':
    case 'avi':
    case 'mkv':
      return ImageType.video;
    case 'gif':
      return ImageType.gif;
    default:
      return ImageType.image;
  }
};

export const discoverImageFiles = async (
  fileList: FileList
): Promise<File[]> => {
  const files: File[] = [];

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension && itemExtensions.includes(extension)) {
      files.push(file);
    }
  }

  return files;
};

export const localImageToImage = (localImage: LocalImage): ImageItem => {
  return {
    thumbnail: `local://thumbnail/${localImage.id}`,
    preview: `local://preview/${localImage.id}`,
    full: `local://full/${localImage.id}`,
    type: localImage.type,
    source: `local://full/${localImage.id}`,
    service: ImageServiceType.local,
    id: localImage.id,
  };
};
