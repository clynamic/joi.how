import { useMemo } from 'react';
import { useContextSelector } from 'use-context-selector';
import { dispatchEvent, GameEvent } from '../../engine/pipes/Events';
import { Pipe } from '../../engine/State';
import { GameEngineContext } from '../GameProvider';

export function useDispatchEvent() {
  const injectImpulse = useContextSelector(
    GameEngineContext,
    ctx => ctx?.injectImpulse
  );

  return useMemo(
    () => ({
      inject: (pipe: Pipe) => {
        injectImpulse?.(pipe);
      },
      dispatchEvent: (event: GameEvent) => {
        injectImpulse?.(dispatchEvent(event));
      },
    }),
    [injectImpulse]
  );
}
