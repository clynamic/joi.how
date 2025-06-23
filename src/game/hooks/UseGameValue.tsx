import { Composer } from '../../engine/Composer';
import { useGameEngine } from '../GameProvider';

export const useGameValue = <T = any,>(path: string): T => {
  const { state } = useGameEngine();
  if (!state) {
    return {} as T;
  }
  return new Composer(state).from<T>(path) as T;
};
