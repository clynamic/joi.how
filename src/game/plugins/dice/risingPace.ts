import { Composer } from '../../../engine/Composer';
import { Sequence } from '../../Sequence';
import Pace from '../pace';
import { DiceEvent } from '../../../types';
import { intensityToPaceRange, round } from '../../../utils';
import {
  PLUGIN_ID,
  intensityState,
  settings,
  outcomeDone,
  DiceOutcome,
} from './types';
import { doRandomPace } from './randomPace';

type RisingPacePayload = {
  current: number;
  portion: number;
  remaining: number;
};

const seq = Sequence.for(PLUGIN_ID, 'risingPace');

export const risingPaceOutcome: DiceOutcome = {
  id: DiceEvent.risingPace,
  check: frame =>
    Composer.get(intensityState)(frame).intensity * 100 >= 30,
  update: Composer.pipe(
    seq.on(() =>
      Composer.bind(intensityState, ist =>
        Composer.bind(settings, s => {
          const i = ist.intensity * 100;
          const acceleration = Math.round(100 / Math.min(i, 35));
          const { max } = intensityToPaceRange(i, s.steepness, s.timeshift, {
            min: s.minPace,
            max: s.maxPace,
          });
          const portion = (max - s.minPace) / acceleration;
          return Composer.pipe(
            seq.message({ title: 'Rising pace strokes!' }),
            Pace.setPace(s.minPace),
            seq.after(10000, 'step', {
              current: s.minPace,
              portion,
              remaining: acceleration,
            })
          );
        })
      )
    ),
    seq.on<RisingPacePayload>('step', event => {
      const { current, portion, remaining } = event.payload;
      const newPace = round(current + portion);
      return Composer.pipe(
        Pace.setPace(newPace),
        seq.message({ title: `Pace rising to ${newPace}!`, duration: 5000 }),
        remaining <= 1
          ? seq.after(10000, 'hold')
          : seq.after(10000, 'step', {
              current: newPace,
              portion,
              remaining: remaining - 1,
            })
      );
    }),
    seq.on('hold', () =>
      Composer.pipe(
        seq.message({ title: 'Stay at this pace for a bit', duration: 5000 }),
        seq.after(15000, 'done')
      )
    ),
    seq.on('done', () => Composer.pipe(doRandomPace(), outcomeDone()))
  ),
};
