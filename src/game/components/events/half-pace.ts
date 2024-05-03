import { GameEvent } from '../../../types';
import { round, wait } from '../../../utils';
import { EventDataRef, silenceEventData } from '../GameEvents';
import { randomPaceEvent } from './random-pace';

export const halfPaceEvent = async (data: EventDataRef) => {
  const {
    game: { pace, setPace, sendMessage },
    settings: { minPace },
  } = data.current;

  sendMessage({
    id: GameEvent.halfPace,
    title: 'Half pace!',
  });
  const newPace = Math.max(round(pace / 2), minPace);
  setPace(newPace);
  const duration = Math.ceil(Math.random() * 20000) + 12000;
  const durationPortion = duration / 3;
  sendMessage({
    id: GameEvent.halfPace,
    description: '3...',
  });
  await wait(durationPortion);
  sendMessage({
    id: GameEvent.halfPace,
    description: '2...',
  });
  await wait(durationPortion);
  sendMessage({
    id: GameEvent.halfPace,
    description: '1...',
  });
  await wait(durationPortion);
  sendMessage({
    id: GameEvent.halfPace,
    title: 'Done! Back to normal pace',
    description: undefined,
    duration: 5000,
  });

  randomPaceEvent(silenceEventData(data));
};
