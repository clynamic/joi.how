import { useState } from 'react';
import styled from 'styled-components';
import {
  SettingsDescription,
  Space,
  Button,
  ToggleTile,
  ToggleTileType,
  SettingsInfo,
} from '../common';
import { useImages, useSetting } from '../settings';
import { ImageItem } from '../types';
import { scaleDataURL } from './base64';
import { createImageItem } from './image';

const StyledLocalImport = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
`;

export const LocalImport = () => {
  const [nestedFiles] = useSetting('nestedFiles');
  const [localVideos, setLocalVideos] = useSetting('localVideos');

  const [images, setImages] = useImages();
  const [highRes] = useSetting('highRes');

  const [fileCount, setFileCount] = useState(0);
  const [progressCount, setProgressCount] = useState(0);
  const [disabledButton, setDisabledButton] = useState(false);

  const select = async () => {
    //reset counts
    setFileCount(0);
    setProgressCount(0);

    try {
      //get user permission to access a directory (limited browser support https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker)
      const dirHandle = await showDirectoryPicker();
      const loaded: ImageItem[] = [...images];

      //get number of files in directory
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          const file = await entry.getFile();
          const extension = file.name.split('.').pop();

          //dont count videos if they aren't enabled
          if (!(extension.includes('mp4') || extension.includes('webm'))) {
            setFileCount(fileCount => fileCount + 1);
          } else if (
            localVideos &&
            (extension.includes('mp4') || extension.includes('webm'))
          ) {
            setFileCount(fileCount => fileCount + 1);
          }
        }
      }

      setDisabledButton(true);

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

                  setProgressCount(progressCount => progressCount + 1);
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
              const base64 = event.target?.result;

              //base64 could be null? most unlikely
              if (typeof base64 !== 'string') {
                console.log('base64 of file', file.name, 'is not readable');
                return;
              }

              scaleDataURL(base64, 64, 64)
                .then(mini64 => {
                  scaleDataURL(base64, 850, 850)
                    .then(compressed64 => {
                      //add to the image pool
                      if (highRes) {
                        loaded.push(
                          createImageItem(
                            mini64, //1:1 mini squares
                            compressed64, //hover img
                            base64, //preview img and game img
                            file.name,
                            extension
                          )
                        );
                      } else {
                        loaded.push(
                          createImageItem(
                            mini64, //1:1 mini squares
                            compressed64, //hover img and game img
                            compressed64, //preview img
                            file.name,
                            extension
                          )
                        );
                      }

                      setProgressCount(progressCount => progressCount + 1);
                    })
                    .catch(err => console.log(err));
                })
                .catch(err => console.log(err));
            };

            reader.readAsDataURL(file);
          }
        }
      }

      setDisabledButton(false);

      //localstorage issues https://arty.name/localstorage.html
      //setImages(images => images.concat(loaded));

      setImages(loaded);
      //todo image section div needs to be reloaded to show all images
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
          Allow adding videos from the chosen folder (needs high resolution
          enabled)
        </p>
      </ToggleTile>
      {/*<ToggleTile
        value={nestedFiles}
        type={ToggleTileType.check}
        onClick={() => setNestedFiles(!nestedFiles)}
      >
        <strong>Import Nested Media</strong>
        <p>Allow importing images from sub-folders</p>
      </ToggleTile>*/}
      <Space size='medium' />
      <Button
        style={{
          gridColumn: '1 / -1',
          justifySelf: 'center',
        }}
        onClick={select}
        disabled={disabledButton}
      >
        Select Folder
      </Button>
      <Space size='small' />
      <SettingsInfo
        style={{
          gridColumn: '1 / -1',
          justifySelf: 'center',
        }}
      >
        {fileCount === 0
          ? 'Please select a folder to import.'
          : `${progressCount} out of ${fileCount} files have been imported.`}
      </SettingsInfo>
      <Space size='small' />
    </StyledLocalImport>
  );
};
