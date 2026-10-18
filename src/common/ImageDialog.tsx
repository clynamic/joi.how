import { JoiToggleTile } from './ToggleTile';
import { useCallback, useEffect, useState } from 'react';
import { GridImage } from './gridImage';
import { JoiImage } from './JoiImage';
import { useDispatchEvent } from '../game/hooks';
import Assets from '../game/plugins/assets';
import styled from 'styled-components';
import { WaDialog, WaCard, WaIcon } from '@awesome.me/webawesome/dist/react';
import { JoiStack } from './JoiStack';

export interface ImageDialogProps {
  image?: GridImage;
  onClose?: () => void;
  onSelect?: () => void;
  onDelete?: () => void;
  loud?: boolean;
}

const StyledImageDialog = styled(WaDialog)`
  &::part(dialog) {
    background-color: transparent;
  }

  &::part(body) {
    padding: var(--wa-space-2xs);
  }

  wa-card {
    background-color: var(--wa-color-surface-raised);
  }
  wa-card::part(body) {
    padding: var(--wa-space-2xs);
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
  const [current, setCurrent] = useState<GridImage | null>(null);
  const { inject } = useDispatchEvent();

  useEffect(() => {
    setVisible(!!image);
    if (image) {
      setCurrent(image);
      inject(
        Assets.load(
          image.key,
          image.record.kind === 'video' ? 'full' : 'preview'
        )
      );
      inject(Assets.load(image.key, 'full'));
    }
  }, [image, inject]);

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
            thumb={current.urls.thumbnail}
            preview={current.urls.preview}
            full={current.urls.full}
            kind={current.record.kind === 'video' ? 'video' : 'image'}
            playable={current.record.kind === 'video'}
            loud={loud}
            objectFit='contain'
            style={{ height: 400 }}
            alt={`file #${current.key}`}
          />
          <WaCard appearance='filled'>
            <JoiToggleTile
              onChange={async () =>
                window.open(
                  (
                    current.record.meta?.source as string | undefined
                  )?.startsWith('local://')
                    ? (current.urls.full ?? '')
                    : ((current.record.meta?.source as string | undefined) ??
                        current.urls.full ??
                        ''),
                  '_blank'
                )
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
