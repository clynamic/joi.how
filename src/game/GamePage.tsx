import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { GameMessages } from './components/GameMessages';
import { GameImages } from './components/GameImages';
import { GameMeter } from './components/GameMeter';
import { GameHypno } from './components/GameHypno';
import { GameSound } from './components/GameSound';
import { GameVibrator } from './components/GameVibrator';
import { GameInstructions } from './components/GameInstructions';
import { GameEmergencyStop } from './components/GameEmergencyStop';
import { GamePauseMenu } from './components/GamePauseMenu';
import { GameResume } from './components/GameResume';
import { useGameEngine } from './hooks/UseGameEngine';
import { useGameState } from './hooks';
import Pause from './plugins/pause';
import { climax } from './plugins/dice/climax';

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
  // TODO: none of this logic should live inside this component.
  const { state, injectImpulse } = useGameEngine();
  const ready = !!state;
  const done = useGameState(climax.done);
  const navigate = useNavigate();

  useEffect(() => {
    // Replace this with on Scene transition to play, unpause
    if (!ready) return;
    injectImpulse(Pause.setPaused(false));
    return () => injectImpulse(Pause.setPaused(true));
  }, [ready, injectImpulse]);

  useEffect(() => {
    // Replace this with Scene transition to end
    if (done === true) navigate('/end');
  }, [done, navigate]);

  return (
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
        <GamePauseMenu />
        <GameEmergencyStop />
      </StyledBottomBar>
      <GameResume />
      <GameSound />
      <GameVibrator />
    </StyledGamePage>
  );
};
