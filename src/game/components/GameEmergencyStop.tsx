import { GamePhase, useGameValue, useSendMessage } from '../GameProvider';
import { useCallback } from 'react';
import { wait } from '../../utils';
import { useSetting } from '../../settings';
import { WaButton, WaIcon } from '@awesome.me/webawesome/dist/react';

export const GameEmergencyStop = () => {
  const [phase, setPhase] = useGameValue('phase');
  const [intensity, setIntensity] = useGameValue('intensity');
  const [, setPace] = useGameValue('pace');
  const [minPace] = useSetting('minPace');
  const sendMessage = useSendMessage();
  const messageId = 'emergency-stop';

  const onStop = useCallback(async () => {
    const timeToCalmDown = Math.ceil((intensity * 500 + 10000) / 1000);

    setPhase(GamePhase.break);

    sendMessage({
      id: messageId,
      title: 'Calm down with your $hands off.',
    });

    // maybe percentage based reduction
    setIntensity(intensity => Math.max(intensity - 30, 0));
    setPace(minPace);

    await wait(5000);

    for (let i = 0; i < timeToCalmDown; i++) {
      sendMessage({
        id: messageId,
        description: `${timeToCalmDown - i}...`,
      });
      await wait(1000);
    }

    sendMessage({
      id: messageId,
      title: 'Put your $hands back.',
      description: undefined,
      duration: 5000,
    });

    await wait(2000);

    setPhase(GamePhase.active);
  }, [intensity, minPace, sendMessage, setIntensity, setPace, setPhase]);

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
