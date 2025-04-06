import { Box, Typography } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faImage } from '@fortawesome/free-solid-svg-icons';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useTransitionStyles,
} from '@floating-ui/react';
import { Image, ImageSize } from './Image';
import { StackedImage } from './StackedImage';
import { ImageItem } from '../types';

interface ImageThumbnailTileProps {
  item: ImageItem;
  selecting?: boolean;
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  onClick?: () => void;
}

const ImageThumbnailTile: React.FC<ImageThumbnailTileProps> = ({
  item,
  selected,
  selecting,
  onSelectedChange,
  onClick,
}) => {
  return (
    <Box position='relative'>
      <ImageMiniView item={item}>
        <Box
          height={40}
          width={40}
          onClick={onClick}
          sx={{ cursor: onClick ? 'pointer' : 'default' }}
        >
          <Image item={item} size={ImageSize.thumbnail} />
        </Box>
      </ImageMiniView>
      <SelectionOverlay
        selecting={selecting}
        selected={selected}
        onSelectedChange={onSelectedChange}
      />
    </Box>
  );
};

interface SelectionOverlayProps {
  selecting?: boolean;
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
}

const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  selecting,
  selected,
  onSelectedChange,
}) => {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: selected ? 1 : 0 }}
      onClick={() => onSelectedChange?.(!selected)}
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 15,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'var(--overlay-background)',
        color: 'var(--overlay-color)',
        pointerEvents: selecting ? 'auto' : 'none',
        cursor: selecting ? 'pointer' : 'default',
      }}
    >
      <FontAwesomeIcon icon={faCheck} />
    </Box>
  );
};

interface ImageMiniViewProps extends React.HTMLAttributes<HTMLDivElement> {
  item: ImageItem;
  children: React.ReactNode;
}

const ImageMiniView: React.FC<ImageMiniViewProps> = ({ item, children }) => {
  const [hovered, setHovered] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    placement: 'bottom-end',
    strategy: 'fixed',
    open: hovered,
    onOpenChange: setHovered,
    middleware: [
      offset(({ rects }) => ({
        mainAxis: -10,
        alignmentAxis: -rects.floating.width + 10,
      })),
      flip(),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const { isMounted, styles } = useTransitionStyles(context);

  const hover = useHover(context, {
    move: false,
    // this would allow hovering over the mini view without closing it
    // `pointer-events: none;` above would need to be removed
    // handleClose: safePolygon(),
  });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
  ]);

  return (
    <Box>
      <Box
        component={motion.div}
        ref={refs.setReference}
        {...getReferenceProps()}
        sx={{
          position: 'relative',
          zIndex: hovered ? 10 : 0,
          transform: hovered ? 'scale(1.4)' : 'scale(1)',
          boxShadow: hovered ? '0 0 10px rgba(40, 50, 60, 0.75)' : 'none',
        }}
      >
        {children}
      </Box>
      {isMounted && (
        <Box
          ref={refs.setFloating}
          {...getFloatingProps()}
          sx={{
            width: 160,
            boxShadow: '0 0 10px var(--overlay-background)',
            border: '1px solid var(--button-color)',
            zIndex: 20,
            pointerEvents: 'none',
            ...floatingStyles,
            ...styles,
          }}
        >
          <StackedImage item={item} size={ImageSize.preview} playable />
        </Box>
      )}
    </Box>
  );
};

export interface ImageGridProps {
  images: ImageItem[];
  selected?: ImageItem[];
  onSelectedChange?: (selected: ImageItem[]) => void;
  onClickTile?: (item: ImageItem) => void;
}

export const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  selected,
  onSelectedChange,
  onClickTile,
}) => {
  return images.length === 0 ? (
    <Box
      display='flex'
      flexDirection='column'
      alignItems='center'
      my={2}
      sx={{ gridColumn: '1 / -1' }}
    >
      <Typography variant='h5'>
        <FontAwesomeIcon icon={faImage} />
      </Typography>
      <Typography>No images have been added</Typography>
    </Box>
  ) : (
    <Box display='flex' flexWrap='wrap' width='100%'>
      {images.map((item, index) => (
        <ImageThumbnailTile
          key={index}
          item={item}
          selected={selected?.includes(item)}
          selecting={(selected?.length || 0) > 0}
          onSelectedChange={value =>
            onSelectedChange?.(
              value
                ? [...(selected ?? []), item]
                : (selected ?? []).filter(i => i !== item)
            )
          }
          onClick={onClickTile ? () => onClickTile(item) : undefined}
        />
      ))}
    </Box>
  );
};
