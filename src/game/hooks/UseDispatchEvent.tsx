import { useMemo } from 'react';
import { dispatchEvent, GameEvent } from '../../engine/pipes/Events';
import { useGameEngine } from './UseGameEngine';

export function useDispatchEvent() {
  const { injectImpulse } = useGameEngine();

  return useMemo(
    () => ({
      dispatchEvent: (event: GameEvent) => {
        injectImpulse(dispatchEvent(event));
      },
    }),
    [injectImpulse]
  );
}
