import { GameEvent } from '../../../types';
import { wait } from '../../../utils';
import { GamePhase } from '../../GameProvider';
import { EventDataRef } from '../GameEvents';

export const pauseEvent = async (data: EventDataRef) => {
  const {
    game: { intensity, setPhase, sendMessage },
  } = data.current;

  sendMessage({
    id: GameEvent.pause,
    title: 'Stop stroking!',
  });
  setPhase(GamePhase.pause);
  const duration = Math.ceil(-100 * intensity + 12000);
  await wait(duration);
  sendMessage({
    id: GameEvent.pause,
    title: 'Start stroking again!',
    duration: 5000,
  });
  setPhase(GamePhase.active);
};
