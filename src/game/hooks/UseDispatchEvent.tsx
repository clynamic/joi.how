import { useMemo } from 'react';
import { createEventContext, GameEvent } from '../../engine/pipes/Events';
import { useGameEngine } from '../GameProvider';

export function useDispatchEvent() {
  const { injectContext } = useGameEngine();

  return useMemo(
    () => ({
      dispatchEvent: (event: GameEvent) => {
        injectContext(createEventContext(event));
      },
    }),
    [injectContext]
  );
}
