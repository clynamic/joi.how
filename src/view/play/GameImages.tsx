import styled from 'styled-components';
import { useKeys, useGameFrame } from '../bridge/hooks';
import {
  imageKeys,
  getImageSwitchDuration,
} from '../../game/classic/randomImages';
import { motion } from 'framer-motion';
import { JoiImage } from '../common';
import Image, { displayKeys } from '../../game/classic/image';
import Assets from '../../game/assets';
import Intensity from '../../game/classic/intensity';

const StyledGameImages = styled.div`
  position: absolute;
  isolation: isolate;
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

const StyledBackgroundImage = motion.create(styled.div`
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
  const { currentImage } = useGameFrame(Image.paths);
  const { intensity = 0 } = useGameFrame(Intensity.paths);
  const assets = useGameFrame(Assets.paths);
  const [{ videoSound }] = useKeys(displayKeys);
  const [{ imageDuration, intenseImages }] = useKeys(imageKeys);

  const switchDuration = getImageSwitchDuration(
    { imageDuration, intenseImages },
    intensity
  );

  const entry = currentImage ? assets?.inUse?.[currentImage] : undefined;
  const record = currentImage
    ? assets?.library?.[currentImage]?.record
    : undefined;
  const urls = entry?.urls ?? {};
  const isVideo = record?.kind === 'video';

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
              thumb={urls.thumbnail}
              preview={urls.preview}
              kind={isVideo ? 'video' : 'image'}
              objectFit='cover'
            />
          </StyledBackgroundImage>
          <StyledForegroundImage>
            <JoiImage
              thumb={urls.thumbnail}
              preview={urls.preview}
              full={urls.full}
              kind={isVideo ? 'video' : 'image'}
              playable={isVideo}
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
