import { useState } from 'react';
import styled from 'styled-components';
import {
  SettingsDescription,
  Space,
  Button,
  SettingsInfo,
  Spinner,
  SettingsGrid,
} from '../common';
import { useImages } from '../settings';
import { AnimatePresence } from 'framer-motion';
import { discoverImageFiles, imageTypeFromExtension } from './files';
import { LocalImageRequest, useLocalImages } from './LocalProvider';
import { ImageServiceType } from '../types';
import { chunk } from 'lodash';

const StyledLoadingHint = styled(SettingsInfo)`
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
  const [files, setFiles] = useState<File[] | undefined>(undefined);
  const [progress, setProgress] = useState<number | undefined>(undefined);

  const select = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList) return;

    try {
      setLoading(true);
      setFiles([]);
      setProgress(0);

      const imageFiles = await discoverImageFiles(fileList);
      setFiles(imageFiles);

      const fileChunks = chunk(imageFiles, 30);

      for (const chunk of fileChunks) {
        const requests = await Promise.all(
          chunk.map<Promise<LocalImageRequest>>(async file => {
            const extension = file.name.split('.').pop()?.toLowerCase();
            setProgress(prev => (prev ?? 0) + 1);
            return {
              blob: file,
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
      }
    } finally {
      setLoading(false);
      setFiles(undefined);
      setProgress(undefined);
    }
  };

  return (
    <SettingsGrid>
      <SettingsDescription>Add images from your device</SettingsDescription>
      <Space size='medium' />
      <input
        type='file'
        multiple
        accept='image/*'
        style={{ display: 'none' }}
        id='filePicker'
        onChange={select}
      />
      <Button
        style={{ justifySelf: 'center' }}
        onClick={() => document.getElementById('filePicker')?.click()}
        disabled={loading}
      >
        Select Files
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
    </SettingsGrid>
  );
};
