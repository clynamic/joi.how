import styled from 'styled-components';
import {
  SettingsDescription,
  Space,
  Button,
  ToggleTile,
  ToggleTileType,
} from '../common';
import { useImages, useSetting } from '../settings';
import { ImageItem, ImageServiceType, ImageType } from '../types';

const StyledLocalImport = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
`;

//rescale a base64 image to save space in localstorage https://stackoverflow.com/a/73405800/16216937
function scaleDataURL(dataURL: string, maxWidth: number, maxHeight: number) {
  return new Promise(done => {
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

//simplify the process of creating a imageitem
function createImageItem(
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

export const LocalImport = () => {
  const [nestedFiles, setNestedFiles] = useSetting('nestedFiles');
  const [localVideos, setLocalVideos] = useSetting('localVideos');

  const [images, setImages] = useImages();
  //const setImages = useImages()[1];

  const select = async () => {
    try {
      //get user permission to access a directory (limited browser support https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker)
      const dirHandle = await showDirectoryPicker();
      const loaded: ImageItem[] = [...images];

      //loop through all items in the directory
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'directory' && nestedFiles) {
          //todo
        } else if (entry.kind === 'file') {
          const file = await entry.getFile();
          const extension = file.name.split('.').pop();

          if (
            (extension.includes('mp4') || extension.includes('webm')) &&
            localVideos
          ) {
            //store as a blob to reference later
            const reader = new FileReader();

            //read the file to an arraybuffer to then convert to blob
            reader.onload = function (event) {
              const arrayBuffer = event.target?.result as ArrayBuffer;
              const blob = new Blob([arrayBuffer], { type: 'video/mp4' });
              const url = URL.createObjectURL(blob);

              //create a thumbnail for the video
              const video = document.createElement('video');
              video.src = url;
              video.currentTime = 1;

              video.addEventListener('loadeddata', () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                const context = canvas.getContext('2d');
                if (context) {
                  context.drawImage(video, 0, 0, canvas.width, canvas.height);
                  const thumbBase64 = canvas.toDataURL('image/png');

                  //add to the image pool
                  loaded.push(
                    createImageItem(thumbBase64, url, url, file.name, extension)
                  );
                }
              });
            };

            reader.readAsArrayBuffer(file);
          } else if (
            extension.includes('gif') ||
            extension.includes('bmp') ||
            extension.includes('jpg') ||
            extension.includes('jpeg') ||
            extension.includes('webp') ||
            extension.includes('png') ||
            extension.includes('svg')
          ) {
            //store as base64
            const reader = new FileReader();

            reader.onload = function (event) {
              const base64: string = event.target?.result;

              scaleDataURL(base64, 120, 120)
                .then(compressed64 => {
                  //add to the image pool
                  loaded.push(
                    createImageItem(
                      compressed64,
                      compressed64,
                      base64,
                      file.name,
                      extension
                    )
                  );
                })
                .catch(err => console.log(err));
            };

            reader.readAsDataURL(file);
          }
        }
      }

      //setImages(images => [
      //  ...loaded,
      //  ...images,
      //]);
      setImages(loaded);
    } catch (error) {
      console.log('canceled choosing folder');
    }
  };

  return (
    <StyledLocalImport>
      <SettingsDescription>
        Add images from your local drive
      </SettingsDescription>
      <ToggleTile
        value={localVideos}
        type={ToggleTileType.check}
        onClick={() => setLocalVideos(!localVideos)}
      >
        <strong>Import Videos</strong>
        <p>
          Allow adding videos from the chosen folder (this needs high resolution
          enabled)
        </p>
      </ToggleTile>
      <ToggleTile
        value={nestedFiles}
        type={ToggleTileType.check}
        onClick={() => setNestedFiles(!nestedFiles)}
      >
        <strong>Import Nested Media</strong>
        <p>Allow importing images from sub-folders</p>
      </ToggleTile>
      <Space size='small' />
      <Button
        style={{
          gridColumn: '1 / -1',
          justifySelf: 'center',
        }}
        onClick={select}
      >
        Select Folder
      </Button>
      <Space size='medium' />
    </StyledLocalImport>
  );
};
