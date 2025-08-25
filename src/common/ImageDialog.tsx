import '@awesome.me/webawesome/dist/components/card/card.js';
import { useCallback, useEffect, useState } from 'react';
import { ImageItem, ImageSize } from '../types';
import { StackedImage } from './StackedImage';
import { useLocalImages } from '../local/LocalProvider';
import styled from 'styled-components';
import { ToggleTile } from './ToggleTile';
import { WaDialog, WaCard } from '@awesome.me/webawesome/dist/react';

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

const StyledTitle = styled.h4`
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
`;

const StyledCaption = styled.p`
  margin: 0;
  font-size: 0.75rem;
  opacity: 0.7;
`;

export const ImageDialog: React.FC<ImageDialogProps> = ({
  image,
  onClose,
  onSelect,
  onDelete,
  loud,
}) => {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<ImageItem | null>(null);
  const { resolveUrl } = useLocalImages();

  useEffect(() => {
    setVisible(!!image);
    if (image) setCurrent(image);
  }, [image]);

  const handleOpenChange = useCallback(
    (event: any) => {
      const isOpen = event.target.open;
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
      onWaAfterHide={handleOpenChange}
    >
      {current && (
        <div className='wa-stack'>
          <StackedImage
            item={current}
            size={ImageSize.full}
            playable
            loud={loud}
            style={{ maxHeight: 400, objectFit: 'contain' }}
          />
          <WaCard appearance='filled'>
            <ToggleTile
              onClick={async () =>
                window.open(await resolveUrl(current.source), '_blank')
              }
            >
              <StyledTitle>Browse</StyledTitle>
              <StyledCaption>Open source in new tab</StyledCaption>
            </ToggleTile>

            <ToggleTile
              onClick={() => {
                onSelect?.();
                onClose?.();
              }}
            >
              <StyledTitle>Select</StyledTitle>
              <StyledCaption>Start multi-select here</StyledCaption>
            </ToggleTile>

            <ToggleTile
              onClick={() => {
                onDelete?.();
                onClose?.();
              }}
            >
              <StyledTitle>Delete</StyledTitle>
              <StyledCaption>Remove from library</StyledCaption>
            </ToggleTile>
          </WaCard>
        </div>
      )}
    </StyledImageDialog>
  );
};
