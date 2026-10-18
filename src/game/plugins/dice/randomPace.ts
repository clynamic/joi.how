import { Composer } from '../../../engine/Composer';
import { Sequence } from '../../Sequence';
import { Pipe } from '../../../engine/State';
import { Module } from '../../../engine/modules/Module';
import Pace from '../pace';
import Rand from '../rand';
import { intensityToPaceRange, round } from '../../../utils';
import { PLUGIN_ID, intensityState, outcomeDone } from './types';

const seq = Sequence.for(PLUGIN_ID, 'randomPace');

export const doRandomPace = (): Pipe =>
  Composer.do(({ get, pipe }) => {
    const i = get(intensityState).intensity;
    const { steepness, timeshift } = Pace.keys.get(get());
    const { min, max } = intensityToPaceRange(
      i * 100,
      steepness,
      timeshift,
      Pace.bounds(get())
    );
    pipe(
      Rand.nextFloatRange(min, max, v => {
        const newPace = round(v);
        return Composer.pipe(
          Pace.setPace(newPace),
          seq.message({
            title: `Pace changed to ${newPace}!`,
            duration: 5000,
          })
        );
      })
    );
  });

export const randomPaceModule: Module = {
  id: `${PLUGIN_ID}.random_pace`,
  ordering: { loadAfter: [PLUGIN_ID] },
  update: Composer.pipe(
    seq.on(() => Composer.pipe(doRandomPace(), seq.after(9000, 'done'))),
    seq.on('done', () => outcomeDone())
  ),
};
