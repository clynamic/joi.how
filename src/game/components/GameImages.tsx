import styled from 'styled-components';
import { useSetting } from '../../settings';
import { motion } from 'framer-motion';
import { JoiImage } from '../../common';
import { useImagePreloader } from '../../utils';
import { ImageSize, ImageType } from '../../types';
import { useGameState } from '../hooks';
import { ImageState } from '../pipes';

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
  const { currentImage, nextImages = [] } = useGameState<ImageState>([
    'core.images',
  ]);
  const { intensity } = useGameState(['core.intensity']);
  const [videoSound] = useSetting('videoSound');
  const [highRes] = useSetting('highRes');

  useImagePreloader(nextImages, highRes ? ImageSize.full : ImageSize.preview);

  const switchDuration = Math.max((100 - intensity * 100) * 80, 2000);

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
            <JoiImage
              thumb={currentImage.thumbnail}
              preview={currentImage.preview}
              kind={currentImage.type === ImageType.video ? 'video' : 'image'}
              objectFit='cover'
            />
          </StyledBackgroundImage>
          <StyledForegroundImage>
            <JoiImage
              thumb={currentImage.thumbnail}
              preview={currentImage.preview}
              full={
                highRes && currentImage.type !== ImageType.video
                  ? currentImage.full
                  : undefined
              }
              kind={currentImage.type === ImageType.video ? 'video' : 'image'}
              playable={currentImage.type === ImageType.video}
              loud={videoSound}
              randomStart={true}
              objectFit='contain'
            />
          </StyledForegroundImage>
        </>
      )}
    </StyledGameImages>
  );
};
