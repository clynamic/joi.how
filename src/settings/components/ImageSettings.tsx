import styled from 'styled-components';
import {
  IconButton,
  ImageGrid,
  ImageDialog,
  SettingsTile,
  Space,
} from '../../common';
import { useImages, useSetting } from '../../settings';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckSquare,
  faMinusSquare,
  faSquare,
} from '@fortawesome/free-regular-svg-icons';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { ImageItem } from '../../types';
import { useLocalImages } from '../../local/LocalProvider';

const StyledImageActions = styled.div`
  display: flex;
  justify-content: space-between;
  grid-column: 1 / -1;

  margin-bottom: 8px;
`;

const StyledImageButtons = styled.div`
  display: flex;
`;

const SmallActionButton = styled(IconButton)`
  font-size: 1rem;
  color: var(--color-text);
`;

export const ImageSettings = () => {
  const [images, setImages] = useImages();
  const { removeImage } = useLocalImages();
  const [selected, setSelected] = useState<ImageItem[]>([]);
  const [clicked, setClicked] = useState<ImageItem | undefined>(undefined);
  const [videoSound] = useSetting('videoSound');

  return (
    <SettingsTile label='Images' style={{ gridColumn: '1 / -1' }}>
      <StyledImageActions>
        <p>{`You have loaded ${images.length} images`}</p>
        <StyledImageButtons>
          <SmallActionButton
            onClick={
              selected.length > 0
                ? () => {
                    setImages(
                      images.filter(image => !selected.includes(image))
                    );
                    setSelected([]);
                  }
                : undefined
            }
            icon={<FontAwesomeIcon icon={faTrash} />}
            tooltip='Delete selected images'
          />
          <SmallActionButton
            onClick={
              images.length > 0
                ? () => {
                    if (selected.length > 0) {
                      setSelected([]);
                    } else {
                      setSelected(images);
                    }
                  }
                : undefined
            }
            icon={
              <FontAwesomeIcon
                icon={(() => {
                  if (images.length > 0 && selected.length === images.length) {
                    return faCheckSquare;
                  } else if (selected.length > 0) {
                    return faMinusSquare;
                  } else {
                    return faSquare;
                  }
                })()}
              />
            }
            tooltip={
              selected.length > 0 ? 'Deselect all images' : 'Select all images'
            }
          />
        </StyledImageButtons>
      </StyledImageActions>
      <ImageDialog
        image={clicked}
        onClose={() => setClicked(undefined)}
        onSelect={() => {
          if (!clicked) return;
          setSelected([...selected, clicked]);
        }}
        onDelete={() => {
          if (clicked) {
            removeImage(clicked.id);
          }
          setImages(images.filter(image => image !== clicked));
        }}
        loud={videoSound}
      >
        <ImageGrid
          images={images}
          selected={selected}
          onSelectedChange={setSelected}
          onClickTile={setClicked}
        />
      </ImageDialog>
      <Space size='medium' />
    </SettingsTile>
  );
};
