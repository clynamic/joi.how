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
    video.muted = true;
    video.playsInline = true;

    await new Promise<void>((resolve, reject) => {
      const onLoadedData = () => {
        video.removeEventListener('loadeddata', onLoadedData);
        video.removeEventListener('error', onError);
        resolve();
      };
      const onError = () => {
        video.removeEventListener('loadeddata', onLoadedData);
        video.removeEventListener('error', onError);
        reject(new Error('Failed to load video'));
      };
      video.addEventListener('loadeddata', onLoadedData);
      video.addEventListener('error', onError);
    });

    const seekTime = Math.min(1, video.duration * 0.1);
    video.currentTime = seekTime;

    await new Promise<void>((resolve, reject) => {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        video.removeEventListener('error', onError);
        resolve();
      };
      const onError = () => {
        video.removeEventListener('seeked', onSeeked);
        video.removeEventListener('error', onError);
        reject(new Error('Failed to seek video'));
      };
      video.addEventListener('seeked', onSeeked);
      video.addEventListener('error', onError);
    });

    const offscreenCanvas = new OffscreenCanvas(
      video.videoWidth,
      video.videoHeight
    );
    const context = offscreenCanvas.getContext('2d');
    if (!context) throw new Error('Failed to get OffscreenCanvas 2D context');

    context.drawImage(video, 0, 0);

    URL.revokeObjectURL(video.src);

    return offscreenCanvas;
  } else if (type === ImageType.image || type === ImageType.gif) {
    const image = new Image();
    image.src = URL.createObjectURL(blob);

    await new Promise<void>((resolve, reject) => {
      const onLoad = () => {
        image.removeEventListener('load', onLoad);
        image.removeEventListener('error', onError);
        resolve();
      };
      const onError = () => {
        image.removeEventListener('load', onLoad);
        image.removeEventListener('error', onError);
        reject(new Error('Failed to load image'));
      };
      image.addEventListener('load', onLoad);
      image.addEventListener('error', onError);
    });

    const offscreenCanvas = new OffscreenCanvas(image.width, image.height);
    const context = offscreenCanvas.getContext('2d');
    if (!context) throw new Error('Failed to get OffscreenCanvas 2D context');

    context.drawImage(image, 0, 0);

    URL.revokeObjectURL(image.src);

    return offscreenCanvas;
  }

  throw new Error('Invalid image type');
};
