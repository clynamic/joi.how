import styled from 'styled-components';
import { GameEngineProvider } from './GameProvider';
import { FpsDisplay } from './components/FpsDisplay';
import { messagesPipe } from '../engine/pipes/Messages';
import { GameMessages } from './components/GameMessages';
import { PauseButton } from './components/Pause';
import { fpsPipe } from '../engine/pipes/Fps';
import { messageTestPipe } from './test';
import { useSettingsPipe } from './pipes';
import { GameIntensity } from './components/GameIntensity';
import { intensityPipe } from './pipes/Intensity';
import { imagePipe } from './pipes/Image';
import { GameImages } from './components/GameImages';

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
  const settingsPipe = useSettingsPipe();

  return (
    <GameEngineProvider
      pipes={[
        fpsPipe,
        messagesPipe,
        settingsPipe,
        intensityPipe,
        imagePipe,
        messageTestPipe,
      ]}
    >
      <StyledGamePage>
        <GameImages />
        <StyledTopBar>
          <GameIntensity />
          <FpsDisplay />
          <GameMessages />
        </StyledTopBar>
        <StyledCenter></StyledCenter>
        <StyledBottomBar>
          <PauseButton />
        </StyledBottomBar>
      </StyledGamePage>
    </GameEngineProvider>
  );
};
