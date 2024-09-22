import { ImageItem } from '../types';
import { processImageElement } from './resize';

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
];

export const videoExtensions = ['mp4', 'webm'];

export const processImageFile = async (entry: FileSystemFileHandle) => {
  const file = await entry.getFile();
  const extension = file.name.split('.').pop();

  if (!extension || !itemExtensions.includes(extension)) return undefined;

  try {
    return await new Promise<ImageItem | undefined>(resolve => {
      if (videoExtensions.includes(extension)) {
        const reader = new FileReader();
        reader.onload = function (event) {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const blob = new Blob([arrayBuffer], { type: 'video/mp4' });
          const url = URL.createObjectURL(blob);

          const video = document.createElement('video');
          video.src = url;
          video.currentTime = 1;

          video.addEventListener('loadeddata', async () => {
            try {
              const item = await processImageElement(video, file, extension);
              resolve(item);
            } catch (error) {
              console.error(error);
              resolve(undefined);
            }
          });
        };
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = async event => {
          const base64 = event.target?.result;

          if (typeof base64 !== 'string') return;

          const image = new Image();
          image.src = base64;

          image.onload = async () => {
            const item = await processImageElement(image, file, extension);
            resolve(item);
          };
        };
        reader.readAsDataURL(file);
      }
    });
  } catch (error) {
    console.error(error);
    return undefined;
  }
};

export const discoverImageFiles = async (
  dir: FileSystemDirectoryHandle,
  onDiscover?: (file: FileSystemFileHandle) => void
): Promise<FileSystemFileHandle[]> => {
  const files: FileSystemFileHandle[] = [];
  const entries: (FileSystemFileHandle | FileSystemDirectoryHandle)[] = [];

  for await (const entry of dir.values()) {
    entries.push(entry);
  }

  const CHUNK_SIZE = 5;
  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    const chunk = entries.slice(i, i + CHUNK_SIZE);

    await Promise.all(
      chunk.map(async entry => {
        if (entry.kind === 'directory') {
          files.push(...(await discoverImageFiles(entry)));
        } else if (entry.kind === 'file') {
          const file = await entry.getFile();
          const extension = file.name.split('.').pop();

          if (extension && itemExtensions.includes(extension)) {
            files.push(entry);
            onDiscover?.(entry);
          }
        }
      })
    );
  }

  return files;
};
