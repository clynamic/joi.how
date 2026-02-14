import { Composer } from '../../../engine/Composer';
import { Sequence } from '../../Sequence';
import Pace from '../pace';
import { GameEvent as GameEventType } from '../../../types';
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

const seq = Sequence.for(PLUGIN_ID, 'halfPace');

export const halfPaceOutcome: DiceOutcome = {
  id: GameEventType.halfPace,
  check: frame => {
    const i = (Composer.get(intensityState)(frame)?.intensity ?? 0) * 100;
    return i >= 10 && i <= 50;
  },
  update: Composer.pipe(
    seq.on(() =>
      Composer.bind(paceState, pace =>
        Composer.bind(settings, s => {
          const newPace = Math.max(round((pace?.pace ?? 1) / 2), s.minPace);
          const duration = Math.ceil(Math.random() * 20000) + 12000;
          const portion = duration / 3;
          return Composer.pipe(
            Pace.setPace(newPace),
            seq.message({ title: 'Half pace!', description: '3...' }),
            seq.after(portion, 'step2', { portion })
          );
        })
      )
    ),
    seq.on('step2', event =>
      Composer.pipe(
        seq.message({ description: '2...' }),
        seq.after(event.payload.portion, 'step3', event.payload)
      )
    ),
    seq.on('step3', event =>
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
