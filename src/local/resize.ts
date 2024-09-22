import pica from 'pica';
import { ImageType, ImageServiceType } from '../types';

const picaInstance = pica({
  idle: 10000,
  createCanvas: (width, height) => {
    const canvas = new OffscreenCanvas(width, height);
    // the @types/pica package does not recognize that OffscreenCanvas is a valid return type
    return canvas as unknown as HTMLCanvasElement;
  },
});

export const resizeCanvas = async (
  canvas: HTMLCanvasElement | OffscreenCanvas,
  targetWidth: number
): Promise<string> => {
  const aspectRatio = canvas.width / canvas.height;
  const targetHeight = Math.round(targetWidth / aspectRatio);

  const resizedCanvas = document.createElement('canvas');
  resizedCanvas.width = targetWidth;
  resizedCanvas.height = targetHeight;

  await picaInstance.resize(
    canvas as unknown as HTMLCanvasElement,
    resizedCanvas
  );

  return picaInstance
    .toBlob(resizedCanvas, 'image/png')
    .then(blob => URL.createObjectURL(blob));
};

export const processImageElement = async (
  image: HTMLImageElement | HTMLVideoElement,
  file: File,
  extension: string
) => {
  const originalCanvas = new OffscreenCanvas(image.width, image.height);
  const context = originalCanvas.getContext('2d');
  if (!context) return undefined;
  context.drawImage(image, 0, 0);

  const thumbnail = await resizeCanvas(
    originalCanvas as unknown as HTMLCanvasElement,
    64
  );

  const preview = await resizeCanvas(
    originalCanvas as unknown as HTMLCanvasElement,
    850
  );

  return {
    thumbnail: thumbnail,
    preview: preview,
    full: URL.createObjectURL(file),
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
    source: URL.createObjectURL(file),
    service: ImageServiceType.local,
    id: file.name,
  };
};
