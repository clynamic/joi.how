import { faPause } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';
import { GamePhase, useGameValue, useSendMessage } from '../GameProvider';
import { useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { wait } from '../../utils';
import { useSetting } from '../../settings';

const StyledGameEmergencyStop = styled.div`
  display: flex;
  flex-direction: column;
`;

const StyledStopButton = motion(styled.button`
  display: flex;

  align-items: center;

  padding: 16px 12px;
  gap: 8px;

  border-radius: var(--border-radius) 0 0 0;
  opacity: 0.8;
  background: #a52727;
  color: #fff;
  font-size: 1rem;

  cursor: pointer;

  transition: filter 0.2s;
  &:hover {
    filter: brightness(1.4);
  }
`);

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
    <StyledGameEmergencyStop>
      <AnimatePresence>
        {phase === GamePhase.active && (
          <StyledStopButton
            key='stopAction'
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: {
                duration: 0.4,
                ease: [0.23, 1, 0.32, 1],
                type: 'spring',
              },
            }}
            exit={{ opacity: 0 }}
            onClick={onStop}
          >
            <p>Too close</p>
            <FontAwesomeIcon
              style={{ fontSize: 'var(--icon-size)' }}
              icon={faPause}
            />
          </StyledStopButton>
        )}
      </AnimatePresence>
    </StyledGameEmergencyStop>
  );
};
