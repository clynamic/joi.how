import styled from 'styled-components';
import { useImages, useSetting } from '../../settings';
import { useGameValue } from '../GameProvider';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo } from 'react';
import { ImageSize, StackedImage } from '../../common';
import { useLooping } from '../../utils';

const StyledGameImages = styled.div`
  position: absolute;
  overflow: hidden;

  height: 100%;
  width: 100%;
`;

const StyledForegroundImage = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
  pointer-events: none;
  user-select: none;
`;

const StyledBackgroundImage = motion(styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -2;
  pointer-events: none;
  user-select: none;

  display: flex;
  justify-items: center;
  align-items: center;

  filter: blur(30px);
`);

export const GameImages = () => {
  const [images] = useImages();
  const [currentImage, setCurrentImage] = useGameValue('currentImage');
  const [intensity] = useGameValue('intensity');
  const [videoSound] = useSetting('videoSound');
  const [highRes] = useSetting('highRes');

  const image = useMemo(() => images[currentImage], [images, currentImage]);

  const switchDuration = useMemo(() => {
    return Math.max((100 - intensity) * 80, 400);
  }, [intensity]);

  const switchImage = useCallback(() => {
    setCurrentImage(Math.floor(Math.random() * images.length));
  }, [images.length, setCurrentImage]);

  useLooping(switchImage, switchDuration);

  useEffect(() => switchImage(), [switchImage]);

  return (
    <StyledGameImages>
      <StyledBackgroundImage
        animate={{
          scale: [1.2, 1.4, 1.2],
        }}
        transition={{
          duration: switchDuration * 0.001,
          repeat: Infinity,
        }}
      >
        <StackedImage item={image} size={ImageSize.preview} />
      </StyledBackgroundImage>
      <StyledForegroundImage>
        <StackedImage
          style={{
            objectFit: 'contain',
          }}
          item={image}
          size={highRes ? ImageSize.full : ImageSize.preview}
          playable
          randomStart
          loud={videoSound}
        />
      </StyledForegroundImage>
    </StyledGameImages>
  );
};
