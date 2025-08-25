import { useEffect } from 'react';
import { useGameContext } from '../hooks';
import { useSetting } from '../../settings';
import { PaceContext } from '../pipes/Pace';

export const GamePace = () => {
  const [minPace] = useSetting('minPace');
  const { resetPace } = useGameContext<PaceContext>(['core.pace']);

  useEffect(() => {
    resetPace();
  }, [minPace, resetPace]);

  return null;
};
