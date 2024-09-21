import styled from 'styled-components';
import { PawLabels, useGameValue } from '../GameProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFire,
  faHand,
  faPerson,
  faPersonRunning,
  faPersonWalking,
} from '@fortawesome/free-solid-svg-icons';
import { useSetting } from '../../settings';
import { useMemo } from 'react';
import { GameEvent } from '../../types';
import { ProgressBar, VerticalDivider } from '../../common';

const StyledGameInstructions = styled.div`
  display: flex;
  height: fit-content;

  padding: 8px;

  background-color: var(--overlay-background);
  color: var(--overlay-color);
  border-bottom-right-radius: var(--border-radius);
`;

const StyledPaceIcons = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  justify-items: center;
`;

const StyledActiveIcon = styled.div<{ $active?: boolean }>`
  color: ${({ $active: active }) =>
    active ? '#fff' : 'rgba(255, 255, 255, 0.3)'};
  transition: color 0.2s;
  font-size: 2rem;
  padding: 0 4px;
`;

const StyledInfoText = styled.div`
  color: #fff;
  font-size: 1rem;
  padding: 0 4px;

  grid-column: 1/ -1;
`;

const StyledGripIcons = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  justify-items: center;
`;

const StyledIntensityMeter = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

export const GameInstructions = () => {
  const [pace] = useGameValue('pace');
  const [intensity] = useGameValue('intensity');
  const [maxPace] = useSetting('maxPace');
  const paceSection = useMemo(() => maxPace / 3, [maxPace]);

  const [paws] = useGameValue('paws');
  const [events] = useSetting('events');
  const useRandomGrip = useMemo(
    () => events.includes(GameEvent.randomGrip),
    [events]
  );

  return (
    <StyledGameInstructions>
      <StyledPaceIcons>
        <StyledActiveIcon $active={pace <= paceSection}>
          <FontAwesomeIcon icon={faPerson} />
        </StyledActiveIcon>
        <StyledActiveIcon
          $active={pace > paceSection && pace <= paceSection * 2}
        >
          <FontAwesomeIcon icon={faPersonWalking} />
        </StyledActiveIcon>
        <StyledActiveIcon $active={pace > paceSection * 2}>
          <FontAwesomeIcon icon={faPersonRunning} />
        </StyledActiveIcon>
        <StyledInfoText>
          <strong>{pace}</strong> b/s
        </StyledInfoText>
      </StyledPaceIcons>
      {useRandomGrip && (
        <>
          <VerticalDivider />
          <StyledGripIcons>
            <StyledActiveIcon $active={paws === 'left' || paws === 'both'}>
              <FontAwesomeIcon
                style={{ transform: 'scaleX(-1)' }}
                icon={faHand}
              />
            </StyledActiveIcon>
            <StyledActiveIcon $active={paws === 'right' || paws === 'both'}>
              <FontAwesomeIcon icon={faHand} />
            </StyledActiveIcon>
            <StyledInfoText>
              <strong>{PawLabels[paws]}</strong>
            </StyledInfoText>
          </StyledGripIcons>
        </>
      )}
      <StyledIntensityMeter>
        <ProgressBar
          progress={intensity}
          direction='vertical'
          background='rgba(255, 255, 255, 0.3)'
          color='#fff'
        />
        <FontAwesomeIcon
          icon={faFire}
          color={`rgb(255, ${255 - (intensity / 100) * 255}, ${255 - (intensity / 100) * 255})`}
        />
      </StyledIntensityMeter>
    </StyledGameInstructions>
  );
};
