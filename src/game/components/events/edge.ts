import { GameEvent } from '../../../types';
import { wait } from '../../../utils';
import { EventDataRef } from '../GameEvents';

export const edgeEvent = async (data: EventDataRef) => {
  const {
    game: { setEdged, setPace, sendMessage },
    settings: { minPace },
  } = data.current;

  setEdged(true);
  setPace(minPace);
  sendMessage({
    id: GameEvent.edge,
    title: `You should getting close to the edge. Don't cum yet.`,
    duration: 10000,
  });
  await wait(10000);
};
