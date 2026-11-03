import { useCallback } from 'react';
import { WaButton, WaIcon } from '@awesome.me/webawesome/dist/react';
import { useGameFrame } from '../bridge/hooks';
import { useDispatchEvent } from '../bridge/hooks/UseDispatchEvent';
import Phase, { GamePhase } from '../../game/phase';
import EmergencyStop from '../../game/classic/emergencyStop';

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
