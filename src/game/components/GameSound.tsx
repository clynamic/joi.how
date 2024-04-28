import { useEffect } from 'react';
import { Stroke, useGameValue } from '../GameProvider';
import { playTone } from '../../utils/sound';

export const GameSound = () => {
  const [stroke] = useGameValue('stroke');

  useEffect(() => {
    switch (stroke) {
      case Stroke.up:
        playTone(425);
        break;
      case Stroke.down:
        playTone(625);
        break;
    }
  }, [stroke]);

  return null;
};
