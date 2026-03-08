import { Composer } from '../../../engine/Composer';
import { Module } from '../../../engine/modules/Module';
import { Sequence } from '../../Sequence';
import Phase, { GamePhase } from '../phase';
import { PLUGIN_ID, intensityState, outcomeDone } from './types';

const seq = Sequence.for(PLUGIN_ID, 'pause');

export const pauseModule: Module = {
  id: `${PLUGIN_ID}.pause`,
  ordering: { loadAfter: [PLUGIN_ID] },
  update: Composer.pipe(
    seq.on(() =>
      Composer.bind(intensityState, ist => {
        const i = ist.intensity * 100;
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
