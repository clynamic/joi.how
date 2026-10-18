import styled from 'styled-components';
import { GameMessages } from './GameMessages';
import { GameImages } from './GameImages';
import { GameMeter } from './GameMeter';
import { GameHypno } from './GameHypno';
import { GameInstructions } from './GameInstructions';
import { GameEmergencyStop } from './GameEmergencyStop';
import { GamePauseMenu } from './GamePauseMenu';
import { GameResume } from './GameResume';
import { WhenLoaded } from './WhenLoaded';
import Pace from '../plugins/pace';
import Stroke from '../plugins/stroke';
import Hypno from '../plugins/hypno';
import EmergencyStop from '../plugins/emergencyStop';

const StyledGamePage = styled.div`
  position: relative;

  height: 100%;
  width: 100%;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const StyledTopBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;

  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
`;

const StyledTopLeft = styled.div`
  margin-bottom: 8px;
`;

const StyledTopRight = styled.div`
  margin-left: auto;
`;

const StyledCenter = styled.div`
  position: relative;
`;

const StyledCenterOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  white-space: nowrap;
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
`;

const StyledBottomRight = styled.div`
  margin-left: auto;
`;

export const GamePage = () => {
  return (
    <StyledGamePage className='game-page'>
      <GameImages />
      <StyledTopBar>
        <StyledTopLeft>
          <WhenLoaded plugin={Pace}>
            <GameInstructions />
          </WhenLoaded>
        </StyledTopLeft>
        <StyledTopRight>
          <GameMessages />
        </StyledTopRight>
      </StyledTopBar>
      <StyledCenter>
        <WhenLoaded plugin={Stroke}>
          <GameMeter />
        </WhenLoaded>
        <StyledCenterOverlay>
          <WhenLoaded plugin={Hypno}>
            <GameHypno />
          </WhenLoaded>
        </StyledCenterOverlay>
      </StyledCenter>
      <StyledBottomBar>
        <GamePauseMenu />
        <StyledBottomRight>
          <WhenLoaded plugin={EmergencyStop}>
            <GameEmergencyStop />
          </WhenLoaded>
        </StyledBottomRight>
      </StyledBottomBar>
      <GameResume />
    </StyledGamePage>
  );
};
