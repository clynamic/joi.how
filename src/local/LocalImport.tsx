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
import { discoverImageFiles, processImageFile } from './files';

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

  const [, setImages] = useImages();

  const [files, setFiles] = useState<FileSystemFileHandle[] | undefined>(
    undefined
  );

  const [progress, setProgress] = useState<number | undefined>(undefined);

  const select = async () => {
    try {
      const dir = await showDirectoryPicker();
      setLoading(true);
      setFiles([]);
      setProgress(0);
      const files = await discoverImageFiles(dir);
      setFiles(files);
      for (const [index, file] of files.entries()) {
        const item = await processImageFile(file);
        if (item) {
          setImages(images => [
            ...images,
            ...(images.some(image => image.id === item.id) ? [] : [item]),
          ]);
        }
        setProgress(index + 1);
      }
    } catch (error) {
      // user canceled
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
