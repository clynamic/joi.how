import { Composer } from '../../../engine/Composer';
import { Sequence } from '../../Sequence';
import { Pipe } from '../../../engine/State';
import Pace from '../pace';
import { GameEvent as GameEventType } from '../../../types';
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
  Composer.bind(intensityState, ist =>
    Composer.bind(settings, s => {
      const i = ist?.intensity ?? 0;
      const { min, max } = intensityToPaceRange(
        i * 100,
        s.steepness,
        s.timeshift,
        { min: s.minPace, max: s.maxPace }
      );
      const newPace = round(Math.random() * (max - min) + min);
      return Composer.pipe(
        Pace.setPace(newPace),
        seq.message({
          title: `Pace changed to ${newPace}!`,
          duration: 5000,
        })
      );
    })
  );

export const randomPaceOutcome: DiceOutcome = {
  id: GameEventType.randomPace,
  update: Composer.pipe(
    seq.on(() => Composer.pipe(doRandomPace(), seq.after(9000, 'done'))),
    seq.on('done', () => outcomeDone())
  ),
};
