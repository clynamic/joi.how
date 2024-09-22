import {
  faArrowUpRightFromSquare,
  faTrash,
  faCheckSquare,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { ImageItem } from '../types';
import { Dialog } from './Dialog';
import { ImageSize } from './Image';
import { ToggleTile } from './ToggleTile';
import { Surrounded } from './Trailing';
import styled from 'styled-components';
import { StackedImage } from './StackedImage';
import { useLocalImages } from '../local/LocalProvider';

export interface ImageDialogProps {
  image?: ImageItem;
  onClose?: () => void;
  onSelect?: () => void;
  onDelete?: () => void;
  loud?: boolean;
}

const StyledImageDialogContent = styled.div`
  display: flex;
  flex-direction: column;
  width: 400px;
  max-width: 100%;
  max-height: 100%;
  overflow: auto;
`;

const StyledImageDialogImage = styled(StackedImage)`
  max-height: 400px;
  object-fit: contain;
`;

const StyledImageDialogActions = styled.div`
  background: var(--card-background);
  border-radius: var(--border-radius);
  padding: 8px;
  margin-top: 8px;
`;

export const ImageDialog: React.FC<PropsWithChildren<ImageDialogProps>> = ({
  image,
  onClose,
  onSelect,
  onDelete,
  loud,
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<ImageItem | null>(null);
  const { resolveUrl } = useLocalImages();

  useEffect(() => {
    setVisible(!!image);
    if (image) {
      setCurrent(image);
    }
  }, [image]);

  const onVisibleChange = useCallback(
    (visible: boolean) => {
      setVisible(visible);
      if (!visible) {
        setCurrent(null);
      }
    },
    [setVisible, setCurrent]
  );

  return (
    <Dialog
      dismissable
      onVisibleChange={onVisibleChange}
      background='transparent'
      open={visible}
      onOpenChange={value => value || onClose?.()}
      content={
        current && (
          <StyledImageDialogContent>
            <StyledImageDialogImage
              item={current}
              size={ImageSize.full}
              playable
              loud={loud}
            />
            <StyledImageDialogActions>
              <ToggleTile
                onClick={async () =>
                  window.open(await resolveUrl(current.source), '_blank')
                }
              >
                <Surrounded
                  trailing={<FontAwesomeIcon icon={faArrowUpRightFromSquare} />}
                >
                  <strong>Browse</strong>
                  <p>Open source in new tab</p>
                </Surrounded>
              </ToggleTile>
              <ToggleTile
                onClick={() => {
                  onSelect?.();
                  onClose?.();
                }}
              >
                <Surrounded trailing={<FontAwesomeIcon icon={faCheckSquare} />}>
                  <strong>Select</strong>
                  <p>Start multi-select here</p>
                </Surrounded>
              </ToggleTile>
              <ToggleTile
                onClick={() => {
                  onDelete?.();
                  onClose?.();
                }}
              >
                <Surrounded trailing={<FontAwesomeIcon icon={faTrash} />}>
                  <strong>Delete</strong>
                  <p>Remove from library</p>
                </Surrounded>
              </ToggleTile>
            </StyledImageDialogActions>
          </StyledImageDialogContent>
        )
      }
      children={children}
    />
  );
};
