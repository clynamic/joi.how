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
import Pace from '../plugins/pace';
import Intensity from '../plugins/intensity';
import { Paws, PawLabels, pawsPath } from '../plugins/dealer';

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

const PaceDisplay = () => {
  const { pace = 0 } = useGameState(Pace.paths.state) ?? {};
  const [maxPace] = useSetting('maxPace');
  const paceSection = useMemo(() => maxPace / 3, [maxPace]);

  return (
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
  );
};

const GripDisplay = () => {
  const paws = useGameState(pawsPath) ?? Paws.both;

  return (
    <StyledGripIcons>
      <StyledActiveIcon $active={paws === Paws.left || paws === Paws.both}>
        <FontAwesomeIcon
          style={{ transform: 'scaleX(-1)' }}
          icon={faHand}
        />
      </StyledActiveIcon>
      <StyledActiveIcon $active={paws === Paws.right || paws === Paws.both}>
        <FontAwesomeIcon icon={faHand} />
      </StyledActiveIcon>
      <StyledInfoText>
        <strong>{PawLabels[paws]}</strong>
      </StyledInfoText>
    </StyledGripIcons>
  );
};

const IntensityDisplay = () => {
  const { intensity = 0 } =
    useGameState(Intensity.paths.state) ?? {};
  const intensityPct = Math.round(intensity * 100);

  return (
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
  );
};

export const GameInstructions = () => {
  const [events] = useSetting('events');
  const useRandomGrip = useMemo(
    () => events.includes(GameEventType.randomGrip),
    [events]
  );

  return (
    <StyledGameInstructions>
      <PaceDisplay />
      {useRandomGrip && (
        <>
          <WaDivider orientation='vertical' style={{ alignSelf: 'center' }} />
          <GripDisplay />
        </>
      )}
      <IntensityDisplay />
    </StyledGameInstructions>
  );
};
