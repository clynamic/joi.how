import styled from 'styled-components';
import { useGameValue } from '../GameProvider';
import { useMemo } from 'react';
import { motion } from 'framer-motion';

const StyledGameMeter = styled.div`
  pointer-events: none;
`;

const StyledGameMeterCircle = styled.div`
  aspect-ratio: 1;
  width: 250px;
  border-radius: 100%;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.23, 1, 0.32, 1);
  opacity: 0.3;
  border: 1px solid #000;
  background: rgb(114, 114, 114);
`;

export const GameMeter = () => {
  const [stroke] = useGameValue('stroke');
  const [phase] = useGameValue('phase');
  const [pace] = useGameValue('pace');

  const size = useMemo(() => {
    switch (phase) {
      case 'warmup':
        return 0; // no meter during warmup
      case 'active':
        switch (stroke) {
          case 'up':
            return 1;
          case 'down':
            return 0.6;
        }
        return 0;
      case 'climax':
        return 0.2;
    }
    return 0;
  }, [phase, stroke]);

  const duration = useMemo(() => {
    switch (phase) {
      case 'warmup':
        return 0;
      case 'active':
        if (pace >= 5) {
          return 100;
        }
        if (pace >= 3) {
          return 250;
        }
        return 550;
      case 'climax':
        return 0;
    }
    return 0;
  }, [phase, pace]);

  return (
    <StyledGameMeter>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: size }}
        transition={{ duration: duration * 0.001, ease: 'easeInOut' }}
      >
        <StyledGameMeterCircle />
      </motion.div>
    </StyledGameMeter>
  );
};
