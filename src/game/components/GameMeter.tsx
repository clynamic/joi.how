import styled from 'styled-components';
import { GamePhase, Stroke, useGameValue } from '../GameProvider';
import { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { defaultTransition, useLooping } from '../../utils';

const StyledGameMeter = styled.div`
  pointer-events: none;
`;

const StyledGameMeterCircle = motion(styled.div`
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
  const [stroke, setStroke] = useGameValue('stroke');
  const [phase] = useGameValue('phase');
  const [pace] = useGameValue('pace');

  const switchDuration = useMemo(() => {
    if (pace === 0) return 0;
    return (1 / pace) * 1000;
  }, [pace]);

  const updateStroke = useCallback(() => {
    setStroke(stroke => {
      switch (stroke) {
        case Stroke.up:
          return Stroke.down;
        case Stroke.down:
          return Stroke.up;
      }
    });
  }, [setStroke]);

  useLooping(
    updateStroke,
    switchDuration,
    [GamePhase.active, GamePhase.finale].includes(phase) && pace > 0
  );

  const size = useMemo(() => {
    switch (phase) {
      case GamePhase.active:
      case GamePhase.finale:
        return (() => {
          switch (stroke) {
            case Stroke.up:
              return 1;
            case Stroke.down:
              return 0.6;
          }
        })();
    }
    return 0;
  }, [phase, stroke]);

  const duration = useMemo(() => {
    switch (phase) {
      case GamePhase.active:
      case GamePhase.finale:
        if (pace >= 5) {
          return 100;
        }
        if (pace >= 3) {
          return 250;
        }
        return 550;
    }
    return 0;
  }, [phase, pace]);

  const color = useMemo(() => {
    switch (stroke) {
      case Stroke.up:
        return MeterColor.light;
      case Stroke.down:
        return MeterColor.dark;
    }
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
