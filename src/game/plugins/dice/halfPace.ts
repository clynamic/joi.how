import { Composer } from '../../../engine/Composer';
import { Sequence } from '../../Sequence';
import Pace from '../pace';
import Rand from '../rand';
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

type HalfPacePayload = { portion: number };

const seq = Sequence.for(PLUGIN_ID, 'halfPace');

export const halfPaceOutcome: DiceOutcome = {
  id: DiceEvent.halfPace,
  check: frame => {
    const i = (Composer.get(intensityState)(frame)?.intensity ?? 0) * 100;
    return i >= 10 && i <= 50;
  },
  update: Composer.pipe(
    seq.on(() =>
      Composer.do(({ get, pipe }) => {
        const pace = get(paceState);
        const s = get(settings);
        const newPace = Math.max(round((pace?.pace ?? 1) / 2), s.minPace);
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
