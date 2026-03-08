import { Composer } from '../../../engine/Composer';
import { typedPath } from '../../../engine/Lens';
import { Module } from '../../../engine/modules/Module';
import { Sequence } from '../../Sequence';
import Rand from '../rand';
import { PLUGIN_ID, outcomeDone } from './types';

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

export const pawsPath = typedPath<Paws>([PLUGIN_ID, 'paws']);

const allPaws = Object.values(Paws);

const seq = Sequence.for(PLUGIN_ID, 'randomGrip');

export const randomGripModule: Module = {
  id: `${PLUGIN_ID}.random_grip`,
  ordering: { loadAfter: [PLUGIN_ID] },
  activate: Rand.pick(allPaws, paw => Composer.set(pawsPath, paw)),
  deactivate: Composer.set(pawsPath, undefined),
  update: Composer.pipe(
    seq.on(() =>
      Composer.bind(pawsPath, currentPaws =>
        Rand.pick(
          allPaws.filter(p => p !== currentPaws),
          newPaws =>
            Composer.pipe(
              Composer.set(pawsPath, newPaws),
              seq.message({
                title: `Grip changed to ${PawLabels[newPaws]}!`,
                duration: 5000,
              }),
              seq.after(10000, 'done')
            )
        )
      )
    ),
    seq.on('done', () => outcomeDone())
  ),
};
