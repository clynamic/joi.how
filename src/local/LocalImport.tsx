import { useState } from 'react';
import { SettingsDescription, SettingsInfo, Spinner } from '../common';
import { useImages } from '../settings';
import { AnimatePresence } from 'framer-motion';
import { discoverImageFiles, imageTypeFromExtension } from './files';
import { LocalImageRequest, useLocalImages } from './LocalProvider';
import { ImageServiceType } from '../types';
import { chunk } from 'lodash';
import { Stack, Button } from '@mui/material';

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
    <Stack direction='column'>
      <SettingsDescription>Add images from your device</SettingsDescription>
      <Stack direction='column' alignItems='center' gap={2}>
        <input
          type='file'
          multiple
          accept='image/*'
          style={{ display: 'none' }}
          id='filePicker'
          onChange={select}
        />
        <Button
          variant='contained'
          color='primary'
          onClick={() => document.getElementById('filePicker')?.click()}
          disabled={loading}
        >
          Select Files
        </Button>

        <AnimatePresence>
          {files && (
            <SettingsInfo
              sx={{
                gridColumn: '1 / -1',
                justifySelf: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Spinner />
              <p>
                {progress !== undefined
                  ? `${progress} / ${files.length} processed`
                  : `${files.length} discovered`}
              </p>
            </SettingsInfo>
          )}
        </AnimatePresence>
      </Stack>
    </Stack>
  );
};
