import { useContext } from 'use-context-selector';
import { GameEngineContext } from '../GameProvider';

export function useGameEngine() {
  const ctx = useContext(GameEngineContext);
  if (!ctx)
    throw new Error('useGameEngine must be used inside GameEngineProvider');
  return ctx;
}
