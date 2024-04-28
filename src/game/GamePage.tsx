import styled from 'styled-components';
import {
  GameHypno,
  GameImages,
  GameMeter,
  GameIntensity,
  GameSound,
} from './components';
import { GameProvider } from './GameProvider';

const StyledGamePage = styled.div`
  position: relative;

  height: 100%;
  width: 100%;

  display: flex;
  justify-content: center;
  align-items: center;
`;

export const GamePage = () => {
  return (
    <StyledGamePage>
      <GameProvider>
        <GameSound />
        <GameIntensity />
        <GameImages />
        <GameMeter />
        <GameHypno />
      </GameProvider>
    </StyledGamePage>
  );
};
