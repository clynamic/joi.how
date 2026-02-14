import { Composer } from '../../../engine/Composer';
import { Sequence } from '../../Sequence';
import Phase, { GamePhase } from '../phase';
import { GameEvent as GameEventType } from '../../../types';
import { PLUGIN_ID, intensityState, outcomeDone, DiceOutcome } from './types';

const seq = Sequence.for(PLUGIN_ID, 'pause');

export const pauseOutcome: DiceOutcome = {
  id: GameEventType.pause,
  check: frame =>
    (Composer.get(intensityState)(frame)?.intensity ?? 0) * 100 >= 15,
  update: Composer.pipe(
    seq.on(() =>
      Composer.bind(intensityState, ist => {
        const i = (ist?.intensity ?? 0) * 100;
        return Composer.pipe(
          seq.message({ title: 'Stop stroking!' }),
          Phase.setPhase(GamePhase.break),
          seq.after(Math.ceil(-100 * i + 12000), 'resume')
        );
      })
    ),
    seq.on('resume', () =>
      Composer.pipe(
        seq.message({ title: 'Start stroking again!', duration: 5000 }),
        Phase.setPhase(GamePhase.active),
        outcomeDone()
      )
    )
  ),
};
