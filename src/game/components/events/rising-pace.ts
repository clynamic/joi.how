import { GameEvent } from '../../../types';
import { intensityToPaceRange, wait, round } from '../../../utils';
import { EventDataRef } from '../GameEvents';
import { randomPaceEvent } from './random-pace';

export const risingPaceEvent = async (data: EventDataRef) => {
  const {
    game: { intensity, setPace, sendMessage },
    settings: { minPace, maxPace, steepness, timeshift },
  } = data.current;

  sendMessage({
    id: GameEvent.risingPace,
    title: 'Rising pace strokes!',
  });
  const acceleration = Math.round(100 / Math.min(intensity, 35));
  const { max } = intensityToPaceRange(intensity, steepness, timeshift, {
    min: minPace,
    max: maxPace,
  });
  const portion = (max - minPace) / acceleration;
  let newPace = minPace;
  setPace(newPace);
  for (let i = 0; i < acceleration; i++) {
    await wait(10000);
    newPace = round(newPace + portion);
    setPace(newPace);
    sendMessage({
      id: GameEvent.risingPace,
      title: `Pace rising to ${newPace}!`,
      duration: 5000,
    });
  }
  await wait(10000);
  sendMessage({
    id: GameEvent.risingPace,
    title: 'Stay at this pace for a bit',
    duration: 5000,
  });
  await wait(15000);

  randomPaceEvent(data);
};
