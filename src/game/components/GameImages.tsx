import styled from 'styled-components';
import { useImages, useSetting } from '../../settings';
import { useGameValue } from '../GameProvider';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo } from 'react';
import { ImageSize, StackedImage } from '../../common';
import { useAutoRef, useImagePreloader, useLooping } from '../../utils';

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
  const [seenImages, setSeenImages] = useGameValue('seenImages');
  const [nextImages, setNextImages] = useGameValue('nextImages');
  const [intensity] = useGameValue('intensity');
  const [videoSound] = useSetting('videoSound');
  const [highRes] = useSetting('highRes');

  useImagePreloader(nextImages, highRes ? ImageSize.full : ImageSize.preview);

  const imagesTracker = useAutoRef({
    images,
    currentImage,
    setCurrentImage,
    seenImages,
    setSeenImages,
    nextImages,
    setNextImages,
  });

  const switchImage = useCallback(() => {
    const {
      images,
      currentImage,
      setCurrentImage,
      seenImages,
      setSeenImages,
      nextImages,
      setNextImages,
    } = imagesTracker.current;

    let next = nextImages;
    if (next.length <= 0) {
      next = images.sort(() => Math.random() - 0.5).slice(0, 3);
    }
    const seen = [...seenImages, ...(currentImage ? [currentImage] : [])];
    if (seen.length > images.length / 2) {
      seen.shift();
    }
    const unseen = images.filter(i => !seen.includes(i));
    setCurrentImage(next.shift());
    setSeenImages(seen);
    setNextImages([...next, unseen[Math.floor(Math.random() * unseen.length)]]);
  }, [imagesTracker]);

  const switchDuration = useMemo(() => {
    return Math.max((100 - intensity) * 80, 2000);
  }, [intensity]);

  useEffect(() => switchImage(), [switchImage]);

  useLooping(switchImage, switchDuration);

  return (
    <StyledGameImages>
      {currentImage && (
        <>
          <StyledBackgroundImage
            animate={{
              scale: [1.2, 1.4, 1.2],
            }}
            transition={{
              duration: switchDuration / 1000,
              repeat: Infinity,
            }}
          >
            <StackedImage item={currentImage} size={ImageSize.preview} />
          </StyledBackgroundImage>
          <StyledForegroundImage>
            <StackedImage
              style={{
                objectFit: 'contain',
              }}
              item={currentImage}
              size={highRes ? ImageSize.full : ImageSize.preview}
              playable
              randomStart
              loud={videoSound}
            />
          </StyledForegroundImage>
        </>
      )}
    </StyledGameImages>
  );
};
