import { useCallback } from 'react';
import { WaButton, WaIcon } from '@awesome.me/webawesome/dist/react';
import { useGameFrame } from '../hooks';
import { useDispatchEvent } from '../hooks/UseDispatchEvent';
import Phase, { GamePhase } from '../plugins/phase';
import { Events } from '../../engine/pipes/Events';

export const GameEmergencyStop = () => {
  const phase = useGameFrame(Phase.paths.current) ?? '';
  const { dispatchEvent } = useDispatchEvent();

  const onStop = useCallback(() => {
    dispatchEvent({ type: Events.getKey('core.emergencyStop', 'stop') });
  }, [dispatchEvent]);

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
