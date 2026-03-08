import { Composer } from '../../../engine/Composer';
import { Module } from '../../../engine/modules/Module';
import { Sequence } from '../../Sequence';
import Pace from '../pace';
import { round } from '../../../utils';
import { PLUGIN_ID, paceState, settings, outcomeDone } from './types';
import { doRandomPace } from './randomPace';

const seq = Sequence.for(PLUGIN_ID, 'doublePace');

export const doublePaceModule: Module = {
  id: `${PLUGIN_ID}.double_pace`,
  ordering: { loadAfter: [PLUGIN_ID] },
  update: Composer.pipe(
    seq.on(() =>
      Composer.bind(paceState, pace =>
        Composer.bind(settings, s => {
          const newPace = Math.min(round(pace.pace * 2), s.maxPace);
          return Composer.pipe(
            Pace.setPace(newPace),
            seq.message({ title: 'Double pace!', description: '3...' }),
            seq.after(3000, 'step2')
          );
        })
      )
    ),
    seq.on('step2', () =>
      Composer.pipe(
        seq.message({ description: '2...' }),
        seq.after(3000, 'step3')
      )
    ),
    seq.on('step3', () =>
      Composer.pipe(
        seq.message({ description: '1...' }),
        seq.after(3000, 'done')
      )
    ),
    seq.on('done', () =>
      Composer.pipe(
        seq.message({
          title: 'Done! Back to normal pace',
          description: undefined,
          duration: 5000,
        }),
        doRandomPace(),
        outcomeDone()
      )
    )
  ),
};
