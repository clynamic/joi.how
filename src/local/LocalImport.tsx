import { useCallback, useState } from 'react';
import styled from 'styled-components';
import { SettingsDescription, Space, Button, SettingsInfo } from '../common';
import { useImages } from '../settings';
import { ImageItem } from '../types';
import { createLocalImageItem } from './image';
import { AnimatePresence } from 'framer-motion';
import { resizeCanvas } from './resize';
import { itemExtensions, videoExtensions } from './extensions';

const StyledLocalImport = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
`;

export const LocalImport = () => {
  const [loading, setLoading] = useState(false);

  const [, setImages] = useImages();

  const [fileCount, setFileCount] = useState(0);

  const processImageElement = useCallback(
    async (
      image: HTMLImageElement | HTMLVideoElement,
      file: File,
      extension: string
    ) => {
      const originalCanvas = document.createElement('canvas');
      originalCanvas.width = image.width;
      originalCanvas.height = image.height;

      const context = originalCanvas.getContext('2d');
      if (!context) return undefined;
      context.drawImage(image, 0, 0);

      const thumbnail = await resizeCanvas(originalCanvas, 100);
      const preview = await resizeCanvas(originalCanvas, 400);

      return createLocalImageItem(
        thumbnail,
        preview,
        image.src,
        file.name,
        extension
      );
    },
    []
  );

  const processFile = useCallback(
    async (entry: FileSystemFileHandle) => {
      const file = await entry.getFile();
      const extension = file.name.split('.').pop();

      if (!extension || !itemExtensions.includes(extension)) return undefined;

      const item = await new Promise<ImageItem | undefined>(resolve => {
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
              const item = await processImageElement(video, file, extension);
              resolve(item);
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

      return item;
    },
    [processImageElement]
  );

  const addFiles = useCallback(
    async (dir: FileSystemDirectoryHandle): Promise<void> => {
      const entries = [];

      for await (const entry of dir.values()) {
        entries.push(entry);
      }

      const CHUNK_SIZE = 5;
      for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
        const chunk = entries.slice(i, i + CHUNK_SIZE);

        await Promise.all(
          chunk.map(async entry => {
            if (entry.kind === 'directory') {
              await addFiles(entry);
            } else if (entry.kind === 'file') {
              const item = await processFile(entry);
              if (item) {
                setImages(images => images.concat(item));
                setFileCount(count => count + 1);
              }
            }
          })
        );
      }
    },
    [processFile, setImages]
  );

  const select = async () => {
    try {
      const dir = await showDirectoryPicker();
      setLoading(true);
      setFileCount(0);
      await addFiles(dir);
    } catch (error) {
      // user canceled
    } finally {
      setLoading(false);
      setFileCount(0);
    }
  };

  return (
    <StyledLocalImport>
      <SettingsDescription>
        Add images from your local drive
      </SettingsDescription>
      <Space size='medium' />
      <Button
        style={{
          gridColumn: '1 / -1',
          justifySelf: 'center',
        }}
        onClick={select}
        disabled={loading}
      >
        Select Folder
      </Button>
      <Space size='small' />
      <AnimatePresence>
        {fileCount > 0 && (
          <SettingsInfo
            style={{
              gridColumn: '1 / -1',
              justifySelf: 'center',
            }}
          >
            {`${fileCount} files have been imported...`}
          </SettingsInfo>
        )}
      </AnimatePresence>
      <Space size='small' />
    </StyledLocalImport>
  );
};
