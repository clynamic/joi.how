import { GameEvent } from '../../../types';
import { wait } from '../../../utils';
import { Paws, PawLabels } from '../../GameProvider';
import { EventDataRef } from '../GameEvents';

export const randomGripEvent = async (data: EventDataRef) => {
  const {
    game: { paws, setPaws, sendMessage },
  } = data.current;

  let newPaws: Paws;
  const seed = Math.random();
  if (seed < 0.33) newPaws = paws === Paws.both ? Paws.left : Paws.both;
  if (seed < 0.66) newPaws = paws === Paws.left ? Paws.right : Paws.left;
  newPaws = paws === Paws.right ? Paws.both : Paws.right;
  setPaws(newPaws);
  sendMessage({
    id: GameEvent.randomGrip,
    title: `Grip changed to ${PawLabels[newPaws]}!`,
    duration: 5000,
  });
  await wait(10000);
};
