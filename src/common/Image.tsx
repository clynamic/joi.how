/* eslint-disable react-refresh/only-export-components */

import styled from 'styled-components';
import { ImageItem } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { useRef } from 'react';

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
  randomStart?: boolean;
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
  randomStart = false,
  onLoadedMetadata,
  ...rest
}) => {
  let url: string | undefined;
  let playing = false;
  const videoRef = useRef<HTMLVideoElement>(null);

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
        playing = true;
      }
      url = item.full;
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
        ref={videoRef}
        src={url}
        alt={`Video from ${item.service} with id ${item.id}`}
        autoPlay
        loop
        muted={!loud}
        playsInline
        onLoadedMetadata={event => {
          if (randomStart) {
            const video = videoRef.current;
            if (video) {
              video.currentTime = Math.random() * video.duration;
            }
          }
          onLoadedMetadata?.(event);
        }}
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
