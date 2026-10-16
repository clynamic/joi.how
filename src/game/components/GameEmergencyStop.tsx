import { useCallback } from 'react';
import { WaButton, WaIcon } from '@awesome.me/webawesome/dist/react';
import { useGameFrame } from '../hooks';
import { useDispatchEvent } from '../hooks/UseDispatchEvent';
import Phase, { GamePhase } from '../plugins/phase';
import EmergencyStop from '../plugins/emergencyStop';

export const GameEmergencyStop = () => {
  const phase = useGameFrame(Phase.paths.current) ?? '';
  const { inject } = useDispatchEvent();

  const onStop = useCallback(() => {
    inject(EmergencyStop.trigger());
  }, [inject]);

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
