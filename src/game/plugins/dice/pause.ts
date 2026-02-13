import { Composer } from '../../../engine/Composer';
import { Events, getEventKey } from '../../../engine/pipes/Events';
import { Messages } from '../../../engine/pipes/Messages';
import { Scheduler, getScheduleKey } from '../../../engine/pipes/Scheduler';
import Phase, { GamePhase } from '../phase';
import { GameEvent as GameEventType } from '../../../types';
import { PLUGIN_ID, intensityState, setBusy, DiceOutcome } from './types';

const ev = {
  pause: getEventKey(PLUGIN_ID, 'pause'),
  resume: getEventKey(PLUGIN_ID, 'pause.resume'),
};

const sched = {
  pause: getScheduleKey(PLUGIN_ID, 'pause'),
};

export const pauseOutcome: DiceOutcome = {
  id: GameEventType.pause,
  check: intensity => intensity >= 15,
  scheduleKeys: Object.values(sched),
  pipes: Composer.pipe(
    Events.handle(ev.pause, () =>
      Composer.do(({ get, pipe }) => {
        const i = (get(intensityState)?.intensity ?? 0) * 100;
        pipe(
          Messages.send({
            id: GameEventType.pause,
            title: 'Stop stroking!',
          })
        );
        pipe(Phase.setPhase(GamePhase.break));
        const duration = Math.ceil(-100 * i + 12000);
        pipe(
          Scheduler.schedule({
            id: sched.pause,
            duration,
            event: { type: ev.resume },
          })
        );
      })
    ),
    Events.handle(ev.resume, () =>
      Composer.pipe(
        Messages.send({
          id: GameEventType.pause,
          title: 'Start stroking again!',
          duration: 5000,
        }),
        Phase.setPhase(GamePhase.active),
        setBusy(false)
      )
    )
  ),
};
