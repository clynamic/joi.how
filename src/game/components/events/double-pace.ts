import { GameEvent } from '../../../types';
import { round, wait, intensityToPaceRange } from '../../../utils';
import { EventData } from '../GameEvents';

export const doublePaceEvent = async (data: EventData) => {
  const {
    game: { intensity, pace, setPace, sendMessage },
    settings: { minPace, maxPace, steepness },
  } = data;

  sendMessage({
    id: GameEvent.doublePace,
    title: 'Double pace!',
  });
  const newPace = Math.min(round(pace * 2), maxPace);
  setPace(newPace);
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
  setPace(() => {
    const { min, max } = intensityToPaceRange(intensity, steepness, {
      min: minPace,
      max: maxPace,
    });
    return round(Math.random() * (max - min) + min);
  });
};
