import styled from 'styled-components';
import { ImageItem } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import { faCheck, faImage } from '@fortawesome/free-solid-svg-icons';
import { Image, ImageSize } from './Image';
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
import { motion } from 'framer-motion';
import { StackedImage } from './StackedImage';

interface ImageThumbnailTileProps {
  item: ImageItem;
  selecting?: boolean;
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  onClick?: () => void;
}

const StyledImageThumbnailTile = styled.div`
  position: relative;
`;

const StyledImageThumbnailTileImage = styled.div`
  height: 40px;
  aspect-ratio: 1;
`;

const ImageThumbnailTile: React.FC<ImageThumbnailTileProps> = ({
  item,
  selected,
  selecting,
  onSelectedChange,
  onClick,
}) => {
  return (
    <StyledImageThumbnailTile>
      <ImageMiniView item={item}>
        <StyledImageThumbnailTileImage
          onClick={onClick}
          style={{
            cursor: onClick ? 'pointer' : 'default',
          }}
        >
          <Image item={item} size={ImageSize.thumbnail} />
        </StyledImageThumbnailTileImage>
      </ImageMiniView>
      <SelectionOverlay
        selecting={selecting}
        selected={selected}
        onSelectedChange={onSelectedChange}
      />
    </StyledImageThumbnailTile>
  );
};

const StyledSelectionOverlay = motion(styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  z-index: 15;

  display: flex;
  justify-content: center;
  align-items: center;

  background: var(--overlay-background);
  color: var(--overlay-color);
`);

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
    <StyledSelectionOverlay
      initial={{ opacity: 0 }}
      animate={{ opacity: selected ? 1 : 0 }}
      style={{
        pointerEvents: selecting ? 'auto' : 'none',
        cursor: selecting ? 'pointer' : 'default',
      }}
      onClick={() => onSelectedChange?.(!selected)}
    >
      <FontAwesomeIcon icon={faCheck} />
    </StyledSelectionOverlay>
  );
};

interface ImageMiniViewProps extends React.HTMLAttributes<HTMLDivElement> {
  item: ImageItem;
  children: React.ReactNode;
}

const StyledImageMiniView = styled.div``;

const StyledImageMiniViewContent = motion(styled.div``);

const StyledImageMiniViewImage = styled.div`
  width: 160px;

  box-shadow: 0 0 10px rgba(40, 50, 60, 0.75); // TODO: Use CSS variable
  border: 1px solid #fff;

  z-index: 20;
  pointer-events: none;
`;

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
      shift({
        padding: 8,
      }),
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
    <StyledImageMiniView>
      <StyledImageMiniViewContent
        ref={refs.setReference}
        {...getReferenceProps()}
        style={{
          position: 'relative',
          zIndex: hovered ? 10 : 0,
          scale: hovered ? 1.4 : 1,
          boxShadow: hovered ? '0 0 10px rgba(40, 50, 60, 0.75)' : 'none',
        }}
      >
        {children}
      </StyledImageMiniViewContent>
      {isMounted && (
        <StyledImageMiniViewImage
          ref={refs.setFloating}
          {...getFloatingProps()}
          style={{ ...floatingStyles, ...styles }}
        >
          {/* could also be full */}
          <StackedImage item={item} size={ImageSize.preview} playable />
        </StyledImageMiniViewImage>
      )}
    </StyledImageMiniView>
  );
};

export interface ImageGridProps {
  images: ImageItem[];
  selected?: ImageItem[];
  onSelectedChange?: (selected: ImageItem[]) => void;
  onClickTile?: (item: ImageItem) => void;
}

const StyledImageGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  width: 100%;
`;

const StyledNoImages = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  margin: 16px 0px;

  columns: 1 / -1;
`;

export const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  selected,
  onSelectedChange,
  onClickTile,
}) => {
  return images.length === 0 ? (
    <StyledNoImages>
      <h2>
        <FontAwesomeIcon icon={faImage} />
      </h2>
      <p>No images have been added</p>
    </StyledNoImages>
  ) : (
    <StyledImageGrid>
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
    </StyledImageGrid>
  );
};
