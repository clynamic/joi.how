import styled from 'styled-components';
import { ImageItem } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { faImage } from '@fortawesome/free-solid-svg-icons';
import { Image, ImageSize } from './Image';

interface ImageThumbnailTileProps {
  item: ImageItem;
}

const StyledImageThumbnailTile = styled.div`
  position: relative;

  height: 40px;
  aspect-ratio: 1;

  cursor: pointer;

  &:hover,
  &:focus > img {
    transform: scale(1.4);
    box-shadow: 0 0 10px rgba(40, 50, 60, 0.75); // TODO: Use CSS variable
    z-index: 10;
  }
`;

const ImageThumbnailTile: React.FC<ImageThumbnailTileProps> = ({ item }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <StyledImageThumbnailTile
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Image item={item} size={ImageSize.thumbnail} />
      <ImageMiniView item={item} shown={hovered} />
    </StyledImageThumbnailTile>
  );
};

interface ImageMiniViewProps {
  item: ImageItem;
  shown: boolean;
}

interface StyledImageMiniViewProps {
  $shown: boolean;
}

const StyledImageMiniView = styled.div<StyledImageMiniViewProps>`
  position: absolute;

  display: ${({ $shown }) => ($shown ? 'flex' : 'none')};

  width: 100px;

  top: 90%;
  left: 90%;

  z-index: 20;

  box-shadow: 0 0 10px rgba(40, 50, 60, 0.75); // TODO: Use CSS variable
  border: 1px solid #fff;

  & > img {
    width: 100%;
    object-fit: cover;
  }
`;

const ImageMiniView: React.FC<ImageMiniViewProps> = ({ item, shown }) => {
  return (
    <StyledImageMiniView $shown={shown}>
      <Image item={item} size={ImageSize.thumbnail} />
    </StyledImageMiniView>
  );
};

export interface ImageGridProps {
  images: ImageItem[];
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

export const ImageGrid: React.FC<ImageGridProps> = ({ images }) => {
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
        <ImageThumbnailTile key={index} item={item} />
      ))}
    </StyledImageGrid>
  );
};
