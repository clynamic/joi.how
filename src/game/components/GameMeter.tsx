import styled from 'styled-components';
import { GamePhase, Stroke, useGameValue } from '../GameProvider';
import { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLooping } from '../../utils';

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
  red = 'red',
}

export const GameMeter = () => {
  const [stroke, setStroke] = useGameValue('stroke');
  const [phase] = useGameValue('phase');
  const [pace] = useGameValue('pace');

  const switchDuration = useMemo(() => {
    return (1 / Math.max(1, pace)) * 1000;
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
    [GamePhase.active, GamePhase.climax].includes(phase) && pace > 0
  );

  const size = useMemo(() => {
    switch (phase) {
      case GamePhase.pause:
      case GamePhase.warmup: // no meter during warmup
        return 0;
      case GamePhase.active:
        return (() => {
          switch (stroke) {
            case Stroke.up:
              return 1;
            case Stroke.down:
              return 0.6;
          }
        })();
      case GamePhase.climax:
        return 0.2;
    }
  }, [phase, stroke]);

  const duration = useMemo(() => {
    switch (phase) {
      case GamePhase.pause:
      case GamePhase.warmup:
        return 0;
      case GamePhase.active:
        if (pace >= 5) {
          return 100;
        }
        if (pace >= 3) {
          return 250;
        }
        return 550;
      case GamePhase.climax:
        return 0;
    }
  }, [phase, pace]);

  const color = useMemo(() => {
    if (phase === GamePhase.climax) {
      return MeterColor.red;
    }
    switch (stroke) {
      case Stroke.up:
        return MeterColor.dark;
      case Stroke.down:
        return MeterColor.light;
    }
  }, [stroke, phase]);

  return (
    <StyledGameMeter>
      <StyledGameMeterCircle
        initial={{ scale: 0 }}
        animate={{
          scale: size,
          backgroundColor: {
            light: 'rgb(114, 114, 114)',
            dark: 'rgb(179, 179, 179)',
            red: 'rgb(211, 76, 76)',
          }[color],
        }}
        transition={{
          duration: Math.min(switchDuration, duration) * 0.001,
          ease: [0.23, 1, 0.32, 1],
        }}
      />
    </StyledGameMeter>
  );
};
