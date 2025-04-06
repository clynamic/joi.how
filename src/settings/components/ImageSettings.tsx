import { ImageGrid, ImageDialog, Fields, Space } from '../../common';
import { useImages, useSetting } from '../../settings';
import { useState } from 'react';
import { ImageItem } from '../../types';
import { useLocalImages } from '../../local/LocalProvider';
import {
  IconButton,
  Checkbox,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { Delete } from '@mui/icons-material';

export const ImageSettings = () => {
  const [images, setImages] = useImages();
  const { removeImage } = useLocalImages();
  const [selected, setSelected] = useState<ImageItem[]>([]);
  const [clicked, setClicked] = useState<ImageItem | undefined>(undefined);
  const [videoSound] = useSetting('videoSound');

  return (
    <Fields label='Images' sx={{ gridColumn: '1 / -1' }}>
      <Stack direction='row' justifyContent='space-between' alignItems='center'>
        <Typography variant='body2'>{`You have loaded ${images.length} images`}</Typography>
        <Stack direction='row'>
          <Tooltip title='Delete selected images'>
            <IconButton
              disabled={selected.length === 0}
              onClick={() => {
                const selectedIds = selected.map(image => image.id);
                removeImage(selectedIds);
                setImages(
                  images.filter(image => !selectedIds.includes(image.id))
                );
                setSelected([]);
              }}
              children={<Delete />}
            />
          </Tooltip>
          <Tooltip
            title={
              selected.length === images.length
                ? 'Deselect all images'
                : 'Select all images'
            }
          >
            <Checkbox
              size='small'
              indeterminate={
                selected.length > 0 && selected.length < images.length
              }
              checked={selected.length > 0 && selected.length === images.length}
              disabled={images.length === 0}
              onChange={e => setSelected(e.target.checked ? images : [])}
            />
          </Tooltip>
        </Stack>
      </Stack>
      <ImageDialog
        image={clicked}
        onClose={() => setClicked(undefined)}
        onSelect={() => {
          if (!clicked) return;
          setSelected([...selected, clicked]);
        }}
        onDelete={() => {
          if (!clicked) return;
          removeImage(clicked.id);
          setImages(images.filter(image => image !== clicked));
        }}
        loud={videoSound}
      />
      <ImageGrid
        images={images}
        selected={selected}
        onSelectedChange={setSelected}
        onClickTile={setClicked}
      />
      <Space size='medium' />
    </Fields>
  );
};
