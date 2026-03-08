import { Composer } from '../../../engine/Composer';
import { Sequence } from '../../Sequence';
import { Pipe } from '../../../engine/State';
import { Module } from '../../../engine/modules/Module';
import Pace from '../pace';
import Rand from '../rand';
import { intensityToPaceRange, round } from '../../../utils';
import { PLUGIN_ID, intensityState, settings, outcomeDone } from './types';

const seq = Sequence.for(PLUGIN_ID, 'randomPace');

export const doRandomPace = (): Pipe =>
  Composer.do(({ get, pipe }) => {
    const i = get(intensityState).intensity;
    const s = get(settings);
    const { min, max } = intensityToPaceRange(
      i * 100,
      s.steepness,
      s.timeshift,
      { min: s.minPace, max: s.maxPace }
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
