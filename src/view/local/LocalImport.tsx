import { useState } from 'react';
import { SettingsDescription, Space, SettingsGrid, JoiStack } from '../common';
import { useDispatchEvent } from '../bridge/hooks';
import Local from '../../game/local';
import ClassicImages from '../../game/classic/images';
import { AnimatePresence } from 'framer-motion';
import { discoverImageFiles, imageTypeFromExtension } from './files';
import { chunk } from 'lodash';
import {
  WaButton,
  WaIcon,
  WaProgressBar,
} from '@awesome.me/webawesome/dist/react';
import { LocalImageRequest } from '../../game/local/images';

export const LocalImport = () => {
  const [loading, setLoading] = useState(false);
  const { inject } = useDispatchEvent();
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

        const items = await Local.import(requests);
        inject(
          ClassicImages.add(
            items.map(item => ({ source: Local.source, ...item }))
          )
        );
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
        accept='image/*,video/*'
        style={{ display: 'none' }}
        id='filePicker'
        onChange={select}
      />
      <WaButton
        style={{ justifySelf: 'center' }}
        onClick={() => document.getElementById('filePicker')?.click()}
        disabled={loading}
      >
        <span>Select Files</span>
        <WaIcon slot='end' name='upload' />
      </WaButton>
      <Space size='small' />
      <AnimatePresence>
        {files && (
          <JoiStack direction='column'>
            <span>{`${progress ?? 0} / ${files.length} files processed`}</span>
            <WaProgressBar value={((progress ?? 1) / files.length) * 100} />
          </JoiStack>
        )}
      </AnimatePresence>
      <Space size='small' />
    </SettingsGrid>
  );
};
