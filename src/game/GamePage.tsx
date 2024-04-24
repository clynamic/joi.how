import { GameImages } from './components/GameImages';
import { GameProvider } from './GameProvider';

export const GamePage = () => {
  return (
    <GameProvider>
      <GameImages />
    </GameProvider>
  );
};
