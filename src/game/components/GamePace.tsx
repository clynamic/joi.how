import { useEffect } from 'react';
import { useGameContext } from '../hooks';
import { useSetting } from '../../settings';
import Pace from '../plugins/pace';

export const GamePace = () => {
  const [minPace] = useSetting('minPace');
  const { resetPace } = useGameContext(Pace.paths.context);

  useEffect(() => {
    resetPace();
  }, [minPace, resetPace]);

  return null;
};
