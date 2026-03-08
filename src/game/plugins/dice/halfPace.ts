import { Composer } from '../../../engine/Composer';
import { Module } from '../../../engine/modules/Module';
import { Sequence } from '../../Sequence';
import Pace from '../pace';
import Rand from '../rand';
import { round } from '../../../utils';
import { PLUGIN_ID, paceState, settings, outcomeDone } from './types';
import { doRandomPace } from './randomPace';

type HalfPacePayload = { portion: number };

const seq = Sequence.for(PLUGIN_ID, 'halfPace');

export const halfPaceModule: Module = {
  id: `${PLUGIN_ID}.half_pace`,
  ordering: { loadAfter: [PLUGIN_ID] },
  update: Composer.pipe(
    seq.on(() =>
      Composer.do(({ get, pipe }) => {
        const pace = get(paceState);
        const s = get(settings);
        const newPace = Math.max(round(pace.pace / 2), s.minPace);
        pipe(
          Rand.next(v => {
            const duration = Math.ceil(v * 20000) + 12000;
            const portion = duration / 3;
            return Composer.pipe(
              Pace.setPace(newPace),
              seq.message({ title: 'Half pace!', description: '3...' }),
              seq.after(portion, 'step2', { portion })
            );
          })
        );
      })
    ),
    seq.on<HalfPacePayload>('step2', event =>
      Composer.pipe(
        seq.message({ description: '2...' }),
        seq.after(event.payload.portion, 'step3', event.payload)
      )
    ),
    seq.on<HalfPacePayload>('step3', event =>
      Composer.pipe(
        seq.message({ description: '1...' }),
        seq.after(event.payload.portion, 'done')
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
