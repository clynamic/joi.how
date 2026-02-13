import { Composer } from '../../../engine/Composer';
import { Events, getEventKey } from '../../../engine/pipes/Events';
import { Messages } from '../../../engine/pipes/Messages';
import Phase, { GamePhase } from '../phase';
import {
  GameEvent as GameEventType,
  CleanUpDescriptions,
} from '../../../types';
import { PLUGIN_ID, settings, setBusy, DiceOutcome } from './types';

const ev = {
  cleanUp: getEventKey(PLUGIN_ID, 'cleanUp'),
  done: getEventKey(PLUGIN_ID, 'cleanUp.done'),
};

export const cleanUpOutcome: DiceOutcome = {
  id: GameEventType.cleanUp,
  check: intensity => intensity >= 75,
  scheduleKeys: [],
  pipes: Composer.pipe(
    Events.handle(ev.cleanUp, () =>
      Composer.do(({ get, pipe }) => {
        const s = get(settings);
        if (!s) return;
        pipe(Phase.setPhase(GamePhase.break));
        pipe(
          Messages.send({
            id: GameEventType.cleanUp,
            title: `Lick up any ${CleanUpDescriptions[s.body]}`,
            duration: undefined,
            prompts: [
              {
                title: `I'm done, $master`,
                event: { type: ev.done },
              },
            ],
          })
        );
      })
    ),
    Events.handle(ev.done, () =>
      Composer.pipe(
        Messages.send({
          id: GameEventType.cleanUp,
          title: 'Good $player',
          duration: 5000,
          prompts: undefined,
        }),
        Phase.setPhase(GamePhase.active),
        setBusy(false)
      )
    )
  ),
};
