import styled from 'styled-components';
import {
  GameHypnoText,
  GameHypnoSpiral,
  GameImages,
  GameMeter,
  GameIntensity,
  GameSound,
  GameInstructions,
  GamePace,
  GameEvents,
  GameMessages,
  GameWarmup,
  GameEmergencyStop,
  GameSettings,
  GameVibrator,
} from './components';
import { GameProvider } from './GameProvider';

const StyledGamePage = styled.div`
  position: relative;

  height: 100%;
  width: 100%;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const StyledLogicElements = styled.div`
  // these elements have no visual representation. This style is merely to group them.
`;

const StyledTopBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;

  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;

  & > *:first-child {
    margin-bottom: 8px;
  }

  & > *:nth-child(2) {
    margin-left: auto;
  }
`;

const StyledCenter = styled.div`
  position: relative;

  & > *:nth-child(2) {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    white-space: nowrap;
  }
`;

const StyledBottomBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;

  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;

  align-items: flex-end;

  & > *:nth-child(2) {
    margin-left: auto;
  }
`;

export const GamePage = () => {
  return (
    <GameProvider>
      <StyledGamePage>
        <StyledLogicElements>
          <GameWarmup />
          <GameIntensity />
          <GamePace />
          <GameSound />
          <GameVibrator />
          <GameEvents />
        </StyledLogicElements>
        <GameImages />
        <GameHypnoSpiral />
        <StyledTopBar>
          <GameInstructions />
          <GameMessages />
        </StyledTopBar>
        <StyledCenter>
          <GameMeter />
          <GameHypnoText />
        </StyledCenter>
        <StyledBottomBar>
          <GameSettings />
          <GameEmergencyStop />
        </StyledBottomBar>
      </StyledGamePage>
    </GameProvider>
  );
};
