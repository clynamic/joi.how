import pica from 'pica';

const picaInstance = pica();

export const resizeCanvas = async (
  canvas: HTMLCanvasElement,
  targetWidth: number
): Promise<string> => {
  const aspectRatio = canvas.width / canvas.height;
  const targetHeight = Math.round(targetWidth / aspectRatio);

  const resizedCanvas = document.createElement('canvas');
  resizedCanvas.width = targetWidth;
  resizedCanvas.height = targetHeight;

  await picaInstance.resize(canvas, resizedCanvas);

  return picaInstance
    .toBlob(resizedCanvas, 'image/png')
    .then(blob => URL.createObjectURL(blob));
};
