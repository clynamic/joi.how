import { Image, ImageProps, ImageSize } from './Image';
import { useState, useCallback } from 'react';

export const StackedImage: React.FC<ImageProps> = ({
  item,
  size,
  ...props
}) => {
  const [isPreviewLoaded, setIsPreviewLoaded] = useState(false);
  const [isFullLoaded, setIsFullLoaded] = useState(false);

  const handleLoadPreview = useCallback(() => {
    setIsPreviewLoaded(true);
  }, [setIsPreviewLoaded]);

  const handleLoadFull = useCallback(() => {
    setIsFullLoaded(true);
  }, [setIsFullLoaded]);

  return (
    <>
      <Image
        {...props}
        item={item}
        size={ImageSize.thumbnail}
        style={{ display: isPreviewLoaded || isFullLoaded ? 'none' : 'block' }}
      />
      {[ImageSize.preview, ImageSize.full].includes(size) && (
        <Image
          {...props}
          item={item}
          size={ImageSize.preview}
          style={{ display: isFullLoaded ? 'none' : 'block' }}
          onLoad={handleLoadPreview}
        />
      )}
      {size === ImageSize.full && (
        <Image
          {...props}
          item={item}
          size={ImageSize.full}
          onLoad={handleLoadFull}
          onLoadedMetadata={handleLoadFull}
        />
      )}
    </>
  );
};
