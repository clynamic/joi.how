import styled from 'styled-components';
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
import { GameEvent as GameEventType } from '../../types';
import { ProgressBar } from '../../common';
import { WaDivider } from '@awesome.me/webawesome/dist/react';
import { useGameState } from '../hooks';
import { PaceState } from '../plugins/pace';
import { IntensityState } from '../plugins/intensity';
import { DiceState, Paws, PawLabels } from '../plugins/dealer';

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
  const { pace = 0 } = useGameState<PaceState>(['core.pace']) ?? {};
  const { intensity = 0 } =
    useGameState<IntensityState>(['core.intensity']) ?? {};
  const { paws = Paws.both } = useGameState<DiceState>(['core.dice']) ?? {};
  const [maxPace] = useSetting('maxPace');
  const paceSection = useMemo(() => maxPace / 3, [maxPace]);

  const [events] = useSetting('events');
  const useRandomGrip = useMemo(
    () => events.includes(GameEventType.randomGrip),
    [events]
  );

  const intensityPct = Math.round(intensity * 100);

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
          <WaDivider orientation='vertical' style={{ alignSelf: 'center' }} />
          <StyledGripIcons>
            <StyledActiveIcon
              $active={paws === Paws.left || paws === Paws.both}
            >
              <FontAwesomeIcon
                style={{ transform: 'scaleX(-1)' }}
                icon={faHand}
              />
            </StyledActiveIcon>
            <StyledActiveIcon
              $active={paws === Paws.right || paws === Paws.both}
            >
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
          progress={intensityPct}
          direction='vertical'
          background='rgba(255, 255, 255, 0.3)'
          color='#fff'
        />
        <FontAwesomeIcon
          icon={faFire}
          color={`rgb(255, ${255 - intensity * 255}, ${255 - intensity * 255})`}
        />
      </StyledIntensityMeter>
    </StyledGameInstructions>
  );
};
