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
import {
  discoverImageFiles,
  imageTypeFromExtension,
  itemExtensions,
} from './files';
import { LocalImageRequest, useLocalImages } from './LocalProvider';
import { ImageServiceType } from '../types';
import { chunk } from 'lodash';

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

      const fileChunks = chunk(
        files.filter(file => {
          const extension = file.name.split('.').pop()?.toLowerCase();
          return extension && itemExtensions.includes(extension);
        }),
        30
      );

      for (const chunk of fileChunks) {
        const requests = await Promise.all(
          chunk.map<Promise<LocalImageRequest>>(async file => {
            const extension = file.name.split('.').pop()?.toLowerCase();
            setProgress(prev => (prev ?? 0) + 1);
            return {
              blob: await file.getFile(),
              type: imageTypeFromExtension(extension!),
              name: file.name,
            };
          })
        );

        const results = await storeImage(requests);

        setImages(prev => [
          ...(prev ?? []),
          ...results.map(result => ({
            thumbnail: `local://thumbnail/${result.id}`,
            preview: `local://preview/${result.id}`,
            full: `local://full/${result.id}`,
            type: result.type,
            source: `local://full/${result.id}`,
            service: ImageServiceType.local,
            id: result.id,
          })),
        ]);
        setProgress(prev => (prev ?? 0) + chunk.length);
      }
    } finally {
      setLoading(false);
      setFiles(undefined);
      setProgress(undefined);
    }
  };

  return (
    <StyledLocalImport>
      <SettingsDescription>Add images from your device</SettingsDescription>
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
