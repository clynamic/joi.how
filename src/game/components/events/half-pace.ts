import { GameEvent } from '../../../types';
import { round, wait, intensityToPaceRange } from '../../../utils';
import { EventData } from '../GameEvents';

export const halfPaceEvent = async (data: EventData) => {
  const {
    game: { intensity, pace, setPace, sendMessage },
    settings: { minPace, maxPace, steepness },
  } = data;

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
  setPace(() => {
    const { min, max } = intensityToPaceRange(intensity, steepness, {
      min: minPace,
      max: maxPace,
    });
    return round(Math.random() * (max - min) + min);
  });
};
