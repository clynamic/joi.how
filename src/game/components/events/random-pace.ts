import { GameEvent } from '../../../types';
import { intensityToPaceRange, round, wait } from '../../../utils';
import { EventData } from '../GameEvents';

export const randomPaceEvent = async (data: EventData) => {
  const {
    game: { intensity, setPace, sendMessage },
    settings: { minPace, maxPace, steepness },
  } = data;

  const { min, max } = intensityToPaceRange(intensity, steepness, {
    min: minPace,
    max: maxPace,
  });
  const newPace = round(Math.random() * (max - min) + min);
  setPace(newPace);
  sendMessage({
    id: GameEvent.randomPace,
    title: `Pace changed to ${newPace}!`,
    duration: 5000,
  });
  await wait(9000);
};
