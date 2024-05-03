import { GameEvent } from '../../../types';
import { wait } from '../../../utils';
import { EventData } from '../GameEvents';

export const edgeEvent = async (data: EventData) => {
  const {
    game: { setEdged, setPace, sendMessage },
    settings: { minPace },
  } = data;

  setEdged(true);
  setPace(minPace);
  sendMessage({
    id: GameEvent.edge,
    title: `You should getting close to the edge. Don't cum yet.`,
    duration: 10000,
  });
  await wait(10000);
};
