import { Composer } from '../../../engine/Composer';
import { typedPath } from '../../../engine/Lens';
import { Sequence } from '../../Sequence';
import { DiceEvent } from '../../../types';
import { PLUGIN_ID, outcomeDone, DiceOutcome } from './types';

export enum Paws {
  left = 'left',
  right = 'right',
  both = 'both',
}

export const PawLabels: Record<Paws, string> = {
  left: 'Left',
  right: 'Right',
  both: 'Both',
};

export const pawsPath = typedPath<Paws>(['state', PLUGIN_ID, 'paws']);

const allPaws = Object.values(Paws);

const randomPaw = (exclude?: Paws): Paws => {
  const options = exclude ? allPaws.filter(p => p !== exclude) : allPaws;
  return options[Math.floor(Math.random() * options.length)];
};

const seq = Sequence.for(PLUGIN_ID, 'randomGrip');

export const randomGripOutcome: DiceOutcome = {
  id: DiceEvent.randomGrip,
  activate: Composer.over(pawsPath, () => randomPaw()),
  update: Composer.pipe(
    seq.on(() =>
      Composer.bind(pawsPath, currentPaws => {
        const newPaws = randomPaw(currentPaws);
        return Composer.pipe(
          Composer.set(pawsPath, newPaws),
          seq.message({
            title: `Grip changed to ${PawLabels[newPaws]}!`,
            duration: 5000,
          }),
          seq.after(10000, 'done')
        );
      })
    ),
    seq.on('done', () => outcomeDone())
  ),
};
