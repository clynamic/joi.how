import { ImageGrid, ImageDialog, Space, Fields, JoiStack } from '../../common';
import { GridImage } from '../../common/gridImage';
import { useDispatchEvent, useGameFrame, useKeys } from '../../bridge/hooks';
import { displayKeys } from '../../../game/classic/image';
import Assets, { AssetKey, AssetsState } from '../../../game/assets';
import ClassicImages from '../../../game/classic/images';
import { useMemo, useState } from 'react';
import { WaButton, WaIcon, WaTooltip } from '@awesome.me/webawesome/dist/react';

export const ImageSettings = () => {
  const [{ images: selection }] = useKeys(ClassicImages.keys);
  const assets = useGameFrame<AssetsState | undefined>(Assets.paths);
  const { inject } = useDispatchEvent();
  const [selected, setSelected] = useState<AssetKey[]>([]);
  const [clicked, setClicked] = useState<GridImage | undefined>(undefined);
  const [{ videoSound }] = useKeys(displayKeys);

  const images = useMemo<GridImage[]>(
    () =>
      selection.flatMap(key => {
        const entry = assets?.library?.[key];
        if (!entry) return [];
        return [
          { key, record: entry.record, urls: assets?.inUse?.[key]?.urls ?? {} },
        ];
      }),
    [selection, assets]
  );
  const selectedImages = images.filter(image => selected.includes(image.key));

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
              inject(ClassicImages.remove(selected));
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
                setSelected(images.map(image => image.key));
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
          setSelected([...selected, clicked.key]);
        }}
        onDelete={() => {
          if (!clicked) return;
          inject(ClassicImages.remove([clicked.key]));
        }}
        loud={videoSound}
      />
      <Space size='small' />
      <ImageGrid
        images={images}
        selected={selectedImages}
        onSelectedChange={items => setSelected(items.map(image => image.key))}
        onClickTile={setClicked}
      />
    </Fields>
  );
};
