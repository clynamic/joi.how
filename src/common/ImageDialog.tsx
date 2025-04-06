import { useCallback, useEffect, useState } from 'react';
import { ImageItem } from '../types';
import { Dialog } from './Dialog';
import { ImageSize } from './Image';
import { ToggleCard } from './ToggleCard';
import { StackedImage } from './StackedImage';
import { useLocalImages } from '../local/LocalProvider';
import { Typography, Box } from '@mui/material';
import { CheckBox, Delete, OpenInNew } from '@mui/icons-material';

export interface ImageDialogProps {
  image?: ImageItem;
  onClose?: () => void;
  onSelect?: () => void;
  onDelete?: () => void;
  loud?: boolean;
}

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
          <Box
            display='flex'
            flexDirection='column'
            width={400}
            maxWidth='100%'
            maxHeight='100%'
            overflow='auto'
          >
            <StackedImage
              item={current}
              size={ImageSize.full}
              playable
              loud={loud}
              style={{
                maxHeight: 400,
                objectFit: 'contain',
              }}
            />
            <Box
              sx={{
                background: 'var(--card-background)',
                borderRadius: 'var(--border-radius)',
                p: 1,
                mt: 1,
              }}
            >
              <ToggleCard
                onClick={async () =>
                  window.open(await resolveUrl(current.source), '_blank')
                }
                trailing={<OpenInNew />}
              >
                <Typography variant='subtitle2'>Browse</Typography>
                <Typography variant='caption'>
                  Open source in new tab
                </Typography>
              </ToggleCard>
              <ToggleCard
                onClick={() => {
                  onSelect?.();
                  onClose?.();
                }}
                trailing={<CheckBox />}
              >
                <Typography variant='subtitle2'>Select</Typography>
                <Typography variant='caption'>
                  Start multi-select here
                </Typography>
              </ToggleCard>
              <ToggleCard
                onClick={() => {
                  onDelete?.();
                  onClose?.();
                }}
                trailing={<Delete />}
              >
                <Typography variant='subtitle2'>Delete</Typography>
                <Typography variant='caption'>Remove from library</Typography>
              </ToggleCard>
            </Box>
          </Box>
        )
      }
    />
  );
};
