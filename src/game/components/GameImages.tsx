import styled from 'styled-components';
import { useImages } from '../../images';
import { useGameValue } from '../GameProvider';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { IconButton, Image, ImageSize, VerticalDivider } from '../../common';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faForward,
  faUpRightFromSquare,
} from '@fortawesome/free-solid-svg-icons';

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

  & > img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const StyledBackgroundImage = styled.div`
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

  & > div {
    width: 100%;
    height: 100%;

    transform-origin: center;

    & > img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
`;

const StyledImageActions = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;

  display: flex;

  padding: 8px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: var(--border-radius) 0 0 0;
`;

export const GameImages = () => {
  const [images] = useImages();
  const [currentImage] = useGameValue('currentImage');
  const [intensity] = useGameValue('intensity');

  const pulseDuration = useMemo(() => {
    return Math.max((100 - intensity) * 80, 800) / 1000;
  }, [intensity]);

  const image = useMemo(() => images[currentImage], [images, currentImage]);

  return (
    <StyledGameImages>
      <StyledBackgroundImage>
        <motion.div
          animate={{
            scale: [1.2, 1.4, 1.2],
          }}
          transition={{
            duration: pulseDuration,
            repeat: Infinity,
          }}
        >
          <Image item={image} size={ImageSize.preview} playable={false} />
        </motion.div>
      </StyledBackgroundImage>
      <StyledForegroundImage>
        <Image item={image} size={ImageSize.full} />
      </StyledForegroundImage>
      <StyledImageActions>
        <IconButton
          onClick={() => {
            // TODO: implement skip
          }}
        >
          <FontAwesomeIcon icon={faForward} />
        </IconButton>
        <VerticalDivider />
        <IconButton onClick={() => window.open(image.source, '_blank')}>
          <FontAwesomeIcon icon={faUpRightFromSquare} />
        </IconButton>
      </StyledImageActions>
    </StyledGameImages>
  );
};
