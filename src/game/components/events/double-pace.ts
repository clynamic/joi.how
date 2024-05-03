import { GameEvent } from '../../../types';
import { round, wait } from '../../../utils';
import { EventDataRef, silenceEventData } from '../GameEvents';
import { randomPaceEvent } from './random-pace';

export const doublePaceEvent = async (data: EventDataRef) => {
  const {
    game: { pace, setPace, sendMessage },
    settings: { maxPace },
  } = data.current;
  const newPace = Math.min(round(pace * 2), maxPace);
  setPace(newPace);
  sendMessage({
    id: GameEvent.doublePace,
    title: 'Double pace!',
  });
  const duration = 9000;
  const durationPortion = duration / 3;
  sendMessage({
    id: GameEvent.doublePace,
    description: '3...',
  });
  await wait(durationPortion);
  sendMessage({
    id: GameEvent.doublePace,
    description: '2...',
  });
  await wait(durationPortion);
  sendMessage({
    id: GameEvent.doublePace,
    description: '1...',
  });
  await wait(durationPortion);
  sendMessage({
    id: GameEvent.doublePace,
    title: 'Done! Back to normal pace',
    description: undefined,
    duration: 5000,
  });

  randomPaceEvent(silenceEventData(data));
};
