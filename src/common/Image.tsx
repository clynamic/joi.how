/* eslint-disable react-refresh/only-export-components */

import { Box } from '@mui/material';
import { ImageItem } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useRef, useState } from 'react';
import { useLocalImages } from '../local/LocalProvider';

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

export const Image: React.FC<ImageProps> = ({
  item,
  size,
  playable = false,
  loud = false,
  randomStart = false,
  onLoadedMetadata,
  ...rest
}) => {
  const [url, setUrl] = useState<string | undefined>(undefined);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { resolveUrl } = useLocalImages();

  useEffect(() => {
    let url: string | undefined;
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
          setPlaying(true);
        }
        url = item.full;
        break;
    }
    resolveUrl(url).then(
      url => {
        setUrl(url);
      },
      () => {
        setUrl(undefined);
      }
    );
  }, [item, size, playable, resolveUrl]);

  if (!url) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
        }}
      >
        <FontAwesomeIcon icon={faFileCircleExclamation} />
      </Box>
    );
  }

  if (playing) {
    return (
      <Box
        component='video'
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
        sx={{
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          userSelect: 'none',
        }}
        {...rest}
      />
    );
  }

  return (
    <Box
      component='img'
      src={url}
      alt={`Image from ${item.service} with id ${item.id}`}
      sx={{
        display: 'block',
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        userSelect: 'none',
      }}
      {...rest}
    />
  );
};
