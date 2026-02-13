import { useCallback } from 'react';
import { WaButton, WaIcon } from '@awesome.me/webawesome/dist/react';
import { useGameEngine, useGameState } from '../hooks';
import { GamePhase, PhaseState } from '../plugins/phase';
import { dispatchEvent } from '../../engine/pipes/Events';
import { getEventKey } from '../../engine/pipes/Events';

export const GameEmergencyStop = () => {
  const { current: phase } = useGameState<PhaseState>(['core.phase']) ?? {};
  const { injectImpulse } = useGameEngine();

  const onStop = useCallback(() => {
    injectImpulse(
      dispatchEvent({ type: getEventKey('core.dice', 'emergencyStop') })
    );
  }, [injectImpulse]);

  return (
    <>
      {phase === GamePhase.active && (
        <WaButton
          size='large'
          variant='danger'
          onClick={onStop}
          style={
            {
              '--wa-form-control-height': '40px',
            } as React.CSSProperties
          }
        >
          <p>Too close</p>
          <WaIcon slot='end' name='pause' />
        </WaButton>
      )}
    </>
  );
};
