import { Composer } from '../../../engine/Composer';
import { Sequence } from '../../Sequence';
import Phase, { GamePhase } from '../phase';
import { DiceEvent, CleanUpDescriptions } from '../../../types';
import {
  PLUGIN_ID,
  intensityState,
  settings,
  outcomeDone,
  DiceOutcome,
} from './types';

const seq = Sequence.for(PLUGIN_ID, 'cleanUp');

export const cleanUpOutcome: DiceOutcome = {
  id: DiceEvent.cleanUp,
  check: frame => Composer.get(intensityState)(frame).intensity * 100 >= 75,
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
