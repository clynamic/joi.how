import { JoiToggleTile } from './ToggleTile';
import { useCallback, useEffect, useState } from 'react';
import { ImageItem, ImageType } from '../types';
import { JoiImage } from './JoiImage';
import { useLocalImages } from '../local/LocalProvider';
import styled from 'styled-components';
import { WaDialog, WaCard, WaIcon } from '@awesome.me/webawesome/dist/react';
import { JoiStack } from './JoiStack';

export interface ImageDialogProps {
  image?: ImageItem;
  onClose?: () => void;
  onSelect?: () => void;
  onDelete?: () => void;
  loud?: boolean;
}

const StyledImageDialog = styled(WaDialog)`
  &::part(dialog) {
    background-color: transparent;
  }

  wa-card {
    background-color: var(--wa-color-surface-raised);
  }
  wa-card::part(body) {
    padding: var(--wa-space-xs);
  }
`;

export const ImageDialog: React.FC<ImageDialogProps> = ({
  image,
  onClose,
  onSelect,
  onDelete,
  loud = false,
}) => {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<ImageItem | null>(null);
  const { resolveUrl } = useLocalImages();

  useEffect(() => {
    setVisible(!!image);
    if (image) setCurrent(image);
  }, [image]);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      setVisible(isOpen);
      if (!isOpen) {
        setCurrent(null);
        onClose?.();
      }
    },
    [onClose]
  );

  return (
    <StyledImageDialog
      open={visible}
      lightDismiss
      onWaAfterHide={() => handleOpenChange(false)}
    >
      {current && (
        <JoiStack>
          <JoiImage
            thumb={current.thumbnail}
            preview={current.preview}
            full={current.full}
            kind={current.type === ImageType.video ? 'video' : 'image'}
            playable={current.type === ImageType.video}
            loud={loud}
            objectFit='contain'
            style={{ height: 400 }}
            alt={`file #${current.id}`}
          />
          <WaCard appearance='filled'>
            <JoiToggleTile
              onChange={async () =>
                window.open(await resolveUrl(current.source), '_blank')
              }
            >
              <h6 className='subtitle'>Browse</h6>
              <p className='caption'>Open source in new tab</p>
              <WaIcon slot='trailing' name='arrow-up-right-from-square' />
            </JoiToggleTile>

            <JoiToggleTile
              onChange={() => {
                onSelect?.();
                onClose?.();
              }}
            >
              <h6 className='subtitle'>Select</h6>
              <p className='caption'>Start multi-select here</p>
              <span slot='trailing'>
                <WaIcon name='square-check' />
              </span>
            </JoiToggleTile>

            <JoiToggleTile
              onChange={() => {
                onDelete?.();
                onClose?.();
              }}
            >
              <h6 className='subtitle'>Delete</h6>
              <p className='caption'>Remove from library</p>
              <span slot='trailing'>
                <WaIcon name='trash' />
              </span>
            </JoiToggleTile>
          </WaCard>
        </JoiStack>
      )}
    </StyledImageDialog>
  );
};
