import { Composer } from '../../engine/Composer';
import { Path } from '../../engine/Lens';
import { useGameEngine } from '../GameProvider';

export const useGameValue = <T = any,>(path: Path): T => {
  const { state } = useGameEngine();
  if (!state) {
    return {} as T;
  }
  return new Composer(state).get<T>(path) ?? ({} as T);
};
