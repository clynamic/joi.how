//rescale a base64 image to save space in localstorage https://stackoverflow.com/a/73405800/16216937
export function scaleDataURL(
  dataURL: string,
  maxWidth: number,
  maxHeight: number
) {
  return new Promise<string>(done => {
    const img = new Image();
    img.onload = () => {
      let scale: number;

      if (img.width > maxWidth) {
        scale = maxWidth / img.width;
      } else if (img.height > maxHeight) {
        scale = maxHeight / img.height;
      } else {
        scale = 1;
      }

      const newWidth = img.width * scale;
      const newHeight = img.height * scale;

      const canvas = document.createElement('canvas');
      canvas.height = newHeight;
      canvas.width = newWidth;

      const ctx = canvas.getContext('2d');
      //console.log('img', 'scale', scale, 0, 0, img.width, img.height, 0, 0, newWidth, newHeight)
      ctx.drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        0,
        0,
        newWidth,
        newHeight
      );

      done(canvas.toDataURL());
    };
    img.src = dataURL;
  });
}
