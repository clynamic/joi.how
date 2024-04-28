import { useSetting } from '../../settings';
import { useLooping } from '../../utils';
import { GamePhase, useGameValue } from '../GameProvider';

export const GameIntensity = () => {
  const [, setIntensity] = useGameValue('intensity');
  const [phase] = useGameValue('phase');
  const [duration] = useSetting('gameDuration');

  useLooping(
    () => {
      setIntensity(prev => Math.min(prev + 1, 100));
    },
    duration,
    phase === GamePhase.active
  );

  return null;
};
