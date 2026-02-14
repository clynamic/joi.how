import styled from 'styled-components';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { defaultTransition } from '../../utils';
import { useGameState } from '../hooks';
import Phase, { GamePhase } from '../plugins/phase';
import Stroke, { StrokeDirection } from '../plugins/stroke';
import Pace from '../plugins/pace';

const StyledGameMeter = styled.div`
  pointer-events: none;
`;

const StyledGameMeterCircle = motion.create(styled.div`
  aspect-ratio: 1;
  width: 250px;
  border-radius: 100%;
  opacity: 0.3;
  border: 1px solid #000;
`);

enum MeterColor {
  light = 'light',
  dark = 'dark',
}

export const GameMeter = () => {
  const { stroke } = useGameState(Stroke.paths.state) ?? {};
  const { current: phase } = useGameState(Phase.paths.state) ?? {};
  const { pace } = useGameState(Pace.paths.state) ?? {};

  const switchDuration = useMemo(() => {
    if (!pace || pace === 0) return 0;
    return (1 / pace) * 1000;
  }, [pace]);

  const size = useMemo(() => {
    if (phase === GamePhase.active || phase === GamePhase.finale) {
      return stroke === StrokeDirection.up ? 1 : 0.6;
    }
    return 0;
  }, [phase, stroke]);

  const duration = useMemo(() => {
    if (phase === GamePhase.active || phase === GamePhase.finale) {
      if (pace && pace >= 5) return 100;
      if (pace && pace >= 3) return 250;
      return 550;
    }
    return 0;
  }, [phase, pace]);

  const color = useMemo(() => {
    return stroke === StrokeDirection.up ? MeterColor.light : MeterColor.dark;
  }, [stroke]);

  return (
    <StyledGameMeter>
      <StyledGameMeterCircle
        initial={{ scale: 0 }}
        animate={{
          scale: size,
          backgroundColor: {
            dark: 'rgb(114, 114, 114)',
            light: 'rgb(179, 179, 179)',
          }[color],
        }}
        transition={{
          ...defaultTransition,
          duration: Math.min(switchDuration, duration) / 1000,
        }}
      />
    </StyledGameMeter>
  );
};
