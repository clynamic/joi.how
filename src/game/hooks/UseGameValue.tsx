import { fromNamespace } from '../../engine/Namespace';
import { useGameEngine } from '../GameProvider';

export const useGameValue = <T = any,>(path: string): T => {
  const { state } = useGameEngine();
  return fromNamespace<T>(state, path);
};
