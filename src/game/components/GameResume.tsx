import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameFrame } from '../hooks';
import Pause from '../plugins/pause';

const StyledOverlay = styled(motion.div)`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 10;
`;

const StyledNumber = styled(motion.div)`
  font-size: clamp(3rem, 15vw, 8rem);
  font-weight: bold;
  color: var(--overlay-color);
`;

const display = (countdown: number) =>
  countdown === 3 ? 'Ready?' : `${countdown}`;

export const GameResume = () => {
  const { countdown } = useGameFrame(Pause.paths) ?? {};

  return (
    <AnimatePresence mode='wait'>
      {countdown != null && (
        <StyledOverlay
          key='countdown-overlay'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <StyledNumber
            key={countdown}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            {display(countdown)}
          </StyledNumber>
        </StyledOverlay>
      )}
    </AnimatePresence>
  );
};
