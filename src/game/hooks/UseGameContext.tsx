import { Composer } from '../../engine/Composer';
import { Path } from '../../engine/Lens';
import { useGameEngine } from '../GameProvider';

export const useGameContext = <T = any,>(path: Path): T => {
  const { context } = useGameEngine();
  if (!context) {
    return {} as T;
  }
  return new Composer(context).get<T>(path) ?? ({} as T);
};
