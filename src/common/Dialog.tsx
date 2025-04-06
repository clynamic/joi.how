import { Box, Modal, Fade, IconButton } from '@mui/material';
import { faClose } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect } from 'react';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVisibleChange?: (visible: boolean) => void;
  closable?: boolean;
  dismissable?: boolean;
  barrierColor?: string;
  background?: string;
  title?: React.ReactNode;
  content: React.ReactNode;
}

export const Dialog = ({
  open,
  onOpenChange,
  onVisibleChange,
  content,
  title,
  closable = true,
  dismissable = false,
  barrierColor = 'var(--overlay-background)',
  background = 'var(--card-background)',
}: DialogProps) => {
  useEffect(() => {
    onVisibleChange?.(open);
  }, [open, onVisibleChange]);

  return (
    <Modal
      open={open}
      onClose={() => dismissable && onOpenChange(false)}
      closeAfterTransition
      slotProps={{
        backdrop: {
          timeout: 200,
          sx: {
            backgroundColor: barrierColor,
          },
        },
      }}
    >
      <Fade in={open} timeout={200}>
        <Box
          onClick={() => dismissable && onOpenChange(false)}
          sx={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
          }}
        >
          <Box
            onClick={e => e.stopPropagation()}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '100%',
              maxWidth: '100%',
              background,
              color: 'var(--card-color)',
              borderRadius: 'var(--border-radius)',
              p: 1,
            }}
          >
            {(title || closable) && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1,
                }}
              >
                {title || <Box />}
                {closable && (
                  <IconButton
                    aria-label='Close dialog'
                    onClick={() => onOpenChange(false)}
                  >
                    <FontAwesomeIcon icon={faClose} />
                  </IconButton>
                )}
              </Box>
            )}
            {content}
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};
