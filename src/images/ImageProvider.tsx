import { ImageItem } from '../types';
import { createLocalStorageProvider } from '../utils';

const imagesStorageKey = 'images';

export const { Provider: ImageProvider, useProvider: useImages } =
  createLocalStorageProvider<ImageItem[]>({
    key: imagesStorageKey,
    defaultData: [],
  });
