import { Composer } from '../../../engine/Composer';
import { Sequence } from '../../Sequence';
import Pace from '../pace';
import { DiceEvent } from '../../../types';
import { round } from '../../../utils';
import {
  PLUGIN_ID,
  paceState,
  intensityState,
  settings,
  outcomeDone,
  DiceOutcome,
} from './types';
import { doRandomPace } from './randomPace';

const seq = Sequence.for(PLUGIN_ID, 'doublePace');

export const doublePaceOutcome: DiceOutcome = {
  id: DiceEvent.doublePace,
  check: frame =>
    Composer.get(intensityState)(frame).intensity * 100 >= 20,
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
