/* eslint-disable react-refresh/only-export-components */

import styled from 'styled-components';
import { ImageItem } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileCircleExclamation } from '@fortawesome/free-solid-svg-icons';

export enum ImageSize {
  thumbnail = 'thumbnail',
  preview = 'preview',
  full = 'full',
}

export interface ImageProps
  extends Omit<
    React.ImgHTMLAttributes<HTMLImageElement | HTMLVideoElement>,
    'src' | 'size'
  > {
  item: ImageItem;
  size: ImageSize;
  playable?: boolean;
  loud?: boolean;
}

const StyledImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
`;

const StyledVideo = styled.video`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
`;

const StyledImageError = styled.div`
  display: block;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const Image: React.FC<ImageProps> = ({
  item,
  size,
  playable = false,
  loud = false,
  ...rest
}) => {
  let url: string | undefined;
  let playing = false;

  switch (size) {
    case ImageSize.thumbnail:
      url = item.thumbnail;
      break;
    case ImageSize.preview:
      url = item.preview;
      break;
    case ImageSize.full:
      if (playable && item.type === 'video') {
        // only full res URLs may be videos
        url = item.full;
        playing = true;
      } else {
        url = item.preview;
      }
      break;
  }

  if (!url) {
    return (
      <StyledImageError>
        <FontAwesomeIcon icon={faFileCircleExclamation} />
      </StyledImageError>
    );
  }

  if (playing) {
    return (
      <StyledVideo
        src={url}
        alt={`Video from ${item.service} with id ${item.id}`}
        autoPlay
        loop
        muted={!loud}
        playsInline
        {...rest}
      />
    );
  }

  return (
    <StyledImage
      src={url}
      alt={`Image from ${item.service} with id ${item.id}`}
      {...rest}
    />
  );
};
