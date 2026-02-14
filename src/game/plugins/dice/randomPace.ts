import { Composer } from '../../../engine/Composer';
import { Sequence } from '../../Sequence';
import { Pipe } from '../../../engine/State';
import Pace from '../pace';
import Rand from '../rand';
import { DiceEvent } from '../../../types';
import { intensityToPaceRange, round } from '../../../utils';
import {
  PLUGIN_ID,
  intensityState,
  settings,
  outcomeDone,
  DiceOutcome,
} from './types';

const seq = Sequence.for(PLUGIN_ID, 'randomPace');

export const doRandomPace = (): Pipe =>
  Composer.do(({ get, pipe }) => {
    const i = get(intensityState)?.intensity ?? 0;
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

export const randomPaceOutcome: DiceOutcome = {
  id: DiceEvent.randomPace,
  update: Composer.pipe(
    seq.on(() => Composer.pipe(doRandomPace(), seq.after(9000, 'done'))),
    seq.on('done', () => outcomeDone())
  ),
};
