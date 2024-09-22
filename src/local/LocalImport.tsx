import { useState } from 'react';
import styled from 'styled-components';
import {
  SettingsDescription,
  Space,
  Button,
  SettingsInfo,
  Spinner,
} from '../common';
import { useImages } from '../settings';
import { AnimatePresence } from 'framer-motion';
import { discoverImageFiles } from './files';
import { useLocalImages } from './LocalProvider';
import { ImageServiceType, ImageType } from '../types';

const StyledLocalImport = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
`;

const StyledLoadingHint = styled(SettingsInfo)`
  grid-column: 1 / -1;
  justify-self: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

export const LocalImport = () => {
  const [loading, setLoading] = useState(false);
  const { storeImage } = useLocalImages();

  const [, setImages] = useImages();

  const [files, setFiles] = useState<FileSystemFileHandle[] | undefined>(
    undefined
  );

  const [progress, setProgress] = useState<number | undefined>(undefined);

  const select = async () => {
    let dir: FileSystemDirectoryHandle | undefined;
    try {
      dir = await showDirectoryPicker();
    } catch (error) {
      // user canceled
    }
    if (!dir) return;
    try {
      setLoading(true);
      setFiles([]);
      setProgress(0);
      const files = await discoverImageFiles(dir);
      setFiles(files);

      for (const file of files) {
        const extension = file.name.split('.').pop()?.toLowerCase();
        const type = (() => {
          switch (extension) {
            case 'webm':
            case 'mp4':
              return ImageType.video;
            case 'gif':
              return ImageType.gif;
            default:
              return ImageType.image;
          }
        })();
        const result = await storeImage(await file.getFile(), type, file.name);
        setImages(prev => [
          ...(prev ?? []),
          ...(prev.some(image => image.id === result.id)
            ? []
            : [
                {
                  thumbnail: `local://thumbnail/${result.id}`,
                  preview: `local://preview/${result.id}`,
                  full: `local://full/${result.id}`,
                  type: result.type,
                  source: `local://full/${result.id}`,
                  service: ImageServiceType.local,
                  id: result.id,
                },
              ]),
        ]);
        setProgress(prev => (prev ?? 0) + 1);
      }
    } finally {
      setLoading(false);
      setFiles(undefined);
      setProgress(undefined);
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
        {files && (
          <StyledLoadingHint>
            <Spinner />
            <p>
              {progress !== undefined
                ? `${progress} / ${files.length} processed`
                : `${files.length} discovered`}
            </p>
          </StyledLoadingHint>
        )}
      </AnimatePresence>
      <Space size='small' />
    </StyledLocalImport>
  );
};
