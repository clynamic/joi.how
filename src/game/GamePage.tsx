import { useMemo } from 'react';
import styled from 'styled-components';
import { GameEngineProvider } from './GameProvider';
import { GameMessages } from './components/GameMessages';
import { useSettingsPipe } from './pipes';
import { GameImages } from './components/GameImages';
import { pluginInstallerPipe } from '../engine/plugins/PluginInstaller';
import { pluginManagerPipe } from '../engine/plugins/PluginManager';
import { registerPlugins } from './plugins';
import { GameMeter } from './components/GameMeter';
import { GameHypno } from './components/GameHypno';
import { GameSound } from './components/GameSound';
import { GameVibrator } from './components/GameVibrator';
import { GameInstructions } from './components/GameInstructions';
import { GameEmergencyStop } from './components/GameEmergencyStop';
import { GameSettings } from './components/GameSettings';

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
  const pipes = useMemo(
    () => [
      pluginManagerPipe,
      pluginInstallerPipe,
      registerPlugins,
      settingsPipe,
    ],
    [settingsPipe]
  );

  return (
    <GameEngineProvider pipes={pipes}>
      <StyledGamePage className='game-page'>
        <GameImages />
        <StyledTopBar>
          <GameInstructions />
          <GameMessages />
        </StyledTopBar>
        <StyledCenter>
          <GameMeter />
          <GameHypno />
        </StyledCenter>
        <StyledBottomBar>
          <GameSettings />
          <GameEmergencyStop />
        </StyledBottomBar>
        <GameSound />
        <GameVibrator />
      </StyledGamePage>
    </GameEngineProvider>
  );
};
