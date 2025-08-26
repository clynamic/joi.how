import { ImageGrid, ImageDialog, Space, Fields, JoiStack } from '../../common';
import { useImages, useSetting } from '../../settings';
import { useState } from 'react';
import { ImageItem } from '../../types';
import { useLocalImages } from '../../local/LocalProvider';
import { WaButton, WaIcon, WaTooltip } from '@awesome.me/webawesome/dist/react';

export const ImageSettings = () => {
  const [images, setImages] = useImages();
  const { removeImage } = useLocalImages();
  const [selected, setSelected] = useState<ImageItem[]>([]);
  const [clicked, setClicked] = useState<ImageItem | undefined>(undefined);
  const [videoSound] = useSetting('videoSound');

  return (
    <Fields label='Images' style={{ gridColumn: '1 / -1' }}>
      <JoiStack direction='row' justifyContent='space-between'>
        <p>{`You have loaded ${images.length} images`}</p>
        <JoiStack direction='row'>
          <WaTooltip for='delete-selected-images'>
            Delete selected images
          </WaTooltip>
          <WaButton
            id='delete-selected-images'
            size='small'
            disabled={selected.length === 0}
            onClick={() => {
              removeImage(selected.map(image => image.id));
              setImages(images.filter(image => !selected.includes(image)));
              setSelected([]);
            }}
          >
            <WaIcon name='trash' />
          </WaButton>
          <WaTooltip for='select-deselect-all-images'>
            {selected.length > 0 ? 'Deselect all images' : 'Select all images'}
          </WaTooltip>
          <WaButton
            id='select-deselect-all-images'
            size='small'
            disabled={images.length === 0}
            onClick={() => {
              if (selected.length > 0) {
                setSelected([]);
              } else {
                setSelected(images);
              }
            }}
          >
            <WaIcon
              name={(() => {
                if (images.length > 0 && selected.length === images.length) {
                  return 'check-square';
                } else if (selected.length > 0) {
                  return 'minus-square';
                } else {
                  return 'square';
                }
              })()}
              variant='regular'
            />
          </WaButton>
        </JoiStack>
      </JoiStack>
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
      <Space size='small' />
      <ImageGrid
        images={images}
        selected={selected}
        onSelectedChange={setSelected}
        onClickTile={setClicked}
      />
    </Fields>
  );
};
