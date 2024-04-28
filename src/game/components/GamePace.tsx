import { useEffect } from 'react';
import { useGameValue } from '../GameProvider';
import { useSetting } from '../../settings';

export const GamePace = () => {
  const [minPace] = useSetting('minPace');
  const [, setPace] = useGameValue('pace');

  useEffect(() => {
    setPace(minPace);
  }, [minPace, setPace]);

  return null;
};
