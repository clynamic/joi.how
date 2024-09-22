import pica from 'pica';
import { ImageType } from '../types';

const picaInstance = pica({
  idle: 10000,
  createCanvas: (width, height) => {
    const canvas = new OffscreenCanvas(width, height);

    return canvas as unknown as HTMLCanvasElement;
  },
});

export const resizeCanvas = async (
  canvas: HTMLCanvasElement | OffscreenCanvas,
  targetWidth: number
): Promise<Blob> => {
  const aspectRatio = canvas.width / canvas.height;
  const targetHeight = Math.round(targetWidth / aspectRatio);

  const resizedCanvas = document.createElement('canvas');
  resizedCanvas.width = targetWidth;
  resizedCanvas.height = targetHeight;

  await picaInstance.resize(
    canvas as unknown as HTMLCanvasElement,
    resizedCanvas
  );

  return picaInstance.toBlob(resizedCanvas, 'image/png');
};

export enum LowResImageSize {
  thumbnail = 'thumbnail',
  preview = 'preview',
}

export const generateLowResImage = async (
  blob: Blob,
  type: ImageType,
  size: LowResImageSize
): Promise<Blob> => {
  const offscreenCanvas: OffscreenCanvas = await createCanvasFromBlob(
    blob,
    type
  );

  if (size === LowResImageSize.thumbnail) {
    return await resizeCanvas(
      offscreenCanvas as unknown as HTMLCanvasElement,
      64
    );
  } else if (size === LowResImageSize.preview) {
    return await resizeCanvas(
      offscreenCanvas as unknown as HTMLCanvasElement,
      850
    );
  }

  throw new Error('Invalid image size provided');
};

const createCanvasFromBlob = async (
  blob: Blob,
  type: ImageType
): Promise<OffscreenCanvas> => {
  if (type === ImageType.video) {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(blob);
    video.currentTime = 1;

    await new Promise<void>(resolve => {
      video.addEventListener('loadeddata', () => resolve());
    });

    const offscreenCanvas = new OffscreenCanvas(
      video.videoWidth,
      video.videoHeight
    );
    const context = offscreenCanvas.getContext('2d');
    if (!context) throw new Error('Failed to get OffscreenCanvas 2D context');

    context.drawImage(video, 0, 0);
    return offscreenCanvas;
  } else if (type === ImageType.image || type === ImageType.gif) {
    const image = new Image();
    image.src = URL.createObjectURL(blob);

    await new Promise<void>(resolve => (image.onload = () => resolve()));

    const offscreenCanvas = new OffscreenCanvas(image.width, image.height);
    const context = offscreenCanvas.getContext('2d');
    if (!context) throw new Error('Failed to get OffscreenCanvas 2D context');

    context.drawImage(image, 0, 0);
    return offscreenCanvas;
  }

  throw new Error('Invalid image type');
};
