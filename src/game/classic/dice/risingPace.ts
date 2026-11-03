import { Composer } from '../../../engine/Composer';
import { Module } from '../../../engine/modules/Module';
import { Sequence } from '../../Sequence';
import Pace from '../pace';
import { intensityToPaceRange } from '../pace';
import { round, PLUGIN_ID, intensityState, outcomeDone } from './types';
import { doRandomPace } from './randomPace';

type RisingPacePayload = {
  start: number;
  max: number;
  portion: number;
  step: number;
  total: number;
};

const seq = Sequence.for(PLUGIN_ID, 'risingPace');

export const risingPaceModule: Module = {
  id: `${PLUGIN_ID}.rising_pace`,
  ordering: { loadAfter: [PLUGIN_ID] },
  update: Composer.pipe(
    seq.on(() =>
      Composer.bind(intensityState, ist =>
        Composer.do(({ get, pipe }) => {
          const i = ist.intensity * 100;
          const acceleration = Math.round(100 / Math.max(1, Math.min(i, 35)));
          const { steepness, timeshift } = Pace.keys.get(get());
          const bounds = Pace.bounds(get());
          const { max } = intensityToPaceRange(i, steepness, timeshift, bounds);
          const portion = (max - bounds.min) / acceleration;
          pipe(
            seq.message({ title: 'Rising pace strokes!' }),
            Pace.setPace(bounds.min),
            seq.after(10000, 'step', {
              start: bounds.min,
              max,
              portion,
              step: 1,
              total: acceleration,
            })
          );
        })
      )
    ),
    seq.on<RisingPacePayload>('step', event => {
      const { start, max, portion, step, total } = event.payload;
      const newPace = round(Math.min(max, start + portion * step));
      return Composer.pipe(
        Pace.setPace(newPace),
        seq.message({ title: `Pace rising to ${newPace}!`, duration: 5000 }),
        step >= total
          ? seq.after(10000, 'hold')
          : seq.after(10000, 'step', { ...event.payload, step: step + 1 })
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
