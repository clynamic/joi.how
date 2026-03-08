import { Composer } from '../../../engine/Composer';
import { Module } from '../../../engine/modules/Module';
import { Sequence } from '../../Sequence';
import Phase, { GamePhase } from '../phase';
import { CleanUpDescriptions } from '../../../types';
import { PLUGIN_ID, settings, outcomeDone } from './types';

const seq = Sequence.for(PLUGIN_ID, 'cleanUp');

export const cleanUpModule: Module = {
  id: `${PLUGIN_ID}.clean_up`,
  ordering: { loadAfter: [PLUGIN_ID] },
  update: Composer.pipe(
    seq.on(() =>
      Composer.bind(settings, s =>
        Composer.pipe(
          Phase.setPhase(GamePhase.break),
          seq.message({
            title: `Lick up any ${CleanUpDescriptions[s.body]}`,
            duration: undefined,
            prompts: [seq.prompt(`I'm done, $master`, 'done')],
          })
        )
      )
    ),
    seq.on('done', () =>
      Composer.pipe(
        seq.message({
          title: 'Good $player',
          duration: 5000,
          prompts: undefined,
        }),
        Phase.setPhase(GamePhase.active),
        outcomeDone()
      )
    )
  ),
};
