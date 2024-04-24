import styled from 'styled-components';
import { ImageItem } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { faImage } from '@fortawesome/free-solid-svg-icons';

interface ImageThumbnailTileProps {
  item: ImageItem;
}

const StyledImageThumbnailTile = styled.div`
  position: relative;

  height: 40px;
  aspect-ratio: 1;

  cursor: pointer;

  user-select: none;

  & > img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

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
      <img
        src={item.thumbnail}
        alt={`Image from ${item.service} with id ${item.id}`}
      />
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
      <img
        src={item.thumbnail}
        alt={`Image from ${item.service} with id ${item.id}`}
      />
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
