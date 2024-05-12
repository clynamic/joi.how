import styled from 'styled-components';
import { Image, ImageProps, ImageSize } from './Image';
import { useState, useCallback, useEffect } from 'react';

const StyledStackedImage = styled.div`
  position: relative;
  width: 100%;
  height: 100%;

  // the first child provides the size of the container
  & > *:not(:first-child) {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
`;

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

  useEffect(() => {
    setIsPreviewLoaded(false);
    setIsFullLoaded(false);
  }, [item]);

  return (
    <StyledStackedImage>
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
          style={{
            ...props.style,
            visibility: isFullLoaded ? 'hidden' : 'inherit',
          }}
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
          style={{
            ...props.style,
            visibility: !isFullLoaded ? 'hidden' : 'inherit',
          }}
        />
      )}
    </StyledStackedImage>
  );
};
