import { Box } from '@mui/material';
import { Image, ImageProps, ImageSize } from './Image';
import { useState, useCallback, useEffect } from 'react';

export const StackedImage: React.FC<ImageProps> = ({
  item,
  size,
  ...props
}) => {
  const [isPreviewLoaded, setIsPreviewLoaded] = useState(false);
  const [isFullLoaded, setIsFullLoaded] = useState(false);

  const handleLoadPreview = useCallback(() => {
    setIsPreviewLoaded(true);
  }, []);

  const handleLoadFull = useCallback(() => {
    setIsFullLoaded(true);
  }, []);

  useEffect(() => {
    setIsPreviewLoaded(false);
    setIsFullLoaded(false);
  }, [item]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',

        // the first child provides the size of the container
        '& > *:not(:first-child)': {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        },
      }}
    >
      <Image
        {...props}
        item={item}
        size={ImageSize.thumbnail}
        style={{
          ...props.style,
          visibility: isPreviewLoaded || isFullLoaded ? 'hidden' : 'inherit',
        }}
      />

      {[ImageSize.preview, ImageSize.full].includes(size) && (
        <Image
          {...props}
          item={item}
          size={ImageSize.preview}
          onLoad={handleLoadPreview}
          style={{
            ...props.style,
            visibility: !isPreviewLoaded || isFullLoaded ? 'hidden' : 'inherit',
          }}
        />
      )}

      {size === ImageSize.full && (
        <Image
          {...props}
          item={item}
          size={ImageSize.full}
          onLoad={handleLoadFull}
          onLoadedMetadata={handleLoadFull}
          style={{
            ...props.style,
            visibility: !isFullLoaded ? 'hidden' : 'inherit',
          }}
        />
      )}
    </Box>
  );
};
